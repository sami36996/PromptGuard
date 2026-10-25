from sqlalchemy.orm import Session

from app.models.admin_audit_log import AdminAuditLog


class AdminAuditService:

    @staticmethod
    def log(
        db: Session,
        action: str,
        resource_type: str,
        resource_id: str | None = None,
        admin_id: int | None = None,
        reason: str | None = None,
        extra_data: dict | None = None,
        ip_address: str | None = None,
    ) -> AdminAuditLog:

        audit_log = AdminAuditLog(
            admin_id=admin_id,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            reason=reason,
            extra_data=extra_data,
            ip_address=ip_address,
        )

        db.add(audit_log)
        db.commit()
        db.refresh(audit_log)

        return audit_log