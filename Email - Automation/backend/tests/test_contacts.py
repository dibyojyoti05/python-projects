import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_contacts_crud(client: AsyncClient, auth_headers: dict):
    # 1. Create a contact
    create_res = await client.post(
        "/api/v1/contacts/",
        json={
            "email": "sarah.connor@sky.net",
            "first_name": "Sarah",
            "last_name": "Connor",
            "attributes": {"tag": "VIP", "city": "LA"},
            "is_subscribed": True,
        },
        headers=auth_headers,
    )
    assert create_res.status_code == 201
    contact = create_res.json()
    assert contact["email"] == "sarah.connor@sky.net"
    contact_id = contact["id"]

    # 2. Get contact by ID
    get_res = await client.get(f"/api/v1/contacts/{contact_id}", headers=auth_headers)
    assert get_res.status_code == 200
    assert get_res.json()["first_name"] == "Sarah"

    # 3. List contacts
    list_res = await client.get("/api/v1/contacts/", headers=auth_headers)
    assert list_res.status_code == 200
    contacts_list = list_res.json()
    assert len(contacts_list) >= 1

    # 4. Search contacts
    search_res = await client.get("/api/v1/contacts/?search=Sarah", headers=auth_headers)
    assert search_res.status_code == 200
    assert len(search_res.json()) >= 1

    # 5. Update contact
    update_res = await client.put(
        f"/api/v1/contacts/{contact_id}",
        json={"first_name": "Sarah J."},
        headers=auth_headers,
    )
    assert update_res.status_code == 200
    assert update_res.json()["first_name"] == "Sarah J."

    # 6. Delete contact
    del_res = await client.delete(f"/api/v1/contacts/{contact_id}", headers=auth_headers)
    assert del_res.status_code == 200

@pytest.mark.asyncio
async def test_contacts_csv_import(client: AsyncClient, auth_headers: dict):
    csv_data = "email,first_name,last_name\nalice@example.com,Alice,Wonderland\nbob@example.com,Bob,Builder\n"
    files = {"file": ("contacts.csv", csv_data.encode("utf-8"), "text/csv")}

    import_res = await client.post(
        "/api/v1/contacts/import-csv",
        files=files,
        headers=auth_headers,
    )
    assert import_res.status_code == 200
    res_data = import_res.json()
    assert res_data["imported"] == 2
    assert res_data["skipped_duplicates"] == 0
