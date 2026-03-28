"""
Seed database with demo data for RentOS.
Run from backend/ directory: python -m scripts.seed_database
"""

import sys
import uuid
from datetime import date, datetime, timezone

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Ensure the app package is importable when running as a module from backend/
sys.path.insert(0, ".")

from app.database import DATABASE_URL, Base
from app.models.apartment import Apartment
from app.models.conversation import Conversation
from app.models.inventory_item import InventoryItem
from app.models.lease_period import LeasePeriod
from app.models.listing import Listing
from app.models.message import Message


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def clear_data(session) -> None:
    """Delete all existing data in reverse-dependency order."""
    print("[CLEAR] Removing existing data ...")
    session.execute(text("DELETE FROM messages"))
    session.execute(text("DELETE FROM conversations"))
    session.execute(text("DELETE FROM listings"))
    session.execute(text("DELETE FROM inventory_items"))
    session.execute(text("DELETE FROM lease_periods"))
    session.execute(text("DELETE FROM damage_reports"))
    session.execute(text("DELETE FROM photos"))
    session.execute(text("DELETE FROM apartments"))
    session.commit()
    print("[CLEAR] Done.")


def seed_apartments(session) -> list[Apartment]:
    print("[SEED] Inserting apartments ...")
    apartments_data = [
        {
            "address": "ul. Marszalkowska 15",
            "apartment_number": "4",
            "city": "Warsaw",
            "rooms": 3,
            "sqm": 65.0,
            "floor": 4,
            "status": "rented",
            "specifications": {
                "parking": True,
                "balcony": True,
                "elevator": True,
                "furnished": True,
            },
        },
        {
            "address": "ul. Nowy Swiat 22",
            "apartment_number": "10",
            "city": "Warsaw",
            "rooms": 2,
            "sqm": 45.0,
            "floor": 2,
            "status": "listed",
            "specifications": {
                "balcony": True,
                "furnished": True,
            },
        },
        {
            "address": "ul. Florianska 8",
            "apartment_number": "3",
            "city": "Krakow",
            "rooms": 4,
            "sqm": 90.0,
            "floor": 1,
            "status": "vacant",
            "specifications": {
                "parking": True,
                "elevator": True,
                "furnished": True,
                "pet_friendly": True,
            },
        },
        {
            "address": "ul. Piotrkowska 100",
            "apartment_number": "15",
            "city": "Lodz",
            "rooms": 1,
            "sqm": 30.0,
            "floor": 5,
            "status": "move-out",
            "specifications": {
                "elevator": True,
                "furnished": True,
            },
        },
        {
            "address": "ul. Dluga 45",
            "apartment_number": "7",
            "city": "Gdansk",
            "rooms": 3,
            "sqm": 72.0,
            "floor": 3,
            "status": "rented",
            "specifications": {
                "parking": True,
                "balcony": True,
                "furnished": True,
            },
        },
    ]

    apartments: list[Apartment] = []
    for data in apartments_data:
        apt = Apartment(id=uuid.uuid4(), **data)
        session.add(apt)
        apartments.append(apt)
        print(f"  + Apartment: {data['address']}/{data['apartment_number']}, {data['city']}")

    session.flush()
    return apartments


