from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency that provides a database session.

    This is a placeholder that will be connected to the actual database
    session factory once database.py is set up by the database agent.
    """
    # Will be replaced with actual session logic once database.py exists:
    #
    # from app.database import async_session_maker
    # async with async_session_maker() as session:
    #     try:
    #         yield session
    #         await session.commit()
    #     except Exception:
    #         await session.rollback()
    #         raise
    raise NotImplementedError(
        "Database session not yet configured. "
        "Waiting for database.py to be created by the database agent."
    )
