import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import declarative_base, sessionmaker

DATABASE_URL = os.environ.get("DATABASE_URL")

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