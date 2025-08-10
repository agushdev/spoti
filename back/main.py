import os
import shutil
from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form, status, Response, Query
from sqlalchemy import exc, func
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from typing import List, Optional
from pathlib import Path # Importar Path para manejo robusto de rutas de archivo

# Importa los modelos de la base de datos
from .database import engine, Base, get_db
from back.models import Playlist, Track 
from back.schemas import PlaylistCreate, PlaylistResponse, TrackBase, PagedTracksResponse

app = FastAPI(
    title="Minimalist Music Stream API",
    description="API for a minimalist music streaming application.",
    version="1.0.0",
)

# Configuración de CORS
origins = [
    "http://localhost:3000",
    # Añade aquí la IP de tu PC si la usas directamente desde el móvil
    # Por ejemplo: "http://192.168.0.107:3000",
    "*" # Permite todos los orígenes para facilitar el desarrollo, ajustar en producción
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
    limit: Optional[int] = Query(None, ge=1), # ✅ Permite None para sin límite, sin max.
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db)
):
    # Consulta base para las canciones
    query = select(Track)
    
    # Aplica offset y limit si están definidos
    if offset is not None:
        query = query.offset(offset)
    if limit is not None: # ✅ Aplica el límite solo si no es None
        query = query.limit(limit)

    result = await db.execute(query)
    tracks = result.scalars().all()

    # Consulta el total de canciones (sin limit ni offset)
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
        })

    return {
        "total": total,
        "items": track_list,
    }

@app.get("/api/playlists", response_model=List[PlaylistResponse])
async def get_all_playlists(db: AsyncSession = Depends(get_db)):
    """Obtiene todas las playlists existentes."""
    # Usamos selectinload para cargar las canciones de forma ansiosa (eager loading)
    result = await db.execute(select(Playlist).options(selectinload(Playlist.tracks)))
    playlists = result.scalars().all()
    
    response_data = []
    for playlist in playlists:
        tracks_data = []
        # Serializamos manualmente las canciones para asegurar la compatibilidad con el esquema TrackBase
        for track in playlist.tracks:
            tracks_data.append(TrackBase.model_validate(track).model_dump()) 
        response_data.append({
            "id": playlist.id,
            "name": playlist.name,
            "tracks": tracks_data
        })
    return response_data 

@app.get("/api/playlists/{playlist_id}", response_model=PlaylistResponse)
async def get_playlist_by_id(playlist_id: int, db: AsyncSession = Depends(get_db)):
    """Obtiene una playlist específica por su ID, incluyendo sus canciones."""
    # Usamos selectinload para cargar las canciones de forma ansiosa
    result = await db.execute(select(Playlist).options(selectinload(Playlist.tracks)).filter(Playlist.id == playlist_id))
    playlist = result.scalars().first()
    if not playlist:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Playlist no encontrada"
        )
    
    tracks_data = []
    # Serializamos manualmente las canciones
    for track in playlist.tracks:
        tracks_data.append(TrackBase.model_validate(track).model_dump())
    
    response_data = {
        "id": playlist.id,
        "name": playlist.name,
        "tracks": tracks_data
    }
    return response_data 

@app.post("/api/playlists", response_model=PlaylistResponse, status_code=status.HTTP_201_CREATED)
async def create_playlist(playlist: PlaylistCreate, db: AsyncSession = Depends(get_db)):
    """Crea una nueva playlist en la base de datos."""
    # Verifica si ya existe una playlist con el mismo nombre
    existing_playlist_result = await db.execute(select(Playlist).filter(Playlist.name == playlist.name))
    existing_playlist = existing_playlist_result.scalars().first()
    if existing_playlist:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ya existe una playlist con este nombre"
        )
    
    new_playlist = Playlist(name=playlist.name)
    db.add(new_playlist) 
    try:
        await db.commit() 
        # await db.refresh(new_playlist) # ✅ No es necesario aquí si se retorna un diccionario explícito
        
        # ✅ CRÍTICO: Serialización explícita para asegurar que 'tracks' sea una lista vacía
        # y evitar el MissingGreenlet/ResponseValidationError que ocurre cuando Pydantic
        # intenta acceder a una relación no cargada en un objeto recién creado.
        response_data = {
            "id": new_playlist.id,
            "name": new_playlist.name,
            "tracks": [] # Una playlist nueva siempre tendrá una lista de tracks vacía
        }
        return response_data
    except exc.IntegrityError:
        await db.rollback() 
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Error de integridad al crear playlist")
        

@app.post("/api/playlists/{playlist_id}/tracks/{track_id}", response_model=PlaylistResponse)
async def add_track_to_playlist(playlist_id: int, track_id: int, db: AsyncSession = Depends(get_db)):
    """Añade una canción a una playlist."""
    # Carga la playlist y sus tracks de forma ansiosa
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
            await db.refresh(playlist) # Refresca la playlist para que las relaciones se actualicen
        except exc.IntegrityError:
            await db.rollback()
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="La canción ya está en esta playlist")
    else:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="La canción ya está en esta playlist")
        
    tracks_data = []
    # Serializa manualmente las canciones de la playlist actualizada
    for t in playlist.tracks:
        tracks_data.append(TrackBase.model_validate(t).model_dump())
    
    response_data = {
        "id": playlist.id,
        "name": playlist.name,
        "tracks": tracks_data
    }
    return response_data


@app.delete("/api/playlists/{playlist_id}/tracks/{track_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_track_from_playlist(playlist_id: int, track_id: int, db: AsyncSession = Depends(get_db)):
    # Carga la playlist y sus tracks de forma ansiosa
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
async def update_playlist_name(playlist_id: int, new_name: PlaylistCreate, db: AsyncSession = Depends(get_db)):
    # Carga la playlist y sus tracks de forma ansiosa
    result = await db.execute(select(Playlist).options(selectinload(Playlist.tracks)).filter(Playlist.id == playlist_id))
    playlist = result.scalars().first()

    if not playlist:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Playlist not found")

    # Verifica si el nuevo nombre ya existe para otra playlist
    if new_name.name != playlist.name:
        existing_playlist_with_name_result = await db.execute(select(Playlist).filter(Playlist.name == new_name.name))
        existing_playlist_with_name = existing_playlist_with_name_result.scalars().first()
        if existing_playlist_with_name:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Playlist with this name already exists")

    playlist.name = new_name.name
    try:
        await db.commit()
        await db.refresh(playlist) # Refresca la playlist después de la actualización
    except exc.IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Error updating playlist name")
    
    # Serializa manualmente las canciones para la respuesta
    return {
        "id": playlist.id,
        "name": playlist.name,
        "tracks": [TrackBase.model_validate(t).model_dump() for t in playlist.tracks]
    }


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
    cover_art: Optional[UploadFile] = File(None)
):
    audio_filename = Path(audio_file.filename).name
    cover_filename = Path(cover_art.filename).name if cover_art else None

    new_track = Track(
        title=title,
        artist=artist,
        album=album,
        duration=duration,
        audio_url=f"/audio/{audio_filename}",
        artwork_url=f"/cover_art/{cover_filename}" if cover_filename else None
    )
    
    db.add(new_track)
    await db.commit()
    await db.refresh(new_track)
    
    return {
        "message": "Track and cover uploaded successfully!",
        "track_id": new_track.id,
        "title": new_track.title
    }