# back/schemas.py

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
    
    class Config:
        from_attributes = True

class PlaylistCreate(BaseModel):
    name: str

class PlaylistResponse(BaseModel):
    id: int
    name: str
    tracks: List[TrackBase] = []
    artwork_url: Optional[str] = None # ✅ Añadir artwork_url al esquema de respuesta

    class Config:
        from_attributes = True

# ✅ NUEVO ESQUEMA: Para la respuesta paginada de canciones
class PagedTracksResponse(BaseModel):
    total: int
    items: List[TrackBase]

# ✅ NUEVO ESQUEMA: Para reordenar canciones en una playlist
class ReorderTracksRequest(BaseModel):
    trackIds: List[int]

# ✅ NUEVO ESQUEMA: Para actualizar el nombre y/o la URL de la carátula de una playlist
class PlaylistUpdate(BaseModel):
    name: Optional[str] = None
    artwork_url: Optional[str] = None # Para actualizar o eliminar la carátula por URL