# PromptGuard Backend

PromptGuard is an **LLM security middleware / prompt-injection firewall** built with **FastAPI**. It sits between an application and an LLM provider, analyzes incoming prompts, evaluates security risk, and determines whether the request should be **allowed, reviewed, or blocked**.

The backend also provides APIs for agent registration, authentication, security policies, logs, statistics, threats, and super-admin monitoring.

---

## 1. Technology Stack

* **Python 3**
* **FastAPI**
* **Uvicorn**
* **SQLAlchemy**
* **Pydantic**
* **JWT authentication**
* **SQLite/PostgreSQL-compatible database layer**
* **Regex/pattern-based security analysis**
* **Swagger / OpenAPI**

---

# 2. Project Structure

```text
Promptguard/
│
├── app/
│   ├── core/
│   │   ├── api_auth.py
│   │   ├── api_keys.py
│   │   ├── auth.py
│   │   ├── chain.py
│   │   ├── chain_security.py
│   │   ├── database.py
│   │   ├── default_policy.py
│   │   ├── dependencies.py
│   │   └── security.py
│   │
│   ├── engine/
│   │   ├── analyzer.py
│   │   ├── chain_risks.py
│   │   ├── decision.py
│   │   ├── patterns.py
│   │   ├── scoring.py
│   │   └── trust.py
│   │
│   ├── models/
│   ├── schemas/
│   ├── routes/
│   └── main.py
│
├── requirements.txt
├── .env
└── README.md
```

The exact folder structure may differ slightly depending on the current branch/version.

---

# 3. Running the Backend

## Create virtual environment

```bash
python3 -m venv .venv
```

## Activate it

Linux/macOS:

```bash
source .venv/bin/activate
```

## Install dependencies

```bash
pip install -r requirements.txt
```

## Start the server

```bash
uvicorn app.main:app --reload
```

The backend will normally be available at:

```text
http://127.0.0.1:8000
```

---

# 4. API Documentation

FastAPI automatically provides interactive documentation.

Swagger:

```text
http://127.0.0.1:8000/docs
```

ReDoc:

```text
http://127.0.0.1:8000/redoc
```

The `/docs` page should be considered the most accurate source for the exact schemas currently implemented in the running backend.

---

# 5. Security Model

PromptGuard analyzes an incoming LLM prompt before it reaches the model.

The general flow is:

```text
Client
   │
   ▼
PromptGuard API
   │
   ▼
Authentication
   │
   ▼
Prompt Analyzer
   │
   ├── Pattern Detection
   ├── Risk Scoring
   ├── Chain-Risk Analysis
   └── Trust Evaluation
   │
   ▼
Decision Engine
   │
   ├── ALLOW
   ├── REVIEW
   └── BLOCK
   │
   ▼
LLM / Application
```

The security engine evaluates multiple indicators instead of relying on a single keyword.

The resulting risk score is normalized to a maximum of `100`.

Current decision thresholds:

```text
0 - 29    → ALLOW
30 - 69   → REVIEW
70 - 100  → BLOCK
```

`/api/chat` forwards ALLOW and REVIEW to the configured LLM. BLOCK is not forwarded. If the LLM is not configured, analysis still returns and the response includes `llm_error`.

---

# 6. Authentication

Protected endpoints require authentication.

Depending on the endpoint, authentication may use:

```text
Authorization: Bearer <JWT_TOKEN>
```

or an API key.

Example:

```http
Authorization: Bearer eyJhbGciOi...
```

Do not commit authentication tokens, API keys, passwords, or `.env` files to Git.

---

# 7. Agent APIs

## Register Agent

### Endpoint

```http
POST /api/agents/register
```

Registers a new AI agent with PromptGuard.

### Request

```json
{
  "agent_name": "Customer Support Agent",
  "agent_type": "customer support",
  "organization": "Example Company",
  "description": "Customer support AI agent"
}
```

### Example

```bash
curl -X POST \
  http://127.0.0.1:8000/api/agents/register \
  -H "Content-Type: application/json" \
  -d '{
    "agent_name": "Customer Support Agent",
    "agent_type": "customer support",
    "organization": "Example Company",
    "description": "Customer support AI agent"
  }'
```

The response contains the newly registered agent information and credentials/API-key information where applicable.

---

# 8. Agent Detail

### Endpoint

```http
GET /api/agents/{agent_id}
```

Returns information about a specific registered agent.

### Example

```http
GET /api/agents/123
```

Typical information includes:

```json
{
  "id": 123,
  "agent_name": "Customer Support Agent",
  "agent_type": "customer support",
  "organization": "Example Company",
  "description": "Customer support AI agent",
  "registered_at": "...",
  "last_seen": "..."
}
```

The exact response schema should be verified through `/docs`.

---

# 9. Prompt Security / Chat Proxy

