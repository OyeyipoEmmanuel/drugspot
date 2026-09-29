# DrugSpot

DrugSpot is a responsive online pharmacy marketplace that connects patients
with verified pharmacies and pharmacists. Patients can discover medicines,
place orders, manage medication schedules, request refills, scan prescriptions,
and speak with a pharmacist. Pharmacies register independently, submit their
licence information for platform review, and receive access to their workspace
after approval.

The project is an MVP consisting of a React single-page application and a
FastAPI REST API. It is designed around a blue-and-white medical interface and
supports patient, pharmacy, pharmacist, and platform administrator workflows.

## Live applications

- Frontend: [drugspot.vercel.app](https://drugspot.vercel.app)
- Backend API: [drugspot.pxxlspace.cv](https://drugspot.pxxlspace.cv)
- Interactive API documentation: [drugspot.pxxlspace.cv/docs](https://drugspot.pxxlspace.cv/docs)
- Health check: [drugspot.pxxlspace.cv/health](https://drugspot.pxxlspace.cv/health)

## Core features

### Patients

- Account registration, login, onboarding, and profile management
- Medication schedules and adherence tracking
- Prescription OCR that can prefill multiple medicines from one image
- Pharmacy and medicine discovery
- Shopping cart, checkout, order history, and order tracking
- Refill and pre-order requests
- Pharmacy-specific conversations with pharmacists

### Pharmacies and pharmacists

- Independent pharmacy registration and licence submission
- Approval-gated pharmacy workspace
- Inventory creation and stock management
- Product image uploads
- NAFDAC number lookup and verification metadata
- Order processing and status updates
- Customer, refill-request, and pharmacy-message views
- Pharmacist credential submission and verification

### Platform administrators

- Pharmacy and pharmacist verification queues
- Application review, approval, and rejection
- Role-based access to administrative routes

## Technology stack

### Frontend

- React 19, TypeScript, and Vite
- React Router for client-side routing
- TanStack Query for API queries, mutations, and cache management
- Tailwind CSS v4 and reusable Radix/shadcn-style UI components
- React Hook Form and Zod for form handling and validation
- i18next for localization
- Lucide React for icons
- Vitest and Testing Library for tests

### Backend

- FastAPI and Pydantic
- SQLAlchemy async ORM and Alembic migrations
- PostgreSQL in production and SQLite for local development
- Token-based authentication with refresh sessions and role-based access
- OCR.space integration for prescription extraction
- NAFDAC Greenbook integration for product verification
- Pytest and Ruff for automated checks

## Repository structure

```text
drugspot/
|-- frontend/        React application
|-- backend/         FastAPI application, migrations, and tests
|-- data/            Project data and reference material
|-- vercel.json      Vercel build and SPA rewrite configuration
`-- readme.md
```

## Run locally

### Requirements

- Node.js with pnpm 10+
- Python 3.12+
- `uv` for Python dependency and environment management

### Backend

In a PowerShell terminal:

```powershell
cd backend
Copy-Item .env.example .env
uv sync --dev
uv run alembic upgrade head
uv run python -m app.cli create-admin --email admin@example.com --phone +2348000000000 --first-name Platform --last-name Admin --password "choose-a-strong-password"
uv run python -m app.db.seed
uv run uvicorn app.main:app --reload --port 8000
```

Run the admin command only once for a new database. The seed requires this admin
to own the sample pharmacies and is safe to re-run. The API is available at
`http://localhost:8000`; its docs are at `http://localhost:8000/docs`.

### Frontend

In a second PowerShell terminal:

```powershell
cd frontend
pnpm install
Copy-Item .env.example .env.local
pnpm dev
```

The checked-in frontend environment sample points to
`http://localhost:8000/api/v1`, so the frontend talks to the local backend.

## Tests and quality checks

```powershell
cd frontend
pnpm lint
pnpm test
pnpm build
```

```powershell
cd backend
uv run pytest
uv run ruff check .
uv run alembic check
```

## Deployment

The root `vercel.json` builds `frontend/` on Vercel and rewrites application
routes to `index.html`. Deploy the backend separately as a Python 3.12 web
service with `backend` as its root directory. Use `pip install -r requirements.txt`
as the build command and `/health` as the health-check path.

Pxxl and other Procfile-compatible hosts can use the checked-in `Procfile`:

```text
sh docker-entrypoint.sh
```

The entrypoint applies schema migrations before starting the API. It then runs
the optional admin bootstrap and idempotent public catalogue seed in the
background so remote database latency cannot block the deployment readiness
check. Seed data requires a platform administrator; configure the `ADMIN_*`
variables below for a new production database.

Set these backend environment variables in Pxxl or Render:

```text
APP_ENV=production
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DATABASE
AUTH_SECRET=<random secret of at least 32 characters>
CORS_ORIGINS=https://drugspot.vercel.app
OCR_SPACE_API_KEY=<optional OCR.space key>
ADMIN_EMAIL=<initial platform administrator email>
ADMIN_PASSWORD=<initial platform administrator password>
ADMIN_FIRST_NAME=<initial platform administrator first name>
ADMIN_LAST_NAME=<initial platform administrator last name>
ADMIN_PHONE=<initial platform administrator phone number>
```

Use the provider's persistent PostgreSQL URL; the backend adapts
`postgresql://` for its async driver. Render's internal database URL is preferred
when the service and database share a region. Set `CORS_ORIGINS` to the exact
frontend origin, without a trailing slash.

In Vercel, set `VITE_API_BASE_URL` to the deployed API plus `/api/v1`, for
example `https://drugspot.pxxlspace.cv/api/v1`. Redeploy the frontend after
changing it because Vite embeds this value at build time.

## Docker deployment

From the repository root, copy the backend environment sample:

```powershell
Copy-Item backend/.env.example backend/.env
```

On the first run with a new Compose database, create the admin before starting
the backend so the seed has an owner:

```powershell
docker compose up -d db
docker compose build backend
docker compose run --rm --no-deps --entrypoint python backend -m alembic upgrade head
docker compose run --rm --no-deps --entrypoint python backend -m app.cli create-admin --email admin@example.com --phone +2348000000000 --first-name Platform --last-name Admin --password "choose-a-strong-password"
```

Then start the stack:

```powershell
docker compose up --build -d
```

The backend entrypoint applies migrations, starts FastAPI, and completes the
idempotent admin/catalogue bootstrap in the background. Later starts can use
`docker compose up -d`. Stop with `docker compose down`.

## External-service notes

- OCR requires an `OCR_SPACE_API_KEY`. Without it, manual medicine entry still
  works.
- NAFDAC verification depends on the availability and response format of the
  external Greenbook service.
- Product uploads currently fall back to temporary container storage when the
  deployment filesystem is read-only. Connect the upload endpoint to durable
  object storage before relying on uploaded images in production.
- Never commit production database credentials, API keys, or `AUTH_SECRET` to
  the repository.
