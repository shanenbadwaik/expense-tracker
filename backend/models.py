from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    Date,
    ForeignKey,
)

from sqlalchemy.orm import relationship

from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    username = Column(
        String,
        unique=True,
        nullable=False
    )

    email = Column(
        String,
        unique=True,
        nullable=False
    )

    password = Column(
        String,
        nullable=False
    )

    expenses = relationship(
        "Expense",
        back_populates="owner"
    )


class Expense(Base):
    __tablename__ = "expenses"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    amount = Column(Float)

    category = Column(String)

    date = Column(Date)

    description = Column(String)

    user_id = Column(
        Integer,
        ForeignKey("users.id")
    )

    owner = relationship(
        "User",
        back_populates="expenses"
    )