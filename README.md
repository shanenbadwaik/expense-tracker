# Expense Tracker

A full-stack personal expense tracking app with user authentication, expense management, and spending analytics.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                          Browser                                │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                React Frontend  :3000                    │   │
│   │                                                         │   │
│   │  ┌──────────┐  ┌───────────┐  ┌──────────────────────┐ │   │
│   │  │ Login /  │  │ Dashboard │  │      Dashboard       │ │   │
│   │  │ Register │  │  Sidebar  │  │       Tabs           │ │   │
│   │  └──────────┘  └───────────┘  │  ┌────────────────┐  │ │   │
│   │                               │  │  Expenses Tab  │  │ │   │
│   │                               │  │  Analytics Tab │  │ │   │
│   │                               │  │  Profile Tab   │  │ │   │
│   │                               │  └────────────────┘  │ │   │
│   │                               └──────────────────────┘ │   │
│   └───────────────────────┬─────────────────────────────────┘   │
│                           │  HTTP + JWT (Axios)                 │
└───────────────────────────┼─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                  FastAPI Backend  :8000                         │
│                                                                 │
│   ┌──────────────┐   ┌─────────────────┐   ┌───────────────┐   │
│   │  Auth Layer  │   │     Routes      │   │  Dependency   │   │
│   │              │   │                 │   │  Injection    │   │
│   │  bcrypt      │   │  POST /register │   │               │   │
│   │  JWT encode  │   │  POST /login    │   │  get_db()     │   │
│   │  JWT decode  │   │  POST /expenses │   │  get_current  │   │
│   │              │   │  GET  /expenses │   │  _user()      │   │
│   └──────────────┘   │  GET  /profile  │   └───────────────┘   │
│                      └─────────────────┘                       │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │               SQLAlchemy ORM                            │   │
│   │    User(id, username, email, password)                  │   │
│   │    Expense(id, amount, category, description, date,     │   │
│   │            user_id → users.id)                          │   │
│   └───────────────────────────┬─────────────────────────────┘   │
└───────────────────────────────┼─────────────────────────────────┘
                                │
                                ▼
                   ┌────────────────────────┐
                   │   SQLite (expenses.db) │
                   │                        │
                   │  ┌──────────────────┐  │
                   │  │  users table     │  │
                   │  └──────────────────┘  │
                   │  ┌──────────────────┐  │
                   │  │  expenses table  │  │
                   │  └──────────────────┘  │
                   └────────────────────────┘
```

### Request Flow

```
User Action
    │
    ▼
React (Axios)  ──── Authorization: Bearer <JWT> ────▶  FastAPI
                                                           │
                                                    Decode JWT
                                                    Identify User
                                                           │
                                                    SQLAlchemy Query
                                                    (filtered by user_id)
                                                           │
                                                         SQLite
                                                           │
                                                    JSON Response
                                                           │
React (useState) ◀─────────────────────────────────────────
    │
    ▼
Re-render UI
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Recharts, Axios, React Router, Tailwind CSS |
| Backend | Python, FastAPI, SQLAlchemy |
| Database | SQLite |
| Auth | JWT (python-jose), bcrypt (passlib) |

## Features

- User registration and login with JWT authentication
- Add expenses with amount, category, description, and date
- View all expenses with running total
- Analytics tab with a pie chart broken down by category
- Profile tab showing username, email, and spending summary

## Project Structure

```
expense-tracker/
├── backend/
│   ├── app.py          # FastAPI routes and JWT logic
│   ├── models.py       # SQLAlchemy User and Expense models
│   ├── schemas.py      # Pydantic request/response schemas
│   ├── auth.py         # Password hashing and verification
│   ├── database.py     # SQLite connection and session setup
│   ├── expenses.db     # SQLite database file
│   └── requirements.txt
└── frontend/
    └── src/
        ├── App.js
        ├── pages/
        │   ├── Login.js
        │   ├── Register.js
        │   ├── Dashboard.js       # Main app view with sidebar tabs
        │   └── ForgotPassword.jsx
        └── components/
            ├── ExpenseForm.js
            ├── ExpenseList.js
            ├── ExpenseChart.js
            └── Navbar.jsx
```

## Getting Started

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app:app --reload
```

The API will be available at `http://127.0.0.1:8000`.

### Frontend

```bash
cd frontend
npm install
npm start
```

The app will open at `http://localhost:3000`.

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/register` | No | Create a new user account |
| POST | `/login` | No | Login and receive a JWT token |
| POST | `/expenses` | Yes | Add a new expense |
| GET | `/expenses` | Yes | Get all expenses for the current user |
| GET | `/profile` | Yes | Get the current user's profile |
