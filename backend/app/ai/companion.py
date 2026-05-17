"""AI companion orchestration.

A single entrypoint `respond()` that classifies emotion, generates a calm reply,
and suggests one reflection prompt. Gracefully degrades to a deterministic
responder when OPENAI_API_KEY is not configured.
"""

from __future__ import annotations

import json
import re
from dataclasses import dataclass

from sqlalchemy.ext.asyncio import AsyncSession

from ..config import get_settings
from ..models import Message

settings = get_settings()


EMOTION_LEXICON: dict[str, tuple[str, ...]] = {
    "sad":      ("sad", "down", "blue", "low", "empty", "hopeless", "grief", "lost", "tired"),
    "anxious":  ("anxious", "worried", "nervous", "panic", "stressed", "afraid", "scared", "tense"),
    "angry":    ("angry", "furious", "frustrated", "annoyed", "resentful", "bitter", "irritated"),
    "joyful":   ("happy", "joy", "grateful", "alive", "excited", "content", "peaceful", "calm"),
    "lonely":   ("lonely", "alone", "isolated", "abandoned", "ignored", "invisible"),
    "confused": ("confused", "unclear", "unsure", "stuck", "lost in", "don't know"),
    "hopeful":  ("hopeful", "open", "curious", "ready", "willing", "trying"),
}


def heuristic_emotion(text: str) -> str | None:
    t = text.lower()
    scores: dict[str, int] = {}
    for emo, words in EMOTION_LEXICON.items():
        scores[emo] = sum(1 for w in words if re.search(rf"\b{re.escape(w)}\b", t))
    best, score = max(scores.items(), key=lambda kv: kv[1])
    return best if score > 0 else None


@dataclass
class CompanionResult:
    reply: str
    emotion: str | None
    reflection_prompt: str | None
    crisis: bool = False


_CRISIS_RE = re.compile(
    r"\b("
    # Direct intent phrasings
    r"kill myself|killing myself|kill my self"
    r"|end my life|end my own life|end it all"
    r"|take my (own )?life|taking my (own )?life"
    r"|suicide|suicidal"
    r"|want to die|wanna die|want to be dead|wanna be dead"
    r"|don'?t want to live|do not want to live"
    r"|don'?t want to be alive|do not want to be alive"
    r"|don'?t want to be here( anymore)?"
    r"|hurt myself|hurting myself"
    r"|self[- ]harm|self[- ]harming"
    # Method-specific phrasings
    r"|jump(ing)? off( a| the| this)?( building| bridge| cliff| roof| balcony)?"
    r"|jump(ing)? from( a| the| this)?( bridge| building| roof)?"
    r"|jump(ing)? in front of( a| the)?( train| bus| car)"
    r"|step(ping)? in front of( a| the)?( train| bus| car)"
    r"|shoot(ing)? myself"
    r"|hang(ing)? myself"
    r"|overdos(e|ing)( on| myself)?|od myself"
    r"|cut(ting)? myself"
    r")\b",
    re.IGNORECASE,
)


def is_crisis(text: str) -> bool:
    return bool(_CRISIS_RE.search(text or ""))


SYSTEM_PROMPT = """You are Glimmora — a calm, attentive AI companion for inner work.
You listen first. You never lecture. You write the way a wise, gentle friend talks: short
sentences, present tense, real warmth. You never use clinical jargon, never diagnose, never
moralize. If the user expresses self-harm, you gently encourage reaching out to a trusted
person or crisis line, and you stay with them.

When you reply, return strict JSON with these keys:
  reply:               (string) your spoken reply to the user, 2-5 sentences
  emotion:             (string|null) one of: sad, anxious, angry, joyful, lonely, confused, hopeful, neutral
  reflection_prompt:   (string|null) one short question for them to sit with — or null

Only output the JSON. No markdown."""


