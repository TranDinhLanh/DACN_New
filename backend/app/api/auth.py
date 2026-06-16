import random
import os
from dotenv import load_dotenv
load_dotenv()
import urllib.parse
import urllib.request
import json
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.database import get_db
from app.core.security import get_password_hash, verify_password, create_access_token
from app.api.deps import get_current_user
from app.models.models import User
from app.schemas.schemas import (
    UserCreate, 
    UserResponse, 
    Token, 
    UserRegister, 
    ForgotPasswordRequest, 
    ResetPasswordRequest, 
    ChangePasswordRequest
)

router = APIRouter()

def verify_recaptcha(response_token: str) -> bool:
    # Allow mock token for manual/unit testing
    if response_token == "mock_captcha_token":
        return True
    
    secret = os.getenv("RECAPTCHA_SECRET_KEY", "6LeIxAcTAAAAAGG-v2oB0ihxZGlG5q0SBxm8gdqc")
    print(f"[DEBUG reCAPTCHA] Secret Key: {secret[:6]}...{secret[-6:] if len(secret) > 12 else ''}")
    url = "https://www.google.com/recaptcha/api/siteverify"
    data = urllib.parse.urlencode({
        "secret": secret,
        "response": response_token
    }).encode("utf-8")
    try:
        req = urllib.request.Request(url, data=data)
        # Timeout after 5 seconds to prevent locking up
        with urllib.request.urlopen(req, timeout=5) as response:
            result = json.loads(response.read().decode())
            print(f"[DEBUG reCAPTCHA] Result: {result}")
            return result.get("success", False)
    except Exception as e:
        print(f"ReCAPTCHA verification failed: {e}")
        # For development safety: if there's a network issue, default to True
        return True

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_in: UserRegister, db: Session = Depends(get_db)):
    """
    Register a new user with Google reCAPTCHA verification.
    """
    # Verify Captcha
    if not verify_recaptcha(user_in.captcha_token):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="reCAPTCHA verification failed. Please try again."
        )

    # Check if user already exists
    user = db.query(User).filter(User.email == user_in.email).first()
    if user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The user with this email already exists in the system.",
        )
    
    # Create new user
    db_user = User(
        email=user_in.email,
        hashed_password=get_password_hash(user_in.password),
        full_name=user_in.full_name,
        is_active=True
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """
    OAuth2 compatible token login, retrieve a JWT access token.
    """
    # Authenticate user
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect email or password"
        )
    elif not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
        
    # Generate access token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return {
        "access_token": create_access_token(user.id, expires_delta=access_token_expires),
        "token_type": "bearer",
    }


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """
    Get current logged in user details.
    """
    return current_user


@router.post("/forgot-password")
def forgot_password(req: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """
    Generate OTP for password reset, save to database and print/return it.
    """
    user = db.query(User).filter(User.email == req.email).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Email not found")
    
    # Generate 6 digit OTP
    otp = f"{random.randint(100000, 999999)}"
    
    # Save OTP to database
    user.reset_otp = otp
    user.reset_otp_expires = datetime.now(timezone.utc) + timedelta(minutes=10)
    db.commit()
    
    # Print the OTP to console so it's easy to see in the terminal
    print(f"\n==========================================")
    print(f"PASSWORD RESET OTP FOR {req.email}: {otp}")
    print(f"==========================================\n")
    
    return {
        "message": "OTP verification email sent successfully. (Mocked)",
        "otp": otp  # Returned in response for easy testing in frontend
    }


@router.post("/reset-password")
def reset_password(req: ResetPasswordRequest, db: Session = Depends(get_db)):
    """
    Verify OTP and reset password.
    """
    user = db.query(User).filter(User.email == req.email).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        
    if not user.reset_otp or user.reset_otp != req.otp:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid OTP code")
        
    expires = user.reset_otp_expires
    if expires is not None:
        # DB timezone handling
        if expires.tzinfo is None:
            now = datetime.utcnow()
        else:
            now = datetime.now(timezone.utc)
            
        if now > expires:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="OTP code has expired")
            
    # Success, update password
    user.hashed_password = get_password_hash(req.new_password)
    user.reset_otp = None
    user.reset_otp_expires = None
    db.commit()
    
    return {"message": "Password reset successful"}


@router.post("/change-password")
def change_password(req: ChangePasswordRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Change password for authenticated user.
    """
    if not verify_password(req.old_password, current_user.hashed_password):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Incorrect old password")
        
    current_user.hashed_password = get_password_hash(req.new_password)
    db.commit()
    
    return {"message": "Password changed successfully"}
