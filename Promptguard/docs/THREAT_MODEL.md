# PromptGuard STRIDE Threat Model

This threat model describes the **implemented** PromptGuard system in `Promptguard/` and `frontend/`. It is based on code inspection and automated tests, not on a production penetration test.

**Scope:** local demonstration deployment of the existing FastAPI backend and Next.js frontend.

**Out of scope:** claims that every attack will be detected, production hosting that has not been tested, and controls that are only recommended below.

## Trust boundaries

```text
Untrusted Content
  (user prompts, A2A messages, web pages, documents, encoded payloads)
        │
        ▼
Ingestion
  (/api/chat, /api/agents/a2a, /api/external/web)
        │
        ▼
PromptGuard Analysis
  detectors → scoring → decision (ALLOW / REVIEW / BLOCK)
        │
        ├── BLOCK → response returned; LLM is not called
        ├── REVIEW → analysis returned; /api/chat still forwards to the LLM
        └── ALLOW → forwarded to the configured LLM provider when present
        │
        ▼
Downstream Consumer
  browser UI, tenant logs, admin SOC, optional LLM provider
```

PromptGuard **does not** control execution inside an external LLM, browser, or third-party agent runtime. It can refuse to forward a blocked `/api/chat` or `/api/agents/a2a` request. REVIEW requests on `/api/chat` are still sent to the LLM.

## Actors

| Actor | Trust | Entry points |
|---|---|---|
| Anonymous internet client | Untrusted | `/auth/*`, unauthenticated probes of protected APIs |
| Company user (JWT) | Tenant | `/api/*`, `/company/me`, `/users/me`, `/api/policy` |
| Agent API key | Tenant | `/api/agents/a2a` and agent-key authenticated routes |
| Platform super admin | Privileged | `/admin/*`, exports, reports, graph |
| External web origin | Untrusted | Content fetched by `WebService` |
| LLM provider | Semi-trusted outbound | `LLM_BASE_URL` |

## Decision policy as implemented

Live scoring/decision (`app/engine/decision.py`, `app/services/analyzer_service.py`):

| Score | Decision | `/api/chat` LLM call |
|---|---|---|
| `< 30` | ALLOW | Yes, if configured |
| `30–69` | REVIEW | Yes, if configured |
| `>= 70` | BLOCK | No |

Company policy (`/api/policy`) can change the tenant block threshold, disable automatic blocking, and add blocked keywords. Global SOC policy remains `/admin/policy`.

## STRIDE register

