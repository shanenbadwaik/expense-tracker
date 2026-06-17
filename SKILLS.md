# Skills & Technologies

A reference for the languages, frameworks, and tools used in this project.

## Backend

### Python
- Core language for all backend logic
- Version: 3.13

### FastAPI
- REST API framework
- Handles routing, dependency injection, and request validation
- Runs via `uvicorn`

### SQLAlchemy
- ORM for database access
- Models: `User`, `Expense`
- Session managed per request via `get_db()` dependency

### SQLite
- Lightweight file-based database (`expenses.db`)
- No separate database server required

### Authentication
- **passlib + bcrypt** — password hashing and verification
- **python-jose** — JWT creation and decoding
- **OAuth2PasswordBearer** — FastAPI token extraction from request headers

### Pydantic
- Request/response schema validation via `schemas.py`

---

## Frontend

### React 19
- Component-based UI
- State managed with `useState` and `useEffect`
- Routing with `react-router-dom`

### Axios
- HTTP client for all API calls
- JWT token attached via `Authorization: Bearer <token>` header

### Recharts
- Pie chart on the Analytics tab, breaking down spending by category
- Components used: `PieChart`, `Pie`, `Cell`, `Tooltip`, `ResponsiveContainer`

### Tailwind CSS
- Utility-first CSS framework (via `@tailwindcss/vite`)
- Dashboard currently uses inline styles; Tailwind available for new components

---

## Key Concepts

### JWT Flow
1. User logs in → backend returns a signed JWT
2. Frontend stores token in `localStorage`
3. All protected requests include `Authorization: Bearer <token>`
4. Backend decodes the token to identify the current user

### Data Scoping
All expense queries are filtered by `user_id`, so users only ever see their own data.

### CORS
The backend allows all origins (`"*"`) to support local development between `localhost:3000` (frontend) and `127.0.0.1:8000` (backend).
