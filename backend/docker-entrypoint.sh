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

echo "Loading seed data..."
python -m app.db.seed
status=$?
if [ "$status" -ne 0 ]; then
	echo "Seed failed with exit $status"
	exit "$status"
fi

echo "Migrations complete, starting server..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
