from pydantic import BaseModel, EmailStr, Field, field_validator
from datetime import date
from typing import Optional
import re

VALID_CATEGORIES = {
    "Food", "Transport", "Shopping", "Bills", "Health", "Leisure", "Other"
}
VALID_INCOME_SOURCES = {
    "Salary", "Freelance", "Business", "Investment", "Gift", "Other"
}
VALID_CURRENCIES = {
    "INR", "USD", "EUR", "GBP", "AED", "SGD", "JPY", "CAD", "AUD"
}
VALID_FREQUENCIES = {"monthly", "weekly", "yearly"}


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


# ── Password reset schemas ───────────────────────────────────────────────────────

class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class PasswordResetConfirm(BaseModel):
    token: str = Field(min_length=10)
    new_password: str = Field(min_length=8, max_length=128)

    @field_validator("new_password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if not any(c.isupper() for c in v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one number")
        return v


# ── Expense schemas ─────────────────────────────────────────────────────────────

class ExpenseCreate(BaseModel):
    amount: float = Field(gt=0, le=10_000_000)
    category: str = Field(max_length=50)
    date: date
    description: str = Field(default="", max_length=200)
    currency: str = Field(default="INR", max_length=10)

    @field_validator("category")
    @classmethod
    def category_must_be_valid(cls, v: str) -> str:
        v = v.strip()
        if v not in VALID_CATEGORIES:
            raise ValueError(f"Category must be one of: {', '.join(sorted(VALID_CATEGORIES))}")
        return v

    @field_validator("currency")
    @classmethod
    def currency_must_be_valid(cls, v: str) -> str:
        v = v.strip().upper()
        if v not in VALID_CURRENCIES:
            raise ValueError(f"Currency must be one of: {', '.join(sorted(VALID_CURRENCIES))}")
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


class ExpenseUpdate(BaseModel):
    amount: Optional[float] = Field(None, gt=0, le=10_000_000)
    category: Optional[str] = Field(None, max_length=50)
    date: Optional[date] = None
    description: Optional[str] = Field(None, max_length=200)
    currency: Optional[str] = Field(None, max_length=10)

    @field_validator("category")
    @classmethod
    def category_must_be_valid(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        v = v.strip()
        if v not in VALID_CATEGORIES:
            raise ValueError(f"Category must be one of: {', '.join(sorted(VALID_CATEGORIES))}")
        return v

    @field_validator("currency")
    @classmethod
    def currency_must_be_valid(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        v = v.strip().upper()
        if v not in VALID_CURRENCIES:
            raise ValueError(f"Currency must be one of: {', '.join(sorted(VALID_CURRENCIES))}")
        return v


class ExpenseResponse(BaseModel):
    id: int
    amount: float
    category: str
    date: date
    description: str
    currency: str
    user_id: int

    class Config:
        from_attributes = True


# ── Income schemas ──────────────────────────────────────────────────────────────

class IncomeCreate(BaseModel):
    amount: float = Field(gt=0, le=10_000_000)
    source: str = Field(default="Other", max_length=50)
    date: date
    description: str = Field(default="", max_length=200)
    currency: str = Field(default="INR", max_length=10)

    @field_validator("source")
    @classmethod
    def source_must_be_valid(cls, v: str) -> str:
        v = v.strip()
        if v not in VALID_INCOME_SOURCES:
            raise ValueError(f"Source must be one of: {', '.join(sorted(VALID_INCOME_SOURCES))}")
        return v

    @field_validator("currency")
    @classmethod
    def currency_must_be_valid(cls, v: str) -> str:
        v = v.strip().upper()
        if v not in VALID_CURRENCIES:
            raise ValueError(f"Currency must be one of: {', '.join(sorted(VALID_CURRENCIES))}")
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
            raise ValueError("Income date cannot be in the future")
        return v


class IncomeUpdate(BaseModel):
    amount: Optional[float] = Field(None, gt=0, le=10_000_000)
    source: Optional[str] = Field(None, max_length=50)
    date: Optional[date] = None
    description: Optional[str] = Field(None, max_length=200)
    currency: Optional[str] = Field(None, max_length=10)

    @field_validator("source")
    @classmethod
    def source_must_be_valid(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        v = v.strip()
        if v not in VALID_INCOME_SOURCES:
            raise ValueError(f"Source must be one of: {', '.join(sorted(VALID_INCOME_SOURCES))}")
        return v

    @field_validator("currency")
    @classmethod
    def currency_must_be_valid(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        v = v.strip().upper()
        if v not in VALID_CURRENCIES:
            raise ValueError(f"Currency must be one of: {', '.join(sorted(VALID_CURRENCIES))}")
        return v


class IncomeResponse(BaseModel):
    id: int
    amount: float
    source: str
    date: date
    description: str
    currency: str
    user_id: int

    class Config:
        from_attributes = True


# ── Budget schemas ──────────────────────────────────────────────────────────────

class BudgetCreate(BaseModel):
    category: str = Field(max_length=50)
    amount: float = Field(gt=0, le=10_000_000)
    month: str = Field(max_length=7)  # "YYYY-MM"

    @field_validator("category")
    @classmethod
    def category_must_be_valid(cls, v: str) -> str:
        v = v.strip()
        if v not in VALID_CATEGORIES:
            raise ValueError(f"Category must be one of: {', '.join(sorted(VALID_CATEGORIES))}")
        return v

    @field_validator("month")
    @classmethod
    def month_format(cls, v: str) -> str:
        if not re.match(r"^\d{4}-\d{2}$", v):
            raise ValueError("Month must be in YYYY-MM format")
        return v


class BudgetResponse(BaseModel):
    id: int
    category: str
    amount: float
    month: str
    user_id: int

    class Config:
        from_attributes = True


# ── Recurring expense schemas ────────────────────────────────────────────────────

class RecurringExpenseCreate(BaseModel):
    amount: float = Field(gt=0, le=10_000_000)
    category: str = Field(default="Bills", max_length=50)
    description: str = Field(default="", max_length=200)
    currency: str = Field(default="INR", max_length=10)
    frequency: str = Field(default="monthly", max_length=20)
    day_of_month: int = Field(default=1, ge=1, le=28)

    @field_validator("category")
    @classmethod
    def category_must_be_valid(cls, v: str) -> str:
        v = v.strip()
        if v not in VALID_CATEGORIES:
            raise ValueError(f"Category must be one of: {', '.join(sorted(VALID_CATEGORIES))}")
        return v

    @field_validator("frequency")
    @classmethod
    def frequency_must_be_valid(cls, v: str) -> str:
        v = v.strip().lower()
        if v not in VALID_FREQUENCIES:
            raise ValueError(f"Frequency must be one of: {', '.join(sorted(VALID_FREQUENCIES))}")
        return v

    @field_validator("currency")
    @classmethod
    def currency_must_be_valid(cls, v: str) -> str:
        v = v.strip().upper()
        if v not in VALID_CURRENCIES:
            raise ValueError(f"Currency must be one of: {', '.join(sorted(VALID_CURRENCIES))}")
        return v


class RecurringExpenseResponse(BaseModel):
    id: int
    amount: float
    category: str
    description: str
    currency: str
    frequency: str
    day_of_month: int
    active: bool
    next_due_date: Optional[date]
    user_id: int

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str
