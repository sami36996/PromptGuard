from datetime import datetime
import asyncio
import uuid

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
)
from fastapi.security import HTTPAuthorizationCredentials

from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import (
    SessionLocal,
    get_db,
)

from app.core.dependencies import (
    get_current_user,
    get_current_agent,
    security,
)
from app.core.security import decode_access_token

from app.core.policy import get_policy

from app.core.api_keys import (
    generate_api_key,
    hash_api_key,
)

from app.core.security import (
    analyze_prompt,
    update_trust,
    compute_chain_risk,
)

from app.core.websocket import manager

from app.models.agent import AgentMessage
from app.models.agent_graph import AgentEdge
from app.models.agent_registry import Agent
from app.models.api_key import AgentAPIKey
from app.models.log import PromptLog
from app.models.membership import Membership
from app.models.user import User
from app.models.company import Company
from app.services.company_policy_service import (
    apply_company_policy,
    get_or_create_company_policy,
)
router = APIRouter(
    prefix="/agents",
    tags=["Agents"],
)


# ============================================================
# SCHEMAS
# ============================================================

class AgentRegister(BaseModel):
    agent_name: str
    agent_type: str
    organization: str
    description: str


def get_a2a_principal(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
):
    if credentials is None:
        raise HTTPException(status_code=401, detail="Not authenticated")

    payload = decode_access_token(credentials.credentials)
    if payload and payload.get("sub"):
        user = db.query(User).filter(
            User.id == int(payload["sub"]),
            User.is_active.is_(True),
        ).first()
        if user:
            return user

    return get_current_agent(credentials)


# ============================================================
# AGENT-TO-AGENT COMMUNICATION
# ============================================================

