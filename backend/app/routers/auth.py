from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.schemas.auth import UserRegister, UserLogin, UserOut, Token
from app.utils.security import verify_password, get_password_hash, create_access_token, get_current_user

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED, summary="Register a new developer account")
def register(payload: UserRegister, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    new_user = User(
        name=payload.name,
        email=payload.email,
        password_hash=get_password_hash(payload.password)
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    access_token = create_access_token(data={"sub": new_user.id, "email": new_user.email})
    return Token(access_token=access_token, user=UserOut.model_validate(new_user))

@router.post("/login", response_model=Token, summary="Authenticate and retrieve JWT access token")
def login(payload: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(data={"sub": user.id, "email": user.email})
    return Token(access_token=access_token, user=UserOut.model_validate(user))

@router.get("/me", response_model=UserOut, summary="Retrieve authenticated user profile")
def get_me(current_user: User = Depends(get_current_user)):
    return UserOut.model_validate(current_user)
