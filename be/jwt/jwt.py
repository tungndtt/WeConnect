import jwt
import os
import datetime
from typing import Any


class Jwt:
    def __init__(self) -> None:
        self.__secret_key = os.environ.get("SECRET_KEY", "WeConnect")

    # Generate token with payload and 2 additional fields "created_at" and "duration"
    def generate_token(self, payload: Any, duration: int) -> str:
        payload["created_at"] = datetime.datetime.utcnow()
        payload["duration"] = datetime.timedelta(minutes=duration)
        return jwt.encode(payload, self.__secret_key, algorithm="HS256")

    # verify the token whether it's still valid. True if valid (otw, False)
    def verify_token(self, token: str) -> tuple[bool, Any]:
        try:
            payload = jwt.decode(token, self.__secret_key, algorithms=["HS256"])
            is_unexpired = payload["created_at"] + payload["duration"] > datetime.datetime.utcnow()
            return is_unexpired, payload
        except jwt.InvalidTokenError:
            return False, None