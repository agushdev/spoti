"use client";

    import { useEffect, useState, useCallback, useMemo } from 'react';
    import { TrackCard } from "@/components/track-card";
    import { toast, Toaster } from "sonner";
    import { Button } from "@/components/ui/button";
    import { Spinner } from "@/components/ui/spinner";
    import { SearchInput } from "@/components/search-input";
    import { PlaylistCard } from "@/components/playlist-card"; 
    import Link from "next/link"; 

    type Track = {
      id: number;
      title: string;
      artist: string;
      album: string;
      duration: string;
      artwork_url: string | null;
      audio_url: string;
      tags?: string[]; 
    };

    type Playlist = {
      id: number;
      name: string;
      tracks: Track[];
      artwork_url?: string | null;
    };

    type PagedTracksResponse = {
      total: number;
      items: Track[];
    };

    const PAGE_SIZE = 20;

    export default function Home() {
      const [allTracks, setAllTracks] = useState<Track[]>([]); 
      const [playlists, setPlaylists] = useState<Playlist[]>([]); 
      const [currentPage, setCurrentPage] = useState(0);
      const [hasMore, setHasMore] = useState(true);
      const [isLoading, setIsLoading] = useState(false);
      const [initialLoad, setInitialLoad] = useState(true);
      const [searchTerm, setSearchTerm] = useState("");

      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000'; 

      useEffect(() => {
        console.log("API_BASE_URL que el frontend está usando:", API_BASE_URL);
      }, [API_BASE_URL]);


      const fetchInitialData = useCallback(async () => {
        setIsLoading(true);

        try {
          const tracksResponse = await fetch(`${API_BASE_URL}/api/tracks?limit=100`, { 
            headers: { 'Accept': 'application/json' },
          });
          if (tracksResponse.ok) {
              const pagedTracksData: PagedTracksResponse = await tracksResponse.json();
              setAllTracks(pagedTracksData.items);
              setHasMore(pagedTracksData.items.length === 100); 
          } else {
              console.warn("Could not fetch tracks from network. Relying on Service Worker cache.");
          } 

          const playlistsResponse = await fetch(`${API_BASE_URL}/api/playlists`, {
            headers: { 'Accept': 'application/json' },
          });
          if (playlistsResponse.ok) {
              const playlistsData: Playlist[] = await playlistsResponse.json();
              setPlaylists(playlistsData);
          } else {
              console.warn("Could not fetch playlists from network. Relying on Service Worker cache.");
          }

        } catch (error) {
          console.error("Error fetching initial data:", error);
          toast.error("Error de conexion. Mostrando contenido de cache", {
            description: "Es posible que no tengas conexion a internet.",
            duration: 5000,
          });
        } finally {
          setIsLoading(false);
          setInitialLoad(false);
        }
      }, [API_BASE_URL]);

      const fetchMoreTracks = useCallback(async (page: number) => {
        setIsLoading(true);
        const offset = page * PAGE_SIZE;
        const url = `${API_BASE_URL}/api/tracks?limit=${PAGE_SIZE}&offset=${offset}`;

        try {
          const response = await fetch(url, {
            headers: { 'Accept': 'application/json' },
          });

          if (!response.ok) {
            throw new Error(`Failed to fetch more tracks: ${response.statusText}`);
          }

          const data: PagedTracksResponse = await response.json();
          setAllTracks(prevTracks => {
            const newTracks = data.items.filter(newItem => !prevTracks.some(existingItem => existingItem.id === newItem.id));
            return [...prevTracks, ...newTracks];
          });
          setHasMore(data.items.length === PAGE_SIZE);

        } catch (error) {
          console.error("Error fetching more tracks:", error);
          toast.error("Error al cargar más canciones.", {
            description: "Verifica la conexión con el backend.",
            duration: 5000,
          });
          setHasMore(false);
        } finally {
          setIsLoading(false);
        }
      }, [API_BASE_URL]);


      useEffect(() => {
        fetchInitialData();
      }, [fetchInitialData]);

      const handleLoadMore = () => {
        if (!isLoading && hasMore && searchTerm === "") {
          setCurrentPage(prevPage => prevPage + 1);
          fetchMoreTracks(currentPage + 1);
        }
      };

      const filteredItems = useMemo(() => {
        if (!searchTerm) {
          return { tracks: allTracks, playlists: playlists };
        }
        const lowerCaseSearchTerm = searchTerm.toLowerCase();

        const filteredTracks = allTracks.filter(
          (track) =>
            track.title.toLowerCase().includes(lowerCaseSearchTerm) ||
            track.artist.toLowerCase().includes(lowerCaseSearchTerm) ||
            track.album.toLowerCase().includes(lowerCaseSearchTerm) ||
            (track.tags && track.tags.some(tag => tag.toLowerCase().includes(lowerCaseSearchTerm)))
        );

        const filteredPlaylists = playlists.filter(
          (playlist) =>
            playlist.name.toLowerCase().includes(lowerCaseSearchTerm) ||
            playlist.tracks.some(track => 
              track.title.toLowerCase().includes(lowerCaseSearchTerm) ||
              track.artist.toLowerCase().includes(lowerCaseSearchTerm)
            )
        );
        return { tracks: filteredTracks, playlists: filteredPlaylists };
      }, [searchTerm, allTracks, playlists]);


      if (initialLoad) {
        return (
          <div className="flex justify-center items-center h-64">
            <Spinner size="lg" />
          </div>
        );
      }

      return (
        <div className="space-y-8">
          <h1 className="text-3xl font-bold">¡Bienvenido!</h1>

          <div className="mt-4 mb-6">
            <SearchInput
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Explora por título, artista, álbum o playlist..."
            />
          </div>

          {searchTerm ? (
            <section className="space-y-6">
              <h2 className="text-2xl font-semibold">Resultados de la Búsqueda</h2>

              {filteredItems.tracks.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-xl font-medium text-neutral-700">Canciones</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {filteredItems.tracks.map((track) => (
                      <TrackCard
                        key={track.id}
                        track={track}
                        queue={filteredItems.tracks}
                      />
                    ))}
                  </div>
                </div>
              )}

              {filteredItems.playlists.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-xl font-medium text-neutral-700">Playlists</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {filteredItems.playlists.map((playlist) => (
                      <Link key={playlist.id} href={`/playlists/${playlist.id}`}>
                        <PlaylistCard
                          title={playlist.name}
                          count={playlist.tracks.length}
                          coverUrl={playlist.artwork_url || (playlist.tracks.length > 0 ? playlist.tracks[0].artwork_url : undefined)}
                        />
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {filteredItems.playlists.length === 0 && filteredItems.tracks.length === 0 && (
                <p className="text-neutral-500 py-4 text-center">No se encontraron resultados para "{searchTerm}".</p>
              )}
            </section>
          ) : (
            <>
              <section className="space-y-4">
                <h2 className="text-2xl font-semibold">Explorar Canciones</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {allTracks.map((track) => (
                    <TrackCard
                      key={track.id}
                      track={track}
                      queue={allTracks}
                    />
                  ))}
                </div>
              </section>

              {playlists.length > 0 && (
                <section className="space-y-4">
                  <h2 className="text-2xl font-semibold">Explorar Playlists</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {playlists.slice(0, 5).map((playlist) => ( 
                      <Link key={playlist.id} href={`/playlists/${playlist.id}`}>
                        <PlaylistCard
                          title={playlist.name}
                          count={playlist.tracks.length}
                          coverUrl={playlist.artwork_url || (playlist.tracks.length > 0 ? playlist.tracks[0].artwork_url : undefined)}
                        />
                      </Link>
                    ))}
                  </div>
                  {playlists.length > 5 && (
                       <div className="flex justify-end">
                         <Link href="/library" passHref>
                             <Button variant="ghost" className="text-black hover:underline">Ver todas las playlists</Button>
                         </Link>
                       </div>
                   )}
                </section>
              )}

              {hasMore && searchTerm === "" && (
                <div className="flex justify-center mt-8">
                  <Button
                    onClick={handleLoadMore}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-6 py-3 rounded-full bg-white text-black border border-neutral-200 hover:bg-neutral-100 transition-colors"
                  >
                    {isLoading ? (
                      <>
                        <Spinner size="sm" /> Cargando más...
                      </>
                    ) : (
                      "Cargar más canciones"
                    )}
                  </Button>
                </div>
              )}

              {!hasMore && allTracks.length > 0 && searchTerm === "" && (
                <div className="text-center text-neutral-500 mt-8">
                  Has llegado al final de la lista de canciones.
                </div>
              )}
            </>
          )}

          <Toaster theme="light" position="top-right" />
        </div>
      );
    }