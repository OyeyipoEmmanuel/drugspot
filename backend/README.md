# DrugSpot backend

FastAPI backend for the DrugSpot MVP. Phases 1–3 provide the application foundation,
authentication/RBAC, and pharmacy verification.

## Local setup

```powershell
cd backend
Copy-Item .env.example .env
uv sync --all-groups
uv run alembic upgrade head
uv run uvicorn app.main:app --reload --port 8000
```

The API documentation is available at `http://localhost:8000/docs`. The React app
uses `http://localhost:8000/api/v1` by default.

## Pharmacy vendor registration and verification

A pharmacy registers directly as a marketplace vendor through
`POST /api/v1/pharmacy/register/`. This single request creates the vendor account,
pharmacy profile, pharmacy licence record, and pharmacist-in-charge record.

The platform administrator reviews both credential sets together through:

- `GET /api/v1/admin/verifications/`
- `PATCH /api/v1/admin/verifications/{pharmacy_id}/`

Approval activates the pharmacy and its pharmacist-in-charge. Only approved,
active pharmacies are returned by the public marketplace pharmacy endpoints.

## Live marketplace and pharmacy workspace

Approved pharmacies can create and update catalogue inventory through
`/api/v1/pharmacy/inventory/`. Public product discovery reads the same persisted
stock through `/api/v1/products/`. Patient checkout creates real orders, reserves
stock, and exposes those orders to the owning pharmacy for controlled fulfilment
status updates.

The live pharmacy workspace also provides dashboard aggregates, order-derived
customer summaries, refill requests, and pre-order requests. Payment provider
capture and uploaded-file storage remain external integrations; new orders retain
`pending` payment status until a payment service is connected.

For PostgreSQL/Supabase, set an async SQLAlchemy URL in `.env`, for example:

```text
DATABASE_URL=postgresql+psycopg://USER:PASSWORD@HOST:5432/postgres
```

Do not apply the baseline migration to a database that already contains DrugSpot
tables until its current migration state has been inspected.

## Create the first platform administrator

Public registration always creates a patient. Create the initial trusted administrator
from the server environment after running migrations:

```powershell
uv run python -m app.cli create-admin --email admin@example.com --phone +2348000000000 --first-name Platform --last-name Admin --password "replace-this-password"
```

## Checks

```powershell
uv run ruff check app tests
uv run pytest
uv run alembic check
```

