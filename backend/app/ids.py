from uuid import uuid4


def new_id(prefix: str = "c") -> str:
    """Short cuid-like identifier — 25 chars, URL-safe, sortable enough for logs."""
    return f"{prefix}{uuid4().hex[:24]}"
