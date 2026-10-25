"""Super admin routes - global platform dashboard."""

from datetime import datetime, timedelta
from typing import List
from fastapi import HTTPException
from app.admin.control_service import (
    SystemStateControlService,
)
from app.models.admin_audit_log import AdminAuditLog
from app.admin.control_service import (
    AgentControlService,
    AgentStatus,
)
from app.services.policy_service import (
    get_or_create_global_policy,
    update_global_policy,
)
from app.admin.audit_service import AdminAuditService
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.dependencies import get_db, get_super_admin

from app.models.user import User
from app.models.company import Company
from app.models.agent_registry import Agent
from app.models.membership import Membership
from app.models.guard_log import GuardLog
from app.models.threat_event import ThreatEvent
from app.admin.control_service import (
    AgentControlService,
    CompanyControlService,
    APIKeyControlService,
)
from app.schemas.admin import (
    CompanyAdminView,
    GlobalStats,
    AgentGlobalView,
)
from app.admin.control_service import CompanyControlService
from app.schemas.company import CompanyResponse


router = APIRouter(
    prefix="/admin",
    tags=["admin"],
    dependencies=[Depends(get_super_admin)],
)


# ============================================================
# GLOBAL PLATFORM STATISTICS
# ============================================================


@router.get(
    "/stats",
    response_model=GlobalStats,
)
def global_stats(
    db: Session = Depends(get_db),
    admin: User = Depends(get_super_admin),
):
    today = datetime.utcnow().date()

    total_companies = (
        db.query(Company)
        .count()
    )

    total_agents = (
        db.query(Agent)
        .count()
    )

    total_requests = (
        db.query(GuardLog)
        .count()
    )

    total_blocked = (
        db.query(GuardLog)
        .filter(
            GuardLog.action == "block"
        )
        .count()
    )

    active_today = (
        db.query(Agent)
        .filter(
            Agent.last_seen >= datetime.combine(
                today,
                datetime.min.time(),
            )
        )
        .count()
    )

    threats_today = (
        db.query(ThreatEvent)
        .filter(
            ThreatEvent.created_at >= datetime.combine(
                today,
                datetime.min.time(),
            )
        )
        .count()
    )

    return {
        "total_companies": total_companies,
        "total_agents": total_agents,
        "total_requests": total_requests,
        "total_blocked": total_blocked,
        "active_today": active_today,
        "threats_today": threats_today,
    }


# ============================================================
# LIST ALL COMPANIES
# ============================================================


@router.get(
    "/companies",
)
def list_all_companies(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    admin: User = Depends(get_super_admin),
):
    companies = (
        db.query(Company)
        .offset(skip)
        .limit(limit)
        .all()
    )

    result = []

    for company in companies:

        member_count = (
            db.query(Membership)
            .filter(
                Membership.company_id == company.id
            )
            .count()
        )

        agent_count = (
            db.query(Agent)
            .filter(
                Agent.company_id == company.id
            )
            .count()
        )

        total_requests = (
            db.query(GuardLog)
            .filter(
                GuardLog.company_id == company.id
            )
            .count()
        )

        result.append(
            {
                "id": company.id,
                "name": company.name,
                "slug": company.slug,
                "is_active": company.is_active,
                "member_count": member_count,
                "agent_count": agent_count,
                "total_requests": total_requests,
                "created_at": company.created_at,
            }
        )

    return result


# ============================================================
# GET COMPANY DETAILS
# ============================================================


@router.get(
    "/companies/{company_id}",
    response_model=CompanyResponse,
)
def get_company_detail(
    company_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_super_admin),
):
    company = (
        db.query(Company)
        .filter(Company.id == company_id)
        .first()
    )

    if not company:
        raise HTTPException(
            status_code=404,
            detail="Company not found",
        )

    return company


# ============================================================
# GET ALL AGENTS BELONGING TO A COMPANY
# ============================================================


@router.get(
    "/companies/{company_id}/agents",
)
def get_company_agents(
    company_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_super_admin),
):
    company = (
        db.query(Company)
        .filter(
            Company.id == company_id
        )
        .first()
    )

    if not company:
        raise HTTPException(
            status_code=404,
            detail="Company not found",
        )

    agents = (
        db.query(Agent)
        .filter(
            Agent.company_id == company_id
        )
        .all()
    )

    return agents


# ============================================================
# GLOBAL AGENT LIST
# ============================================================

@router.get(
    "/agents/global",
)
def global_agents(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    admin: User = Depends(get_super_admin),
):
    agents = (
        db.query(Agent)
        .offset(skip)
        .limit(limit)
        .all()
    )

    result = []

    for agent in agents:

        company = (
            db.query(Company)
            .filter(
                Company.id == agent.company_id
            )
            .first()
        )

        result.append(
            {
                "id": agent.id,
                "agent_id": agent.agent_id,
                "company_id": agent.company_id,
                "company_name": (
                    company.name
                    if company
                    else "Unknown"
                ),
                "agent_name": agent.agent_name,
                "agent_type": agent.agent_type,
                "status": agent.status,
                "total_messages": agent.total_messages,
                "blocked_messages": agent.blocked_messages,
                "trust_score": agent.trust_score,
                "last_seen": agent.last_seen,
                "created_at": agent.created_at,
            }
        )

    return result


