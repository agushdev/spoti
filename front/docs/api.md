# API (MVP, Mock)
Base URL: /api

- GET /api/tracks
  - Response: { data: Track[] }

- GET /api/search?q={query}&tag={Minimal|Electrónica|Lo-fi|Indie|Instrumental}
  - Response: { data: Track[] }

- GET /api/recommendations
  - Response: { data: Track[] }

Types:
Track {
  id: string
  title: string
  artist: string
  album: string
  duration: number
  image: string
  audioUrl: string
  tags?: string[]
}

Nota: Sustituye estos handlers por tu API Python (Django/FastAPI) cuando esté lista.
\`\`\`

```mermaid title="User Flows (MVP)" type="diagram"
graph TD;
A["Inicio"]B["Buscar y Filtrar"];
A["Inicio"]C["Recomendaciones"];
B["Buscar y Filtrar"]D["Seleccionar Pista"];
C["Recomendaciones"]D["Seleccionar Pista"];
D["Seleccionar Pista"]E["Reproducir en Player Persistente"];
E["Reproducir en Player Persistente"]F["Marcar Me Gusta"];
E["Reproducir en Player Persistente"]G["Agregar a Playlist (próximo)"];
E["Reproducir en Player Persistente"]H["Historial (Local)"];
I["Biblioteca"]J["Ver Me Gusta"];
I["Biblioteca"]K["Ver Historial"];
I["Biblioteca"]L["Gestionar Playlists"];
M["Perfil"]N["Editar Nombre y Bio"];
