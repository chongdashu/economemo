from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session

from app.db import get_db
from app.streak.api import StreakResponse
from app.streak.db import get_streak

router = APIRouter()


@router.get("/streak", response_model=StreakResponse)
def get_user_streak(
    user_id: str = Header(None, alias="User-Id"),
    db: Session = Depends(get_db),
):
    if user_id is None:
        raise HTTPException(status_code=400, detail="User ID is required")

    streak = get_streak(db, user_id)
    return streak
