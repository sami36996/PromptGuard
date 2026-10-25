# PromptGuard Deployment Readiness

This document describes a **local demonstration** setup. A production deployment has **not** been performed or certified.

## Local demonstration

Backend:

```bash
cd Promptguard
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Frontend:

```bash
cd frontend
npm install
# optional: echo 'NEXT_PUBLIC_API_URL=http://127.0.0.1:8000' > .env.local
npm run dev
```

Default frontend API target is `http://127.0.0.1:8000` when `NEXT_PUBLIC_API_URL` is unset.

## Required environment variables

Set these in `Promptguard/.env`. **Do not commit real secret values.**

| Variable | Required | Purpose |
|---|---|---|
| `SECRET_KEY` | Yes | JWT signing key. Must be at least 32 characters. Never reuse the development default. |
| `DATABASE_URL` | Yes | SQLAlchemy URL. Local default is `sqlite:///./promptguard.db`. |
| `JWT_ALGORITHM` | No | Default `HS256`. |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | No | Used by `create_access_token` fallback. Login/register currently issue a 1-day token. |
| `CORS_ORIGINS` | Yes for browsers | Comma-separated frontend origins, e.g. `http://localhost:3000,http://127.0.0.1:3000`. |
| `LLM_BASE_URL` | No | OpenAI-compatible chat completions URL. If unset, analysis still runs and `/api/chat` returns `llm_error`. |
| `LLM_API_KEY` | With LLM | Bearer token for the LLM provider. Never send this to the frontend. |
| `LLM_MODEL` | With LLM | Model name. Company allow-lists compare against this value. |
| `LLM_TIMEOUT` | No | Default `30`. |
| `LLM_MAX_RESPONSE_SIZE` | No | Default `1048576`. |
| `WEB_MAX_RESPONSE_SIZE` | No | Default 5MB. |
| `WEB_MAX_REDIRECTS` | No | Default `5`. |
| `WEB_CONNECT_TIMEOUT` / `WEB_READ_TIMEOUT` / `WEB_WRITE_TIMEOUT` / `WEB_POOL_TIMEOUT` | No | Outbound web-scan timeouts. |
| `WEB_MAX_URL_LENGTH` | No | Default `2048`. |
| `NEXT_PUBLIC_API_URL` | Frontend | Backend origin for the browser. Public by design; must not contain secrets. |

## Secret handling

- The backend reads secrets from the environment / `.env`.
- The browser only stores the user JWT (`promptguard_token`).
- LLM keys, `SECRET_KEY`, and the database URL must never be returned by an API.
- Rotate `SECRET_KEY` only with a planned logout of all JWTs.

## Production prerequisites (not verified)

These are required before a real production launch. They are **not** claimed complete:

- Unique `SECRET_KEY` of sufficient entropy
- PostgreSQL (or equivalent) instead of SQLite
- HTTPS terminator and HSTS
- CORS limited to the real frontend origin
- Disable or protect `/docs` and `/redoc`
- Database backups and restore tests
- Log redaction for secrets and prompts
- Rate limiting at the reverse proxy
- Process supervisor / health checks
- Migration process (`Base.metadata.create_all` is used today; it will not alter existing columns)
- Incident response for leaked JWTs and API keys

## Database initialization

`app/main.py` calls `Base.metadata.create_all()` at import. That creates **missing tables** only. It does not migrate existing columns and it does not reset data.

New tables added for company policy and company settings are created on next startup. Existing company, user, agent, and log rows are left intact.

Do not point automated tests at the operator’s database. The pytest suite uses an isolated temporary SQLite file.

## CORS and HTTPS

- Local CORS must include the exact frontend origin, including `localhost` vs `127.0.0.1`.
- `allow_credentials=True` is enabled. Do not use `*` origins in production.
- The application does not terminate TLS. Put it behind HTTPS.

## Logging and error disclosure

- API errors return FastAPI `detail` strings.
- LLM provider failures return `llm_error` on an otherwise successful analysis response.
- Structured operational monitoring is not bundled.

## Backup and recovery

Not implemented in-app. For SQLite, copy `promptguard.db` while the app is stopped. For PostgreSQL, use the database’s backup tooling.

## Known demonstration limits

- Notification switches persist preferences only; no mail sender is configured.
- Password reset remains “coming soon”.
- `/api/chat` REVIEW decisions still call the LLM when configured.
- Heuristic detection is not a complete prevention guarantee.
- No Dockerfile or container orchestration is provided.
