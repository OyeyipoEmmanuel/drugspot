# DrugSpot backend

FastAPI backend for the DrugSpot MVP. The React client now uses persisted API data
for authentication, pharmacy verification, marketplace inventory, orders,
medication tracking, pharmacist discovery, and pharmacy-scoped conversations.

## Local setup

```powershell
cd backend
Copy-Item .env.example .env
uv sync --all-groups
uv run alembic upgrade head
uv run python -m app.cli create-admin --email admin@example.com --phone +2348000000000 --first-name Platform --last-name Admin --password "replace-this-password"
uv run python -m app.db.seed
uv run uvicorn app.main:app --reload --port 8000
```

The public catalogue is intentionally seeded from approved pharmacy + product records only; no user-bound rows are created by the seed command. The admin bootstrap step is required only so pharmacy rows have a valid owner_user_id in the schema.

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
capture remains an external integration; new orders retain `pending` payment status
until a payment service is connected.

## Product images

Approved pharmacy staff can upload a JPEG, PNG, or WebP product photo up to 5 MB
through `POST /api/v1/pharmacy/inventory/product-image/`. Development uploads are
stored under `backend/uploads/product-images/` and served from `/uploads`. The saved
URL is included in pharmacy inventory and public marketplace product responses.

The photo is a customer-facing visual reference, not an authenticity check. For a
multi-instance production deployment, replace the local storage implementation with
durable object storage while preserving the endpoint response contract.

## Medication OCR

Authenticated patients can upload a JPEG, PNG, or WebP image up to 1 MB to
`POST /api/v1/medications/ocr/`. The backend sends the image directly to
OCR.space, parses candidate medicine details, and checks a detected NAFDAC number
against the Greenbook when possible. A slip containing multiple medicines is split
into separate review drafts. Images are not retained by DrugSpot's OCR endpoint,
and every returned field must be confirmed by the patient.

Add the free OCR.space key to `.env` and restart the API:

```text
OCR_SPACE_API_KEY=replace-with-your-key
OCR_SPACE_API_URL=https://api.ocr.space/parse/image
OCR_SPACE_TIMEOUT_SECONDS=25
```

When the key is absent, the endpoint returns a configuration error instead of
fabricating an OCR result.

## NAFDAC product verification

Approved pharmacies verify catalogue products against the public NAFDAC Greenbook
before saving them. `POST /api/v1/pharmacy/inventory/verify-nafdac/` checks the
registration number, registered product name, and expiry date. Product creation
repeats the verification server-side and stores the official registered metadata.

The integration uses `https://greenbook.nafdac.gov.ng` by default. Override
`NAFDAC_API_BASE_URL` and `NAFDAC_API_TIMEOUT_SECONDS` when required.

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

## Production deployment

The frontend origin is `https://drugspot.vercel.app` and is included in the
default CORS allowlist. In Pxxl, configure a persistent PostgreSQL
`DATABASE_URL`, a production `AUTH_SECRET`, and use the checked-in `Procfile`
start command. It applies Alembic migrations before starting the API.

