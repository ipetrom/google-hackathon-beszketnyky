import logging
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi import status as http_status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.apartment import Apartment
from app.models.conversation import Conversation
from app.models.message import Message
from app.schemas.conversation import (
    ConversationCreate,
    ConversationResponse,
    MessageCreate,
    MessageResponse,
)

logger = logging.getLogger(__name__)

router = APIRouter(tags=["conversations"])


class StatusUpdate(BaseModel):
    status: str


@router.get("/conversations")
async def list_conversations(
    status: str | None = Query(None),
    db: Session = Depends(get_db),
) -> dict:
    """List all conversations, optionally filtered by status."""
    query = db.query(Conversation)
    if status:
        query = query.filter(Conversation.status == status)
    conversations = query.order_by(Conversation.updated_at.desc()).all()
    return {"conversations": [ConversationResponse.model_validate(c) for c in conversations]}


@router.get("/apartments/{apartment_id}/conversations")
async def get_apartment_conversations(
    apartment_id: str,
    db: Session = Depends(get_db),
) -> dict:
    """Get all conversations for an apartment."""
    apartment = db.query(Apartment).filter(Apartment.id == apartment_id).first()
    if not apartment:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail=f"Apartment {apartment_id} not found",
        )

    conversations = (
        db.query(Conversation)
        .filter(Conversation.apartment_id == apartment_id)
        .order_by(Conversation.updated_at.desc())
        .all()
    )
    return {"conversations": [ConversationResponse.model_validate(c) for c in conversations]}


@router.post("/conversations", status_code=http_status.HTTP_201_CREATED, response_model=ConversationResponse)
async def create_conversation(
    data: ConversationCreate,
    db: Session = Depends(get_db),
) -> ConversationResponse:
    """Create a new conversation."""
    # Verify the apartment exists
    apartment = db.query(Apartment).filter(Apartment.id == data.apartment_id).first()
    if not apartment:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail=f"Apartment {data.apartment_id} not found",
        )

    conversation = Conversation(
        id=uuid.uuid4(),
        apartment_id=data.apartment_id,
        tenant_name=data.tenant_name,
        platform_source=data.platform_source,
        status="ai_handled",
    )
    db.add(conversation)
    db.commit()
    db.refresh(conversation)
    logger.info("Created conversation %s for apartment %s", conversation.id, data.apartment_id)
    return ConversationResponse.model_validate(conversation)


@router.get("/conversations/{conversation_id}/messages")
async def get_messages(
    conversation_id: str,
    db: Session = Depends(get_db),
) -> dict:
    """Get all messages for a conversation."""
    conversation = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conversation:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail=f"Conversation {conversation_id} not found",
        )

    messages = (
        db.query(Message)
        .filter(Message.conversation_id == conversation_id)
        .order_by(Message.timestamp.asc())
        .all()
    )
    return {"messages": [MessageResponse.model_validate(m) for m in messages]}


@router.post(
    "/conversations/{conversation_id}/messages",
    status_code=http_status.HTTP_201_CREATED,
    response_model=MessageResponse,
)
async def send_message(
    conversation_id: str,
    data: MessageCreate,
    db: Session = Depends(get_db),
) -> MessageResponse:
    """Send a message in a conversation."""
    conversation = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conversation:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail=f"Conversation {conversation_id} not found",
        )

    message = Message(
        id=uuid.uuid4(),
        conversation_id=conversation_id,
        sender=data.sender,
        message_text=data.message_text,
    )
    db.add(message)
    db.commit()
    db.refresh(message)
    logger.info(
        "Message sent in conversation %s by %s",
        conversation_id,
        data.sender,
    )
    return MessageResponse.model_validate(message)


@router.patch("/conversations/{conversation_id}/status", response_model=ConversationResponse)
async def update_conversation_status(
    conversation_id: str,
    data: StatusUpdate,
    db: Session = Depends(get_db),
) -> ConversationResponse:
    """Update a conversation's status."""
    conversation = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conversation:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail=f"Conversation {conversation_id} not found",
        )

    conversation.status = data.status
    db.commit()
    db.refresh(conversation)
    logger.info("Updated conversation %s status to %s", conversation_id, data.status)
    return ConversationResponse.model_validate(conversation)