# ============================================================
# GLOBAL THREAT EVENTS
# ============================================================

@router.get(
    "/threats/global",
)
def global_threats(
    db: Session = Depends(get_db),
    admin: User = Depends(get_super_admin),
):
    return (
        db.query(ThreatEvent)
        .order_by(
            ThreatEvent.created_at.desc()
        )
        .limit(100)
        .all()
    )
    

@router.post("/agents/{agent_id}/suspend")
def suspend_agent(
    agent_id: str,
    db: Session = Depends(get_db),
):
    agent = (
        db.query(Agent)
        .filter(Agent.agent_id == agent_id)
        .first()
    )

    if not agent:
        raise HTTPException(
            status_code=404,
            detail="Agent not found",
        )

    updated_agent = AgentControlService.suspend(
        db=db,
        agent=agent,
    )
    AdminAuditService.log(
        db=db,
        action="AGENT_SUSPENDED",
        resource_type="agent",
        resource_id=agent.agent_id,
    )

    return {
        "agent_id": updated_agent.agent_id,
        "status": updated_agent.status,
        "message": "Agent suspended successfully",
    }
@router.post("/agents/{agent_id}/activate")
def activate_agent(
    agent_id: str,
    db: Session = Depends(get_db),
):
    agent = (
        db.query(Agent)
        .filter(Agent.agent_id == agent_id)
        .first()
    )

    if not agent:
        raise HTTPException(
            status_code=404,
            detail="Agent not found",
        )

    updated_agent = AgentControlService.activate(
        db=db,
        agent=agent,
    )
    AdminAuditService.log(
        db=db,
        action="AGENT_ACTIVATED",
        resource_type="agent",
        resource_id=agent.agent_id,
    )

    return {
        "agent_id": updated_agent.agent_id,
        "status": updated_agent.status,
        "message": "Agent activated successfully",
    }

@router.post("/agents/{agent_id}/quarantine")
def quarantine_agent(
    agent_id: str,
    db: Session = Depends(get_db),
):
    agent = (
        db.query(Agent)
        .filter(Agent.agent_id == agent_id)
        .first()
    )

    if not agent:
        raise HTTPException(
            status_code=404,
            detail="Agent not found",
        )

    updated_agent = AgentControlService.quarantine(
        db=db,
        agent=agent,
    )
    AdminAuditService.log(
        db=db,
        action="AGENT_QUARANTINED",
        resource_type="agent",
        resource_id=agent.agent_id,
    )
    

    return {
        "agent_id": updated_agent.agent_id,
        "status": updated_agent.status,
        "message": "Agent quarantined successfully",
    }

@router.post("/agents/{agent_id}/revoke")
def revoke_agent(
    agent_id: str,
    db: Session = Depends(get_db),
):
    agent = (
        db.query(Agent)
        .filter(Agent.agent_id == agent_id)
        .first()
    )

    if not agent:
        raise HTTPException(
            status_code=404,
            detail="Agent not found",
        )

    updated_agent = AgentControlService.revoke(
        db=db,
        agent=agent,
    )
    AdminAuditService.log(
        db=db,
        action="AGENT_REVOKED",
        resource_type="agent",
        resource_id=agent.agent_id,
    )

    return {
        "agent_id": updated_agent.agent_id,
        "status": updated_agent.status,
        "message": "Agent revoked successfully",
    }

@router.post("/companies/{company_id}/suspend")
def suspend_company(
    company_id: int,
    db: Session = Depends(get_db),
):
    company = (
        db.query(Company)
        .filter(Company.id == company_id)
        .first()
    )

    if not company:
        raise HTTPException(
            status_code=404,
            detail="Company not found",
        )

    updated_company = CompanyControlService.suspend(
        db=db,
        company=company,
    )
    AdminAuditService.log(
        db=db,
        action="COMPANY_SUSPENDED",
        resource_type="company",
        resource_id=str(company.id),
    )

    return {
        "company_id": updated_company.id,
        "is_active": updated_company.is_active,
        "message": "Company suspended successfully",
    }
@router.post("/companies/{company_id}/activate")
def activate_company(
    company_id: int,
    db: Session = Depends(get_db),
):
    company = (
        db.query(Company)
        .filter(Company.id == company_id)
        .first()
    )

    if not company:
        raise HTTPException(
            status_code=404,
            detail="Company not found",
        )

    updated_company = CompanyControlService.activate(
        db=db,
        company=company,
    )
    AdminAuditService.log(
        db=db,
        action="COMPANY_ACTIVATED",
        resource_type="company",
        resource_id=str(company.id),
    )

    return {
        "company_id": updated_company.id,
        "is_active": updated_company.is_active,
        "message": "Company activated successfully",
    }

