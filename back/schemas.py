from pydantic import BaseModel
from typing import List, Optional

# Esquema para las canciones (Track)
class TrackBase(BaseModel):
    id: int
    title: str
    artist: str
    album: str
    duration: str
    artwork_url: str
    audio_url: str

    class Config:
        from_attributes = True # Permite mapear de SQLAlchemy a Pydantic

# Esquema para crear una playlist (solo nombre)
class PlaylistCreate(BaseModel):
    name: str

# Esquema para una playlist completa (con sus canciones)
class PlaylistResponse(BaseModel):
    id: int
    name: str
    tracks: List[TrackBase] = [] # Lista de canciones en la playlist

    class Config:
        from_attributes = True

class PagedTracksResponse(BaseModel):
    total: int
    items: List[TrackBase]

class ReorderTracksRequest(BaseModel):
    trackIds: List[int]