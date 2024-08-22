from datetime import datetime

from pydantic import BaseModel


class StreakDay(BaseModel):
    day: str
    date: datetime
    read_count: int


class StreakResponse(BaseModel):
    current_streak: int
    streaks: list[StreakDay]
