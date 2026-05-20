from passlib.context import CryptContext
from jose import jwt
from datetime import datetime, timedelta

SECRET_KEY = "SECRET123"
ALGORITHM = "HS256"

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)


def hash_password(password: str):

    # bcrypt max length fix
    password = password[:72]

    return pwd_context.hash(password)


def verify_password(
    plain_password,
    hashed_password
):

    plain_password = plain_password[:72]

    return pwd_context.verify(
        plain_password,
        hashed_password
    )


def create_token(data: dict):

    to_encode = data.copy()

    expire = datetime.utcnow() + timedelta(days=1)

    to_encode.update({
        "exp": expire
    })

    return jwt.encode(
        to_encode,
        SECRET_KEY,
        algorithm=ALGORITHM
    )