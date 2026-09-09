import csv
import io
import uuid
from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from app import crud, models, schemas
from app.api import deps

router = APIRouter()

@router.get("/", response_model=List[schemas.Contact])
async def read_contacts(
    db: AsyncSession = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    status: Optional[str] = None,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Retrieve contacts with optional search query and subscription status filtering.
    """
    contacts = await crud.contact.get_multi_by_user(
        db, user_id=current_user.id, skip=skip, limit=limit, search=search, status=status
    )
    return contacts

@router.post("/", response_model=schemas.Contact, status_code=status.HTTP_201_CREATED)
async def create_contact(
    *,
    db: AsyncSession = Depends(deps.get_db),
    contact_in: schemas.ContactCreate,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Create new contact.
    """
    existing = await crud.contact.get_by_email_and_user(
        db, email=contact_in.email, user_id=current_user.id
    )
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"Contact with email '{contact_in.email}' already exists.",
        )
    contact = await crud.contact.create_with_user(
        db, obj_in=contact_in, user_id=current_user.id
    )
    return contact

@router.get("/{id}", response_model=schemas.Contact)
async def get_contact(
    *,
    db: AsyncSession = Depends(deps.get_db),
    id: uuid.UUID,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get contact by ID.
    """
    contact = await crud.contact.get_by_user_and_id(db, user_id=current_user.id, id=id)
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    return contact

@router.put("/{id}", response_model=schemas.Contact)
async def update_contact(
    *,
    db: AsyncSession = Depends(deps.get_db),
    id: uuid.UUID,
    contact_in: schemas.ContactUpdate,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Update contact details.
    """
    contact = await crud.contact.get_by_user_and_id(db, user_id=current_user.id, id=id)
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    contact = await crud.contact.update(db, db_obj=contact, obj_in=contact_in)
    return contact

@router.delete("/{id}", response_model=schemas.Contact)
async def delete_contact(
    *,
    db: AsyncSession = Depends(deps.get_db),
    id: uuid.UUID,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Delete a contact.
    """
    contact = await crud.contact.get_by_user_and_id(db, user_id=current_user.id, id=id)
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    await crud.contact.remove(db, id=id)
    return contact

@router.post("/import-csv", response_model=schemas.ContactBulkImportResponse)
async def import_contacts_csv(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Bulk import contacts from an uploaded CSV file.
    Expected headers: email (required), first_name, last_name, attributes (optional).
    """
    content = await file.read()
    try:
        decoded = content.decode("utf-8-sig")
    except UnicodeDecodeError:
        decoded = content.decode("latin-1")

    reader = csv.DictReader(io.StringIO(decoded))
    contacts_to_create: List[schemas.ContactCreate] = []
    errors: List[str] = []
    row_index = 1

    for row in reader:
        row_index += 1
        # Normalize header keys
        cleaned_row = {k.strip().lower(): v.strip() for k, v in row.items() if k}
        email = cleaned_row.get("email")
        if not email or "@" not in email:
            errors.append(f"Row {row_index}: Invalid or missing email address '{email}'")
            continue

        first_name = cleaned_row.get("first_name") or cleaned_row.get("firstname") or cleaned_row.get("name")
        last_name = cleaned_row.get("last_name") or cleaned_row.get("lastname")
        contacts_to_create.append(
            schemas.ContactCreate(
                email=email,
                first_name=first_name,
                last_name=last_name,
                attributes=cleaned_row,
                is_subscribed=True,
            )
        )

    imported, skipped = await crud.contact.bulk_import(
        db, contacts_in=contacts_to_create, user_id=current_user.id
    )

    return schemas.ContactBulkImportResponse(
        total_parsed=len(contacts_to_create) + len(errors),
        imported=imported,
        skipped_duplicates=skipped,
        errors=errors[:10],
    )
