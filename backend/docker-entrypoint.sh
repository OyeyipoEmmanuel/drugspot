#!/usr/bin/env sh
set -eu

cd /app

python -m alembic upgrade head
python -m app.db.seed

exec python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
