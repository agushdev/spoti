from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import declarative_base, sessionmaker

# URL de conexión a la base de datos PostgreSQL
DATABASE_URL = "postgresql+asyncpg://postgres:postgres@localhost/music_stream_db" 

# Crea el motor de base de datos asíncrono
engine = create_async_engine(DATABASE_URL)

# Base declarativa para tus modelos SQLAlchemy
Base = declarative_base()

# Configura el sessionmaker para sesiones asíncronas
AsyncSessionLocal = sessionmaker(
    bind=engine,
    expire_on_commit=False, 
    class_=AsyncSession,   
    autocommit=False,      
    autoflush=False        
)

# Función para obtener una sesión de base de datos asíncrona (dependencia para FastAPI)
async def get_db():
    async with AsyncSessionLocal() as session:
        yield session