The main purpose of PromptGuard is to analyze prompts before they reach an LLM.

### Endpoint

```http
POST /api/chat
```

The endpoint receives an LLM request, evaluates the prompt, and applies the PromptGuard security decision.

Conceptually:

```text
Application
     │
     ▼
POST /api/chat
     │
     ▼
PromptGuard
     │
     ├── Analyze prompt
     ├── Calculate risk
     ├── Determine decision
     │
     ├── ALLOW ───► LLM
     │
     ├── REVIEW ──► Review / policy handling
     │
     └── BLOCK ───► Request rejected
```

The exact request body depends on the current LLM/provider integration. Use the Swagger schema at:

```text
http://127.0.0.1:8000/docs
```

---

# 10. Security Analysis

The security engine is separated into several components.

## Pattern Detection

```text
app/engine/patterns.py
```

Contains security patterns and associated risk weights.

Examples of attack categories include:

* Prompt injection
* Jailbreak attempts
* Instruction override
* System prompt extraction
* Role manipulation
* Malicious instruction chaining
* Sensitive information extraction

---

## Scoring

```text
app/engine/scoring.py
```

Combines detected indicators and calculates the overall security score.

The score is normalized to:

```text
0-100
```

---

## Decision Engine

```text
app/engine/decision.py
```

Converts the security score into a security decision:

```text
ALLOW
REVIEW
BLOCK
```

---

## Analyzer

```text
app/engine/analyzer.py
```

Coordinates the security analysis process.

Conceptually:

```python
prompt
  ↓
pattern detection
  ↓
risk scoring
  ↓
chain-risk analysis
  ↓
trust evaluation
  ↓
final decision
```

---

# 11. Logs

PromptGuard records security events so they can be monitored and analyzed.

### Endpoint

```http
GET /api/logs
```

Returns security/log information for the authenticated account or agent.

Typical information can include:

```text
Request
Risk score
Decision
Detected threats
Agent
Timestamp
```

Query parameters may be available for filtering/pagination depending on the current implementation.

Check `/docs` for the current parameters.

---

# 12. Statistics

### Endpoint

```http
GET /api/stats
```

Returns security statistics.

Typical metrics include:

```text
Total requests
Allowed requests
Review requests
Blocked requests
Threat count
Risk statistics
```

Example conceptual response:

```json
{
  "total_requests": 1000,
  "allowed": 820,
  "review": 100,
  "blocked": 80
}
```

The exact schema is defined by the running API.

---

# 13. Super Admin APIs

PromptGuard contains a separate administrative monitoring layer.

These endpoints provide global visibility across companies and agents.

The existing super-admin API structure is intentionally kept as follows:

```text
GET /admin/stats
GET /admin/companies
GET /admin/companies/{company_id}
GET /admin/companies/{company_id}/agents
GET /admin/agents/global
GET /admin/threats/global
```

These endpoints should not be reorganized into another namespace without coordinating with the frontend.

---

# 14. Super Admin Statistics

### Endpoint

```http
GET /admin/stats
```

Returns global platform-level statistics.

Conceptually:

```text
Companies
Agents
Requests
Threats
Blocked requests
Review requests
Allowed requests
```

Used by the Super Admin dashboard.

---

# 15. List Companies

### Endpoint

```http
GET /admin/companies
```

Returns all companies registered on the platform.

Example conceptual response:

```json
[
  {
    "id": 1,
    "name": "Company A",
    "agents": 5,
    "status": "active"
  },
  {
    "id": 2,
    "name": "Company B",
    "agents": 3,
    "status": "active"
  }
]
```

---

# 16. Company Details

### Endpoint

```http
GET /admin/companies/{company_id}
```

Returns detailed information about one company.

Example:

```http
GET /admin/companies/1
```

This endpoint is used when the administrator opens a company's details.

---

# 17. Company Agents

### Endpoint

```http
GET /admin/companies/{company_id}/agents
```

Returns all agents belonging to a specific company.

Example:

```http
GET /admin/companies/1/agents
```

Conceptual response:

```json
[
  {
    "id": 101,
    "agent_name": "Support Agent",
    "agent_type": "customer support",
    "status": "active"
  }
]
```

---

# 18. Global Agents

### Endpoint

```http
GET /admin/agents/global
```

Returns agents across the entire PromptGuard platform.

This is different from:

```text
GET /admin/companies/{company_id}/agents
```

because the global endpoint is not restricted to a single company.

---

# 19. Global Threats

### Endpoint

```http
GET /admin/threats/global
```

Returns security threats detected across the entire platform.

Typical threat information includes:

```text
Agent
Company
Threat type
Risk score
Decision
Timestamp
```

This endpoint powers the global security/threat monitoring view.

---

# 20. Endpoint Summary

