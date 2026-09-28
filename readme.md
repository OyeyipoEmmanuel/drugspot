# DrugSpot

## Local development bootstrap

Use the real auth flow and live backend in normal development. The mock fixture path is reserved for the existing journey tests only.

1. Start the stack:
   docker compose up
2. Apply database migrations:
   docker compose exec backend python -m alembic upgrade head
3. Seed the public marketplace catalogue:
   docker compose exec backend python -m app.db.seed
4. Sign up or create a real test patient, pharmacy, and admin through the app’s actual auth flow to exercise authenticated paths.
5. Launch the frontend and confirm the UI is talking to the live backend, not local fixtures.

## Notes

- Dev and staging builds default to the live backend.
- Mock mode is only enabled in the Vitest/Cypress/Playwright test environment when VITE_USE_LIVE_BACKEND=false is explicitly set.
- A failed live call should surface a real error state; it must not silently swap to fixture data.
