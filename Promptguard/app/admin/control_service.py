from enum import Enum
from sqlalchemy.orm import Session
from app.models.company import Company
from app.core.api_keys import generate_api_key, hash_api_key
from app.models.api_key import AgentAPIKey
from app.models.agent_registry import Agent
from app.models.system_state import SystemState
class AgentStatus(str, Enum):
    ACTIVE = "active"
    SUSPENDED = "suspended"
    QUARANTINED = "quarantined"
    REVOKED = "revoked"



class AgentControlService:

    @staticmethod
    def change_status(
        db: Session,
        agent: Agent,
        status: AgentStatus,
    ) -> Agent:

        agent.status = status.value

        db.add(agent)
        db.commit()
        db.refresh(agent)

        return agent

    @staticmethod
    def suspend(
        db: Session,
        agent: Agent,
    ) -> Agent:

        return AgentControlService.change_status(
            db=db,
            agent=agent,
            status=AgentStatus.SUSPENDED,
        )

    @staticmethod
    def activate(
        db: Session,
        agent: Agent,
    ) -> Agent:

        return AgentControlService.change_status(
            db=db,
            agent=agent,
            status=AgentStatus.ACTIVE,
        )

    @staticmethod
    def quarantine(
        db: Session,
        agent: Agent,
    ) -> Agent:

        return AgentControlService.change_status(
            db=db,
            agent=agent,
            status=AgentStatus.QUARANTINED,
        )

    @staticmethod
    def revoke(
        db: Session,
        agent: Agent,
    ) -> Agent:

        return AgentControlService.change_status(
            db=db,
            agent=agent,
            status=AgentStatus.REVOKED,
        )
class CompanyControlService:

    @staticmethod
    def suspend(
        db: Session,
        company: Company,
    ) -> Company:

        company.is_active = False

        db.query(Agent).filter(
            Agent.company_id == company.id
        ).update(
            {
                Agent.status: "suspended"
            },
            synchronize_session=False,
        )

        db.add(company)
        db.commit()
        db.refresh(company)

        return company

    @staticmethod
    def activate(
        db: Session,
        company: Company,
    ) -> Company:

        company.is_active = True

        db.add(company)
        db.commit()
        db.refresh(company)

        return company

    @staticmethod
    def disable_all_agents(
        db: Session,
        company: Company,
    ) -> Company:

        db.query(Agent).filter(
            Agent.company_id == company.id
        ).update(
            {
                Agent.status: "suspended"
            },
            synchronize_session=False,
        )

        db.commit()
        db.refresh(company)

        return company

class APIKeyControlService:

    @staticmethod
    def revoke_agent_key(
        db: Session,
        agent_id: str,
    ) -> AgentAPIKey | None:

        key = (
            db.query(AgentAPIKey)
            .filter(
                AgentAPIKey.agent_id == agent_id,
                AgentAPIKey.is_active == True,
            )
            .first()
        )

        if not key:
            return None

        key.is_active = False

        db.commit()
        db.refresh(key)

        return key

    @staticmethod
    def rotate_agent_key(
        db: Session,
        agent_id: str,
    ) -> tuple[AgentAPIKey, str] | None:

        old_key = (
            db.query(AgentAPIKey)
            .filter(
                AgentAPIKey.agent_id == agent_id,
                AgentAPIKey.is_active == True,
            )
            .first()
        )

        if not old_key:
            return None

        old_key.is_active = False

        raw_key = generate_api_key()
        key_hash = hash_api_key(raw_key)

        new_key = AgentAPIKey(
            company_id=old_key.company_id,
            agent_id=old_key.agent_id,
            name=old_key.name,
            key_hash=key_hash,
            key_prefix=raw_key[:12],
            permissions=old_key.permissions,
            rate_limit=old_key.rate_limit,
            is_active=True,
            expires_at=old_key.expires_at,
        )

        db.add(new_key)
        db.commit()
        db.refresh(new_key)

        return new_key, raw_key

class SystemStateControlService:

    ALLOWED_MODES = {
        "normal",
        "elevated",
        "emergency",
    }

    @staticmethod
    def get_or_create(
        db: Session,
    ) -> SystemState:

        state = (
            db.query(SystemState)
            .order_by(SystemState.id.asc())
            .first()
        )

        if not state:
            state = SystemState(
                mode="normal",
            )

            db.add(state)
            db.commit()
            db.refresh(state)

        return state

    @staticmethod
    def set_mode(
        db: Session,
        mode: str,
    ) -> SystemState:

        if mode not in (
            SystemStateControlService.ALLOWED_MODES
        ):
            raise ValueError(
                "Invalid system security mode"
            )

        state = (
            SystemStateControlService.get_or_create(
                db
            )
        )

        state.mode = mode

        db.commit()
        db.refresh(state)

        return state