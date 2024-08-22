from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy import Date, cast, func
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import Article
from app.streak.api import StreakDay, StreakResponse

router = APIRouter()


@router.get("/streak", response_model=StreakResponse)
def get_streak(user_id: str = Header(None, alias="User-Id"), db: Session = Depends(get_db)):
    if user_id is None:
        raise HTTPException(status_code=400, detail="User ID is required")

    today = datetime.now(UTC).date()
    seven_days_ago = today - timedelta(days=6)

    # Query to get read counts for the last 7 days
    read_counts = (
        db.query(cast(Article.date_read, Date).label("date"), func.count(Article.id).label("count"))
        .filter(Article.user_id == user_id)
        .filter(cast(Article.date_read, Date) >= seven_days_ago)
        .filter(cast(Article.date_read, Date) <= today)
        .group_by(cast(Article.date_read, Date))
        .all()
    )

    # Create a dictionary of date to read count
    read_count_dict = {rc.date: rc.count for rc in read_counts}

    # Generate the streaks array
    streaks = []
    for i in range(7):
        date = today - timedelta(days=6 - i)
        day = date.strftime("%a")[:2]
        read_count = read_count_dict.get(date, 0)
        streaks.append(StreakDay(day=day, date=date, read_count=read_count))

    # Calculate current streak
    current_streak = 0
    for streak in reversed(streaks):
        if streak.read_count > 0:
            current_streak += 1
        elif current_streak > 0:
            # Stop counting if we've started a streak and hit a day with no reads
            break
        # If we haven't started a streak yet, continue looking back

    return StreakResponse(current_streak=current_streak, streaks=streaks)
