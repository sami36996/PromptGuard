"""Initialize database with default data."""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import init_db, SessionLocal
from app.core.config import get_settings
from app.core.security import hash_password
from app.models.user import User
from app.models.company import Company
from app.models.membership import Membership, MembershipRole
from app.models.security_policy import SecurityPolicy

settings = get_settings()

def seed():
    init_db()
    db = SessionLocal()
    
    try:
        # Create super admin
        admin = db.query(User).filter(User.email == settings.SUPER_ADMIN_EMAIL).first()
        if not admin:
            admin = User(
                email=settings.SUPER_ADMIN_EMAIL,
                hashed_password=hash_password(settings.SUPER_ADMIN_PASSWORD),
                full_name="Super Admin",
                is_super_admin=True,
                is_active=True
            )
            db.add(admin)
            db.commit()
            print(f"✅ Super admin created: {settings.SUPER_ADMIN_EMAIL}")
        else:
            print(f"ℹ️ Super admin already exists: {settings.SUPER_ADMIN_EMAIL}")
        
        # Create default company for admin
        company = db.query(Company).filter(Company.slug == "promptguard").first()
        if not company:
            company = Company(
                name="PromptGuard",
                slug="promptguard",
                plan="enterprise",
                is_active=True
            )
            db.add(company)
            db.commit()
            
            membership = Membership(
                user_id=admin.id,
                company_id=company.id,
                role=MembershipRole.OWNER
            )
            db.add(membership)
            db.commit()
            print("✅ Default company created")
        
        # Create default policy
        policy = db.query(SecurityPolicy).filter(
            SecurityPolicy.company_id == company.id,
            SecurityPolicy.is_default == True
        ).first()
        if not policy:
            policy = SecurityPolicy(
                company_id=company.id,
                name="Default Policy",
                description="Default security policy",
                is_default=True,
                threshold=70.0,
                action_block=True,
                action_sanitize=False,
                action_alert=True,
                action_log=True,
                detector_config={
                    "prompt_injection": True,
                    "xss": True,
                    "sqli": True,
                    "secrets": True,
                    "os_command": True,
                    "reverse_shell": True,
                    "encoding": True,
                    "obfuscation": True,
                    "file": True,
                    "image": True
                }
            )
            db.add(policy)
            db.commit()
            print("✅ Default security policy created")
        
        print("\n🚀 Database initialized successfully!")
        print(f"   Login: {settings.SUPER_ADMIN_EMAIL}")
        print(f"   Password: {settings.SUPER_ADMIN_PASSWORD}")
        
    finally:
        db.close()

if __name__ == "__main__":
    seed()