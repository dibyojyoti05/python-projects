import pytest
from httpx import AsyncClient
import uuid
from app.models.organization import Organization, OrganizationUser
from app.models.subscription import Subscription
from app.models.link import Link

@pytest.mark.anyio
async def test_create_link_unauthorized(async_client: AsyncClient):
    """
    Test creating a link without organizational access.
    Should return 403 because the mock user isn't part of the org.
    """
    mock_org_id = str(uuid.uuid4())
    
    response = await async_client.post(
        "/api/v1/links/",
        json={
            "original_url": "https://example.com/test",
            "organization_id": mock_org_id
        }
    )
    
    assert response.status_code == 403
    assert "authorized" in response.json()["detail"].lower()

@pytest.mark.anyio
async def test_create_link_success_and_delete(async_client: AsyncClient, db_session, mock_user):
    """
    Test creating a link when user is owner of organization, verifying click count, and deleting it.
    """
    org = Organization(name="Test Org", slug=f"test-org-{uuid.uuid4().hex[:6]}")
    db_session.add(org)
    await db_session.commit()
    await db_session.refresh(org)

    org_user = OrganizationUser(user_id=mock_user.id, organization_id=org.id, role="owner")
    sub = Subscription(organization_id=org.id, tier="free")
    db_session.add_all([org_user, sub])
    await db_session.commit()

    # 1. Create Link
    create_res = await async_client.post(
        "/api/v1/links/",
        json={
            "original_url": "https://google.com",
            "custom_slug": f"my-slug-{uuid.uuid4().hex[:4]}",
            "organization_id": str(org.id)
        }
    )
    assert create_res.status_code == 200
    link_data = create_res.json()
    assert link_data["original_url"] == "https://google.com"
    assert link_data["custom_slug"].startswith("my-slug-")

    # 2. Read Links
    get_res = await async_client.get(f"/api/v1/links/?organization_id={org.id}")
    assert get_res.status_code == 200
    links = get_res.json()
    assert len(links) >= 1
    assert links[0]["click_count"] == 0

    # 3. Delete Link
    del_res = await async_client.delete(f"/api/v1/links/{link_data['id']}")
    assert del_res.status_code == 200
    assert del_res.json()["status"] == "deleted"

@pytest.mark.anyio
async def test_qr_generation(async_client: AsyncClient, db_session):
    """
    Test QR code generation API returns valid SVG XML.
    """
    org = Organization(name="QR Org", slug=f"qr-org-{uuid.uuid4().hex[:6]}")
    db_session.add(org)
    await db_session.commit()
    await db_session.refresh(org)

    link = Link(organization_id=org.id, original_url="https://example.com", short_code=f"qr{uuid.uuid4().hex[:4]}")
    db_session.add(link)
    await db_session.commit()
    await db_session.refresh(link)

    response = await async_client.post(
        f"/api/v1/qr/generate/{link.id}",
        data={"format": "svg"}
    )
    
    assert response.status_code == 200
    assert response.headers["content-type"] == "image/svg+xml"
    assert b"<svg" in response.content

@pytest.mark.anyio
async def test_organization_member_management(async_client: AsyncClient, db_session, mock_user):
    """
    Test adding and removing members in an organization.
    """
    org = Organization(name="Team Org", slug=f"team-org-{uuid.uuid4().hex[:6]}")
    db_session.add(org)
    await db_session.commit()
    await db_session.refresh(org)

    org_user = OrganizationUser(user_id=mock_user.id, organization_id=org.id, role="owner")
    db_session.add(org_user)
    await db_session.commit()

    # Invite new member
    invite_res = await async_client.post(
        f"/api/v1/organizations/{org.id}/members",
        json={"email": "colleague@company.com", "role": "member"}
    )
    assert invite_res.status_code == 200
    invited_data = invite_res.json()
    assert invited_data["email"] == "colleague@company.com"

    # List members
    list_res = await async_client.get(f"/api/v1/organizations/{org.id}/members")
    assert list_res.status_code == 200
    members = list_res.json()
    assert len(members) == 2

    # Remove member
    remove_res = await async_client.delete(f"/api/v1/organizations/{org.id}/members/{invited_data['user_id']}")
    assert remove_res.status_code == 200
    assert remove_res.json()["status"] == "removed"

@pytest.mark.anyio
async def test_campaigns_bulk_and_list(async_client: AsyncClient, db_session, mock_user):
    """
    Test creating a campaign in bulk and retrieving campaign listings.
    """
    org = Organization(name="Campaign Org", slug=f"campaign-org-{uuid.uuid4().hex[:6]}")
    db_session.add(org)
    await db_session.commit()
    await db_session.refresh(org)

    org_user = OrganizationUser(user_id=mock_user.id, organization_id=org.id, role="owner")
    db_session.add(org_user)
    await db_session.commit()

    # Bulk create
    bulk_res = await async_client.post(
        "/api/v1/campaigns/bulk",
        json={
            "organization_id": str(org.id),
            "folder_name": "Summer Launch",
            "original_urls": ["https://example.com/product1", "https://example.com/product2"],
            "utm": {"utm_source": "newsletter", "utm_campaign": "summer"}
        }
    )
    assert bulk_res.status_code == 200
    bulk_data = bulk_res.json()
    assert bulk_data["links_generated"] == 2

    # List campaigns
    camp_res = await async_client.get(f"/api/v1/campaigns/?organization_id={org.id}")
    assert camp_res.status_code == 200
    campaigns = camp_res.json()
    assert len(campaigns) >= 1
    assert campaigns[0]["name"] == "Summer Launch"
    assert campaigns[0]["link_count"] == 2
