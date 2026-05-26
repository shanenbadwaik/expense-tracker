from pydantic import BaseModel
from datetime import date


# -------------------------
# USER SCHEMAS
# -------------------------

class UserCreate(BaseModel):
    username: str
    email: str
    password: str


class UserLogin(BaseModel):
    username: str
    password: str


class ResetPassword(BaseModel):
    username: str
    new_password: str


# -------------------------
# EXPENSE SCHEMAS
# -------------------------

class ExpenseCreate(BaseModel):
    amount: float
    category: str
    date: date
    description: str


class ExpenseResponse(BaseModel):
    id: int
    amount: float
    category: str
    date: date
    description: str
    user_id: int

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str