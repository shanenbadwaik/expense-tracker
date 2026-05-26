from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import (
    OAuth2PasswordBearer,
    OAuth2PasswordRequestForm
)

from sqlalchemy.orm import Session

from jose import JWTError, jwt

from datetime import datetime, timedelta

import models
import schemas
import auth

from database import SessionLocal, engine

# CREATE DATABASE TABLES
models.Base.metadata.create_all(bind=engine)

app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# JWT CONFIG
SECRET_KEY = "mysecretkey"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="login"
)

# DATABASE CONNECTION
def get_db():

    db = SessionLocal()

    try:
        yield db

    finally:
        db.close()


# CREATE ACCESS TOKEN
def create_access_token(data: dict):

    to_encode = data.copy()

    expire = datetime.utcnow() + timedelta(
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


# GET CURRENT USER
def get_current_user(

    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)

):

    credentials_exception = HTTPException(
        status_code=401,
        detail="Could not validate credentials"
    )

    try:

        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        email = payload.get("sub")

        if email is None:
            raise credentials_exception

    except JWTError:
        raise credentials_exception

    user = db.query(models.User).filter(
        models.User.email == email
    ).first()

    if user is None:
        raise credentials_exception

    return user


# HOME ROUTE
@app.get("/")
def home():

    return {
        "message":
        "Expense Tracker Backend Running"
    }


# REGISTER USER
@app.post("/register")
def register(

    user: schemas.UserCreate,
    db: Session = Depends(get_db)

):

    existing_user = db.query(
        models.User
    ).filter(
        models.User.email == user.email
    ).first()

    if existing_user:

        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    hashed_password = auth.hash_password(
        user.password
    )

    new_user = models.User(
        username=user.username,
        email=user.email,
        password=hashed_password
    )

    db.add(new_user)

    db.commit()

    db.refresh(new_user)

    return {
        "message":
        "User registered successfully"
    }


# LOGIN USER
@app.post("/login")
def login(

    request: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)

):

    user = db.query(models.User).filter(
        models.User.email == request.username
    ).first()

    if not user:

        raise HTTPException(
            status_code=401,
            detail="Invalid Email or Password"
        )

    if not auth.verify_password(
        request.password,
        user.password
    ):

        raise HTTPException(
            status_code=401,
            detail="Invalid Email or Password"
        )

    access_token = create_access_token(
        data={
            "sub": user.email
        }
    )

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }


# ADD EXPENSE
@app.post("/expenses")
def add_expense(

    expense: schemas.ExpenseCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(
        get_current_user
    )

):

    new_expense = models.Expense(
        amount=expense.amount,
        category=expense.category,
        description=expense.description,
        date=expense.date,
        user_id=current_user.id
    )

    db.add(new_expense)

    db.commit()

    return {
        "message":
        "Expense added successfully"
    }


# GET USER EXPENSES
@app.get("/expenses")
def get_expenses(

    db: Session = Depends(get_db),
    current_user: models.User = Depends(
        get_current_user
    )

):

    expenses = db.query(
        models.Expense
    ).filter(
        models.Expense.user_id ==
        current_user.id
    ).all()

    return expenses


# GET USER PROFILE
@app.get("/profile")
def get_profile(

    current_user: models.User = Depends(
        get_current_user
    )

):

    return {
        "username": current_user.username,
        "email": current_user.email
    }