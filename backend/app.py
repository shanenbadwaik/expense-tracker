from fastapi import FastAPI, Depends, HTTPException, Request, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm

from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from sqlalchemy import text
from sqlalchemy.orm import Session
from jose import JWTError, jwt
from datetime import datetime, timedelta, timezone

import models
import schemas
import auth
from config import settings
from database import SessionLocal, engine
from email_utils import (
    generate_token, hash_token,
    send_reset_email, send_verification_email,
)

# ── Bootstrap ───────────────────────────────────────────────────────────────────

def run_migrations():
    """Add new columns/tables to an existing database without wiping data."""
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE users ADD COLUMN is_verified BOOLEAN DEFAULT 0 NOT NULL"))
            conn.commit()
        except Exception:
            pass  # column already exists
    models.Base.metadata.create_all(bind=engine)

run_migrations()

# ── Rate limiter ────────────────────────────────────────────────────────────────
limiter = Limiter(key_func=get_remote_address)

app = FastAPI()
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ── CORS ────────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.ALLOWED_ORIGIN],
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

# ── Auth helpers ─────────────────────────────────────────────────────────────────
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")


def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )
    to_encode["exp"] = expire
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
):
    credentials_exception = HTTPException(
        status_code=401,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(models.User).filter(models.User.email == email).first()
    if user is None:
        raise credentials_exception
    return user


def _utc(dt: datetime) -> datetime:
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt


# ── Routes ───────────────────────────────────────────────────────────────────────

@app.get("/")
def home():
    return {"message": "Expense Tracker Backend Running"}


@app.post("/register")
@limiter.limit("5/minute")
async def register(
    request: Request,
    user: schemas.UserCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    existing = db.query(models.User).filter(models.User.email == user.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Could not create account")

    new_user = models.User(
        username=user.username,
        email=user.email,
        password=auth.hash_password(user.password),
        is_verified=False,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    raw, hashed = generate_token()
    verify_token = models.EmailVerificationToken(
        user_id=new_user.id,
        token_hash=hashed,
        expires_at=datetime.now(timezone.utc) + timedelta(hours=24),
        used=False,
    )
    db.add(verify_token)
    db.commit()
    background_tasks.add_task(send_verification_email, new_user.email, raw)

    return {"message": "Account created. Check your email to verify your address."}


@app.post("/login")
@limiter.limit("10/minute")
def login(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    password_ok = auth.verify_password(form_data.password, user.password) if user else False

    if not user or not password_ok:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token(data={"sub": user.email})
    return {"access_token": token, "token_type": "bearer"}


# ── Password reset ───────────────────────────────────────────────────────────────

@app.post("/forgot-password")
@limiter.limit("3/hour")
async def forgot_password(
    request: Request,
    body: schemas.ForgotPasswordRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    SAFE_RESPONSE = {"message": "If that email is registered, you'll receive a reset link shortly."}

    user = db.query(models.User).filter(models.User.email == body.email).first()
    if not user:
        return SAFE_RESPONSE

    # Invalidate any existing unused tokens for this user
    db.query(models.PasswordResetToken).filter(
        models.PasswordResetToken.user_id == user.id,
        models.PasswordResetToken.used == False,
    ).update({"used": True})

    raw, hashed = generate_token()
    reset_token = models.PasswordResetToken(
        user_id=user.id,
        token_hash=hashed,
        expires_at=datetime.now(timezone.utc) + timedelta(minutes=15),
        used=False,
    )
    db.add(reset_token)
    db.commit()

    background_tasks.add_task(send_reset_email, user.email, raw)
    return SAFE_RESPONSE


@app.post("/reset-password")
def reset_password(
    body: schemas.PasswordResetConfirm,
    db: Session = Depends(get_db),
):
    token_record = db.query(models.PasswordResetToken).filter(
        models.PasswordResetToken.token_hash == hash_token(body.token),
        models.PasswordResetToken.used == False,
    ).first()

    if not token_record:
        raise HTTPException(status_code=400, detail="Invalid or expired reset link.")

    if datetime.now(timezone.utc) > _utc(token_record.expires_at):
        token_record.used = True
        db.commit()
        raise HTTPException(status_code=400, detail="This reset link has expired. Please request a new one.")

    token_record.used = True
    user = db.query(models.User).filter(models.User.id == token_record.user_id).first()
    user.password = auth.hash_password(body.new_password)
    db.commit()

    return {"message": "Password reset successfully. You can now log in."}


# ── Email verification ────────────────────────────────────────────────────────────

@app.get("/verify-email")
def verify_email(token: str, db: Session = Depends(get_db)):
    token_record = db.query(models.EmailVerificationToken).filter(
        models.EmailVerificationToken.token_hash == hash_token(token),
        models.EmailVerificationToken.used == False,
    ).first()

    if not token_record:
        raise HTTPException(status_code=400, detail="Invalid or already used verification link.")

    if datetime.now(timezone.utc) > _utc(token_record.expires_at):
        raise HTTPException(status_code=400, detail="Verification link has expired. Please request a new one.")

    token_record.used = True
    user = db.query(models.User).filter(models.User.id == token_record.user_id).first()
    user.is_verified = True
    db.commit()

    return {"message": "Email verified successfully!"}


@app.post("/resend-verification")
@limiter.limit("3/hour")
async def resend_verification(
    request: Request,
    background_tasks: BackgroundTasks,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.is_verified:
        return {"message": "Your email is already verified."}

    db.query(models.EmailVerificationToken).filter(
        models.EmailVerificationToken.user_id == current_user.id,
        models.EmailVerificationToken.used == False,
    ).update({"used": True})

    raw, hashed = generate_token()
    verify_token = models.EmailVerificationToken(
        user_id=current_user.id,
        token_hash=hashed,
        expires_at=datetime.now(timezone.utc) + timedelta(hours=24),
        used=False,
    )
    db.add(verify_token)
    db.commit()

    background_tasks.add_task(send_verification_email, current_user.email, raw)
    return {"message": "Verification email sent. Check your inbox."}


# ── Expenses ─────────────────────────────────────────────────────────────────────

@app.post("/expenses")
def add_expense(
    expense: schemas.ExpenseCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    new_expense = models.Expense(
        amount=expense.amount,
        category=expense.category,
        description=expense.description,
        date=expense.date,
        user_id=current_user.id,
    )
    db.add(new_expense)
    db.commit()
    return {"message": "Expense added successfully"}


@app.get("/expenses")
def get_expenses(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
    limit: int = 200,
    offset: int = 0,
):
    return (
        db.query(models.Expense)
        .filter(models.Expense.user_id == current_user.id)
        .order_by(models.Expense.date.desc())
        .limit(min(limit, 200))
        .offset(offset)
        .all()
    )


@app.get("/profile")
def get_profile(current_user: models.User = Depends(get_current_user)):
    return {
        "username": current_user.username,
        "email": current_user.email,
        "is_verified": current_user.is_verified,
    }
