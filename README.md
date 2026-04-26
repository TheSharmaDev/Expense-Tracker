# Expense Tracker

A minimal full-stack personal finance tool. Users can record, edit, and review expenses, filter by category, sort by date, and see running totals.

## Tech Stack

- **Backend:** Python 3.11+, FastAPI, Pydantic, pytest
- **Frontend:** React 18, Vite, Tailwind CSS, React Icons
- **Persistence:** JSON file (`backend/data/expenses.json`)

## Short Note: Design Decisions, Trade-offs & Omissions

### Key Design Decisions

1. **JSON file persistence** — Chosen for zero-config simplicity in a single-user local tool. Atomic writes (temp file + rename) and a threading lock protect against corruption under light concurrent use.
2. **Money as Decimal / string** — Backend uses Python `Decimal` and serializes to string in JSON to prevent floating-point rounding errors (e.g., `0.1 + 0.2 != 0.3`).
3. **Idempotent creation with `client_id`** — The frontend generates a UUID per submission and stores it in `sessionStorage` until a successful response. Retries with the same `client_id` return the already-saved record instead of creating a duplicate.
4. **Real-world resilience** — Submit button disabled while a request is in flight; API calls have a 15-second timeout; errors are surfaced in the UI with actionable retry messages.
5. **Validation at both layers** — Backend Pydantic validators reject negative amounts, overly high precision, empty strings, and future dates. Frontend mirrors basic checks before sending requests.
6. **Emerald/Slate/Rose color scheme** — Selected for a clean, modern, accessible UI that provides clear visual hierarchy (primary actions in emerald, neutral surfaces in slate, errors in rose).

### Trade-offs Because of the Timebox

- **No authentication/authorization** — Out of scope for a single-user local tool; easy to add later with JWT or session cookies.
- **No pagination** — A personal expense list is expected to stay small (hundreds of entries), so loading all records is acceptable for now.
- **No offline service worker** — The brief mentions retries and refreshes, but not full offline support. Adding a service worker would be a nice next step.
- **No advanced state management** — React `useState`/`useEffect` is sufficient for this feature set. Redux / Zustand would be overkill.
- **JSON instead of a database** — Does not scale to thousands of concurrent writers and lacks advanced querying. If the user base grows, SQLite or PostgreSQL would be the next step.

### What Was Intentionally Not Done

- **Multi-user support** — The entire architecture assumes a single local user. No user models, no ownership of records, no shared data.
- **Advanced analytics** — Only basic summary totals per category are provided. No charts, trends, budgets, or forecasting.
- **Mobile-native app** — The frontend is a responsive web app only. No React Native or native mobile builds.
- **CI/CD pipeline** — Tests exist but are not wired into GitHub Actions or any automated deployment.

## Why JSON file?

For a single-user, small-scope personal tool, a JSON file is the simplest zero-config persistence:
- No database server to install or manage.
- Human-readable and easy to back up or inspect.
- Atomic writes (write to temp file, then rename) and a threading lock keep it safe from corruption under light concurrent use.

Trade-off: It does not scale to thousands of concurrent writers and lacks advanced querying. If the user base grows, SQLite or PostgreSQL would be the next step.

## Design Decisions (Detailed)

1. **Money as Decimal / string**  
   The backend uses Python `Decimal` and serializes to string in JSON. This prevents floating-point rounding errors (e.g., `0.1 + 0.2 != 0.3`).

2. **Idempotent creation with `client_id`**  
   The frontend generates a UUID (`client_id`) for each submission and keeps it in `sessionStorage` until a successful response. If the user refreshes the page mid-request, the same `client_id` is reused on retry, and the backend returns the already-saved record instead of creating a duplicate.

3. **Real-world resilience**  
   - Frontend submit button is disabled while a request is in flight, preventing accidental double-clicks.  
   - API calls have a 15-second timeout.  
   - Errors are surfaced in the UI with messages that invite safe retries.

4. **Validation**  
   - Backend Pydantic validators reject negative amounts, overly high precision, empty strings, and future dates.  
   - Frontend mirrors basic checks before sending the request.

5. **Edit & Delete support**  
   Full CRUD operations are implemented: users can edit existing expenses inline and delete records. The UI reuses the same form component for both create and edit modes.

## Trade-offs & Intentional Omissions

- **No authentication:** Out of scope for a single-user local tool; easy to add later with JWT or session cookies.
- **No pagination:** With a personal expense list, pagination is unnecessary right now. The list loads all records, which is fine for hundreds of entries.
- **No offline service worker:** The brief mentions retries and refreshes, but not full offline support. Adding a service worker would be a nice next step.
- **No advanced state management:** React `useState`/`useEffect` is sufficient for this feature set. Redux / Zustand would be overkill.
- **No multi-user support:** The entire architecture assumes a single local user.
- **No advanced analytics:** Only basic summary totals per category are provided. No charts, trends, budgets, or forecasting.

## Project Structure

```
expense-tracker/
├── backend/
│   ├── main.py          # FastAPI app
│   ├── models.py        # Pydantic schemas
│   ├── store.py         # JSON file persistence layer
│   ├── test_api.py      # Automated tests
│   ├── requirements.txt
│   └── data/
│       └── expenses.json
└── frontend/
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── index.html
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── index.css
        ├── api.js
        └── components/
            ├── ExpenseForm.jsx
            ├── ExpenseList.jsx
            └── Summary.jsx
```

## Running Locally

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`.

Run tests:
```bash
pytest test_api.py -v
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The UI will be available at `http://localhost:5173`. The Vite dev server proxies `/api` requests to the backend.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/expenses` | Create a new expense (idempotent via `client_id`). Returns `{ data: Expense, created: bool }`. |
| GET | `/expenses` | List expenses. Query: `?category=Food&sort=date_desc`. |
| PUT | `/expenses/{expense_id}` | Update an existing expense. |
| DELETE | `/expenses/{expense_id}` | Delete an expense. |
| GET | `/expenses/summary` | Summary totals per category. |

## Core & Nice-to-Have Checklist

- [x] User can create a new expense (amount, category, description, date)
- [x] User can edit an existing expense
- [x] User can delete an expense
- [x] User can view a list of expenses
- [x] User can filter expenses by category
- [x] User can sort expenses by date (newest first)
- [x] User can see a simple total of the current list (e.g., "Total: ₹X")
- [x] Idempotent API for safe retries
- [x] Basic validation (positive amount, required fields, no future dates)
- [x] Summary view (total per category)
- [x] Automated tests (backend integration tests)
- [x] Basic error and loading states in the UI

