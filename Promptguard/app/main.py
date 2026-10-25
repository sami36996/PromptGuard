from fastapi import FastAPI
from app.routes.external import router as external_router
from app.routes.risk import router as risk_router
from app.routes.proxy import router
from app.routes.logs import router as log_router
from app.routes.stats import router as stats_router
from app.routes.company import router as company_router
from app.core.database import Base, engine
from app.routes.attacks import router as attacks_router
from app.routes.auth import router as auth_router
from app.routes.api_key import router as api_key_router
from app.routes.agent import router as agent_router
from app.routes.security import router as security_router
from app.models.agent_status import AgentStatus
from app.core.database import SessionLocal
from app.core .default_policy import create_default_policy
from app.models.agent_registry import Agent
import app.models.threat_event
import app.models.security_policy
from app.routes import dashboard
from app.routes.analytics import router as analytics_router
from app.routes.graph import router as graph_router
from app.routes.events import router as events_router
from app.routes.export import router as export_router
from app.routes.report import router as report_router
from app.routes.websocket import router as websocket_router
from app.routes.agent import router as agent_router
from fastapi.middleware.cors import CORSMiddleware
from app.routes.admin import router as admin_router
from app.routes.company_policy import router as company_policy_router
from app.routes.users import router as users_router
from app.models.company_policy import CompanyPolicy
from app.models.company_settings import CompanySettings
from app.core.config import settings
Base.metadata.create_all(bind=engine)

db = SessionLocal()
create_default_policy(db)
db.close()

# Create FastAPI app
app = FastAPI(
    title="Prompt Guard"
    )
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        origin.strip()
        for origin in settings.CORS_ORIGINS.split(",")
        if origin.strip()
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(
    router,
    prefix="/api"
)

app.include_router(
    log_router,
    prefix="/api"
)

app.include_router(
    stats_router,
    prefix="/api"
)
app.include_router(
    risk_router,
    prefix="/api"
)
app.include_router(
    attacks_router,
    prefix="/api"
)
app.include_router(
    auth_router,
    prefix="/auth"
)
app.include_router(
    api_key_router,
    prefix="/api-keys"
)

app.include_router(
    agent_router, prefix="/api"
)
app.include_router (
    graph_router, prefix="/api"
)
app.include_router (
    security_router, prefix= "/api"
)
app.include_router(
    dashboard.router,
    prefix="/api"
)
app.include_router(
    analytics_router,
    prefix="/api"
)
app.include_router(
    events_router,
    prefix="/api"
)
app.include_router(
    export_router,
    prefix="/api"
)
app.include_router(
    report_router,
    prefix="/api"
)
app.include_router(
    websocket_router
)
app.include_router(
    admin_router
)
app.include_router(
    company_router
)
app.include_router(
    company_policy_router,
    prefix="/api"
)
app.include_router(
    users_router
)
app.include_router(
    external_router,
    prefix="/api"
)