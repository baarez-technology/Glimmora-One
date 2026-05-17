"""Spiritual Knowledge Graph (SKG) — read-only catalog of life situations,
wisdom frameworks, and practices.

Loaded once from backend/data/skg.json on module import. The file is the
source of truth; edit it via PR, do not generate.
"""

from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path

from fastapi import APIRouter, HTTPException, status

from ..schemas import Envelope, LifeSituation, LifeSituationSummary

router = APIRouter(prefix="/v1/skg", tags=["skg"])

_DATA_PATH = Path(__file__).resolve().parents[2] / "data" / "skg.json"


@lru_cache(maxsize=1)
def _load() -> dict[str, LifeSituation]:
    if not _DATA_PATH.exists():
        return {}
    raw = json.loads(_DATA_PATH.read_text(encoding="utf-8"))
    out: dict[str, LifeSituation] = {}
    for s in raw.get("situations", []):
        sit = LifeSituation.model_validate(s)
        out[sit.slug] = sit
    return out


@router.get("/situations", response_model=Envelope[list[LifeSituationSummary]])
async def list_situations():
    sits = _load().values()
    summaries = [
        LifeSituationSummary(
            slug=s.slug,
            title=s.title,
            tagline=s.tagline,
            emotional_patterns=s.emotional_patterns,
        )
        for s in sits
    ]
    summaries.sort(key=lambda x: x.title)
    return Envelope(data=summaries)


@router.get("/situations/{slug}", response_model=Envelope[LifeSituation])
async def get_situation(slug: str):
    sit = _load().get(slug)
    if not sit:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "situation not found")
    return Envelope(data=sit)