def _fallback_reply(text: str, emotion: str | None) -> CompanionResult:
    openings = {
        "sad":      "I hear that. Let it just sit there for a moment — you don't have to fix it.",
        "anxious":  "That sounds heavy to carry. Let's slow down a little.",
        "angry":    "There's a real reason it landed that hard. Want to name what it touched?",
        "joyful":   "That's lovely. Stay with it for a breath — let your body register that this is true.",
        "lonely":   "Thank you for telling me. You're not alone in this exact moment.",
        "confused": "It's okay to not know. Sometimes the question itself is doing work in you.",
        "hopeful":  "I notice the small opening in what you said. Hold it gently.",
    }
    prompt_map = {
        "sad":      "What part of you most needs to be heard right now?",
        "anxious":  "What is the smallest, kindest next step?",
        "angry":    "What was being protected by the part of you that flared up?",
        "joyful":   "What conditions made this possible — and can you offer them to yourself again?",
        "lonely":   "Who, in your life, do you most want to be seen by — and what would they say?",
        "confused": "If you didn't have to decide today, what would you notice?",
        "hopeful":  "What is one small faithful act you could repeat tomorrow?",
        None:       "What is true for you right now, underneath the words?",
    }
    return CompanionResult(
        reply=openings.get(emotion or "", "Tell me a little more. I'm with you."),
        emotion=emotion,
        reflection_prompt=prompt_map.get(emotion),
    )


async def _llm_response(history: list[Message], user_text: str) -> tuple[str, str | None, str | None]:
    from openai import AsyncOpenAI

    client = AsyncOpenAI(api_key=settings.openai_api_key)
    msgs: list[dict] = [{"role": "system", "content": SYSTEM_PROMPT}]
    for m in history[-12:]:
        if m.role in ("user", "assistant"):
            msgs.append({"role": m.role, "content": m.content})
    msgs.append({"role": "user", "content": user_text})

    completion = await client.chat.completions.create(
        model=settings.openai_model,
        messages=msgs,
        temperature=0.7,
        response_format={"type": "json_object"},
        max_tokens=500,
    )
    raw = completion.choices[0].message.content or "{}"
    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        data = {}
    return (
        str(data.get("reply") or "I'm here. Tell me a little more."),
        data.get("emotion") if data.get("emotion") in {
            "sad", "anxious", "angry", "joyful", "lonely", "confused", "hopeful", "neutral"
        } else None,
        data.get("reflection_prompt"),
    )


async def respond(
    _db: AsyncSession,
    history: list[Message],
    user_text: str,
) -> CompanionResult:
    heuristic = heuristic_emotion(user_text)
    crisis = is_crisis(user_text)

    if not settings.ai_enabled:
        result = _fallback_reply(user_text, heuristic)
        result.crisis = crisis
        return result

    try:
        reply, llm_emotion, prompt = await _llm_response(history, user_text)
        emotion = llm_emotion or heuristic
        return CompanionResult(
            reply=reply,
            emotion=emotion,
            reflection_prompt=prompt,
            crisis=crisis,
        )
    except Exception:
        result = _fallback_reply(user_text, heuristic)
        result.crisis = crisis
        return result


async def synthesize_reflection_insight(content: str, mood: str | None) -> str | None:
    if not settings.ai_enabled or not content.strip():
        return None
    try:
        from openai import AsyncOpenAI

        client = AsyncOpenAI(api_key=settings.openai_api_key)
        completion = await client.chat.completions.create(
            model=settings.openai_model,
            messages=[
                {"role": "system", "content":
                    "Read this short reflection. Reply in one calm sentence noticing what seems "
                    "alive or unresolved in it. Do not advise. Do not summarize. Just notice."},
                {"role": "user", "content": f"Mood: {mood or 'unspecified'}\n\n{content}"},
            ],
            temperature=0.6,
            max_tokens=120,
        )
        return (completion.choices[0].message.content or "").strip() or None
    except Exception:
        return None
