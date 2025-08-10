from sqlalchemy import Column, Integer, String, ForeignKey, Table
from sqlalchemy.orm import relationship
from back.database import Base

playlist_tracks = Table(
    'playlist_tracks', Base.metadata,
    Column('playlist_id', Integer, ForeignKey('playlists.id'), primary_key=True),
    Column('track_id', Integer, ForeignKey('tracks.id'), primary_key=True)
)

class Track(Base):
    __tablename__ = "tracks"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    artist = Column(String)
    album = Column(String)
    duration = Column(String)
    artwork_url = Column(String)
    audio_url = Column(String)

class Playlist(Base):
    __tablename__ = 'playlists'
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    tracks = relationship("Track", secondary=playlist_tracks, backref="playlists")