@router.post("/a2a")
def agent_to_agent(
    msg: AgentMessage,
    principal=Depends(get_a2a_principal),
):
    db = SessionLocal()

    try:
        policy = get_policy(db)

        # ----------------------------------------------------
        # Analyze message
        # ----------------------------------------------------

        analysis = analyze_prompt(msg.message)
        company_policy = None

        # ----------------------------------------------------
        # Chain initialization
        # ----------------------------------------------------

        chain_id = str(uuid.uuid4())
        hop = 1
        previous_chain_risk = 0

        # ----------------------------------------------------
        # Origin agent
        # ----------------------------------------------------

        if isinstance(principal, User):
            membership = db.query(Membership).filter(
                Membership.user_id == principal.id
            ).first()
            if not membership:
                raise HTTPException(
                    status_code=403,
                    detail="User is not associated with a company",
                )
            agent_query = db.query(Agent).filter(
                Agent.company_id == membership.company_id
            )
            if msg.origin_agent:
                agent_query = agent_query.filter(
                    Agent.agent_id == msg.origin_agent
                )
            current_agent = agent_query.first()
            if not current_agent:
                raise HTTPException(
                    status_code=404,
                    detail="Origin agent not found",
                )
        else:
            current_agent = principal

        origin = msg.origin_agent or current_agent.agent_id
        if current_agent.status in {"suspended", "revoked"}:
            raise HTTPException(
                status_code=403,
                detail=f"Origin agent is {current_agent.status}",
            )
        target_agent = db.query(Agent).filter(
            Agent.agent_id == msg.to_agent,
            Agent.company_id == current_agent.company_id,
        ).first()
        if not target_agent:
            raise HTTPException(
                status_code=404,
                detail="Target agent not found",
            )

        # ----------------------------------------------------
        # Compute chain risk
        # ----------------------------------------------------

        company_policy = get_or_create_company_policy(
            db,
            current_agent.company_id,
        )
        chain_limit = (
            company_policy.max_chain_risk
            if company_policy is not None
            else policy.max_chain_risk
        )
        chain_risk = compute_chain_risk(
            analysis["score"],
            previous_chain_risk,
            chain_limit,
        )

        # ----------------------------------------------------
        # Get sending agent
        # ----------------------------------------------------

        agent = (
            db.query(Agent)
            .filter(
                Agent.agent_id == current_agent.agent_id
            )
            .first()
        )

        if not agent:
            raise HTTPException(
                status_code=404,
                detail="Sending agent not found",
            )

        # ----------------------------------------------------
        # Update agent activity
        # ----------------------------------------------------

        agent.total_messages += 1
        agent.last_seen = datetime.utcnow()

        # ----------------------------------------------------
        # Quarantine check
        # ----------------------------------------------------

        if agent.status == "quarantined":

            return {
                "status": "blocked",
                "reason": "agent_quarantined",
            }

        # ----------------------------------------------------
        # Update trust
        # ----------------------------------------------------

        agent.trust_score = update_trust(
            analysis["breakdown"],
            agent.trust_score,
        )

        # ----------------------------------------------------
        # Final decision
        # ----------------------------------------------------

        if analysis["score"] >= policy.block_threshold:

            analysis["decision"] = "block"

        elif analysis["score"] >= policy.review_threshold:

            analysis["decision"] = "review"

        else:

            analysis["decision"] = "allow"

        analysis = apply_company_policy(
            analysis,
            company_policy,
            msg.message,
        )

        # ----------------------------------------------------
        # Save prompt log
        # ----------------------------------------------------

        log = PromptLog(
            prompt=(
                f"[A2A:{origin}] "
                f"{current_agent.agent_id} -> "
                f"{msg.to_agent}: "
                f"{msg.message}"
            ),
            score=chain_risk,
            decision=analysis["decision"],
            findings=",".join(
                analysis.get("findings", [])
            ),
        )

        # ----------------------------------------------------
        # Save graph edge
        # ----------------------------------------------------

        edge = AgentEdge(
            chain_id=chain_id,
            hop_index=hop,
            from_agent=current_agent.agent_id,
            to_agent=msg.to_agent,
            score=analysis["score"],
            chain_risk=chain_risk,
            decision=analysis["decision"],
            message_type="a2a",
        )

        db.add(log)
        db.add(edge)

        db.commit()

        # ----------------------------------------------------
        # Broadcast normal event
        # ----------------------------------------------------

        event = {
            "type": "agent_message",
            "from_agent": current_agent.agent_id,
            "to_agent": msg.to_agent,
            "decision": analysis["decision"],
            "risk": analysis["score"],
            "chain_risk": chain_risk,
            "trust": agent.trust_score,
            "chain_id": chain_id,
        }

        try:

            loop = asyncio.get_running_loop()

            loop.create_task(
                manager.broadcast(event)
            )

        except RuntimeError:

            asyncio.run(
                manager.broadcast(event)
            )

        # ----------------------------------------------------
        # Block dangerous message
        # ----------------------------------------------------

        if analysis["decision"] == "block":

            agent.blocked_messages += 1

            db.commit()

            blocked_event = {
                "type": "prompt_blocked",
                "agent": current_agent.agent_id,
                "risk": analysis["score"],
                "prompt": msg.message,
            }

            try:

                loop = asyncio.get_running_loop()

                loop.create_task(
                    manager.broadcast(blocked_event)
                )

            except RuntimeError:

                asyncio.run(
                    manager.broadcast(blocked_event)
                )

            return {
                "status": "blocked",
                "reason": "prompt_risk",
                "analysis": analysis,
                "chain_id": chain_id,
            }

        # ----------------------------------------------------
        # Quarantine agent
        # ----------------------------------------------------

        if (
            agent.trust_score
            < policy.quarantine_threshold
        ):

            agent.status = "quarantined"

            db.commit()

            quarantine_event = {
                "type": "agent_quarantined",
                "agent": agent.agent_id,
                "trust": agent.trust_score,
            }

            try:

                loop = asyncio.get_running_loop()

                loop.create_task(
                    manager.broadcast(
                        quarantine_event
                    )
                )

            except RuntimeError:

                asyncio.run(
                    manager.broadcast(
                        quarantine_event
                    )
                )

            return {
                "status": "blocked",
                "reason": "agent_quarantined",
                "trust_score": agent.trust_score,
                "chain_id": chain_id,
            }

        # ----------------------------------------------------
        # Success
        # ----------------------------------------------------

        return {
            "status": "allowed",
            "analysis": analysis,
            "chain_id": chain_id,
            "hop": hop,
            "chain_risk": chain_risk,
            "trust_score": agent.trust_score,
            "forwarded": True,
        }

    except Exception:

        db.rollback()

        raise

    finally:

        db.close()


# ============================================================
# REGISTER AGENT
# ============================================================

