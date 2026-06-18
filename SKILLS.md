# Skills & Technologies

A reference for the languages, frameworks, and tools used in this project — including the production-ready stack targeted by the roadmap.

---

## Backend

### Python
- Core language for all backend logic
- Version: 3.13

### FastAPI
- REST API framework
- Handles routing, dependency injection, and request validation
- Runs via `uvicorn`
- Async-friendly — suited for OCR/statement-parsing background workloads

### SQLAlchemy
- ORM for database access
- Models: `User`, `Expense`
- Session managed per request via `get_db()` dependency

### Database

| Current | Target | Reason |
|---------|--------|--------|
| SQLite (`expenses.db`) | **PostgreSQL** | Concurrency, managed hosting, backups |

Recommended managed Postgres hosts: **Neon**, **Supabase**, or Railway/Render built-in.

### Alembic *(planned)*
- Schema migration tool for SQLAlchemy
- Handles schema changes without data loss
- Required once moving to PostgreSQL in production

### Authentication
- **passlib + bcrypt** — password hashing and verification (target: ≥12 rounds work factor)
- **python-jose** — JWT creation and decoding
- **OAuth2PasswordBearer** — FastAPI token extraction from request headers

### Pydantic / pydantic-settings *(upgrade planned)*
- Request/response schema validation via `schemas.py`
- `pydantic-settings` + `.env` for environment-based config and secrets management — replaces hardcoded values

### slowapi *(planned)*
- Rate limiting middleware for FastAPI
- Applied to `/login` and `/register` to prevent credential stuffing and brute force

### Celery / RQ + Redis *(planned)*
- Async task queue for background jobs: OCR processing, bank statement parsing, scheduled email reports
- Redis as the message broker (Upstash recommended for serverless/free tier)

### Sentry *(planned)*
- Error tracking and structured logging
- Required before running as a paid product

### Testing
- **pytest + httpx** — API integration tests
- **Playwright** — end-to-end browser testing

---

## Frontend

### React 19
- Component-based UI
- State managed with `useState` and `useEffect`
- Routing with `react-router-dom`

### Build Tool

| Current | Target | Reason |
|---------|--------|--------|
| CRA (`react-scripts`) | **Vite** | CRA is effectively deprecated; Vite is faster |

### Axios
- HTTP client for all API calls
- JWT token attached via `Authorization: Bearer <token>` header

### Recharts
- Pie/donut chart for category spending breakdown
- Components used: `PieChart`, `Pie`, `Cell`, `Tooltip`, `ResponsiveContainer`

### Cairn Design System
- Custom inline-style design system (dark/light mode, Instrument Serif + Hanken Grotesk)
- Design tokens defined in `buildTheme(mode)` inside `Dashboard.js`
- Responsive: mobile bottom-tab layout ↔ desktop sidebar-rail layout at ≥900px

---

## Key Concepts

### JWT Flow (current)
1. User logs in → backend returns a signed JWT
2. Frontend stores token in `localStorage`
3. All protected requests include `Authorization: Bearer <token>`
4. Backend decodes the token to identify the current user

### JWT Flow (target — production hardening)
- **Short-lived access tokens** (15 min) stored in memory, not `localStorage`
- **httpOnly, Secure, SameSite cookies** to prevent XSS exposure
- **Refresh tokens** with rotation — longer-lived, invalidated on use
- **JWT secret** sourced from environment variable / secrets manager, never hardcoded

### Data Scoping
All expense queries are filtered by `user_id`, so users only ever see their own data.

### CORS
- **Current:** wide open (`"*"`) — sufficient for local dev
- **Target:** locked to the deployed frontend origin; `"*"` is unsafe with credentials and won't work in browsers when `credentials: include` is set

### Security Headers *(planned)*
- HTTPS + HSTS everywhere
- CSP, X-Frame-Options on all responses
- Input validation at the Pydantic layer: cap amount precision, string lengths, page sizes; reject negative or absurd values
- Audit logging for auth events (login, register, password reset)

---

## Deployment Stack

### Path A — Recommended for launch

| Layer | Service |
|-------|---------|
| Frontend | Vercel / Netlify / Cloudflare Pages |
| Backend | Railway / Render / Fly.io |
| Database | Neon or Supabase (Postgres) |
| Redis | Upstash (serverless) |
| Object storage | Cloudflare R2 or Supabase Storage |

### Path B — AWS (resume-grade)

| Layer | Service |
|-------|---------|
| Frontend | S3 + CloudFront |
| Backend | App Runner / ECS Fargate / Lambda (via Mangum) |
| Database | RDS Postgres / Aurora Serverless v2 |
| Cache | ElastiCache |
| Secrets | Secrets Manager |
| Region | `ap-south-1` (Mumbai) for latency + data localisation |

### CI/CD
- GitHub Actions: `test → build → deploy` pipeline
- Wrap early — pays for itself fast

---

## Payments

### Razorpay *(planned for monetisation)*
- Subscriptions product with recurring billing, automatic retries, proration, dunning
- UPI Autopay support — critical for Indian users (RBI cap: ₹15,000/transaction without extra auth)
- Standard gateway rate ~2% on cards + ~0.99% subscriptions layer + GST

---

## Planned Features (Roadmap)

### Phase 1 — Harden
- Fix CORS, move to httpOnly cookies + refresh tokens
- Secrets in env vars, rate limiting
- SQLite → PostgreSQL + Alembic migrations
- Add `PUT /expenses/{id}` and `DELETE /expenses/{id}` endpoints
- CI/CD + Path A deployment

### Phase 2 — Product-complete
- Per-category budgets with progress and over-budget warnings
- Recurring expenses (rent, subscriptions, EMIs)
- Income tracking — net cash flow, not just expenses
- Filtering, search, pagination on expense list
- CSV / Excel export
- Onboarding flow (currency, categories, first budget)

### Phase 3 — Wedge (differentiator)
- Bank / UPI statement import (PDF or CSV upload + auto-parse)
- Auto-categorisation — keyword rules engine ("Swiggy → Food")
- Receipt scanning via OCR (photograph a bill, extract amount/date/merchant)
- Spending insights — month-over-month comparisons, anomaly alerts, recurring-charge detection

### Phase 4 — Monetise
- Freemium gate (free: manual entry + basic charts + 3 budgets; paid: import/sync + OCR + unlimited + insights + export)
- Razorpay subscription billing
- Premium analytics and scheduled email reports
