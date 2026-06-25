import calendar
import csv
import io
from datetime import datetime, timedelta, timezone, date as date_type
from typing import Optional

from fastapi import FastAPI, Depends, HTTPException, Request, BackgroundTasks, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm

from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from sqlalchemy import text
from sqlalchemy.orm import Session
from jose import JWTError, jwt

import models
import schemas
import auth
from config import settings
from database import SessionLocal, engine
from email_utils import (
    generate_token, hash_token,
    send_reset_email, send_verification_email,
)

# ── Bootstrap ────────────────────────────────────────────────────────────────────

def run_migrations():
    with engine.connect() as conn:
        for stmt in [
            "ALTER TABLE users ADD COLUMN is_verified BOOLEAN DEFAULT 0 NOT NULL",
            "ALTER TABLE expenses ADD COLUMN currency VARCHAR DEFAULT 'INR'",
        ]:
            try:
                conn.execute(text(stmt))
                conn.commit()
            except Exception:
                pass  # column already exists
    models.Base.metadata.create_all(bind=engine)

run_migrations()

# ── Rate limiter ─────────────────────────────────────────────────────────────────
limiter = Limiter(key_func=get_remote_address)

app = FastAPI()
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ── CORS ─────────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.ALLOWED_ORIGIN.split(",") if o.strip()],
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

# ── Auth helpers ──────────────────────────────────────────────────────────────────
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


# ── Recurring expense helpers ─────────────────────────────────────────────────────

def _advance_date(current: date_type, frequency: str, day_of_month: int) -> date_type:
    if frequency == "weekly":
        return current + timedelta(weeks=1)
    elif frequency == "yearly":
        try:
            return current.replace(year=current.year + 1)
        except ValueError:
            return current + timedelta(days=366)
    else:  # monthly
        m = current.month + 1
        y = current.year
        if m > 12:
            m, y = 1, y + 1
        max_day = calendar.monthrange(y, m)[1]
        return date_type(y, m, min(day_of_month, max_day))


def _initial_due_date(frequency: str, day_of_month: int) -> date_type:
    today = date_type.today()
    if frequency in ("weekly", "yearly"):
        return today
    max_day = calendar.monthrange(today.year, today.month)[1]
    target = today.replace(day=min(day_of_month, max_day))
    if target < today:
        m = today.month + 1
        y = today.year
        if m > 12:
            m, y = 1, y + 1
        max_day = calendar.monthrange(y, m)[1]
        target = date_type(y, m, min(day_of_month, max_day))
    return target


def process_recurring_for_user(user_id: int, db: Session):
    today = date_type.today()
    due = (
        db.query(models.RecurringExpense)
        .filter(
            models.RecurringExpense.user_id == user_id,
            models.RecurringExpense.active == True,
            models.RecurringExpense.next_due_date != None,
            models.RecurringExpense.next_due_date <= today,
        )
        .all()
    )
    for rec in due:
        while rec.next_due_date and rec.next_due_date <= today:
            db.add(models.Expense(
                amount=rec.amount,
                category=rec.category,
                description=rec.description or f"Recurring: {rec.category}",
                date=rec.next_due_date,
                currency=rec.currency or "INR",
                user_id=user_id,
            ))
            rec.next_due_date = _advance_date(rec.next_due_date, rec.frequency, rec.day_of_month)
    db.commit()


# ── Routes ────────────────────────────────────────────────────────────────────────

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

    if not user.is_verified:
        raise HTTPException(status_code=403, detail="Please verify your email address before logging in. Check your inbox for the verification link.")

    token = create_access_token(data={"sub": user.email})
    return {"access_token": token, "token_type": "bearer"}


# ── Password reset ────────────────────────────────────────────────────────────────

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


# ── Temporary admin verify (remove after use) ─────────────────────────────────────

@app.post("/admin/force-verify")
def force_verify(email: str, secret: str, db: Session = Depends(get_db)):
    if secret != "cairn-setup-2024":
        raise HTTPException(status_code=403)
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_verified = True
    db.commit()
    return {"message": f"Verified {email}"}


# ── Email verification ─────────────────────────────────────────────────────────────

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


# ── Expenses ──────────────────────────────────────────────────────────────────────

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
        currency=expense.currency,
        user_id=current_user.id,
    )
    db.add(new_expense)
    db.commit()
    db.refresh(new_expense)
    return new_expense


@app.get("/expenses/export")
def export_expenses(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    expenses = (
        db.query(models.Expense)
        .filter(models.Expense.user_id == current_user.id)
        .order_by(models.Expense.date.desc())
        .all()
    )
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Date", "Category", "Amount", "Currency", "Description"])
    for e in expenses:
        writer.writerow([e.date, e.category, e.amount, e.currency or "INR", e.description or ""])
    output.seek(0)
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode()),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=cairn-expenses-{current_user.username}.csv"},
    )


@app.get("/expenses")
def get_expenses(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
    category: Optional[str] = Query(None),
    date_from: Optional[date_type] = Query(None),
    date_to: Optional[date_type] = Query(None),
    search: Optional[str] = Query(None),
    limit: int = Query(200, le=500),
    offset: int = Query(0, ge=0),
):
    process_recurring_for_user(current_user.id, db)

    q = db.query(models.Expense).filter(models.Expense.user_id == current_user.id)

    if category:
        q = q.filter(models.Expense.category == category)
    if date_from:
        q = q.filter(models.Expense.date >= date_from)
    if date_to:
        q = q.filter(models.Expense.date <= date_to)
    if search:
        q = q.filter(models.Expense.description.ilike(f"%{search}%"))

    return q.order_by(models.Expense.date.desc()).limit(min(limit, 500)).offset(offset).all()


