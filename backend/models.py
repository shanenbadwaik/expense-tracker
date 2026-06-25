from sqlalchemy import Column, Integer, String, Float, Date, DateTime, ForeignKey, Boolean, UniqueConstraint
from sqlalchemy.orm import relationship
from database import Base


class User(Base):
    __tablename__ = "users"

    id          = Column(Integer, primary_key=True, index=True)
    username    = Column(String, unique=True, nullable=False)
    email       = Column(String, unique=True, nullable=False, index=True)
    password    = Column(String, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)

    expenses            = relationship("Expense", back_populates="owner")
    income_entries      = relationship("Income", back_populates="owner")
    budgets             = relationship("Budget", back_populates="owner")
    recurring_expenses  = relationship("RecurringExpense", back_populates="owner")
    reset_tokens        = relationship("PasswordResetToken", back_populates="user")
    verification_tokens = relationship("EmailVerificationToken", back_populates="user")


class Expense(Base):
    __tablename__ = "expenses"

    id          = Column(Integer, primary_key=True, index=True)
    amount      = Column(Float)
    category    = Column(String, index=True)
    date        = Column(Date, index=True)
    description = Column(String)
    currency    = Column(String, default="INR")
    user_id     = Column(Integer, ForeignKey("users.id"), index=True)

    owner = relationship("User", back_populates="expenses")


class Income(Base):
    __tablename__ = "income"

    id          = Column(Integer, primary_key=True, index=True)
    amount      = Column(Float, nullable=False)
    source      = Column(String, default="Other")
    description = Column(String, default="")
    date        = Column(Date, index=True)
    currency    = Column(String, default="INR")
    user_id     = Column(Integer, ForeignKey("users.id"), index=True)

    owner = relationship("User", back_populates="income_entries")


class Budget(Base):
    __tablename__ = "budgets"

    id       = Column(Integer, primary_key=True, index=True)
    category = Column(String, nullable=False)
    amount   = Column(Float, nullable=False)
    month    = Column(String, nullable=False)  # "YYYY-MM"
    user_id  = Column(Integer, ForeignKey("users.id"), index=True)

    owner = relationship("User", back_populates="budgets")

    __table_args__ = (
        UniqueConstraint("user_id", "category", "month", name="uq_budget_user_cat_month"),
    )


class RecurringExpense(Base):
    __tablename__ = "recurring_expenses"

    id            = Column(Integer, primary_key=True, index=True)
    amount        = Column(Float, nullable=False)
    category      = Column(String, default="Bills")
    description   = Column(String, default="")
    currency      = Column(String, default="INR")
    frequency     = Column(String, default="monthly")  # monthly, weekly, yearly
    day_of_month  = Column(Integer, default=1)          # 1-28, used for monthly
    active        = Column(Boolean, default=True)
    next_due_date = Column(Date, nullable=True)
    user_id       = Column(Integer, ForeignKey("users.id"), index=True)

    owner = relationship("User", back_populates="recurring_expenses")


class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"

    id         = Column(Integer, primary_key=True, index=True)
    user_id    = Column(Integer, ForeignKey("users.id"), index=True)
    token_hash = Column(String, unique=True, index=True, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    used       = Column(Boolean, default=False, nullable=False)

    user = relationship("User", back_populates="reset_tokens")


class EmailVerificationToken(Base):
    __tablename__ = "email_verification_tokens"

    id         = Column(Integer, primary_key=True, index=True)
    user_id    = Column(Integer, ForeignKey("users.id"), index=True)
    token_hash = Column(String, unique=True, index=True, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    used       = Column(Boolean, default=False, nullable=False)

    user = relationship("User", back_populates="verification_tokens")
