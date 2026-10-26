import os

from datetime import datetime, timedelta, timezone

import jwt

from jwt.exceptions import InvalidTokenError

from dotenv import load_dotenv
from pwdlib import PasswordHash


load_dotenv()


SECRET_KEY = os.getenv("SECRET_KEY")

ALGORITHM = os.getenv(
    "ALGORITHM",
    "HS256"
)

ACCESS_TOKEN_EXPIRE_MINUTES = int(
    os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30)
)


if not SECRET_KEY:
    raise RuntimeError(
        "SECRET_KEY is missing from .env"
    )


password_hash = PasswordHash.recommended()


# 1. Hash password
def hash_password(password: str) -> str:

    return password_hash.hash(password)


# 2. Verify password
def verify_password(
    plain_password: str,
    hashed_password: str
) -> bool:

    return password_hash.verify(
        plain_password,
        hashed_password
    )


# 3. Generate JWT access token
def create_access_token(data: dict) -> str:

    to_encode = data.copy()

    expire = datetime.now(timezone.utc) + timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )

    to_encode.update({
        "exp": expire
    })

    encoded_jwt = jwt.encode(
        to_encode,
        SECRET_KEY,
        algorithm=ALGORITHM
    )

    return encoded_jwt


# 4. Verify JWT access token
def verify_access_token(token: str):

    try:

        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        user_id = payload.get("sub")

        if user_id is None:
            return None

        return payload

    except InvalidTokenError:

        return None