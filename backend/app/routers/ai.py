from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ..ai.companion import respond
from ..db import get_db
from ..deps import CurrentUser
from ..models import Conversation, Message
from ..schemas import (
    ChatMessage,
    ChatRequest,
    ChatResponse,
    Envelope,
)

router = APIRouter(prefix="/v1/ai", tags=["ai"])


@router.post("/chat", response_model=Envelope[ChatResponse])
async def chat(payload: ChatRequest, user: CurrentUser, db: AsyncSession = Depends(get_db)):
    text = (payload.message or "").strip()
    if not text:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "message is empty")

    history: list[Message] = []
    if payload.conversation_id:
        conv = (
            await db.execute(
                select(Conversation)
                .options(selectinload(Conversation.messages))
                .where(Conversation.id == payload.conversation_id, Conversation.user_id == user.id)
            )
        ).scalar_one_or_none()
        if not conv:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "conversation not found")
        history = list(conv.messages)
    else:
        conv = Conversation(user_id=user.id, title=text[:40].rstrip() + ("…" if len(text) > 40 else ""))
        db.add(conv)
        await db.flush()

    user_msg = Message(conversation_id=conv.id, role="user", content=text)
    db.add(user_msg)
    await db.flush()

    result = await respond(db, history, text)

    assistant_msg = Message(
        conversation_id=conv.id,
        role="assistant",
        content=result.reply,
        emotion=result.emotion,
    )
    db.add(assistant_msg)
    user_msg.emotion = result.emotion
    await db.commit()
    await db.refresh(user_msg)
    await db.refresh(assistant_msg)

    return Envelope(
        data=ChatResponse(
            conversation_id=conv.id,
            user_message=ChatMessage.model_validate(user_msg),
            assistant_message=ChatMessage.model_validate(assistant_msg),
            detected_emotion=result.emotion,
            suggested_reflection=result.reflection_prompt,
            crisis=result.crisis,
        )
    )
