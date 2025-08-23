import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import declarative_base, sessionmaker

<<<<<<< HEAD
DATABASE_URL = os.environ.get("DATABASE_URL")
=======
# URL de conexión a la base de datos PostgreSQL
DATABASE_URL = "postgresql+asyncpg://spoti_db_user:JDVnm8s8b9JnZ6N0JVXNWs3tUyowGVmI@dpg-d2gon6odl3ps73fhr5v0-a/spoti_db" 
>>>>>>> a740774f6458f7c092785f7c3cb8963ad53d6515

engine = create_async_engine(DATABASE_URL, echo=True)

Base = declarative_base()

AsyncSessionLocal = sessionmaker(
    bind=engine,
    expire_on_commit=False, 
    class_=AsyncSession,   
    autocommit=False,      
    autoflush=False        
)

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session