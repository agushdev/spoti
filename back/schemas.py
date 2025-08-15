from pydantic import BaseModel
from typing import List, Optional

class TrackBase(BaseModel):
    id: int
    title: str
    artist: str
    album: str
    duration: str
    artwork_url: Optional[str] = None
    audio_url: str
    lyrics_lrc: Optional[str] = None # ✅ Asegúrate de que lyrics_lrc está aquí

    class Config:
        from_attributes = True

class PlaylistCreate(BaseModel):
    name: str

class PlaylistUpdate(BaseModel): # Para actualizar nombre Y/O carátula
    name: Optional[str] = None
    artwork_url: Optional[str] = None

class ReorderTracksRequest(BaseModel): # Para reordenar canciones en una playlist
    trackIds: List[int]

class PlaylistResponse(BaseModel):
    id: int
    name: str
    tracks: List[TrackBase] = [] # Las canciones asociadas a esta playlist
    artwork_url: Optional[str] = None # ✅ Añadido artwork_url al esquema de respuesta

    class Config:
        from_attributes = True

class PagedTracksResponse(BaseModel):
    total: int
    items: List[TrackBase]

# ✅ NUEVO ESQUEMA: Para actualizar una canción existente
class TrackUpdate(BaseModel):
    title: Optional[str] = None
    artist: Optional[str] = None
    album: Optional[str] = None
    duration: Optional[str] = None
    artwork_url: Optional[str] = None
    audio_url: Optional[str] = None
    lyrics_lrc: Optional[str] = None # ✅ Campo opcional para actualizar las letras