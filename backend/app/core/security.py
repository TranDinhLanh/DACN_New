import hashlib
import os
import base64
import jwt
from datetime import datetime, timedelta, timezone
from typing import Any, Union
from app.core.config import settings

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        parts = hashed_password.split('$')
        if len(parts) != 2:
            # Fallback in case of raw match (useful for simple admin credentials)
            return plain_password == hashed_password
        salt_b64, hash_b64 = parts[0], parts[1]
        salt = base64.b64decode(salt_b64)
        expected_hash = base64.b64decode(hash_b64)
        test_hash = hashlib.pbkdf2_hmac('sha256', plain_password.encode('utf-8'), salt, 100000)
        return test_hash == expected_hash
    except Exception:
        return False

def get_password_hash(password: str) -> str:
    salt = os.urandom(16)
    db_hash = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, 100000)
    salt_b64 = base64.b64encode(salt).decode('utf-8')
    hash_b64 = base64.b64encode(db_hash).decode('utf-8')
    return f"{salt_b64}${hash_b64}"

def create_access_token(subject: Union[str, Any], expires_delta: timedelta = None) -> str:
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm="HS256")
    return encoded_jwt
