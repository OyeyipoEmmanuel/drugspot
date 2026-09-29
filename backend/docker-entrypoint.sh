#!/usr/bin/env sh
set -u

cd /app

echo "Starting migrations..."
alembic upgrade head
status=$?
if [ "$status" -ne 0 ]; then
	echo "Migration failed with exit $status"
	exit "$status"
fi

bootstrap_optional_data() {
	echo "Bootstrapping admin if needed..."
	if ! python -c "import asyncio; from app.cli import bootstrap_admin_if_needed; asyncio.run(bootstrap_admin_if_needed())"; then
		echo "Warning: admin bootstrap failed; API startup will continue"
		return
	fi

	echo "Loading seed data..."
	if ! python -m app.db.seed; then
		echo "Warning: public catalog seed failed; API startup will continue"
	fi
}

# Remote catalogue queries must not block the platform's readiness deadline.
# The operation is idempotent, so it is safe to complete after the API starts.
bootstrap_optional_data &

echo "Migrations complete, starting server on port ${PORT:-8000}..."
exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}"
