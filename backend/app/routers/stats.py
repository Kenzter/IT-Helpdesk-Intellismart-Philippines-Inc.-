import re
from collections import Counter
from datetime import datetime, timezone
from typing import Optional
from zoneinfo import ZoneInfo
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models
from ..auth import require_staff
from ..schemas import CATEGORIES

router = APIRouter(prefix="/stats", tags=["stats"])
TZ = ZoneInfo("Asia/Manila")  # months and years are counted in local (Philippine) time


def _local(dt: datetime) -> datetime:
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(TZ)


def _summary(rows: list[dict]) -> dict:
    total = len(rows)
    status = Counter(r["status"] for r in rows)
    cats = Counter(r["category"] for r in rows)
    deps = Counter(r["department"] or "Not specified" for r in rows)
    pct = lambda n: round(n * 100 / total, 1) if total else 0
    names = CATEGORIES + [c for c in cats if c not in CATEGORIES]  # keep old labels visible
    return {
        "total": total,
        "open": status.get("OPEN", 0),
        "in_progress": status.get("IN_PROGRESS", 0),
        "resolved": status.get("RESOLVED", 0),
        "closed": status.get("CLOSED", 0),
        "categories": [{"name": c, "count": cats.get(c, 0), "percent": pct(cats.get(c, 0))} for c in names],
        "departments": [{"name": d, "count": n} for d, n in sorted(deps.items(), key=lambda x: (-x[1], x[0]))],
    }


@router.get("")
def get_stats(month: Optional[str] = None, year: Optional[int] = None,
              db: Session = Depends(get_db),
              _: models.User = Depends(require_staff)):
    """All-time summary, plus summaries for one month (YYYY-MM) and one year (YYYY), and a 12-month trend."""
    if month and not re.fullmatch(r"\d{4}-(0[1-9]|1[0-2])", month):
        raise HTTPException(400, "month must look like 2026-10")
    if year is not None and (year < 1 or year > 9999):
        raise HTTPException(400, "year must be a valid four-digit year")

    rows = [
        {"status": t.status, "category": t.category, "department": t.department,
         "month": _local(t.created_at).strftime("%Y-%m"),
         "year": _local(t.created_at).year}
        for t in db.query(models.Ticket).all()
    ]
    now = datetime.now(TZ)
    current = now.strftime("%Y-%m")
    months = sorted({r["month"] for r in rows} | {current}, reverse=True)
    years = sorted({r["year"] for r in rows} | {now.year}, reverse=True)

    trend, y, m = [], now.year, now.month
    for _i in range(12):
        key = f"{y}-{m:02d}"
        trend.append({"month": key, "count": sum(1 for r in rows if r["month"] == key)})
        m -= 1
        if m == 0:
            y, m = y - 1, 12
    trend.reverse()

    return {
        "months": months,
        "years": years,
        "overall": _summary(rows),
        "monthly": _summary([r for r in rows if r["month"] == month]) if month else None,
        "yearly": _summary([r for r in rows if r["year"] == year]) if year is not None else None,
        "trend": trend,
    }
