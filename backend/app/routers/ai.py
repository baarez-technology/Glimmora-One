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
    ConversationDetail,
    ConversationSummary,
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
            recommended_episode_ids=result.recommended_episode_ids,
            crisis=result.crisis,
        )
    )


@router.get("/conversations", response_model=Envelope[list[ConversationSummary]])
async def list_conversations(user: CurrentUser, db: AsyncSession = Depends(get_db)):
    rows = (
        await db.execute(
            select(Conversation)
            .where(Conversation.user_id == user.id)
            .order_by(desc(Conversation.updated_at))
            .limit(50)
        )
    ).scalars().all()
    summaries: list[ConversationSummary] = []
    for c in rows:
        last = (
            await db.execute(
                select(Message)
                .where(Message.conversation_id == c.id)
                .order_by(desc(Message.created_at))
                .limit(1)
            )
        ).scalar_one_or_none()
        summaries.append(
            ConversationSummary(
                id=c.id,
                title=c.title,
                updated_at=c.updated_at,
                last_message_preview=(last.content[:140] if last else None),
            )
        )
    return Envelope(data=summaries)


@router.get("/conversations/{conversation_id}", response_model=Envelope[ConversationDetail])
async def get_conversation(
    conversation_id: str, user: CurrentUser, db: AsyncSession = Depends(get_db)
):
    c = (
        await db.execute(
            select(Conversation)
            .options(selectinload(Conversation.messages))
            .where(Conversation.id == conversation_id, Conversation.user_id == user.id)
        )
    ).scalar_one_or_none()
    if not c:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "conversation not found")
    return Envelope(
        data=ConversationDetail(
            id=c.id,
            title=c.title,
            created_at=c.created_at,
            messages=[ChatMessage.model_validate(m) for m in c.messages],
        )
    )


@router.delete("/conversations/{conversation_id}", response_model=Envelope[dict])
async def delete_conversation(
    conversation_id: str, user: CurrentUser, db: AsyncSession = Depends(get_db)
):
    c = (
        await db.execute(
            select(Conversation).where(
                Conversation.id == conversation_id, Conversation.user_id == user.id
            )
        )
    ).scalar_one_or_none()
    if not c:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "conversation not found")
    await db.delete(c)
    await db.commit()
    return Envelope(data={"deleted": True})
