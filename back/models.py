from sqlalchemy import Column, Integer, String, ForeignKey, Table
from sqlalchemy.orm import relationship, Mapped, mapped_column
from typing import List, Optional

from .database import Base

# Tabla de asociación para la relación muchos a muchos entre playlists y tracks
playlist_tracks = Table(
    "playlist_tracks",
    Base.metadata,
    Column("playlist_id", Integer, ForeignKey("playlists.id"), primary_key=True),
    Column("track_id", Integer, ForeignKey("tracks.id"), primary_key=True),
)

class Playlist(Base):
    __tablename__ = "playlists"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String, index=True, unique=True)
    artwork_url: Mapped[Optional[str]] = mapped_column(String, nullable=True) 

    # Relación "muchos a muchos" con el modelo Track
    tracks: Mapped[List["Track"]] = relationship(
        "Track",
        secondary=playlist_tracks,
        back_populates="playlists"
    )

class Track(Base):
    __tablename__ = "tracks"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String, index=True)
    artist: Mapped[str] = mapped_column(String)
    album: Mapped[str] = mapped_column(String)
    duration: Mapped[str] = mapped_column(String)
    artwork_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    audio_url: Mapped[str] = mapped_column(String, unique=True)
    lyrics_lrc: Mapped[Optional[str]] = mapped_column(String, nullable=True)

    # Relación "muchos a muchos" con el modelo Playlist
    playlists: Mapped[List["Playlist"]] = relationship(
        "Playlist",
        secondary=playlist_tracks,
        back_populates="tracks"
    )