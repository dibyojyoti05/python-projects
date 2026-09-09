import asyncio
import uuid
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import select
import app.db.base  # Register all models with SQLAlchemy Base metadata
from app.core.config import settings
from app.core.security import get_password_hash
from app.models.user import User, UserRole
from app.models.organization import Organization, OrganizationMember
from app.models.campaign import Campaign
from app.models.qr_code import QRCode, QRCodeType
from app.models.scan import Scan

async def seed():
    engine = create_async_engine(settings.async_database_uri)
    Session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with Session() as session:
        # Check if default organization exists
        stmt = select(Organization).where(Organization.name == "Default Organization")
        result = await session.execute(stmt)
        org = result.scalar_one_or_none()
        
        if not org:
            org = Organization(
                id=uuid.uuid4(),
                name="Default Organization",
                billing_email="admin@example.com"
            )
            session.add(org)
            await session.commit()
            await session.refresh(org)
            print(f"Created organization: {org.name} (ID: {org.id})")
        else:
            print(f"Organization exists: {org.name} (ID: {org.id})")
            
        # Check if default admin exists
        stmt = select(User).where(User.email == "admin@example.com")
        result = await session.execute(stmt)
        user = result.scalar_one_or_none()
        
        if not user:
            user = User(
                id=uuid.uuid4(),
                email="admin@example.com",
                hashed_password=get_password_hash("admin123"),
                full_name="System Admin",
                role=UserRole.ADMIN,
                is_active=True
            )
            session.add(user)
            await session.commit()
            await session.refresh(user)
            print(f"Created admin user: {user.email} / admin123")
            
            # Add to organization
            membership = OrganizationMember(
                organization_id=org.id,
                user_id=user.id,
                role=UserRole.ADMIN
            )
            session.add(membership)
            await session.commit()
            print("Associated admin with default organization.")
        else:
            print(f"Admin user exists: {user.email}")
            
        # Check if sample campaign exists
        stmt = select(Campaign).where(Campaign.name == "Global Summer Launch")
        result = await session.execute(stmt)
        campaign = result.scalar_one_or_none()
        if not campaign:
            campaign = Campaign(
                id=uuid.uuid4(),
                organization_id=org.id,
                name="Global Summer Launch",
                description="Promotional dynamic QR campaign for summer outreach"
            )
            session.add(campaign)
            await session.commit()
            await session.refresh(campaign)
            print(f"Created sample campaign: {campaign.name}")
            
        # Check if sample QR code exists
        stmt = select(QRCode).where(QRCode.short_code == "demo123")
        result = await session.execute(stmt)
        qr = result.scalar_one_or_none()
        if not qr:
            qr = QRCode(
                id=uuid.uuid4(),
                organization_id=org.id,
                campaign_id=campaign.id,
                name="Official Website",
                is_dynamic=True,
                qr_type=QRCodeType.URL,
                destination_url="https://github.com",
                short_code="demo123",
                customization={"color": "#1e293b", "bg_color": "#ffffff", "scale": 10},
                image_url="/api/v1/qr/image/demo123"
            )
            session.add(qr)
            await session.commit()
            print(f"Created demo dynamic QR code: short code 'demo123' -> https://github.com")

    await engine.dispose()
    print("Database seeding completed successfully!")

if __name__ == "__main__":
    asyncio.run(seed())
