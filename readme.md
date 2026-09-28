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

```powershell
cd backend
Copy-Item .env.example .env
uv sync --dev
uv run alembic upgrade head
uv run uvicorn app.main:app --reload --port 8000
```

The local API will be available at `http://localhost:8000`, with interactive
documentation at `http://localhost:8000/docs`.

### Frontend

In another terminal:

```powershell
cd frontend
pnpm install
Copy-Item .env.example .env.local
pnpm dev
```

The frontend uses the following variable during local development:

```text
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

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
routes to `index.html`, allowing React Router pages to load correctly after a
browser refresh. The FastAPI service is deployed separately from `backend/` on
Pxxl.

### Vercel frontend

Configure this production environment variable and rebuild the deployment:

```text
VITE_API_BASE_URL=https://drugspot.pxxlspace.cv/api/v1
```

Vite embeds environment variables at build time, so changing the value requires
a new frontend deployment.

### Pxxl backend

Set the Pxxl project root to `backend`, configure the application port as
`8000`, and use `/health` as the health-check path.

Configure these environment variables:

```text
APP_ENV=production
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require
AUTH_SECRET=replace-with-a-random-secret-of-at-least-32-characters
CORS_ORIGINS=https://drugspot.vercel.app
OCR_SPACE_API_KEY=your-key-if-ocr-is-enabled
```

Use the pooled PostgreSQL connection URL supplied by the database provider.
The backend automatically adapts a standard `postgresql://` URL for its async
database driver.

Apply migrations and start the API with:

```text
alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port 8000
```

## Docker deployment

From the repository root, start the full stack with:

```powershell
docker compose up --build -d
```

This launches the PostgreSQL container and the FastAPI app together. The backend entrypoint runs:

```sh
python -m alembic upgrade head
python -m app.db.seed
exec python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

To stop the stack:

```powershell
docker compose down
```

To rebuild after code changes:

```powershell
docker compose up --build -d --force-recreate
```

Before starting the stack, copy the backend environment sample and set a strong `AUTH_SECRET`:

```powershell
Copy-Item backend/.env.example backend/.env
```

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