@router.post("/register")
def register_agent(
    data: AgentRegister,
    current_user=Depends(get_current_user),
):
    db = SessionLocal()

    try:

        # ----------------------------------
        # Get user's company membership
        # ----------------------------------

        membership = (
            db.query(Membership)
            .filter(
                Membership.user_id == current_user.id
            )
            .first()
        )

        if membership:
            company_id = membership.company_id
        elif current_user.is_platform_admin:
            company = db.query(Company).filter(
                Company.name == data.organization
            ).first()
            if not company:
                raise HTTPException(
                    status_code=404,
                    detail="Organization does not match an existing company",
                )
            company_id = company.id
        else:
            raise HTTPException(
                status_code=400,
                detail="User is not associated with a company",
            )

        # ----------------------------------
        # Check duplicate agent
        # ----------------------------------

        existing = (
            db.query(Agent)
            .filter(
                Agent.agent_name == data.agent_name,
                Agent.company_id == company_id,
            )
            .first()
        )

        if existing:
            raise HTTPException(
                status_code=409,
                detail="Agent already exists",
            )

        # ----------------------------------
        # Create agent ID
        # ----------------------------------

        agent_id = str(uuid.uuid4())

        # ----------------------------------
        # Create agent
        # ----------------------------------

        agent = Agent(
            agent_id=agent_id,
            company_id=company_id,
            agent_name=data.agent_name,
            agent_type=data.agent_type,
            organization=data.organization,
            description=data.description,
            trust_score=100,
            status="active",
        )

        # ----------------------------------
        # Generate API key
        # ----------------------------------

        raw_api_key = generate_api_key()

        hashed_api_key = hash_api_key(
            raw_api_key
        )

        # ----------------------------------
        # Create API key record
        # ----------------------------------

        api = AgentAPIKey(
            company_id=company_id,
            agent_id=agent_id,
            name=f"{data.agent_name} API Key",
            key_hash=hashed_api_key,
            key_prefix=raw_api_key[:12],
            permissions=["guard:read"],
            rate_limit=1000,
            is_active=True,
        )

        # ----------------------------------
        # Save
        # ----------------------------------

        db.add(agent)
        db.add(api)

        db.commit()

        db.refresh(agent)

        return {
            "id": agent.id,
            "agent_id": agent.agent_id,
            "agent_name": agent.agent_name,
            "agent_type": agent.agent_type,
            "organization": agent.organization,
            "description": agent.description,
            "api_key": raw_api_key,
        }

    except HTTPException:
        db.rollback()
        raise

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()
# ============================================================
# LIST AGENTS
# ============================================================

@router.get("")
def list_agents(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    List agents belonging to the authenticated user's company.
    """

    # Get the user's company memberships
    memberships = current_user.memberships

    if not memberships:
        return []

    # For now, use the first company membership
    company_id = memberships[0].company_id

    agents = (
        db.query(Agent)
        .filter(Agent.company_id == company_id)
        .all()
    )

    result = []

    for agent in agents:
        result.append(
            {
                "id": agent.agent_id,
                "name": agent.agent_name,
                "status": agent.status.upper(),
                "trust": agent.trust_score,
                "risk": 100 - agent.trust_score,
                "messagesSent": agent.total_messages,
                "createdAt": agent.created_at,
            }
        )

    return result

# ============================================================
# GET AGENT
# ============================================================

@router.get("/{agent_id}")
def get_agent(
    agent_id: str,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    agent = (
        db.query(Agent)
        .filter(
            Agent.agent_id == agent_id,
            Agent.company_id == current_user.company_id,
        )
        .first()
    )

    if not agent:
        raise HTTPException(
            status_code=404,
            detail="Agent not found"
        )

    api = (
        db.query(AgentAPIKey)
        .filter(
            AgentAPIKey.agent_id == agent.agent_id
        )
        .first()
    )

    return {
        "id": agent.id,
        "agentId": agent.agent_id,
        "name": agent.agent_name,
        "type": agent.agent_type,
        "organization": agent.organization,
        "description": agent.description,
        "apiKey": api.key_prefix if api else None,
        "status": agent.status.upper(),
        "trust": agent.trust_score,
        "risk": 100 - agent.trust_score,
        "messagesSent": agent.total_messages,
        "messagesReceived": 0,
        "blocked": agent.blocked_messages,
        "registeredAt": agent.created_at,
        "lastSeen": agent.last_seen,
        "strikes": 0,
        "quarantineReason": None,
    }