def seed_inventory_items(session, apartments: list[Apartment]) -> None:
    print("[SEED] Inserting inventory items ...")

    items_per_apartment: list[list[tuple[str, str, str]]] = [
        # Apartment 1
        [
            ("Sofa", "living_room", "Gray fabric sofa, good condition"),
            ("Coffee Table", "living_room", "Wooden coffee table, minor scratches"),
            ("Double Bed", "bedroom", "160x200 bed with mattress, excellent condition"),
            ("Washing Machine", "bathroom", "Samsung 8kg, working properly"),
            ("Refrigerator", "kitchen", "LG two-door fridge, no defects"),
        ],
        # Apartment 2
        [
            ("Sofa Bed", "living_room", "Convertible sofa bed, lightly used"),
            ("Desk", "bedroom", "IKEA desk with drawers, good condition"),
            ("Microwave", "kitchen", "Sharp microwave, fully functional"),
        ],
        # Apartment 3
        [
            ("Sectional Sofa", "living_room", "Large L-shaped sofa, beige fabric"),
            ("Dining Table", "kitchen", "Wooden dining table seats 6, some wear"),
            ("King Bed", "bedroom", "180x200 bed frame with storage, excellent"),
            ("TV", "living_room", "Samsung 55-inch Smart TV, wall-mounted"),
            ("Dishwasher", "kitchen", "Bosch built-in dishwasher, working"),
        ],
        # Apartment 4
        [
            ("Single Bed", "bedroom", "90x200 bed with mattress, fair condition"),
            ("Wardrobe", "bedroom", "Two-door wardrobe, one hinge slightly loose"),
            ("Desk", "bedroom", "Student desk, good condition"),
        ],
        # Apartment 5
        [
            ("Sofa", "living_room", "Dark blue velvet sofa, excellent condition"),
            ("Double Bed", "bedroom", "140x200 bed with new mattress"),
            ("Washing Machine", "bathroom", "Bosch 7kg front loader, like new"),
            ("TV", "living_room", "LG 50-inch 4K TV on stand"),
        ],
    ]

    for apt, items in zip(apartments, items_per_apartment):
        for item_type, room_type, condition_notes in items:
            item = InventoryItem(
                id=uuid.uuid4(),
                apartment_id=apt.id,
                item_type=item_type,
                room_type=room_type,
                condition_notes=condition_notes,
            )
            session.add(item)
            print(f"  + Item: {item_type} ({room_type}) -> apt {apt.apartment_number}")

    session.flush()


def seed_listings(session, apartments: list[Apartment]) -> None:
    print("[SEED] Inserting listings ...")

    listings_data: list[list[dict]] = [
        # Apartment 1 listings
        [
            {
                "platform": "otodom",
                "title": "Spacious 3-room apartment in the heart of Warsaw",
                "description": (
                    "Beautiful, fully furnished 3-room apartment located on "
                    "ul. Marszalkowska. The apartment features 65 sqm of living space "
                    "on the 4th floor with an elevator. Includes a balcony, parking spot, "
                    "and all modern amenities. Perfect for professionals or a small family. "
                    "Available for long-term rent."
                ),
                "amenities": ["parking", "balcony", "elevator", "furnished", "central heating"],
                "price": 3500.0,
                "rental_type": "monthly",
                "status": "published",
            },
            {
                "platform": "airbnb",
                "title": "Central Warsaw Apartment with Parking & Balcony",
                "description": (
                    "Stay in the center of Warsaw in this cozy 3-room apartment. "
                    "Enjoy a private balcony, dedicated parking, and a fully equipped kitchen. "
                    "Walking distance to major attractions, restaurants, and public transport. "
                    "Ideal for tourists and business travelers."
                ),
                "amenities": ["parking", "balcony", "elevator", "wifi", "kitchen", "washer"],
                "price": 250.0,
                "rental_type": "daily",
                "status": "published",
            },
        ],
        # Apartment 2 listings
        [
            {
                "platform": "otodom",
                "title": "Cozy 2-room flat on Nowy Swiat, Warsaw",
                "description": (
                    "Charming 2-room apartment on one of Warsaw's most famous streets. "
                    "45 sqm on the 2nd floor with a balcony. Fully furnished and ready to "
                    "move in. Great location with easy access to shops, cafes, and the metro. "
                    "Monthly rent includes building maintenance."
                ),
                "amenities": ["balcony", "furnished", "central location"],
                "price": 2800.0,
                "rental_type": "monthly",
                "status": "published",
            },
            {
                "platform": "olx",
                "title": "2 pokoje, Nowy Swiat - furnished, balcony",
                "description": (
                    "Furnished 2-room apartment for rent on ul. Nowy Swiat. "
                    "45 sqm, 2nd floor, balcony. Close to everything you need - "
                    "shops, restaurants, public transport. Rent 2800 PLN/month + utilities. "
                    "Available immediately. No pets."
                ),
                "amenities": ["balcony", "furnished"],
                "price": 2800.0,
                "rental_type": "monthly",
                "status": "published",
            },
        ],
        # Apartment 3 - no listings (vacant)
        [],
        # Apartment 4 - no listings (move-out)
        [],
        # Apartment 5 listings
        [
            {
                "platform": "airbnb",
                "title": "Stylish Gdansk Apartment near Old Town",
                "description": (
                    "Modern 3-room apartment in Gdansk, just minutes from the Old Town. "
                    "72 sqm on the 3rd floor with parking. Fully equipped kitchen, "
                    "comfortable beds, and a Smart TV. Perfect base for exploring "
                    "the Tri-City area. Self check-in available."
                ),
                "amenities": ["parking", "balcony", "furnished", "wifi", "washer", "TV"],
                "price": 300.0,
                "rental_type": "daily",
                "status": "published",
            },
            {
                "platform": "booking",
                "title": "Gdansk City Apartment - Parking & Balcony",
                "description": (
                    "Well-appointed 3-room apartment in Gdansk with free parking "
                    "and a balcony. 72 sqm of space, sleeps up to 6 guests. "
                    "Located on ul. Dluga with easy access to the Main Town, "
                    "Neptune Fountain, and the waterfront. Daily housekeeping available."
                ),
                "amenities": ["parking", "balcony", "furnished", "free cancellation"],
                "price": 320.0,
                "rental_type": "daily",
                "status": "published",
            },
        ],
    ]

    for apt, listings in zip(apartments, listings_data):
        for data in listings:
            listing = Listing(
                id=uuid.uuid4(),
                apartment_id=apt.id,
                **data,
            )
            session.add(listing)
            print(f"  + Listing: {data['platform']} ({data['rental_type']}, {data['price']} PLN) -> apt {apt.apartment_number}")

    session.flush()