@router.post("/companies/{company_id}/disable-agents")
def disable_company_agents(
    company_id: int,
    db: Session = Depends(get_db),
):
    company = (
        db.query(Company)
        .filter(Company.id == company_id)
        .first()
    )

    if not company:
        raise HTTPException(
            status_code=404,
            detail="Company not found",
        )

    CompanyControlService.disable_all_agents(
        db=db,
        company=company,
    )
    AdminAuditService.log(
        db=db,
        action="COMPANY_AGENTS_DISABLED",
        resource_type="company",
        resource_id=str(company.id),
    )

    return {
        "company_id": company.id,
        "message": "All company agents suspended successfully",
    }

@router.post("/agents/{agent_id}/revoke-key")
def revoke_agent_key(
    agent_id: str,
    db: Session = Depends(get_db),
):
    revoked_key = APIKeyControlService.revoke_agent_key(
        db=db,
        agent_id=agent_id,
    )

    if not revoked_key:
        raise HTTPException(
            status_code=404,
            detail="Active API key not found for agent",
        )
    AdminAuditService.log(
        db=db,
        action="API_KEY_REVOKED",
        resource_type="api_key",
        resource_id=str(revoked_key.id),
    )
    return {
        "agent_id": agent_id,
        "key_prefix": revoked_key.key_prefix,
        "status": "revoked",
        "message": "API key revoked successfully",
    }

@router.post("/agents/{agent_id}/rotate-key")
def rotate_agent_key(
    agent_id: str,
    db: Session = Depends(get_db),
):
    result = APIKeyControlService.rotate_agent_key(
        db=db,
        agent_id=agent_id,
    )

    if not result:
        raise HTTPException(
            status_code=404,
            detail="Active API key not found for agent",
        )

    new_key, raw_key = result
    AdminAuditService.log(
        db=db,
        action="API_KEY_ROTATED",
        resource_type="api_key",
        resource_id=str(new_key.id),
    )   

    return {
        "agent_id": agent_id,
        "key_id": new_key.id,
        "key_prefix": new_key.key_prefix,
        "api_key": raw_key,
        "status": "active",
        "message": (
            "API key rotated successfully. "
            "Store the new API key securely."
        ),
    }

@router.get("/system/status")
def get_system_status(
    db: Session = Depends(get_db),
):
    state = (
        SystemStateControlService.get_or_create(
            db
        )
    )

    return {
        "mode": state.mode,
        "updated_at": state.updated_at,
    }

@router.put("/system/mode")
def update_system_mode(
    mode: str,
    db: Session = Depends(get_db),
):
    try:
        state = (
            SystemStateControlService.set_mode(
                db=db,
                mode=mode.lower(),
            )
        )

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error),
        )
    AdminAuditService.log(
        db=db,
        action="SYSTEM_MODE_CHANGED",
        resource_type="system",
        resource_id=str(state.id),
        extra_data={
            "new_mode": state.mode,
        },
    )

    return {
        "mode": state.mode,
        "updated_at": state.updated_at,
        "message": (
            "System security mode updated successfully"
        ),
    }

@router.get("/audit-logs")
def get_audit_logs(
    db: Session = Depends(get_db),
):
    return (
        db.query(AdminAuditLog)
        .order_by(
            AdminAuditLog.created_at.desc()
        )
        .limit(200)
        .all()
    )

@router.get("/policy")
def get_global_policy(
    db: Session = Depends(get_db),
):
    policy = get_or_create_global_policy(db)

    return {
        "id": policy.id,
        "name": policy.name,
        "review_threshold": policy.review_threshold,
        "block_threshold": policy.block_threshold,
        "quarantine_threshold": policy.quarantine_threshold,
        "max_chain_risk": policy.max_chain_risk,
        "auto_quarantine": policy.auto_quarantine,
    }

@router.put("/policy")
def update_global_policy_endpoint(
    review_threshold: int | None = None,
    block_threshold: int | None = None,
    quarantine_threshold: int | None = None,
    max_chain_risk: int | None = None,
    auto_quarantine: bool | None = None,
    db: Session = Depends(get_db),
):
    policy = get_or_create_global_policy(db)

    updates = {
        "review_threshold": review_threshold,
        "block_threshold": block_threshold,
        "quarantine_threshold": quarantine_threshold,
        "max_chain_risk": max_chain_risk,
        "auto_quarantine": auto_quarantine,
    }

    updates = {
        key: value
        for key, value in updates.items()
        if value is not None
    }

    updated_policy = update_global_policy(
        db=db,
        policy=policy,
        updates=updates,
    )

    return {
        "message": "Global security policy updated successfully",
        "policy": {
            "review_threshold": updated_policy.review_threshold,
            "block_threshold": updated_policy.block_threshold,
            "quarantine_threshold": updated_policy.quarantine_threshold,
            "max_chain_risk": updated_policy.max_chain_risk,
            "auto_quarantine": updated_policy.auto_quarantine,
        },
    }