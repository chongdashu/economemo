from datetime import datetime

from pydantic import BaseModel, ConfigDict


class StreakResponse(BaseModel):
    current_streak: int
    longest_streak: int
    last_read_date: datetime | None
    streak_days: str

    model_config = ConfigDict(from_attributes=True)
