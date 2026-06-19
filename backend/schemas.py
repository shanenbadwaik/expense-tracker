from pydantic import BaseModel, EmailStr, Field, field_validator
from datetime import date
import re

VALID_CATEGORIES = {
    "Food", "Transport", "Shopping", "Bills", "Health", "Leisure", "Other"
}


# ── User schemas ────────────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    username: str = Field(min_length=2, max_length=50)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)

    @field_validator("username")
    @classmethod
    def username_alphanumeric(cls, v: str) -> str:
        v = v.strip()
        if not re.match(r"^[a-zA-Z0-9_\- ]+$", v):
            raise ValueError("Username may only contain letters, numbers, spaces, hyphens and underscores")
        return v

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if not any(c.isupper() for c in v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one number")
        return v


class UserLogin(BaseModel):
    username: str
    password: str


class ResetPassword(BaseModel):
    username: str
    new_password: str = Field(min_length=8, max_length=128)


# ── Expense schemas ─────────────────────────────────────────────────────────────

class ExpenseCreate(BaseModel):
    amount: float = Field(gt=0, le=10_000_000, description="Must be positive and ≤ 1 crore")
    category: str = Field(max_length=50)
    date: date
    description: str = Field(default="", max_length=200)

    @field_validator("category")
    @classmethod
    def category_must_be_valid(cls, v: str) -> str:
        v = v.strip()
        if v not in VALID_CATEGORIES:
            raise ValueError(f"Category must be one of: {', '.join(sorted(VALID_CATEGORIES))}")
        return v

    @field_validator("description")
    @classmethod
    def sanitise_description(cls, v: str) -> str:
        return v.strip()

    @field_validator("date")
    @classmethod
    def date_not_in_future(cls, v: date) -> date:
        from datetime import date as dt
        if v > dt.today():
            raise ValueError("Expense date cannot be in the future")
        return v


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