def seed_conversations_and_messages(session, apartments: list[Apartment]) -> None:
    print("[SEED] Inserting conversations and messages ...")

    apt1 = apartments[0]
    apt2 = apartments[1]
    apt5 = apartments[4]

    now = _utcnow()

    # Conversation 1 - apartment 1, ai_handled
    conv1 = Conversation(
        id=uuid.uuid4(),
        apartment_id=apt1.id,
        tenant_name="Anna Kowalska",
        platform_source="otodom",
        status="ai_handled",
    )
    session.add(conv1)
    session.flush()

    msgs_conv1 = [
        Message(
            id=uuid.uuid4(),
            conversation_id=conv1.id,
            sender="tenant",
            message_text="Does the apartment have parking?",
            timestamp=now,
        ),
        Message(
            id=uuid.uuid4(),
            conversation_id=conv1.id,
            sender="ai",
            message_text="Yes, the apartment includes parking.",
            timestamp=now,
        ),
    ]
    session.add_all(msgs_conv1)
    print(f"  + Conversation: Anna Kowalska (otodom, ai_handled) - 2 messages")

    # Conversation 2 - apartment 2, escalated
    conv2 = Conversation(
        id=uuid.uuid4(),
        apartment_id=apt2.id,
        tenant_name="Piotr Nowak",
        platform_source="olx",
        status="escalated",
    )
    session.add(conv2)
    session.flush()

    msgs_conv2 = [
        Message(
            id=uuid.uuid4(),
            conversation_id=conv2.id,
            sender="tenant",
            message_text="Can I bring my dog? It's a small breed.",
            timestamp=now,
        ),
    ]
    session.add_all(msgs_conv2)
    print(f"  + Conversation: Piotr Nowak (olx, escalated) - 1 message")

    # Conversation 3 - apartment 1, resolved
    conv3 = Conversation(
        id=uuid.uuid4(),
        apartment_id=apt1.id,
        tenant_name="Maria Wisniewska",
        platform_source="airbnb",
        status="resolved",
    )
    session.add(conv3)
    session.flush()

    msgs_conv3 = [
        Message(
            id=uuid.uuid4(),
            conversation_id=conv3.id,
            sender="tenant",
            message_text="Is there a washing machine?",
            timestamp=now,
        ),
        Message(
            id=uuid.uuid4(),
            conversation_id=conv3.id,
            sender="ai",
            message_text="Yes, there is a washing machine in the bathroom.",
            timestamp=now,
        ),
        Message(
            id=uuid.uuid4(),
            conversation_id=conv3.id,
            sender="tenant",
            message_text="Great, thanks!",
            timestamp=now,
        ),
        Message(
            id=uuid.uuid4(),
            conversation_id=conv3.id,
            sender="landlord",
            message_text="You're welcome! Let me know if you have other questions.",
            timestamp=now,
        ),
    ]
    session.add_all(msgs_conv3)
    print(f"  + Conversation: Maria Wisniewska (airbnb, resolved) - 4 messages")

    # Conversation 4 - apartment 5, ai_handled
    conv4 = Conversation(
        id=uuid.uuid4(),
        apartment_id=apt5.id,
        tenant_name="Jan Zielinski",
        platform_source="booking",
        status="ai_handled",
    )
    session.add(conv4)
    session.flush()

    msgs_conv4 = [
        Message(
            id=uuid.uuid4(),
            conversation_id=conv4.id,
            sender="tenant",
            message_text="What floor is the apartment on?",
            timestamp=now,
        ),
        Message(
            id=uuid.uuid4(),
            conversation_id=conv4.id,
            sender="ai",
            message_text="The apartment is on the 3rd floor.",
            timestamp=now,
        ),
    ]
    session.add_all(msgs_conv4)
    print(f"  + Conversation: Jan Zielinski (booking, ai_handled) - 2 messages")

    session.flush()


