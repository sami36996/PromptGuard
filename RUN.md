# PromptGuard — How to Run

This is the working application after the move into `Project_V1`.

```text
Project_V1/
├── frontend/          Next.js company + admin UI
├── Promptguard/       FastAPI backend
└── requirements.txt   Ignore this file (leftover SDK list)
```

Use `Promptguard/requirements.txt` for the backend. Do not install the root `requirements.txt`.

The app is a local demonstration. Run the backend first, then the frontend, in two terminals.

---

## 1. Requirements

Install these on the machine:

| Tool | Suggested version | Why |
|---|---|---|
| Python | 3.11+ (3.13 works) | FastAPI backend |
| Node.js | 20+ | Next.js frontend |
| npm | comes with Node | frontend packages |
| sqlite3 | optional | inspect the database / promote an admin |

On Kali / Debian / Ubuntu:

```bash
sudo apt update
sudo apt install python3 python3-venv python3-pip nodejs npm sqlite3
```

Check versions:

```bash
python3 --version
node --version
npm --version
```

---

## 2. Go to the project

```bash
cd /home/yishak/Desktop/New_things_from_talent/project_1/Project_V1
```

If your path is different, `cd` into the folder that contains `frontend/` and `Promptguard/`.

---

## 3. Backend — first-time setup

Open **terminal 1**.

```bash
cd Promptguard

python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### Backend environment

Create `Promptguard/.env` if it does not already exist:

```env
DATABASE_URL=sqlite:///./promptguard.db
SECRET_KEY=replace-with-a-unique-secret-key-32+
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

Rules:

- `SECRET_KEY` must be **at least 32 characters**.
- Do not paste real production secrets into chat or git.
- Leave LLM variables unset unless you have a provider. Analysis still works without them; allowed chats return `llm_error` instead of a model reply.

Optional LLM (OpenAI-compatible):

```env
LLM_BASE_URL=https://api.openai.com/v1/chat/completions
LLM_API_KEY=your-provider-key
LLM_MODEL=gpt-4o-mini
```

The first backend start creates `promptguard.db` and missing tables automatically. It does not wipe existing data.

---

## 4. Start the backend

Still in **terminal 1**, from `Promptguard/` with the venv active:

```bash
source .venv/bin/activate
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

When it is up:

| URL | What it is |
|---|---|
| http://127.0.0.1:8000/docs | Swagger UI |
| http://127.0.0.1:8000/redoc | ReDoc |
| http://127.0.0.1:8000/openapi.json | OpenAPI schema |

Keep this terminal open.

---

## 5. Frontend — first-time setup

Open **terminal 2**.

```bash
cd /home/yishak/Desktop/New_things_from_talent/project_1/Project_V1/frontend

npm install
```

Create `frontend/.env.local` if it is missing:

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

That value must match the backend origin. Do not put secrets in this file.

---

## 6. Start the frontend

Still in **terminal 2**:

```bash
npm run dev
```

When it is up:

| URL | What it is |
|---|---|
| http://localhost:3000 | Marketing / home |
| http://localhost:3000/register | Create a company account |
| http://localhost:3000/login | Company portal login |
| http://localhost:3000/dashboard | Company console |
| http://localhost:3000/admin/login | Super-admin SOC login |

Use either `localhost:3000` or `127.0.0.1:3000`. Both are allowed by the backend CORS setting above.

---

## 7. First use

### Create a company user

1. Open http://localhost:3000/register
2. Enter email, password, full name, and company name
3. You are signed in and sent to the company dashboard

That account can use:

- Overview
- Agents
- User → Agent testing
- Agent → Agent testing
- Security logs
- API keys
- Policies
- Usage
- Settings

### Promote a super admin (required for `/admin`)

There is no public “make me platform admin” button. After you register, promote that user in SQLite.

Stop nothing. In a **third** terminal:

```bash
cd /home/yishak/Desktop/New_things_from_talent/project_1/Project_V1/Promptguard
sqlite3 promptguard.db
```

```sql
.tables
SELECT id, email, is_platform_admin FROM users;
UPDATE users SET is_platform_admin = 1 WHERE email = 'you@example.com';
SELECT id, email, is_platform_admin FROM users;
.quit
```

Then open http://localhost:3000/admin/login and sign in with the **same email and password**.

A normal company user is rejected by `/admin` even if they have a valid token.

---

## 8. What each area does

### Company portal (`/dashboard`)

1. Register or log in
2. Open **User → Agent** and submit a prompt
3. ALLOW / REVIEW / BLOCK comes from the backend security engine
4. BLOCK never calls the LLM
5. ALLOW/REVIEW call the LLM only if `LLM_*` is configured
6. **Policies** save tenant thresholds, auto-block, allowed models, and blocked keywords
7. **Settings** save company email, admin profile, notification preferences, and password

### Super admin (`/admin`)

After the user is a platform admin:

- Global stats
- Companies and agents
- Threats
- Global policy
- Exports / reports / graph

---

## 9. Optional checks

Backend tests (uses a temporary database, not `promptguard.db`):

```bash
cd Promptguard
source .venv/bin/activate
python -m pytest -q
```

Frontend production build:

```bash
cd frontend
npm run build
```

---

## 10. Stop the app

In each running terminal press `Ctrl+C`.

The SQLite file `Promptguard/promptguard.db` stays on disk. Starting again keeps existing users and logs.

---

## 11. Common problems

**Backend exits: `SECRET_KEY` too short**  
The key in `Promptguard/.env` must be 32+ characters.

**Frontend loads but login fails / CORS error**  
- Backend must be running on `127.0.0.1:8000`
- `frontend/.env.local` must be `NEXT_PUBLIC_API_URL=http://127.0.0.1:8000`
- `CORS_ORIGINS` must include the exact browser origin (`http://localhost:3000` and `http://127.0.0.1:3000`)
- Restart the frontend after changing `.env.local`

**`/admin` says access required**  
The user is not `is_platform_admin = 1`. Run the SQLite update in section 7.

**Allowed chat has no model reply**  
That is expected until `LLM_BASE_URL`, `LLM_API_KEY`, and `LLM_MODEL` are set. Security analysis still runs.

**Port already in use**  
- Backend: `uvicorn app.main:app --reload --host 127.0.0.1 --port 8001` and set `NEXT_PUBLIC_API_URL=http://127.0.0.1:8001`
- Frontend: `npm run dev -- --port 3001` and add `http://localhost:3001` to `CORS_ORIGINS`

**Moved the folders and Python cannot import the app**  
Recreate the venv inside the new `Promptguard/` path (section 3). Old virtualenvs keep the previous directory.

**Do not install `Project_V1/requirements.txt`**  
That file is not the backend dependency list.

---

## 12. Daily start (after the first setup)

Terminal 1:

```bash
cd /home/yishak/Desktop/New_things_from_talent/project_1/Project_V1/Promptguard
source .venv/bin/activate
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Terminal 2:

```bash
cd /home/yishak/Desktop/New_things_from_talent/project_1/Project_V1/frontend
npm run dev
```

Then open http://localhost:3000
