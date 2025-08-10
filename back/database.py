from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import declarative_base, sessionmaker

# ✅ Importante: Asegúrate de que tu URL usa 'postgresql+asyncpg' para la conexión asíncrona
# y que 'postgres:postgres' son tus credenciales correctas.
DATABASE_URL = "postgresql+asyncpg://postgres:postgres@localhost/music_stream_db" 

# Crea el motor de base de datos asíncrono
engine = create_async_engine(DATABASE_URL)

# Base declarativa para tus modelos SQLAlchemy
Base = declarative_base()

# Configura el sessionmaker para sesiones asíncronas
AsyncSessionLocal = sessionmaker(
    bind=engine,
    expire_on_commit=False, # Los objetos no expiran después del commit
    class_=AsyncSession,    # Usa la clase de sesión asíncrona
    autocommit=False,       # ✅ Explícitamente desactiva el autocommit
    autoflush=False         # ✅ Explícitamente desactiva el autoflush
)

# Función para obtener una sesión de base de datos asíncrona (dependencia para FastAPI)
async def get_db():
    async with AsyncSessionLocal() as session:
        yield session