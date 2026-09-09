import asyncio
from httpx import AsyncClient, ASGITransport
from app.main import app

async def main():
    print("Starting End-to-End Live PostgreSQL Verification...")
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://127.0.0.1:8000") as client:
        # 1. Signup
        user_email = f"e2e_user_{asyncio.get_event_loop().time()}@example.com"
        signup_res = await client.post("/api/v1/auth/signup", json={
            "email": user_email,
            "password": "Password123!",
            "full_name": "E2E Test User"
        })
        print(f"Signup: {signup_res.status_code}")
        assert signup_res.status_code == 200, signup_res.text
        user_data = signup_res.json()
        print(f"  User ID: {user_data['id']}")

        # 2. Login
        login_res = await client.post("/api/v1/auth/login", data={
            "username": user_email,
            "password": "Password123!"
        })
        print(f"Login: {login_res.status_code}")
        assert login_res.status_code == 200, login_res.text
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 3. Check Auto-provisioned Organization
        orgs_res = await client.get("/api/v1/organizations/", headers=headers)
        print(f"Get Organizations: {orgs_res.status_code}")
        assert orgs_res.status_code == 200, orgs_res.text
        orgs = orgs_res.json()
        assert len(orgs) > 0, "No auto-provisioned organization found!"
        org_id = orgs[0]["id"]
        print(f"  Auto-provisioned Org Name: {orgs[0]['name']} (Role: {orgs[0]['role']})")

        # 4. Check Subscription
        sub_res = await client.get(f"/api/v1/billing/{org_id}", headers=headers)
        print(f"Get Subscription: {sub_res.status_code}")
        assert sub_res.status_code == 200
        sub_data = sub_res.json()
        print(f"  Subscription Tier: {sub_data['tier']}, Link Limit: {sub_data['limits']['max_links']}")

        # 5. Create Link with Custom Slug
        slug = f"e2e-{int(asyncio.get_event_loop().time())}"
        link_res = await client.post("/api/v1/links/", headers=headers, json={
            "original_url": "https://example.com/target-destination",
            "custom_slug": slug,
            "password": "secretpassword",
            "organization_id": org_id
        })
        print(f"Create Link: {link_res.status_code}")
        assert link_res.status_code == 200, link_res.text
        link_data = link_res.json()
        print(f"  Short link created: /{link_data['custom_slug']}")

        # 6. Test Password Protected Redirection
        redir_res = await client.get(f"/{slug}", follow_redirects=False)
        print(f"Redirect protected link status: {redir_res.status_code}")
        assert redir_res.status_code in [302, 307]
        assert f"/p/{slug}" in redir_res.headers["location"]
        print(f"  Correctly forwarded to password gateway: {redir_res.headers['location']}")

        # 7. Test Unlock Link
        unlock_res = await client.post(f"/{slug}/unlock", json={"password": "secretpassword"})
        print(f"Unlock link status: {unlock_res.status_code}")
        assert unlock_res.status_code == 200
        assert unlock_res.json()["destination"] == "https://example.com/target-destination"
        print(f"  Successfully unlocked! Destination: {unlock_res.json()['destination']}")

        # 8. Create and list campaigns
        camp_res = await client.post("/api/v1/campaigns/bulk", headers=headers, json={
            "organization_id": org_id,
            "folder_name": "E2E Promo Campaign",
            "original_urls": ["https://example.com/item1", "https://example.com/item2"],
            "utm": {"utm_source": "e2e", "utm_campaign": "promo"}
        })
        print(f"Campaign Bulk Creation: {camp_res.status_code}")
        assert camp_res.status_code == 200
        print(f"  Generated {camp_res.json()['links_generated']} links in folder {camp_res.json()['campaign_folder']}")

        list_camps = await client.get(f"/api/v1/campaigns/?organization_id={org_id}", headers=headers)
        print(f"List Campaigns: {list_camps.status_code}")
        assert list_camps.status_code == 200
        print(f"  Found {len(list_camps.json())} campaign folder(s)")

        # 9. Test API Key Generation and Hybrid Authentication
        key_res = await client.post("/api/v1/api-keys/", headers=headers, json={
            "name": "E2E Script Key",
            "organization_id": org_id,
            "is_production": True
        })
        print(f"Generate API Key: {key_res.status_code}")
        assert key_res.status_code == 200
        raw_key = key_res.json()["raw_key"]
        print(f"  API Key generated: {raw_key[:12]}...")

        # Create link using X-API-Key header (programmatic access)
        api_link_res = await client.post("/api/v1/links/", headers={"X-API-Key": raw_key}, json={
            "original_url": "https://example.com/via-api-key",
            "organization_id": org_id
        })
        print(f"Create Link via X-API-Key: {api_link_res.status_code}")
        assert api_link_res.status_code == 200
        print(f"  Programmatically created link: /{api_link_res.json()['short_code']}")

        print("\nALL END-TO-END VERIFICATION CHECKS PASSED WITH ZERO ERRORS!")

if __name__ == "__main__":
    asyncio.run(main())
