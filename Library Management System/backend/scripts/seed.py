import asyncio
import os
import sys
from datetime import datetime, timedelta, date

# Ensure backend path is in sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.future import select

from app.core.database import AsyncSessionLocal
from app.core.security import get_password_hash
from app.models.user import User, UserRole
from app.models.branch import Branch
from app.models.category import Category
from app.models.author import Author
from app.models.publisher import Publisher
from app.models.book import Book, BookCopy, CopyStatus
from app.models.member import Member, MembershipType
from app.models.circulation import Loan, LoanStatus
from app.models.financial import Fine, Payment, Reservation, FineStatus, ReservationStatus
from app.models.digital import DigitalResource, ResourceType
from app.models.audit import AuditLog

async def seed_data():
    async with AsyncSessionLocal() as session:
        # Check if already seeded
        res = await session.execute(select(User).where(User.email == "admin@library.com"))
        if res.scalars().first():
            print("Database already contains seed data. Skipping...")
            return

        print("Seeding Library Management System data...")

        # 1. Branches
        branches = [
            Branch(name="Central Main Library", address="100 University Ave, Metro City", contact_email="central@library.com", contact_phone="+1 (555) 019-2834"),
            Branch(name="Science & Technology Hub", address="204 Innovation Way, Tech Park", contact_email="sci-tech@library.com", contact_phone="+1 (555) 019-5821"),
            Branch(name="Westside Arts & Humanities", address="50 Quadrangle Circle, West End", contact_email="westside@library.com", contact_phone="+1 (555) 019-9942"),
        ]
        session.add_all(branches)
        await session.flush()

        # 2. Categories
        categories = [
            Category(name="Computer Science & AI", description="Software engineering, algorithms, AI, cloud"),
            Category(name="Classic Literature", description="Timeless literary classics and novels"),
            Category(name="Science & Physics", description="Astrophysics, biology, and natural sciences"),
            Category(name="History & Civilization", description="World history, archives, and archaeology"),
            Category(name="Philosophy & Ethics", description="Epistemology, ethics, and philosophical treatises"),
            Category(name="Business & Finance", description="Economics, management, and entrepreneurial strategy"),
            Category(name="Mystery & Detective", description="Suspense, crime investigations, and thriller fiction"),
            Category(name="Mathematics", description="Pure mathematics, logic, and statistical analysis"),
        ]
        session.add_all(categories)
        await session.flush()

        # 3. Authors
        authors = [
            Author(name="Robert C. Martin", biography="Author of Clean Code and prominent advocate of agile software craftsmanship."),
            Author(name="Martin Fowler", biography="Chief Scientist at ThoughtWorks, author of Refactoring and Patterns of Enterprise Application Architecture."),
            Author(name="George Orwell", biography="English novelist and essayist, author of 1984 and Animal Farm."),
            Author(name="Isaac Asimov", biography="Iconic writer and biochemistry professor, renowned for the Foundation saga."),
            Author(name="Arthur Conan Doyle", biography="British author who created the legendary detective Sherlock Holmes."),
            Author(name="Ada Lovelace", biography="Mathematician and computer pioneer known for her work on Charles Babbage's engine.")
        ]
        session.add_all(authors)
        await session.flush()

        # 4. Publishers
        publishers = [
            Publisher(name="Prentice Hall", description="Premier technical and computer science publisher."),
            Publisher(name="O'Reilly Media", description="Technology books, learning platforms, and conferences."),
            Publisher(name="Secker & Warburg", description="Renowned London publishing house."),
            Publisher(name="MIT Press", description="University press affiliated with Massachusetts Institute of Technology."),
            Publisher(name="Gnome Press", description="Historic science fiction publishing house.")
        ]
        session.add_all(publishers)
        await session.flush()

        # 5. Users
        users = [
            User(
                email="admin@library.com",
                hashed_password=get_password_hash("Admin@123"),
                full_name="Eleanor Vance (Chief Administrator)",
                role=UserRole.ADMIN,
                branch_id=branches[0].id,
                is_active=True
            ),
            User(
                email="librarian@library.com",
                hashed_password=get_password_hash("Librarian@123"),
                full_name="Marcus Holloway (Head Librarian)",
                role=UserRole.LIBRARIAN,
                branch_id=branches[0].id,
                is_active=True
            ),
            User(
                email="assistant@library.com",
                hashed_password=get_password_hash("Assistant@123"),
                full_name="Clara Oswald (Circulation Assistant)",
                role=UserRole.ASSISTANT,
                branch_id=branches[1].id,
                is_active=True
            ),
            User(
                email="john.doe@library.com",
                hashed_password=get_password_hash("Member@123"),
                full_name="John Doe",
                role=UserRole.MEMBER,
                branch_id=branches[0].id,
                is_active=True
            ),
            User(
                email="jane.smith@library.com",
                hashed_password=get_password_hash("Member@123"),
                full_name="Jane Smith",
                role=UserRole.MEMBER,
                branch_id=branches[0].id,
                is_active=True
            ),
            User(
                email="david.wilson@library.com",
                hashed_password=get_password_hash("Member@123"),
                full_name="David Wilson",
                role=UserRole.MEMBER,
                branch_id=branches[2].id,
                is_active=True
            ),
        ]
        session.add_all(users)
        await session.flush()

        # 6. Member Profiles
        today = date.today()
        members = [
            Member(
                user_id=users[3].id,
                member_barcode="LIB-MEM-1001",
                membership_type=MembershipType.STAFF,
                registration_date=today - timedelta(days=120),
                expiry_date=today + timedelta(days=245),
                status="active",
                borrowing_limit=10,
                phone="+1 (555) 234-5678",
                address="42 Elm Street, Metro City"
            ),
            Member(
                user_id=users[4].id,
                member_barcode="LIB-MEM-1002",
                membership_type=MembershipType.STUDENT,
                registration_date=today - timedelta(days=60),
                expiry_date=today + timedelta(days=305),
                status="active",
                borrowing_limit=5,
                phone="+1 (555) 345-6789",
                address="15 Oak Avenue, Metro City"
            ),
            Member(
                user_id=users[5].id,
                member_barcode="LIB-MEM-1003",
                membership_type=MembershipType.STANDARD,
                registration_date=today - timedelta(days=30),
                expiry_date=today + timedelta(days=335),
                status="active",
                borrowing_limit=3,
                phone="+1 (555) 456-7890",
                address="88 Pine Crescent, Metro City"
            )
        ]
        session.add_all(members)
        await session.flush()

        # 7. Books
        books = [
            Book(
                title="Clean Code",
                subtitle="A Handbook of Agile Software Craftsmanship",
                isbn10="0132350882",
                isbn13="9780132350884",
                description="Even bad code can function. But if code isn't clean, it can bring a development organization to its knees.",
                publisher_id=publishers[0].id,
                publication_date=date(2008, 8, 1),
                edition="1st Edition",
                language="English",
                pages=464,
                cover_image="https://images.unsplash.com/photo-1532012164546-f432f2e3777a?w=400&q=80",
                authors=[authors[0]],
                categories=[categories[0]]
            ),
            Book(
                title="Refactoring",
                subtitle="Improving the Design of Existing Code",
                isbn10="0201485672",
                isbn13="9780201485677",
                description="Refactoring is about improving the design of existing code. It is the process of changing a software system.",
                publisher_id=publishers[0].id,
                publication_date=date(2018, 11, 20),
                edition="2nd Edition",
                language="English",
                pages=448,
                cover_image="https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&q=80",
                authors=[authors[1]],
                categories=[categories[0]]
            ),
            Book(
                title="1984",
                subtitle="A Dystopian Masterpiece",
                isbn10="0451524934",
                isbn13="9780451524935",
                description="Winston Smith toes the Party line, rewriting history to satisfy the Ministry of Truth. With each lie he writes, he grows to hate the Party.",
                publisher_id=publishers[2].id,
                publication_date=date(1949, 6, 8),
                edition="Centennial Edition",
                language="English",
                pages=328,
                cover_image="https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400&q=80",
                authors=[authors[2]],
                categories=[categories[1]]
            ),
            Book(
                title="Foundation",
                subtitle="The Epic galactic saga",
                isbn10="0553293354",
                isbn13="9780553293357",
                description="For twelve thousand years the Galactic Empire has ruled supreme. Now it is dying. Only Hari Seldon can see the coming dark age.",
                publisher_id=publishers[4].id,
                publication_date=date(1951, 5, 1),
                edition="Classic Edition",
                language="English",
                pages=255,
                cover_image="https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&q=80",
                authors=[authors[3]],
                categories=[categories[1], categories[2]]
            ),
            Book(
                title="The Adventures of Sherlock Holmes",
                subtitle="Classic Detective Stories",
                isbn10="0140437712",
                isbn13="9780140437713",
                description="A collection of twelve short stories featuring the famous consulting detective Sherlock Holmes and Dr. Watson.",
                publisher_id=publishers[0].id,
                publication_date=date(1892, 10, 14),
                edition="Illustrated Edition",
                language="English",
                pages=307,
                cover_image="https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=400&q=80",
                authors=[authors[4]],
                categories=[categories[6], categories[1]]
            ),
            Book(
                title="Designing Data-Intensive Applications",
                subtitle="The Big Ideas Behind Reliable, Scalable Systems",
                isbn10="1449373321",
                isbn13="9781449373320",
                description="Data is at the center of many challenges in system design today. Difficult issues need to be figured out.",
                publisher_id=publishers[1].id,
                publication_date=date(2017, 3, 16),
                edition="1st Edition",
                language="English",
                pages=616,
                cover_image="https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=400&q=80",
                authors=[authors[1]],
                categories=[categories[0]]
            ),
            Book(
                title="Animal Farm",
                subtitle="A Fairy Story",
                isbn10="0451526341",
                isbn13="9780451526342",
                description="A group of farm animals who rebel against their human farmer, hoping to create a society where animals can be equal and free.",
                publisher_id=publishers[2].id,
                publication_date=date(1945, 8, 17),
                edition="Collector's Edition",
                language="English",
                pages=141,
                cover_image="https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=400&q=80",
                authors=[authors[2]],
                categories=[categories[1]]
            ),
            Book(
                title="Introduction to Algorithms",
                subtitle="CLRS Classic Standard",
                isbn10="0262033844",
                isbn13="9780262033848",
                description="A comprehensive update of the leading algorithms text, with new material on matchings in bipartite graphs, online algorithms, and machine learning.",
                publisher_id=publishers[3].id,
                publication_date=date(2009, 7, 31),
                edition="3rd Edition",
                language="English",
                pages=1312,
                cover_image="https://images.unsplash.com/photo-1509021436665-8f07dbf5bf1d?w=400&q=80",
                authors=[authors[0]],
                categories=[categories[0], categories[7]]
            )
        ]
        session.add_all(books)
        await session.flush()

        # 8. Physical Book Copies
        copies = []
        copy_idx = 1
        for book in books:
            for c_num in range(1, 4):
                status = CopyStatus.AVAILABLE
                condition = "Good" if c_num != 3 else "New"
                barcode = f"BC-LIB-{copy_idx:05d}"
                shelf = f"Floor 1 - Row {c_num}"
                copies.append(BookCopy(
                    book_id=book.id,
                    barcode=barcode,
                    status=status,
                    condition=condition,
                    branch_id=branches[(c_num - 1) % len(branches)].id,
                    shelf=shelf
                ))
                copy_idx += 1
        session.add_all(copies)
        await session.flush()

        # 9. Circulation Loans
        now = datetime.utcnow()
        # Copy 0 (Clean Code) -> Active Loan to John Doe
        copies[0].status = CopyStatus.ISSUED
        loan1 = Loan(
            copy_id=copies[0].id,
            member_id=members[0].id,
            issued_by_id=users[1].id,
            issued_at=now - timedelta(days=5),
            due_date=now + timedelta(days=9),
            status=LoanStatus.ACTIVE
        )

        # Copy 6 (1984) -> Overdue Loan to Jane Smith
        copies[6].status = CopyStatus.ISSUED
        loan2 = Loan(
            copy_id=copies[6].id,
            member_id=members[1].id,
            issued_by_id=users[1].id,
            issued_at=now - timedelta(days=18),
            due_date=now - timedelta(days=4),
            status=LoanStatus.OVERDUE
        )

        # Copy 9 (Foundation) -> Returned Loan by David Wilson
        loan3 = Loan(
            copy_id=copies[9].id,
            member_id=members[2].id,
            issued_by_id=users[2].id,
            issued_at=now - timedelta(days=14),
            due_date=now - timedelta(days=2),
            returned_at=now - timedelta(days=1),
            status=LoanStatus.RETURNED
        )

        session.add_all([loan1, loan2, loan3])
        await session.flush()

        # 10. Fines & Payments
        fine1 = Fine(
            loan_id=loan2.id,
            member_id=members[1].id,
            amount=4.00,
            paid_amount=0.00,
            status=FineStatus.UNPAID,
            reason="Overdue return for 4 days"
        )
        fine2 = Fine(
            loan_id=loan3.id,
            member_id=members[2].id,
            amount=2.00,
            paid_amount=2.00,
            status=FineStatus.PAID,
            reason="Overdue return for 2 days"
        )
        session.add_all([fine1, fine2])
        await session.flush()

        payment1 = Payment(
            fine_id=fine2.id,
            amount=2.00,
            payment_method="card",
            processed_by_id=users[1].id,
            paid_at=now - timedelta(days=1)
        )
        session.add(payment1)

        # 11. Reservations
        reservation1 = Reservation(
            book_id=books[0].id,
            member_id=members[1].id,
            created_at=now - timedelta(days=2),
            status=ReservationStatus.PENDING
        )
        session.add(reservation1)

        # 12. Digital Resources
        digitals = [
            DigitalResource(
                title="Clean Code Architecture Patterns (Companion Guide)",
                resource_type=ResourceType.PDF,
                file_path="https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
                uploaded_by_id=users[0].id,
                book_id=books[0].id
            ),
            DigitalResource(
                title="1984 Critical Analysis & Historical Commentary",
                resource_type=ResourceType.EBOOK,
                file_path="https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
                uploaded_by_id=users[0].id,
                book_id=books[2].id
            )
        ]
        session.add_all(digitals)

        # 13. Audit Logs
        logs = [
            AuditLog(user_id=users[0].id, action="SYSTEM_INIT", resource_type="system", details="System database initialized on PostgreSQL 5433"),
            AuditLog(user_id=users[1].id, action="BOOK_ISSUE", resource_type="loan", resource_id=loan1.id, details="Issued Clean Code copy to John Doe"),
            AuditLog(user_id=users[1].id, action="BOOK_ISSUE", resource_type="loan", resource_id=loan2.id, details="Issued 1984 copy to Jane Smith"),
            AuditLog(user_id=users[2].id, action="BOOK_RETURN", resource_type="loan", resource_id=loan3.id, details="Returned Foundation copy by David Wilson"),
            AuditLog(user_id=users[1].id, action="FINE_PAYMENT", resource_type="fine", resource_id=fine2.id, details="Processed $2.00 card payment for David Wilson")
        ]
        session.add_all(logs)

        await session.commit()
        print("Successfully seeded all database tables with real-world library records!")

if __name__ == "__main__":
    asyncio.run(seed_data())