| ID | Category | Asset / component | Actor and entry point | Attack scenario | Trust boundary / data flow | Existing mitigation (code evidence) | Remaining gap | Risk | Recommended remediation | Verification |
|---|---|---|---|---|---|---|---|---|---|---|
| S1 | Spoofing | Company JWT | Attacker → `/auth/login`, stolen `localStorage` token | Guess or steal a user token and call tenant APIs | Browser ↔ API | JWT HS256 (`app/core/auth.py`); protected routes use `get_current_user`; admin login probes `GET /admin/stats` | Tokens live in `localStorage`; no refresh/revocation list; login ignores `ACCESS_TOKEN_EXPIRE_MINUTES` and hardcodes 1 day | Medium | HttpOnly cookies or short-lived access tokens + refresh; honor expiry setting | `tests/test_auth_isolation.py` |
| S2 | Spoofing | Super admin | Company user → `/admin/*` | Ordinary tenant user opens `/admin` | Frontend admin layout ↔ `/admin/stats` | Router-level `get_super_admin`; frontend `loginAdmin` and admin layout call `/admin/stats` | Admin identity is a boolean on `User.is_platform_admin` with no second factor | Medium | Dedicated admin IdP / MFA | `tests/test_auth_isolation.py` |
| S3 | Spoofing | Agent identity | Forged API key → A2A | Use a leaked agent key to send A2A messages | Agent ↔ `/api/agents/a2a` | Keys stored as SHA-256 hashes; A2A target lookup is company-scoped | `rate_limit` on keys is not enforced; `app/core/api_auth.py` is a dead/broken helper | Medium | Enforce key rate limits and retire the unused helper | A2A registration/login tests |
| T1 | Tampering | Tenant policy | Member → `PUT /api/policy` | Viewer changes block thresholds | Tenant policy table | Write requires `require_admin`; policy is company-scoped | First membership is used; no company switcher | Low | Bind role checks to the selected company | `tests/test_company_policy.py` |
| T2 | Tampering | Security analysis | Attacker → encoded prompt | Hide injection in Base64/HTML entities | Untrusted prompt → analyzer | Second-pass analysis of `decoded_payloads` (`app/engine/analyzer.py`) | Heuristic decoders can miss novel encodings | Medium | Keep regression tests for new encodings; do not treat this as a guarantee | `tests/test_security_engine.py` |
| T3 | Tampering | Web fetch | Attacker → `/api/external/web` | Redirect or DNS-rebind the server onto an internal host | Server ↔ untrusted URL | Scheme/host/IP checks, redirect revalidation, IP pinning + `Host`/`SNI`, size/type/timeouts (`web_service.py`) | TLS-to-IP pinning depends on HTTPX SNI support; no production network test of rebinding | Medium | Pin connections in a custom transport and add an integration test against a rebinding fixture | `tests/external/test_web_service.py` |
| R1 | Repudiation | Guard logs | Tenant user → `/api/chat` | Deny that a blocked prompt was submitted | Chat → `GuardLog` / `ThreatEvent` | Tenant `GuardLog` and `ThreatEvent` written for company users; admin audit table exists | `PromptLog` has no `company_id`; admin audit often omits `admin_id` | Medium | Tenant-scope all logs; always record `admin_id` | Chat and log isolation tests |
| R2 | Repudiation | Auth events | Attacker → `/auth/login` | Password guessing without a durable trail | Auth service | Failed login returns 401 | No login-attempt audit or lockout | Medium | Log auth failures and add lockout/backoff | Auth tests cover 401 only |
| I1 | Information disclosure | Tenant data | Company B → `/api/logs`, agents | Cross-tenant read of prompts or agents | DB queries | Most list endpoints filter `company_id` | Super admin exports/logs can see all tenants by design; `PromptLog` is global | High for a shared production DB | Keep super-admin exports admin-only; add `company_id` to `PromptLog` or stop using it | `tests/test_auth_isolation.py` |
| I2 | Information disclosure | Secrets in prompts | User pastes keys → logs | Secrets persist in `GuardLog.prompt` | Chat → database | Secrets detector can BLOCK high-confidence keys | Blocked and allowed prompts are still stored in plaintext | High | Redact secrets before persistence | Detector tests; no redaction test exists |
| I3 | Information disclosure | Frontend | Browser DevTools | JWT and prompts visible to XSS on the frontend origin | Browser storage | API never returns `SECRET_KEY` or LLM keys | Any XSS on the frontend origin can steal the JWT | High in production | CSP, cookie tokens, output encoding (Next.js defaults help but are not verified here) | Not browser-tested |
| I4 | Information disclosure | Error messages | Client → LLM/web failures | Stack traces or provider keys leak | LLM/web services | LLM failures return generic `llm_error`; web errors raise HTTP 400 with service messages | FastAPI `/docs` is enabled; debug traces depend on deployment | Low | Disable docs and debug in production | Chat LLM-error test |
| D1 | Denial of service | Analyzer | Large/recursive encoded payloads | Exhaust CPU via decode + detector loops | Untrusted prompt | Decode size cap 1MB; unique payload set; encoding skipped on second pass | No application request-size or rate limit | Medium | Reverse-proxy body limits and rate limiting | Encoding tests; no load test |
| D2 | Denial of service | Web fetch | Auth user → huge/slow URL | Make the API wait on an external host | `/api/external/web` | Timeouts, redirect cap, 5MB cap, content-type allowlist | Authenticated users can still cause many outbound fetches | Medium | Per-user rate limit on `/api/external/web` | Existing timeout/size unit tests |
| D3 | Denial of service | SQLite | Local demo | Lock or fill the development database | App ↔ SQLite | Acceptable for demo | Not suitable as a concurrent production store | High for production | PostgreSQL + connection pooling | Not production-tested |
| E1 | Elevation of privilege | Super admin | Forged JWT `is_super_admin` claim | Put an admin claim in a token | JWT → `get_super_admin` | Privilege is loaded from `User.is_platform_admin`, not the claim alone | Compromised `SECRET_KEY` forges any user | Critical if default key is used | Require a unique production `SECRET_KEY` (≥32 chars) | Admin 403 test |
| E2 | Elevation of privilege | Suspended tenant | Suspended company → `/api/chat` | Continue using a suspended tenant | Company flag | `/api/chat` rejects inactive companies | Other tenant routes do not all check `company.is_active`; system mode is unused | Medium | Enforce `is_active` and agent status on every tenant write path | Chat enforcement plus code review |
| E3 | Elevation of privilege | External scanner | Anonymous → `/api/external/web` | Use the server as an open proxy | Public API | Endpoint now requires a JWT | Still allows any authenticated tenant to fetch arbitrary allowed URLs | Medium | Optional allowlist / SSRF egress proxy | `tests/test_startup.py` |
| X1 | Indirect prompt injection | External content | Malicious page → `/api/external/web` | Hidden instructions in HTML/PDF-like text | Untrusted web → analyzer → optional downstream | Fetched content is `trusted=False` and analyzed with the same engine | The scanner does not automatically block a later chat that pastes the same content unless that chat is also analyzed; PDF/binary types are rejected | High for agent workflows that trust scanned text | Treat scan results as untrusted context; never auto-execute scanned content | `tests/external/test_web_security_service.py` |

## Implemented controls versus recommendations

Implemented and verified in this repository (unit/API tests or code review):

- JWT authentication on tenant and admin APIs
- Super-admin gate on `/admin/*`
- Tenant filtering on logs, agents, dashboard, and company policy
- BLOCK short-circuit on `/api/chat` and `/api/agents/a2a`
- Detector pipeline + decoded-payload second pass
- Authenticated web scanner with SSRF URL/IP checks and IP pinning
- Company policy persistence and keyword enforcement
- User profile and password change
- LLM configuration errors returned without a fake model reply

Recommended and **not implemented**:

- Production rate limiting, WAF, and request-size limits
- Secret redaction in stored prompts
- Tenant column on `PromptLog`
- MFA / admin hardening
- Email delivery for notification preferences
- Password-reset email flow (UI still says “coming soon”)
- Guaranteed DNS-rebinding resistance under real resolver behavior
- Blocking REVIEW from reaching the LLM

## Residual risk statement

PromptGuard is a **heuristic prompt firewall** for demonstration and regression testing. It can detect many common injection, command, XSS, SQLi, secret, and encoding patterns. It cannot guarantee detection of every attack, and it does not sandbox the downstream LLM.