@app.put("/expenses/{expense_id}")
def update_expense(
    expense_id: int,
    body: schemas.ExpenseUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    expense = db.query(models.Expense).filter(
        models.Expense.id == expense_id,
        models.Expense.user_id == current_user.id,
    ).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")

    if body.amount is not None:
        expense.amount = body.amount
    if body.category is not None:
        expense.category = body.category
    if body.date is not None:
        expense.date = body.date
    if body.description is not None:
        expense.description = body.description.strip()
    if body.currency is not None:
        expense.currency = body.currency

    db.commit()
    db.refresh(expense)
    return expense


@app.delete("/expenses/{expense_id}")
def delete_expense(
    expense_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    expense = db.query(models.Expense).filter(
        models.Expense.id == expense_id,
        models.Expense.user_id == current_user.id,
    ).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")

    db.delete(expense)
    db.commit()
    return {"message": "Expense deleted"}


# ── Income ────────────────────────────────────────────────────────────────────────

@app.post("/income")
def add_income(
    income: schemas.IncomeCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    new_income = models.Income(
        amount=income.amount,
        source=income.source,
        description=income.description,
        date=income.date,
        currency=income.currency,
        user_id=current_user.id,
    )
    db.add(new_income)
    db.commit()
    db.refresh(new_income)
    return new_income


@app.get("/income")
def get_income(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
    limit: int = Query(200, le=500),
    offset: int = Query(0, ge=0),
):
    return (
        db.query(models.Income)
        .filter(models.Income.user_id == current_user.id)
        .order_by(models.Income.date.desc())
        .limit(min(limit, 500))
        .offset(offset)
        .all()
    )


@app.put("/income/{income_id}")
def update_income(
    income_id: int,
    body: schemas.IncomeUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    income = db.query(models.Income).filter(
        models.Income.id == income_id,
        models.Income.user_id == current_user.id,
    ).first()
    if not income:
        raise HTTPException(status_code=404, detail="Income entry not found")

    if body.amount is not None:
        income.amount = body.amount
    if body.source is not None:
        income.source = body.source
    if body.date is not None:
        income.date = body.date
    if body.description is not None:
        income.description = body.description.strip()
    if body.currency is not None:
        income.currency = body.currency

    db.commit()
    db.refresh(income)
    return income


@app.delete("/income/{income_id}")
def delete_income(
    income_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    income = db.query(models.Income).filter(
        models.Income.id == income_id,
        models.Income.user_id == current_user.id,
    ).first()
    if not income:
        raise HTTPException(status_code=404, detail="Income entry not found")

    db.delete(income)
    db.commit()
    return {"message": "Income entry deleted"}


# ── Budgets ───────────────────────────────────────────────────────────────────────

@app.post("/budgets")
def upsert_budget(
    body: schemas.BudgetCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    existing = db.query(models.Budget).filter(
        models.Budget.user_id == current_user.id,
        models.Budget.category == body.category,
        models.Budget.month == body.month,
    ).first()

    if existing:
        existing.amount = body.amount
        db.commit()
        db.refresh(existing)
        return existing

    budget = models.Budget(
        category=body.category,
        amount=body.amount,
        month=body.month,
        user_id=current_user.id,
    )
    db.add(budget)
    db.commit()
    db.refresh(budget)
    return budget


@app.get("/budgets")
def get_budgets(
    month: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    q = db.query(models.Budget).filter(models.Budget.user_id == current_user.id)
    if month:
        q = q.filter(models.Budget.month == month)
    return q.all()


@app.delete("/budgets/{budget_id}")
def delete_budget(
    budget_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    budget = db.query(models.Budget).filter(
        models.Budget.id == budget_id,
        models.Budget.user_id == current_user.id,
    ).first()
    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found")

    db.delete(budget)
    db.commit()
    return {"message": "Budget deleted"}


# ── Recurring expenses ────────────────────────────────────────────────────────────

@app.post("/recurring")
def add_recurring(
    body: schemas.RecurringExpenseCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    rec = models.RecurringExpense(
        amount=body.amount,
        category=body.category,
        description=body.description,
        currency=body.currency,
        frequency=body.frequency,
        day_of_month=body.day_of_month,
        active=True,
        next_due_date=_initial_due_date(body.frequency, body.day_of_month),
        user_id=current_user.id,
    )
    db.add(rec)
    db.commit()
    db.refresh(rec)
    return rec


@app.get("/recurring")
def get_recurring(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    return (
        db.query(models.RecurringExpense)
        .filter(models.RecurringExpense.user_id == current_user.id)
        .order_by(models.RecurringExpense.id.asc())
        .all()
    )


@app.put("/recurring/{recurring_id}")
def update_recurring(
    recurring_id: int,
    body: dict,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    rec = db.query(models.RecurringExpense).filter(
        models.RecurringExpense.id == recurring_id,
        models.RecurringExpense.user_id == current_user.id,
    ).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Recurring expense not found")

    if "active" in body:
        rec.active = bool(body["active"])

    db.commit()
    db.refresh(rec)
    return rec


@app.delete("/recurring/{recurring_id}")
def delete_recurring(
    recurring_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    rec = db.query(models.RecurringExpense).filter(
        models.RecurringExpense.id == recurring_id,
        models.RecurringExpense.user_id == current_user.id,
    ).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Recurring expense not found")

    db.delete(rec)
    db.commit()
    return {"message": "Recurring expense deleted"}


# ── Profile ───────────────────────────────────────────────────────────────────────

@app.get("/profile")
def get_profile(current_user: models.User = Depends(get_current_user)):
    return {
        "username": current_user.username,
        "email": current_user.email,
        "is_verified": current_user.is_verified,
    }
