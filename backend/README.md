# Fan Hub Plus Flask backend scaffold

## Status

The source contains a Flask application factory, seven domain API blueprints plus health/contract routes, 31 SQLAlchemy tables, Pydantic validation, Alembic migration and core business services. See `../docs/IMPLEMENTATION_STATUS.md` for omissions. It is not a finished backend for every frontend screen.

Model/service/validation/SQLite migration tests were executed. Flask HTTP tests are supplied but skipped in this authoring environment because Flask, Flask-WTF and Flask-Limiter could not be installed. MySQL, SMTP, Redis and container runtime tests are pending. Dependency bounds are **not a resolved lockfile**.

## Local setup (Python 3.11+)

Run these from this backend directory:

```bash
python -m venv .venv
```

Windows PowerShell:

```powershell
.venv\Scripts\Activate.ps1
Copy-Item .env.example .env
```

macOS/Linux:

```bash
. .venv/bin/activate
cp .env.example .env
```

Then install, generate a secret and put that secret in `.env`:

```bash
python -m pip install -r requirements-dev.txt
python -c "import secrets; print(secrets.token_hex(32))"
python -m alembic upgrade head
python -m flask --app wsgi:app seed-demo
python -m flask --app wsgi:app run --host 127.0.0.1 --port 5000
```

The default `.env.example` uses SQLite only to help local development. The assessed target database should be MySQL, which is one of the supplied SRS choices. Do not label SQLite tests as MySQL validation.

Frontend static files are served from the sibling `frontend/dist/`. **Those screens still use the local demo repository.** Browse `/api/v1/health/live`, `/api/v1/health/ready` and `/api/v1/openapi.json` to inspect the API independently. After connecting the frontend, these same-origin URLs keep cookies/CSRF simple.

## MySQL target

Create an empty utf8mb4 database and a least-privileged runtime user. Supply your own credentials in `.env`:

```text
DATABASE_URL=mysql+pymysql://fanhub:YOUR_URL_ENCODED_PASSWORD@127.0.0.1:3306/fanhub?charset=utf8mb4
```

URL-encode reserved password characters. Run `python -m alembic upgrade head` against that database. Prefer a separate migration account with DDL rights; the normal application account should not have DROP/ALTER permissions. `schema/mysql.sql` is a reference alternative, **not** a second initialization step to execute after Alembic.

## Seed and administrator creation

`seed-demo` refuses to run in production, never overwrites an existing user database, and loads fictional content only. The local default password is `FanHubDemo!26`, configurable through `DEMO_PASSWORD`. These example users are marked verified to allow local demonstrations. Never seed a public database with these credentials.

For an explicitly authorized deployment administrator:

```bash
python -m flask --app wsgi:app create-admin
```

The password prompt is hidden and confirmed. Ordinary registration cannot select a role. The operator command must be accessible only to authorized deployers.

## Email and one-time links

In development, verification/reset emails are written as private `.eml` files under `instance/dev-mailbox/`; no real SMTP email is sent. This directory is outside the frontend static directory. A link contains its token in a URL fragment, not a query string. The integration UI must read it once, remove it with history.replaceState and POST it to the verification/reset endpoint with CSRF.

The present frontend has **not** implemented this server link flow. Use an API client for backend verification until that adapter is completed. API responses never return reset tokens. Production SMTP requires TLS, credentials and monitoring. A durable, retryable mail outbox is a production gate and is not implemented here.

## Tests

```bash
python -m pytest -q
python -m compileall -q app
```

After installing runtime packages, Flask-client tests should no longer be skipped. Add a CI job against real MySQL before accepting the schema and concurrency behavior. Build a reproducible dependency lock on your target platform; use dependency/security scanning before deployment.

## Production boundaries

Use a WSGI server, HTTPS and a trusted reverse proxy, not `flask run --debug`. Example, after production configuration and verification:

```bash
waitress-serve --host 127.0.0.1 --port 5000 --threads 4 wsgi:app
```

Production config requires a random SECRET_KEY, a MySQL URL, Redis rate-limit storage, an HTTPS public URL and trusted hosts. It sets Secure/HttpOnly/SameSite cookies and HSTS. Proxy header trust is deliberately not enabled by default; configure exactly the actual trusted hop count and restrict direct origin access before using forwarded client addresses.

`prune-auth` can be scheduled once daily by your deployment scheduler. No scheduler or automatic task has been set up by this kit.
