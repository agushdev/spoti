import os
import shutil
from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form, status, Response, Query
from sqlalchemy import exc, func
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from typing import List, Optional
from pathlib import Path 
from database import engine, Base, get_db
from models import Playlist, Track 
from schemas import PlaylistCreate, PlaylistResponse, TrackBase, PagedTracksResponse, ReorderTracksRequest, PlaylistUpdate, TrackUpdate 

app = FastAPI(
    title="Spoti Backend"
)

# Configuración de CORS
origins = [
    "http://localhost:3000",
    "https://spoti-front.onrender.com"
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins, 
    allow_credentials=True,
    allow_methods=["*"], 
    allow_headers=["*"], 
)


# Evento de inicio para crear las tablas si no existen
@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

# --- Endpoints de la API ---

@app.get("/")
async def read_root():
    return {"message": "Welcome to the Music Stream API!"}

@app.get("/api/tracks", response_model=PagedTracksResponse) 
async def read_tracks(
    limit: Optional[int] = Query(None, ge=1),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db)
):
    query = select(Track)
    
    if offset is not None:
        query = query.offset(offset)
    if limit is not None:
        query = query.limit(limit)

    result = await db.execute(query)
    tracks = result.scalars().all()

    total_result = await db.execute(select(func.count(Track.id)))
    total = total_result.scalar_one()

    track_list = []
    for t in tracks:
        track_list.append({
            "id": t.id,
            "title": t.title,
            "artist": t.artist,
            "album": t.album,
            "duration": t.duration,
            "artwork_url": t.artwork_url,
            "audio_url": t.audio_url,
            "lyrics_lrc": t.lyrics_lrc, # ✅ Incluir lyrics_lrc en la respuesta de /api/tracks
        })

    return {
        "total": total,
        "items": track_list,
    }

@app.get("/api/playlists", response_model=List[PlaylistResponse])
async def get_all_playlists(db: AsyncSession = Depends(get_db)):
    """Obtiene todas las playlists existentes."""
    result = await db.execute(select(Playlist).options(selectinload(Playlist.tracks)))
    playlists = result.scalars().all()
    
    response_data = []
    for playlist in playlists:
        tracks_data = []
        for track in playlist.tracks:
            tracks_data.append(TrackBase.model_validate(track).model_dump()) 
        response_data.append({
            "id": playlist.id,
            "name": playlist.name,
            "tracks": tracks_data,
            "artwork_url": playlist.artwork_url 
        })
    return response_data 

@app.get("/api/playlists/{playlist_id}", response_model=PlaylistResponse)
async def get_playlist_by_id(playlist_id: int, db: AsyncSession = Depends(get_db)):
    """Obtiene una playlist específica por su ID, incluyendo sus canciones."""
    result = await db.execute(select(Playlist).options(selectinload(Playlist.tracks)).filter(Playlist.id == playlist_id))
    playlist = result.scalars().first()
    if not playlist:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Playlist no encontrada"
        )
    
    tracks_data = []
    for track in playlist.tracks:
        tracks_data.append(TrackBase.model_validate(track).model_dump())
    
    response_data = {
        "id": playlist.id,
        "name": playlist.name,
        "tracks": tracks_data,
        "artwork_url": playlist.artwork_url 
    }
    return response_data 

@app.post("/api/playlists", response_model=PlaylistResponse, status_code=status.HTTP_201_CREATED)
async def create_playlist(
    name: str = Form(...), 
    artwork_file: Optional[UploadFile] = File(None), 
    db: AsyncSession = Depends(get_db)
):
    """Crea una nueva playlist en la base de datos con una carátula opcional."""
    existing_playlist_result = await db.execute(select(Playlist).filter(Playlist.name == name))
    existing_playlist = existing_playlist_result.scalars().first()
    if existing_playlist:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ya existe una playlist con este nombre"
        )
    
    artwork_url: Optional[str] = None
    if artwork_file:
        upload_dir = Path(__file__).parent.parent / "front" / "public" / "cover_art"
        upload_dir.mkdir(parents=True, exist_ok=True) 

        file_extension = Path(artwork_file.filename).suffix
        unique_filename = f"playlist_cover_{os.urandom(8).hex()}{file_extension}"
        file_path = upload_dir / unique_filename

        try:
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(artwork_file.file, buffer)
            artwork_url = f"/cover_art/{unique_filename}"
        except Exception as e:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error al guardar la carátula: {e}")

    new_playlist = Playlist(name=name, artwork_url=artwork_url) 
    db.add(new_playlist) 
    try:
        await db.commit() 
        await db.refresh(new_playlist) 
        return new_playlist
    except exc.IntegrityError:
        await db.rollback() 
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Error de integridad al crear playlist (el nombre puede estar duplicado)")
        

@app.post("/api/playlists/{playlist_id}/tracks/{track_id}", response_model=PlaylistResponse)
async def add_track_to_playlist(playlist_id: int, track_id: int, db: AsyncSession = Depends(get_db)):
    """Añade una canción a una playlist."""
    playlist_result = await db.execute(select(Playlist).options(selectinload(Playlist.tracks)).filter(Playlist.id == playlist_id)) 
    playlist = playlist_result.scalars().first()

    track_result = await db.execute(select(Track).filter(Track.id == track_id))
    track = track_result.scalars().first()

    if not playlist:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Playlist no encontrada")
    if not track:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Canción no encontrada")

    if track not in playlist.tracks:
        playlist.tracks.append(track)
        try:
            await db.commit()
            await db.refresh(playlist) 
        except exc.IntegrityError:
            await db.rollback()
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="La canción ya está en esta playlist")
    else:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="La canción ya está en esta playlist")
        
    return playlist


