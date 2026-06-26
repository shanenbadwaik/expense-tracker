# Cairn — Budget Tracker

A full-stack personal finance tracker with multi-currency support, real-time exchange rates, email authentication, and spending insights.

**Live:** [cairnbudget.in](https://cairnbudget.in)

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     cairnbudget.in (Browser)                    │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │              React Frontend (Vercel)                    │   │
│   │                                                         │   │
│   │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐  │   │
│   │  │  Login / │  │  Home    │  │ Activity │  │Insights│  │   │
│   │  │ Register │  │Dashboard │  │ & Search │  │& Budgt │  │   │
│   │  └──────────┘  └──────────┘  └──────────┘  └────────┘  │   │
│   └───────────────────────┬─────────────────────────────────┘   │
│                           │  HTTPS + JWT (Axios)                │
└───────────────────────────┼─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                  FastAPI Backend (Railway)                       │
│                                                                 │
│   ┌──────────────┐   ┌─────────────────────┐   ┌────────────┐  │
│   │  Auth Layer  │   │       Routes        │   │   Email    │  │
│   │  bcrypt      │   │  POST /register     │   │   Brevo    │  │
│   │  JWT tokens  │   │  POST /login        │   │  (Transac- │  │
│   │  slowapi     │   │  GET  /expenses     │   │  tional)   │  │
│   │  rate limit  │   │  POST /expenses     │   └────────────┘  │
│   └──────────────┘   │  PUT  /expenses/:id │                   │
│                      │  DELETE /expenses   │                   │
│                      │  GET  /income       │                   │
│                      │  POST /income       │                   │
│                      │  GET  /budgets      │                   │
│                      │  POST /budgets      │                   │
│                      │  GET  /recurring    │                   │
│                      │  POST /recurring    │                   │
│                      │  GET  /profile      │                   │
│                      │  POST /forgot-pwd   │                   │
│                      │  POST /reset-pwd    │                   │
│                      └─────────────────────┘                   │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                   SQLAlchemy ORM                        │   │
│   │  User · Expense · Income · Budget · RecurringExpense    │   │
│   │  EmailVerificationToken · PasswordResetToken            │   │
│   └───────────────────────────┬─────────────────────────────┘   │
└───────────────────────────────┼─────────────────────────────────┘
                                │
                                ▼
                   ┌────────────────────────┐
                   │  PostgreSQL (Railway)  │
                   └────────────────────────┘
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Recharts, Axios, React Router |
| Backend | Python 3.11, FastAPI, SQLAlchemy, slowapi |
| Database | PostgreSQL (Railway managed) |
| Auth | JWT (python-jose), bcrypt |
| Email | Brevo transactional API |
| FX Rates | ExchangeRate-API (live, hourly cache) |
| Frontend Hosting | Vercel |
| Backend Hosting | Railway |
| Domain | GoDaddy → Vercel DNS → cairnbudget.in |

---

## Features

- **Authentication** — register, login, forgot password, reset password via email link
- **Email delivery** — verification and reset emails sent to any user's address via Brevo
- **Multi-currency expenses** — add in USD, EUR, GBP, AED, SGD, JPY, CAD, AUD; auto-converted to ₹ at live rates
- **Real-time FX rates** — fetched on load, cached in localStorage for 1 hour, auto-refreshed
- **Income tracking** — log income by source, track net cash flow
- **Budgets** — set per-category monthly budgets with progress bars and over-budget alerts
- **Recurring expenses** — track rent, subscriptions, EMIs with next due dates
- **Insights tab** — pie chart by category, monthly spending breakdown
- **Activity tab** — search, filter by category, switch between expenses and income
- **Profile tab** — username, email, spending summary, theme toggle, CSV export, logout
- **Dark / Light mode** — persisted in localStorage
- **Mobile-first design** — bottom tab nav, sheet modals, touch-friendly numpad
- **Password strength checker** — live requirement validation on register

---

## Project Structure

```
cairn/
├── backend/
│   ├── app.py              # FastAPI routes, CORS, rate limiting
│   ├── models.py           # SQLAlchemy models
│   ├── schemas.py          # Pydantic schemas with validation
│   ├── auth.py             # bcrypt + JWT helpers
│   ├── database.py         # PostgreSQL connection
│   ├── config.py           # pydantic-settings env config
│   ├── email_utils.py      # Brevo email sending + HTML templates
│   └── requirements.txt
└── frontend/
    └── src/
        ├── App.js
        ├── api.js              # Base API URL
        ├── App.css             # Global styles + keyframe animations
        ├── pages/
        │   ├── Login.js        # Login + Register (single page)
        │   ├── Dashboard.js    # Main app — all tabs
        │   ├── ForgotPassword.jsx
        │   └── ResetPassword.jsx
        └── components/
```

---

## Local Development

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app:app --reload
```

Create a `.env` file in `backend/`:
```
SECRET_KEY=your-secret-key
DATABASE_URL=postgresql://user:pass@localhost/cairn
ALLOWED_ORIGIN=http://localhost:3000
FRONTEND_URL=http://localhost:3000
BREVO_API_KEY=your-brevo-key
MAIL_FROM=you@gmail.com
MAIL_FROM_NAME=Cairn
```

### Frontend

```bash
cd frontend
npm install
npm start
```

Create a `.env` file in `frontend/`:
```
REACT_APP_API_URL=http://127.0.0.1:8000
```

---

## Deployment

| Service | Platform | URL |
|---------|----------|-----|
| Frontend | Vercel | cairnbudget.in |
| Backend | Railway | cairn-api.railway.app |
| Database | Railway PostgreSQL | managed |

```bash
# Deploy frontend
cd frontend && npx vercel --prod

# Deploy backend
cd backend && railway up --service cairn-api
```

---

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/register` | No | Create account, send verification email |
| POST | `/login` | No | Login, receive JWT |
| POST | `/forgot-password` | No | Send password reset link |
| POST | `/reset-password` | No | Reset password via token |
| GET | `/profile` | Yes | Get user profile |
| GET/POST | `/expenses` | Yes | List / add expenses |
| PUT/DELETE | `/expenses/{id}` | Yes | Edit / delete expense |
| GET/POST | `/income` | Yes | List / add income entries |
| GET/POST | `/budgets` | Yes | List / set category budgets |
| GET/POST | `/recurring` | Yes | List / add recurring expenses |
| DELETE | `/recurring/{id}` | Yes | Delete recurring expense |
