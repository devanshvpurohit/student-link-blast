#!/usr/bin/env bash
# Sets up a local Postgres test database (bazinga_test) for the Bazinga app.
#
# Prerequisites: a running local Postgres (psql/pg_ctl in PATH).
# Usage: bash scripts/setup_test_db.sh [db_name]  (default: bazinga_test)

set -euo pipefail

DB_NAME="${1:-bazinga_test}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(dirname "$SCRIPT_DIR")"
MIGRATIONS_DIR="$REPO_DIR/supabase/migrations"

if ! psql -lqt >/dev/null 2>&1; then
  echo "error: cannot connect to local Postgres (psql -l failed). Is it running?" >&2
  exit 1
fi

echo "==> Dropping and recreating database '$DB_NAME'"
psql -d postgres -q -c "DROP DATABASE IF EXISTS $DB_NAME;"
psql -d postgres -q -c "CREATE DATABASE $DB_NAME;"

echo "==> Applying Supabase compatibility stubs (auth / storage / realtime)"
psql -d "$DB_NAME" -v ON_ERROR_STOP=1 -f "$SCRIPT_DIR/supabase_stubs.sql"

echo "==> Applying migrations (in chronological order)"
for migration in "$MIGRATIONS_DIR"/*.sql; do
  name="$(basename "$migration")"
  echo "    - $name"
  psql -d "$DB_NAME" -v ON_ERROR_STOP=1 -q -f "$migration"
done

echo "==> Seeding test data"
psql -d "$DB_NAME" -v ON_ERROR_STOP=1 -q -f "$SCRIPT_DIR/seed.sql"

echo "==> Granting privileges to RLS test role (app_anon)"
psql -d "$DB_NAME" -v ON_ERROR_STOP=1 -q <<'SQL'
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_anon;
GRANT SELECT ON ALL TABLES IN SCHEMA auth TO app_anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA storage TO app_anon;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public, auth, storage TO app_anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_anon;
SQL

echo
echo "Done. Connect with:  psql $DB_NAME"
echo
echo "Simulate being logged in as a user (RLS uses auth.uid()):"
echo "  psql $DB_NAME -c \"SELECT set_config('app.user_id', '11111111-1111-1111-1111-111111111111', false);\""
echo "  # then run queries in the same session; reset with set_config('app.user_id', '', false)"