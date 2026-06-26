# Skills & Technologies

A reference for the languages, frameworks, and tools used in this project — current production stack as of June 2026.

---

## Backend

### Python 3.11
- Core language for all backend logic
- Deployed on Railway

### FastAPI
- REST API framework
- Handles routing, dependency injection, and request validation
- Async background tasks for email sending
- Runs via `uvicorn`

### SQLAlchemy
- ORM for database access
- Models: `User`, `Expense`, `Income`, `Budget`, `RecurringExpense`, `EmailVerificationToken`, `PasswordResetToken`
- Session managed per request via `get_db()` dependency

### PostgreSQL
- Production database hosted on Railway
- Replaced SQLite for concurrency and persistence

### Authentication
- **bcrypt** — password hashing
- **python-jose** — JWT creation and decoding (1-day expiry)
- **OAuth2PasswordBearer** — FastAPI token extraction
- **Email verification tokens** — SHA-256 hashed, 24h expiry
- **Password reset tokens** — SHA-256 hashed, 15min expiry

### Pydantic + pydantic-settings
- Request/response schema validation via `schemas.py`
- Password strength validation (min 8 chars, uppercase, number)
- Environment config via `config.py` (reads from Railway env vars)

### slowapi
- Rate limiting on `/login` (10/min) and `/register` (5/min)
- Prevents brute-force and credential stuffing

### Brevo (transactional email)
- HTTP API — not SMTP (Railway blocks SMTP ports 587/465)
- Sends verification and password reset emails to any recipient email
- Free tier: 300 emails/day
- Sender verified: shanenbadwaik1234@gmail.com

### requests
- Used for Brevo HTTP API calls inside `asyncio.to_thread`

---

## Frontend

### React 18
- Component-based UI
- State managed with `useState`, `useEffect`, `useCallback`, `useRef`
- Routing with `react-router-dom`

### Axios
- HTTP client for all API calls
- JWT token attached via `Authorization: Bearer <token>` header

### Recharts
- Pie/donut chart for category spending breakdown
- Components: `PieChart`, `Pie`, `Cell`, `Tooltip`, `ResponsiveContainer`

### Cairn Design System
- Custom inline-style design system (no CSS framework)
- Dark/light mode via `buildTheme(colorMode)` design tokens
- Fonts: Instrument Serif (headings) + Hanken Grotesk (body)
- Responsive: mobile bottom-tab layout ↔ desktop sidebar-rail at ≥900px
- Sheet modals with slide-up animation on mobile, centred card on desktop
- CSS keyframe animations: `cairnToast`, `cairnSheet`, `cairnSpin`

### ExchangeRate-API
- Free FX rates API (no key required)
- Base: INR — inverted to get INR-per-unit for each currency
- localStorage cache with 1-hour TTL for instant load on repeat visits
- `setInterval` auto-refresh every hour during long sessions
- Fallback hardcoded rates if API is unreachable

---

## Infrastructure

### Vercel
- Hosts the React frontend
- Domain: `cairnbudget.in` via Vercel DNS (nameservers: `ns1.vercel-dns.com`)
- Auto SSL/TLS certificate provisioning
- Deployed via CLI: `npx vercel --prod`

### Railway
- Hosts FastAPI backend (`cairn-api` service)
- Hosts PostgreSQL database
- Environment variables managed via Railway dashboard + CLI
- Deployed via CLI: `railway up --service cairn-api`

### GoDaddy
- Domain registrar for `cairnbudget.in`
- Nameservers delegated to Vercel DNS for full DNS control

### GitHub
- Source control: `shanenbadwaik/expense-tracker`
- Branch: `main`

---

## Key Concepts

### JWT Flow
1. User logs in → backend returns a signed JWT (1-day expiry)
2. Frontend stores token in `localStorage`
3. All protected requests include `Authorization: Bearer <token>`
4. Backend decodes the token to identify the current user

### Multi-Currency Conversion
- Expenses stored in original currency in the database
- Converted to INR at display time using live FX rates
- `toINR(amount, currency, fxRates)` applied to all dashboard totals
- Conversion: `amount × (1 / rate_from_INR_base)`

### Email Flow
- Register → verification email sent as FastAPI `BackgroundTask`
- Forgot password → reset link emailed with 15-min token
- Brevo delivers to any recipient email (sender-only verification required)
- Email errors caught silently — login does not require email verification

### CORS
- Locked to specific origins: `cairnbudget.in`, `www.cairnbudget.in`, `frontend-xi-one-69.vercel.app`
- Multiple origins supported via comma-separated `ALLOWED_ORIGIN` env var

### Mobile UX
- Bottom tab bar: Home, Activity, Insights, Profile
- `+ Income` and `+ Expense` buttons in the hero card (replaces FAB on mobile)
- Sheet modals slide up from bottom with `box-sizing: border-box` to prevent overflow
- `autoCapitalize="none"` + `useCallback` onChange to prevent keyboard dismissal on search

---

## Planned Improvements

### Security
- Short-lived access tokens (15 min) + httpOnly refresh token cookies
- CSRF protection when moving to cookies
- Audit logging for auth events

### Product
- Bank / UPI statement PDF import with auto-categorisation
- Receipt OCR scanning
- Month-over-month spending comparisons
- Scheduled email spending reports
- Razorpay subscription billing (freemium gate)

### Tech
- Migrate CRA → Vite (CRA is deprecated)
- Add pytest integration tests
- GitHub Actions CI/CD pipeline
- Alembic for schema migrations
