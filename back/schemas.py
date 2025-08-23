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
    lyrics_lrc: Optional[str] = None 
    class Config:
        from_attributes = True

class PlaylistCreate(BaseModel):
    name: str

class PlaylistUpdate(BaseModel): 
    name: Optional[str] = None
    artwork_url: Optional[str] = None

class ReorderTracksRequest(BaseModel): 
    trackIds: List[int]

class PlaylistResponse(BaseModel):
    id: int
    name: str
    tracks: List[TrackBase] = [] 
    artwork_url: Optional[str] = None 

    class Config:
        from_attributes = True

class PagedTracksResponse(BaseModel):
    total: int
    items: List[TrackBase]

class TrackUpdate(BaseModel):
    title: Optional[str] = None
    artist: Optional[str] = None
    album: Optional[str] = None
    duration: Optional[str] = None
    artwork_url: Optional[str] = None
    audio_url: Optional[str] = None
    lyrics_lrc: Optional[str] = None 