@app.delete("/api/playlists/{playlist_id}/tracks/{track_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_track_from_playlist(playlist_id: int, track_id: int, db: AsyncSession = Depends(get_db)):
    playlist_result = await db.execute(select(Playlist).options(selectinload(Playlist.tracks)).filter(Playlist.id == playlist_id))
    playlist = playlist_result.scalars().first()
    track_result = await db.execute(select(Track).filter(Track.id == track_id))
    track = track_result.scalars().first()

    if not playlist:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Playlist not found")
    if not track:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Track not found")

    if track in playlist.tracks:
        playlist.tracks.remove(track)
        await db.commit()
    else:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Track not in playlist")
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@app.patch("/api/playlists/{playlist_id}", response_model=PlaylistResponse)
async def update_playlist(
    playlist_id: int,
    playlist_update: PlaylistUpdate,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Playlist).options(selectinload(Playlist.tracks)).filter(Playlist.id == playlist_id))
    playlist = result.scalars().first()

    if not playlist:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Playlist no encontrada")

    update_data = playlist_update.model_dump(exclude_unset=True) 

    if "name" in update_data and update_data["name"] != playlist.name:
        existing_playlist_with_name_result = await db.execute(select(Playlist).filter(Playlist.name == update_data["name"]))
        existing_playlist_with_name = existing_playlist_with_name_result.scalars().first()
        if existing_playlist_with_name and existing_playlist_with_name.id != playlist_id: 
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Ya existe una playlist con este nombre.")
        playlist.name = update_data["name"]

    if "artwork_url" in update_data: 
        playlist.artwork_url = update_data["artwork_url"]

    try:
        await db.commit()
        await db.refresh(playlist) 
    except exc.IntegrityError as e:
        await db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Error al actualizar playlist: {e}")

    return playlist


@app.delete("/api/playlists/{playlist_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_playlist(playlist_id: int, db: AsyncSession = Depends(get_db)):
    """Elimina una playlist por su ID."""
    result = await db.execute(select(Playlist).filter(Playlist.id == playlist_id))
    playlist = result.scalars().first()

    if not playlist:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Playlist no encontrada")
    
    await db.delete(playlist)
    await db.commit()
    
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@app.post("/api/upload", response_model=dict)
async def upload_track(
    db: AsyncSession = Depends(get_db), 
    title: str = Form(...),
    artist: str = Form(...),
    album: str = Form(...),
    duration: str = Form(...),
    audio_file: UploadFile = File(...),
    cover_art: Optional[UploadFile] = File(None),
    lyrics_lrc: Optional[str] = Form(None) # ✅ Nuevo parámetro para las letras LRC
):
    """Sube un archivo de audio y su portada, y lo guarda en la base de datos."""

    audio_filename = Path(audio_file.filename).name
    cover_filename = Path(cover_art.filename).name if cover_art else None

    new_track = Track(
        title=title,
        artist=artist,
        album=album,
        duration=duration,
        audio_url=f"/audio/{audio_filename}", 
        artwork_url=f"/cover_art/{cover_filename}" if cover_filename else None,
        lyrics_lrc=lyrics_lrc # ✅ Guardar las letras en el modelo Track
    )
    
    db.add(new_track)
    await db.commit()
    await db.refresh(new_track)
    
    return {
        "message": "Track and cover uploaded successfully!",
        "track_id": new_track.id,
        "title": new_track.title
    }

# ✅ NUEVO ENDPOINT: Actualizar una canción existente (incluyendo lyrics_lrc)
@app.patch("/api/tracks/{track_id}", response_model=TrackBase) # Retorna el Track actualizado
async def update_track(
    track_id: int,
    track_update: TrackUpdate, # Usa el nuevo esquema TrackUpdate
    db: AsyncSession = Depends(get_db)
):
    """Actualiza campos de una canción existente, incluyendo lyrics_lrc."""
    result = await db.execute(select(Track).filter(Track.id == track_id))
    track = result.scalars().first()

    if not track:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Canción no encontrada")

    update_data = track_update.model_dump(exclude_unset=True) # Obtiene solo los campos que fueron enviados

    for key, value in update_data.items():
        setattr(track, key, value) # Actualiza cada atributo del modelo Track

    try:
        await db.commit()
        await db.refresh(track) # Refresca el objeto para que Pydantic lo mapee correctamente
    except exc.IntegrityError as e:
        await db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Error al actualizar la canción: {e}")

    return track


@app.put("/api/playlists/{playlist_id}/reorder", response_model=PlaylistResponse)
async def reorder_playlist_tracks(
    playlist_id: int, 
    request_body: ReorderTracksRequest, 
    db: AsyncSession = Depends(get_db)
):
    """
    Reordena las canciones de una playlist basándose en una lista de IDs de canciones.
    """
    playlist_result = await db.execute(
        select(Playlist).options(selectinload(Playlist.tracks)).filter(Playlist.id == playlist_id)
    )
    playlist = playlist_result.scalars().first()

    if not playlist:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Playlist no encontrada"
        )
    
    existing_tracks_map = {track.id: track for track in playlist.tracks}
    
    new_tracks_order = []
    for track_id in request_body.trackIds:
        track = existing_tracks_map.get(track_id)
        if track:
            new_tracks_order.append(track)
    
    playlist.tracks = new_tracks_order
    
    try:
        await db.commit()
        await db.refresh(playlist)
    except exc.IntegrityError:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Error de integridad al reordenar la playlist"
        )

    return playlist