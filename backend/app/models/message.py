import uuid

from sqlalchemy import Column, DateTime, ForeignKey, Index, String, Text, func
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import relationship

from app.database import Base


class Message(Base):
    __tablename__ = "messages"

    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    conversation_id = Column(
        PG_UUID(as_uuid=True),
        ForeignKey("conversations.id", ondelete="CASCADE"),
        nullable=False,
    )
    sender = Column(String(50), nullable=False)
    message_text = Column(Text, nullable=False)
    timestamp = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    # Relationships
    conversation = relationship("Conversation", back_populates="messages")

    __table_args__ = (
        Index("idx_messages_conversation_id", "conversation_id"),
        Index("idx_messages_timestamp", "timestamp"),
    )
