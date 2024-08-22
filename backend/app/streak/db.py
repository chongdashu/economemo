from datetime import UTC, datetime

from sqlalchemy.orm import Session

from app.models import Streak


def update_streak(db: Session, user_id: str) -> Streak:
    streak = db.query(Streak).filter(Streak.user_id == user_id).first()
    if not streak:
        streak = Streak(user_id=user_id)
        db.add(streak)

    today = datetime.now(UTC).date()

    if streak.last_read_date:
        days_diff = (today - streak.last_read_date.date()).days
        if days_diff == 0:
            return streak
        elif days_diff == 1:
            streak.current_streak += 1
        else:
            streak.current_streak = 1
    else:
        streak.current_streak = 1

    streak.last_read_date = today
    streak.longest_streak = max(streak.longest_streak, streak.current_streak)

    # Update streak_days
    streak_days = list(streak.streak_days)
    today_index = today.weekday()
    streak_days[today_index] = "1"
    streak.streak_days = "".join(streak_days)

    db.commit()
    db.refresh(streak)
    return streak


def get_streak(db: Session, user_id: str) -> Streak:
    streak = db.query(Streak).filter(Streak.user_id == user_id).first()
    if not streak:
        streak = Streak(user_id=user_id)
        db.add(streak)
        db.commit()
        db.refresh(streak)

    # Ensure streak_days is up-to-date
    today = datetime.now(UTC).date()
    if streak.last_read_date:
        days_diff = (today - streak.last_read_date.date()).days
        if days_diff > 0:
            streak_days = list("0" * 7)
            streak.current_streak = 0
            streak.last_read_date = None
            streak.streak_days = "".join(streak_days)
            db.commit()
            db.refresh(streak)

    return streak
