from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import User

from .api import UserCreate, UserResponse

router = APIRouter()


@router.post("/users/", response_model=UserResponse)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    if user.email:
        existing_user = db.query(User).filter(User.email == user.email).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="User with this email already exists")
    db_user = User(email=user.email) if user.email else User(id=user.uuid)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


@router.post("/login/", response_model=UserResponse)
def login(user: UserCreate, db: Session = Depends(get_db)):
    if not user.email:
        raise HTTPException(status_code=400, detail="Email is required")
    db_user = db.query(User).filter(User.email == user.email).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user