| Method | Endpoint                               | Purpose                         |
| ------ | -------------------------------------- | ------------------------------- |
| POST   | `/api/agents/register`                 | Register an AI agent            |
| GET    | `/api/agents/{agent_id}`               | Get agent details               |
| POST   | `/api/chat`                            | Analyze/proxy LLM requests      |
| GET    | `/api/logs`                            | Retrieve security logs          |
| GET    | `/api/stats`                           | Get account/platform statistics |
| GET    | `/admin/stats`                         | Super Admin global statistics   |
| GET    | `/admin/companies`                     | List companies                  |
| GET    | `/admin/companies/{company_id}`        | Get company details             |
| GET    | `/admin/companies/{company_id}/agents` | Get company's agents            |
| GET    | `/admin/agents/global`                 | Get all agents                  |
| GET    | `/admin/threats/global`                | Get global security threats     |

---

# 21. HTTP Status Codes

The API generally follows standard HTTP status codes.

```text
200 OK
```

Request succeeded.

```text
201 Created
```

Resource successfully created.

```text
400 Bad Request
```

Invalid request.

```text
401 Unauthorized
```

Authentication is missing or invalid.

```text
403 Forbidden
```

Authenticated user does not have permission.

```text
404 Not Found
```

Requested resource does not exist.

```text
422 Unprocessable Entity
```

FastAPI/Pydantic validation error.

```text
500 Internal Server Error
```

Unexpected server-side error.

---

# 22. Environment Variables

Create a `.env` file for local configuration.

Example:

```env
DATABASE_URL=sqlite:///./promptguard.db

SECRET_KEY=replace-with-a-unique-secret-key-32+

CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

ACCESS_TOKEN_EXPIRE_MINUTES=1440
```

See `docs/DEPLOYMENT.md` for the full variable list and `docs/THREAT_MODEL.md` for the STRIDE register.

`SECRET_KEY` must be at least 32 characters. The development default is not safe for production.

If external LLM providers or other services are configured, their credentials should also be stored in environment variables.

**Never commit `.env` to Git.**

---

# 23. Development Workflow

After making backend changes:

```bash
source .venv/bin/activate
```

Run the server:

```bash
uvicorn app.main:app --reload
```

Check the API:

```text
http://127.0.0.1:8000/docs
```

Run Python compilation checks:

```bash
python -m compileall app
```

---

# 24. Frontend Integration

The frontend should communicate with the backend through the HTTP API.

For local development:

```text
Frontend
   │
   │ HTTP requests
   ▼
http://127.0.0.1:8000
   │
   ▼
PromptGuard FastAPI
   │
   ▼
Database
```

The frontend should not directly access the database.

---

# 25. Important Integration Notes

### Do not change the existing admin endpoints

The frontend currently expects the following structure:

```text
/admin/stats
/admin/companies
/admin/companies/{company_id}
/admin/companies/{company_id}/agents
/admin/agents/global
/admin/threats/global
```

Changing these routes will require corresponding frontend changes.

### Use the OpenAPI documentation

Before implementing a frontend integration, open:

```text
http://127.0.0.1:8000/docs
```

Swagger provides the authoritative request/response schema generated by the current backend.

### Authentication

Protected endpoints must receive the required authentication credentials.

Do not hardcode credentials in frontend source code.

### Security decisions

The security engine produces three primary outcomes:

```text
ALLOW
REVIEW
BLOCK
```

The frontend should treat these as security decisions rather than simply displaying the numerical score.

---

# 26. Production Considerations

For production deployment:

* Use PostgreSQL instead of a development SQLite database where appropriate.
* Store secrets in environment variables or a secrets manager.
* Disable unnecessary debug configuration.
* Configure CORS explicitly.
* Run behind Nginx or another reverse proxy.
* Use HTTPS.
* Rotate API keys/secrets.
* Implement proper database backups.
* Configure structured logging.
* Add rate limiting.
* Monitor blocked/reviewed requests.
* Never expose internal admin endpoints publicly without proper authentication and authorization.

---

# 27. Quick Start

The shortest path to run the backend:

```bash
cd Promptguard

python3 -m venv .venv

source .venv/bin/activate

pip install -r requirements.txt

uvicorn app.main:app --reload
```

Then open:

```text
http://127.0.0.1:8000/docs
```

---

# 28. Developer Handoff

A developer receiving this backend should follow this order:

```text
1. Install Python
        ↓
2. Create virtual environment
        ↓
3. Install requirements
        ↓
4. Configure .env
        ↓
5. Start FastAPI
        ↓
6. Open /docs
        ↓
7. Test authentication
        ↓
8. Register/test an agent
        ↓
9. Test /api/chat
        ↓
10. Test logs/statistics
        ↓
11. Test Super Admin endpoints
        ↓
12. Connect frontend
```

The `/docs` endpoint is the definitive reference for the exact API schemas exposed by the current backend.