def seed_lease_periods(session, apartments: list[Apartment]) -> None:
    print("[SEED] Inserting lease periods ...")

    apt1 = apartments[0]
    apt4 = apartments[3]
    apt5 = apartments[4]

    leases = [
        LeasePeriod(
            id=uuid.uuid4(),
            apartment_id=apt1.id,
            tenant_name="Anna Kowalska",
            start_date=date(2025, 12, 1),
            end_date=date(2026, 5, 31),
            rental_type="monthly",
            status="active",
        ),
        LeasePeriod(
            id=uuid.uuid4(),
            apartment_id=apt1.id,
            tenant_name="Previous Tenant",
            start_date=date(2025, 6, 1),
            end_date=date(2025, 11, 30),
            rental_type="monthly",
            status="completed",
        ),
        LeasePeriod(
            id=uuid.uuid4(),
            apartment_id=apt4.id,
            tenant_name="Student Tenant",
            start_date=date(2025, 10, 1),
            end_date=date(2026, 3, 31),
            rental_type="monthly",
            status="active",
        ),
        LeasePeriod(
            id=uuid.uuid4(),
            apartment_id=apt5.id,
            tenant_name="Tourist Group",
            start_date=date(2026, 3, 25),
            end_date=date(2026, 4, 1),
            rental_type="daily",
            status="active",
        ),
        LeasePeriod(
            id=uuid.uuid4(),
            apartment_id=apt5.id,
            tenant_name="Business Trip",
            start_date=date(2026, 4, 10),
            end_date=date(2026, 4, 15),
            rental_type="daily",
            status="active",
        ),
    ]

    for lp in leases:
        session.add(lp)
        print(f"  + Lease: {lp.tenant_name} ({lp.rental_type}, {lp.start_date} - {lp.end_date})")

    session.flush()


def seed_all(clear: bool = True) -> None:
    """Run the full seed process."""
    engine = create_engine(DATABASE_URL, pool_pre_ping=True)
    Session = sessionmaker(bind=engine)
    session = Session()

    try:
        if clear:
            clear_data(session)

        apartments = seed_apartments(session)
        seed_inventory_items(session, apartments)
        seed_listings(session, apartments)
        seed_conversations_and_messages(session, apartments)
        seed_lease_periods(session, apartments)

        session.commit()
        print("\n[DONE] Database seeded successfully!")

    except Exception as e:
        session.rollback()
        print(f"\n[ERROR] Seeding failed: {e}")
        raise
    finally:
        session.close()


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Seed the RentOS database with demo data.")
    parser.add_argument(
        "--no-clear",
        action="store_true",
        help="Do not clear existing data before seeding.",
    )
    args = parser.parse_args()

    seed_all(clear=not args.no_clear)
