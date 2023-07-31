import jwt
import os
import datetime
from typing import Optional, Any


secret_key = os.environ.get("SECRET_KEY", "WeConnect")

def generate_token(payload: Any, duration: int) -> str:
    payload["exp"] = datetime.datetime.utcnow() + datetime.timedelta(minutes=duration)
    return jwt.encode(payload, secret_key, algorithm="HS256")

def verify_token(token: str) -> Optional[Any]:
    try:
        return jwt.decode(token, secret_key, algorithms=["HS256"])
    except jwt.ExpiredSignatureError or jwt.InvalidTokenError:
        return None