from fastapi import (
    FastAPI,
    Depends,
    HTTPException
)

from fastapi.middleware.cors import CORSMiddleware

from sqlalchemy.orm import Session

import models
import schemas
import auth

from database import (
    SessionLocal,
    engine
)

# -----------------------------
# CREATE DATABASE TABLES
# -----------------------------

models.Base.metadata.create_all(
    bind=engine
)

# -----------------------------
# FASTAPI APP
# -----------------------------

app = FastAPI()

# -----------------------------
# CORS
# -----------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------------
# DATABASE DEPENDENCY
# -----------------------------

def get_db():

    db = SessionLocal()

    try:
        yield db

    finally:
        db.close()

# -----------------------------
# REGISTER API
# -----------------------------

@app.post("/register")
def register(
    user: schemas.UserCreate,
    db: Session = Depends(get_db)
):

    # check email already exists
    existing_email = db.query(
        models.User
    ).filter(
        models.User.email == user.email
    ).first()

    if existing_email:

        raise HTTPException(
            status_code=400,
            detail="Email already exists"
        )

    # check username already exists
    existing_username = db.query(
        models.User
    ).filter(
        models.User.username == user.username
    ).first()

    if existing_username:

        raise HTTPException(
            status_code=400,
            detail="Username already exists"
        )

    # hash password
    hashed_password = auth.hash_password(
        user.password
    )

    # create user
    new_user = models.User(
        username=user.username,
        email=user.email,
        password=hashed_password
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # create token
    token = auth.create_token({
        "user_id": new_user.id
    })

    return {
        "message": "User registered successfully",
        "access_token": token
    }

# -----------------------------
# LOGIN API
# -----------------------------

@app.post("/login")
def login(
    user: schemas.UserLogin,
    db: Session = Depends(get_db)
):

    db_user = db.query(
        models.User
    ).filter(
        models.User.username == user.username
    ).first()

    if not db_user:

        raise HTTPException(
            status_code=401,
            detail="Invalid username"
        )

    # verify password
    valid_password = auth.verify_password(
        user.password,
        db_user.password
    )

    if not valid_password:

        raise HTTPException(
            status_code=401,
            detail="Invalid password"
        )

    # create token
    token = auth.create_token({
        "user_id": db_user.id
    })

    return {
        "access_token": token,
        "message": "Login successful"
    }

# -----------------------------
# RESET PASSWORD API
# -----------------------------

@app.put("/reset-password")
def reset_password(
    data: schemas.ResetPassword,
    db: Session = Depends(get_db)
):

    user = db.query(
        models.User
    ).filter(
        models.User.username == data.username
    ).first()

    if not user:

        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    user.password = auth.hash_password(
        data.new_password
    )

    db.commit()

    return {
        "message": "Password reset successful"
    }

# -----------------------------
# CREATE EXPENSE
# -----------------------------

@app.post("/expenses")
def create_expense(
    expense: schemas.ExpenseCreate,
    db: Session = Depends(get_db)
):

    new_expense = models.Expense(
        amount=expense.amount,
        category=expense.category,
        date=expense.date,
        description=expense.description,
        user_id=1
    )

    db.add(new_expense)

    db.commit()

    db.refresh(new_expense)

    return {
        "message": "Expense added successfully"
    }

# -----------------------------
# GET ALL EXPENSES
# -----------------------------

@app.get("/expenses")
def get_expenses(
    db: Session = Depends(get_db)
):

    expenses = db.query(
        models.Expense
    ).all()

    return expenses