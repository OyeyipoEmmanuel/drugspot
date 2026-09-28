"""Seed only public catalog data needed for the marketplace and pharmacy directory.

This intentionally excludes any user-bound records, including users, patient profiles,
pharmacists, orders, carts, refill requests, conversations, or medication events.
The seed data is safe to re-run and resolves the required pharmacy owner reference
by using an existing platform administrator record, or exits with an explicit
bootstrap instruction if no admin account exists yet.
"""

from __future__ import annotations

import argparse
import asyncio
from decimal import Decimal
from datetime import UTC, datetime, timedelta
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..auth.models import User, UserRole
from ..commerce.models import InventoryItem, Product
from ..database import AsyncSessionLocal
from ..pharmacy_verification.models import Pharmacy, VerificationStatus

PHARMACY_SEEDS: list[dict[str, Any]] = [
    {
        "name": "BlueCare Pharmacy & Wellness",
        "address": "12 Allen Avenue, Ikeja",
        "city": "Lagos",
        "state": "Lagos",
        "phone": "+2348010001001",
        "email": "hello@bluecarepharmacy.ng",
        "description": "Primary care, chronic care, and wellness support for Lagos families.",
        "hours": "Mon-Sat, 8:00 AM - 9:00 PM",
        "supports_delivery": True,
        "supports_pickup": True,
        "delivery_fee": "750.00",
        "rating": 4.8,
        "review_count": 312,
    },
    {
        "name": "MedPoint Pharmacy",
        "address": "48 Broad Street, Marina",
        "city": "Lagos",
        "state": "Lagos",
        "phone": "+2348010001002",
        "email": "care@medpoint.ng",
        "description": "Fast fulfilment pharmacy for everyday medicines and family care.",
        "hours": "Mon-Sun, 7:00 AM - 10:00 PM",
        "supports_delivery": True,
        "supports_pickup": True,
        "delivery_fee": "650.00",
        "rating": 4.7,
        "review_count": 284,
    },
    {
        "name": "HealthFirst Pharmacy",
        "address": "18 Aminu Kano Crescent, Wuse",
        "city": "Abuja",
        "state": "FCT",
        "phone": "+2348010001003",
        "email": "support@healthfirstpharmacy.ng",
        "description": "Clinical pharmacy support and medicine management for busy professionals.",
        "hours": "Mon-Sat, 8:30 AM - 8:30 PM",
        "supports_delivery": True,
        "supports_pickup": True,
        "delivery_fee": "900.00",
        "rating": 4.9,
        "review_count": 401,
    },
    {
        "name": "Hilltop Chemist",
        "address": "72 Murtala Mohammed Way, Kaduna",
        "city": "Kaduna",
        "state": "Kaduna",
        "phone": "+2348010001004",
        "email": "hello@hilltopchemist.ng",
        "description": "Community-focused pharmacy serving households and clinics.",
        "hours": "Mon-Sat, 8:00 AM - 8:00 PM",
        "supports_delivery": True,
        "supports_pickup": True,
        "delivery_fee": "500.00",
        "rating": 4.6,
        "review_count": 188,
    },
    {
        "name": "PrimeCare Pharmacy",
        "address": "5 Ahmadu Bello Way, Kano",
        "city": "Kano",
        "state": "Kano",
        "phone": "+2348010001005",
        "email": "pharmacy@primecare.ng",
        "description": "Prescription support, chronic medication refills, and wellness items.",
        "hours": "Mon-Sat, 8:00 AM - 9:00 PM",
        "supports_delivery": True,
        "supports_pickup": True,
        "delivery_fee": "700.00",
        "rating": 4.5,
        "review_count": 210,
    },
    {
        "name": "Apex Pharmacy Hub",
        "address": "9 Sapele Road, Benin City",
        "city": "Benin City",
        "state": "Edo",
        "phone": "+2348010001006",
        "email": "reach@apexpharmacyhub.ng",
        "description": "Modern family pharmacy for everyday care and prescription support.",
        "hours": "Mon-Sat, 7:30 AM - 9:00 PM",
        "supports_delivery": True,
        "supports_pickup": True,
        "delivery_fee": "650.00",
        "rating": 4.7,
        "review_count": 276,
    },
    {
        "name": "CityLife Pharmacy",
        "address": "32 Odozi Road, Port Harcourt",
        "city": "Port Harcourt",
        "state": "Rivers",
        "phone": "+2348010001007",
        "email": "hello@citylifepharmacy.ng",
        "description": "Accessible pharmacy care for high-traffic urban households.",
        "hours": "Mon-Sun, 8:00 AM - 10:00 PM",
        "supports_delivery": True,
        "supports_pickup": True,
        "delivery_fee": "800.00",
        "rating": 4.6,
        "review_count": 201,
    },
    {
        "name": "Lifeline Chemist",
        "address": "55 Uselu Road, Benin City",
        "city": "Benin City",
        "state": "Edo",
        "phone": "+2348010001008",
        "email": "hello@lifelinechemist.ng",
        "description": "Reliable pharmacy support for primary care and refill management.",
        "hours": "Mon-Sat, 8:00 AM - 8:00 PM",
        "supports_delivery": True,
        "supports_pickup": True,
        "delivery_fee": "550.00",
        "rating": 4.4,
        "review_count": 142,
    },
    {
        "name": "St. Nicholas Pharmacy",
        "address": "14 Nnamdi Azikiwe Road, Enugu",
        "city": "Enugu",
        "state": "Enugu",
        "phone": "+2348010001009",
        "email": "care@stnicholaspharmacy.ng",
        "description": "Faith-based community pharmacy with prescription and wellness services.",
        "hours": "Mon-Sat, 8:00 AM - 9:00 PM",
        "supports_delivery": True,
        "supports_pickup": True,
        "delivery_fee": "600.00",
        "rating": 4.5,
        "review_count": 173,
    },
    {
        "name": "EkoCare Pharmacy",
        "address": "88 Yaba Road, Yaba",
        "city": "Lagos",
        "state": "Lagos",
        "phone": "+2348010001010",
        "email": "support@ekocarepharmacy.ng",
        "description": "Neighbourhood pharmacy for chronic therapy, acute care, and home delivery.",
        "hours": "Mon-Sun, 7:00 AM - 9:00 PM",
        "supports_delivery": True,
        "supports_pickup": True,
        "delivery_fee": "700.00",
        "rating": 4.8,
        "review_count": 297,
    },
]

PRODUCT_SEEDS: list[dict[str, Any]] = [
    {"name": "Amoxicillin", "generic_name": "Amoxicillin", "brand": "Moxiklin", "category": "Antibiotics", "form": "Capsule", "strength": "500 mg", "pack_size": "12 capsules", "price": "1450.00", "stock_count": 40, "reorder_level": 10, "requires_prescription": True, "requires_pharmacist_review": False, "preorder_supported": True, "pharmacy_name": "BlueCare Pharmacy & Wellness"},
    {"name": "Amlodipine", "generic_name": "Amlodipine", "brand": "Amodip", "category": "Antihypertensives", "form": "Tablet", "strength": "5 mg", "pack_size": "30 tablets", "price": "2200.00", "stock_count": 22, "reorder_level": 8, "requires_prescription": True, "requires_pharmacist_review": False, "preorder_supported": False, "pharmacy_name": "BlueCare Pharmacy & Wellness"},
    {"name": "Metformin", "generic_name": "Metformin Hydrochloride", "brand": "Glycophage", "category": "Diabetes", "form": "Tablet", "strength": "500 mg", "pack_size": "60 tablets", "price": "2900.00", "stock_count": 18, "reorder_level": 8, "requires_prescription": True, "requires_pharmacist_review": False, "preorder_supported": True, "pharmacy_name": "BlueCare Pharmacy & Wellness"},
    {"name": "Atorvastatin", "generic_name": "Atorvastatin", "brand": "Lipitor", "category": "Cardiovascular", "form": "Tablet", "strength": "20 mg", "pack_size": "30 tablets", "price": "2500.00", "stock_count": 27, "reorder_level": 9, "requires_prescription": True, "requires_pharmacist_review": False, "preorder_supported": False, "pharmacy_name": "BlueCare Pharmacy & Wellness"},
    {"name": "Paracetamol", "generic_name": "Paracetamol", "brand": "Panadol", "category": "Pain Relief", "form": "Tablet", "strength": "500 mg", "pack_size": "24 tablets", "price": "950.00", "stock_count": 50, "reorder_level": 12, "requires_prescription": False, "requires_pharmacist_review": False, "preorder_supported": False, "pharmacy_name": "BlueCare Pharmacy & Wellness"},
    {"name": "Ibuprofen", "generic_name": "Ibuprofen", "brand": "Brufen", "category": "Pain Relief", "form": "Capsule", "strength": "200 mg", "pack_size": "30 capsules", "price": "1100.00", "stock_count": 31, "reorder_level": 9, "requires_prescription": False, "requires_pharmacist_review": False, "preorder_supported": False, "pharmacy_name": "MedPoint Pharmacy"},
    {"name": "Cefuroxime", "generic_name": "Cefuroxime Axetil", "brand": "Zinnat", "category": "Antibiotics", "form": "Tablet", "strength": "250 mg", "pack_size": "14 tablets", "price": "2100.00", "stock_count": 15, "reorder_level": 6, "requires_prescription": True, "requires_pharmacist_review": True, "preorder_supported": True, "pharmacy_name": "MedPoint Pharmacy"},
    {"name": "Salbutamol Inhaler", "generic_name": "Salbutamol", "brand": "Ventolin", "category": "Respiratory", "form": "Inhaler", "strength": "100 mcg", "pack_size": "1 inhaler", "price": "6800.00", "stock_count": 12, "reorder_level": 3, "requires_prescription": True, "requires_pharmacist_review": False, "preorder_supported": True, "pharmacy_name": "MedPoint Pharmacy"},
    {"name": "Vitamin C", "generic_name": "Ascorbic Acid", "brand": "Cebion", "category": "Vitamins & Supplements", "form": "Tablet", "strength": "1000 mg", "pack_size": "30 tablets", "price": "1800.00", "stock_count": 44, "reorder_level": 12, "requires_prescription": False, "requires_pharmacist_review": False, "preorder_supported": False, "pharmacy_name": "MedPoint Pharmacy"},
    {"name": "Folic Acid", "generic_name": "Folic Acid", "brand": "Folaid", "category": "Vitamins & Supplements", "form": "Tablet", "strength": "5 mg", "pack_size": "30 tablets", "price": "1200.00", "stock_count": 36, "reorder_level": 10, "requires_prescription": False, "requires_pharmacist_review": False, "preorder_supported": False, "pharmacy_name": "HealthFirst Pharmacy"},
    {"name": "Lisinopril", "generic_name": "Lisinopril", "brand": "Prinivil", "category": "Antihypertensives", "form": "Tablet", "strength": "10 mg", "pack_size": "30 tablets", "price": "1700.00", "stock_count": 29, "reorder_level": 8, "requires_prescription": True, "requires_pharmacist_review": False, "preorder_supported": False, "pharmacy_name": "HealthFirst Pharmacy"},
    {"name": "Losartan", "generic_name": "Losartan Potassium", "brand": "Cozaar", "category": "Antihypertensives", "form": "Tablet", "strength": "50 mg", "pack_size": "30 tablets", "price": "1900.00", "stock_count": 24, "reorder_level": 6, "requires_prescription": True, "requires_pharmacist_review": False, "preorder_supported": False, "pharmacy_name": "HealthFirst Pharmacy"},
    {"name": "Glibenclamide", "generic_name": "Glibenclamide", "brand": "Daonil", "category": "Diabetes", "form": "Tablet", "strength": "5 mg", "pack_size": "30 tablets", "price": "1400.00", "stock_count": 21, "reorder_level": 7, "requires_prescription": True, "requires_pharmacist_review": False, "preorder_supported": True, "pharmacy_name": "HealthFirst Pharmacy"},
    {"name": "Multivitamin", "generic_name": "Multivitamin Complex", "brand": "VitaPlus", "category": "Vitamins & Supplements", "form": "Tablet", "strength": "General", "pack_size": "60 tablets", "price": "2500.00", "stock_count": 26, "reorder_level": 9, "requires_prescription": False, "requires_pharmacist_review": False, "preorder_supported": False, "pharmacy_name": "Hilltop Chemist"},
    {"name": "Levothyroxine", "generic_name": "Levothyroxine Sodium", "brand": "Euthyrox", "category": "Endocrine", "form": "Tablet", "strength": "50 mcg", "pack_size": "30 tablets", "price": "3300.00", "stock_count": 20, "reorder_level": 7, "requires_prescription": True, "requires_pharmacist_review": False, "preorder_supported": False, "pharmacy_name": "Hilltop Chemist"},
    {"name": "Omeprazole", "generic_name": "Omeprazole", "brand": "Losec", "category": "Gastrointestinal", "form": "Capsule", "strength": "20 mg", "pack_size": "30 capsules", "price": "1600.00", "stock_count": 33, "reorder_level": 10, "requires_prescription": False, "requires_pharmacist_review": False, "preorder_supported": False, "pharmacy_name": "Hilltop Chemist"},
    {"name": "Acyclovir", "generic_name": "Acyclovir", "brand": "Zovirax", "category": "Antivirals", "form": "Tablet", "strength": "200 mg", "pack_size": "25 tablets", "price": "3100.00", "stock_count": 12, "reorder_level": 4, "requires_prescription": True, "requires_pharmacist_review": True, "preorder_supported": True, "pharmacy_name": "Hilltop Chemist"},
    {"name": "Albendazole", "generic_name": "Albendazole", "brand": "Alben", "category": "Anthelmintics", "form": "Tablet", "strength": "400 mg", "pack_size": "1 tablet", "price": "900.00", "stock_count": 38, "reorder_level": 9, "requires_prescription": False, "requires_pharmacist_review": False, "preorder_supported": False, "pharmacy_name": "PrimeCare Pharmacy"},
    {"name": "Cough Syrup", "generic_name": "Dextromethorphan", "brand": "Robitussin", "category": "Respiratory", "form": "Syrup", "strength": "100 mg/5 mL", "pack_size": "120 mL", "price": "1650.00", "stock_count": 18, "reorder_level": 6, "requires_prescription": False, "requires_pharmacist_review": False, "preorder_supported": False, "pharmacy_name": "PrimeCare Pharmacy"},
    {"name": "Pyrantel", "generic_name": "Pyrantel Pamoate", "brand": "Helmintox", "category": "Anthelmintics", "form": "Oral suspension", "strength": "250 mg/5 mL", "pack_size": "60 mL", "price": "1100.00", "stock_count": 16, "reorder_level": 5, "requires_prescription": False, "requires_pharmacist_review": False, "preorder_supported": False, "pharmacy_name": "PrimeCare Pharmacy"},
    {"name": "Insulin Glargine", "generic_name": "Insulin Glargine", "brand": "Lantus", "category": "Diabetes", "form": "Injection", "strength": "100 units/mL", "pack_size": "3 mL pen", "price": "14500.00", "stock_count": 9, "reorder_level": 3, "requires_prescription": True, "requires_pharmacist_review": True, "preorder_supported": True, "pharmacy_name": "Apex Pharmacy Hub"},
    {"name": "Cefixime", "generic_name": "Cefixime", "brand": "Suprax", "category": "Antibiotics", "form": "Capsule", "strength": "400 mg", "pack_size": "7 capsules", "price": "2400.00", "stock_count": 14, "reorder_level": 5, "requires_prescription": True, "requires_pharmacist_review": False, "preorder_supported": True, "pharmacy_name": "Apex Pharmacy Hub"},
    {"name": "Diclofenac", "generic_name": "Diclofenac Sodium", "brand": "Voltaren", "category": "Pain Relief", "form": "Tablet", "strength": "50 mg", "pack_size": "30 tablets", "price": "1600.00", "stock_count": 28, "reorder_level": 8, "requires_prescription": False, "requires_pharmacist_review": False, "preorder_supported": False, "pharmacy_name": "Apex Pharmacy Hub"},
    {"name": "Clotrimazole Cream", "generic_name": "Clotrimazole", "brand": "Canesten", "category": "Dermatology", "form": "Cream", "strength": "1%", "pack_size": "20 g", "price": "2200.00", "stock_count": 19, "reorder_level": 6, "requires_prescription": False, "requires_pharmacist_review": False, "preorder_supported": False, "pharmacy_name": "CityLife Pharmacy"},
    {"name": "Hydrocortisone Cream", "generic_name": "Hydrocortisone", "brand": "Hycort", "category": "Dermatology", "form": "Cream", "strength": "1%", "pack_size": "30 g", "price": "1400.00", "stock_count": 22, "reorder_level": 7, "requires_prescription": False, "requires_pharmacist_review": False, "preorder_supported": False, "pharmacy_name": "CityLife Pharmacy"},
    {"name": "Pseudoephidrine Syrup", "generic_name": "Pseudoephedrine", "brand": "Sudafed", "category": "Respiratory", "form": "Syrup", "strength": "30 mg/5 mL", "pack_size": "120 mL", "price": "1800.00", "stock_count": 17, "reorder_level": 5, "requires_prescription": False, "requires_pharmacist_review": False, "preorder_supported": False, "pharmacy_name": "CityLife Pharmacy"},
    {"name": "Amoxiclav", "generic_name": "Amoxicillin + Clavulanate", "brand": "Augmentin", "category": "Antibiotics", "form": "Tablet", "strength": "625 mg", "pack_size": "12 tablets", "price": "3400.00", "stock_count": 11, "reorder_level": 4, "requires_prescription": True, "requires_pharmacist_review": True, "preorder_supported": True, "pharmacy_name": "Lifeline Chemist"},
    {"name": "Azithromycin", "generic_name": "Azithromycin", "brand": "Zithromax", "category": "Antibiotics", "form": "Tablet", "strength": "500 mg", "pack_size": "3 tablets", "price": "4200.00", "stock_count": 13, "reorder_level": 5, "requires_prescription": True, "requires_pharmacist_review": False, "preorder_supported": True, "pharmacy_name": "Lifeline Chemist"},
    {"name": "Enalapril", "generic_name": "Enalapril Maleate", "brand": "Renitec", "category": "Antihypertensives", "form": "Tablet", "strength": "10 mg", "pack_size": "30 tablets", "price": "1650.00", "stock_count": 26, "reorder_level": 7, "requires_prescription": True, "requires_pharmacist_review": False, "preorder_supported": False, "pharmacy_name": "St. Nicholas Pharmacy"},
    {"name": "Propranolol", "generic_name": "Propranolol", "brand": "Inderal", "category": "Cardiovascular", "form": "Tablet", "strength": "40 mg", "pack_size": "30 tablets", "price": "2100.00", "stock_count": 25, "reorder_level": 7, "requires_prescription": True, "requires_pharmacist_review": False, "preorder_supported": False, "pharmacy_name": "St. Nicholas Pharmacy"},
    {"name": "Calcium + Vitamin D", "generic_name": "Calcium Carbonate + Vitamin D3", "brand": "CalD", "category": "Vitamins & Supplements", "form": "Tablet", "strength": "500 mg + 400 IU", "pack_size": "30 tablets", "price": "2300.00", "stock_count": 35, "reorder_level": 10, "requires_prescription": False, "requires_pharmacist_review": False, "preorder_supported": False, "pharmacy_name": "St. Nicholas Pharmacy"},
    {"name": "Oral Rehydration Salts", "generic_name": "Oral Rehydration Salts", "brand": "ORSplus", "category": "Gastrointestinal", "form": "Powder", "strength": "WHO formula", "pack_size": "20 sachets", "price": "900.00", "stock_count": 48, "reorder_level": 12, "requires_prescription": False, "requires_pharmacist_review": False, "preorder_supported": False, "pharmacy_name": "EkoCare Pharmacy"},
    {"name": "Antacid Suspension", "generic_name": "Aluminium Hydroxide + Magnesium", "brand": "Maalox", "category": "Gastrointestinal", "form": "Suspension", "strength": "200 mL", "pack_size": "200 mL", "price": "1700.00", "stock_count": 27, "reorder_level": 8, "requires_prescription": False, "requires_pharmacist_review": False, "preorder_supported": False, "pharmacy_name": "EkoCare Pharmacy"},
    {"name": "Captopril", "generic_name": "Captopril", "brand": "Capoten", "category": "Antihypertensives", "form": "Tablet", "strength": "25 mg", "pack_size": "30 tablets", "price": "1800.00", "stock_count": 23, "reorder_level": 7, "requires_prescription": True, "requires_pharmacist_review": False, "preorder_supported": False, "pharmacy_name": "EkoCare Pharmacy"},
    {"name": "Migraine Relief", "generic_name": "Sumatriptan", "brand": "Imigran", "category": "Pain Relief", "form": "Tablet", "strength": "50 mg", "pack_size": "12 tablets", "price": "4200.00", "stock_count": 10, "reorder_level": 4, "requires_prescription": True, "requires_pharmacist_review": False, "preorder_supported": False, "pharmacy_name": "BlueCare Pharmacy & Wellness"},
    {"name": "Budesonide Inhaler", "generic_name": "Budesonide", "brand": "Pulmicort", "category": "Respiratory", "form": "Inhaler", "strength": "200 mcg", "pack_size": "1 inhaler", "price": "8600.00", "stock_count": 7, "reorder_level": 2, "requires_prescription": True, "requires_pharmacist_review": True, "preorder_supported": True, "pharmacy_name": "BlueCare Pharmacy & Wellness"},
    {"name": "Naproxen", "generic_name": "Naproxen Sodium", "brand": "Naprosyn", "category": "Pain Relief", "form": "Tablet", "strength": "500 mg", "pack_size": "30 tablets", "price": "1800.00", "stock_count": 20, "reorder_level": 6, "requires_prescription": False, "requires_pharmacist_review": False, "preorder_supported": False, "pharmacy_name": "MedPoint Pharmacy"},
]


def _slug(value: str) -> str:
    return "".join(ch.lower() if ch.isalnum() else "-" for ch in value).strip("-")


async def fetch_seed_owner(session: AsyncSession) -> User | None:
    return await session.scalar(
        select(User)
        .where(User.role == UserRole.PLATFORM_ADMIN)
        .order_by(User.created_at.asc())
        .limit(1)
    )


async def seed_pharmacies(session: AsyncSession, owner_user_id: str) -> dict[str, Pharmacy]:
    pharmacies: dict[str, Pharmacy] = {}
    for item in PHARMACY_SEEDS:
        existing = await session.scalar(
            select(Pharmacy).where(Pharmacy.name == item["name"], Pharmacy.city == item["city"])
        )
        if existing is None:
            pharmacy = Pharmacy(
                owner_user_id=owner_user_id,
                name=item["name"],
                address=item["address"],
                city=item["city"],
                state=item["state"],
                country="Nigeria",
                phone=item["phone"],
                email=item["email"],
                description=item["description"],
                hours=item["hours"],
                supports_delivery=item["supports_delivery"],
                supports_pickup=item["supports_pickup"],
                delivery_fee=Decimal(str(item["delivery_fee"])),
                rating=float(item["rating"]),
                review_count=int(item["review_count"]),
                verification_status=VerificationStatus.APPROVED,
                is_active=True,
            )
            session.add(pharmacy)
            await session.flush()
            existing = pharmacy
        else:
            existing.address = item["address"]
            existing.state = item["state"]
            existing.phone = item["phone"]
            existing.email = item["email"]
            existing.description = item["description"]
            existing.hours = item["hours"]
            existing.supports_delivery = item["supports_delivery"]
            existing.supports_pickup = item["supports_pickup"]
            existing.delivery_fee = Decimal(str(item["delivery_fee"]))
            existing.rating = float(item["rating"])
            existing.review_count = int(item["review_count"])
            existing.verification_status = VerificationStatus.APPROVED
            existing.is_active = True
            await session.flush()
        pharmacies[item["name"]] = existing
    return pharmacies


async def seed_products(session: AsyncSession, pharmacies: dict[str, Pharmacy]) -> int:
    inserted = 0
    for item in PRODUCT_SEEDS:
        pharmacy = pharmacies[item["pharmacy_name"]]
        sku = f"{_slug(pharmacy.name)}-{_slug(item['name'])}-{_slug(item['strength'])}"
        product = await session.scalar(select(Product).where(Product.sku == sku))
        if product is None:
            product = Product(
                name=item["name"],
                generic_name=item["generic_name"],
                brand=item["brand"],
                category=item["category"],
                form=item["form"],
                strength=item["strength"],
                pack_size=item["pack_size"],
                description=(
                    f"{item['brand']} {item['name']} {item['strength']} for {item['category'].lower()} management. "
                    f"Available through {pharmacy.name} with delivery and pickup support."
                ),
                sku=sku,
                requires_prescription=bool(item["requires_prescription"]),
                requires_pharmacist_review=bool(item["requires_pharmacist_review"]),
                is_active=True,
            )
            session.add(product)
            await session.flush()
            inserted += 1
        else:
            product.generic_name = item["generic_name"]
            product.brand = item["brand"]
            product.category = item["category"]
            product.form = item["form"]
            product.strength = item["strength"]
            product.pack_size = item["pack_size"]
            product.requires_prescription = bool(item["requires_prescription"])
            product.requires_pharmacist_review = bool(item["requires_pharmacist_review"])
            product.is_active = True

        inventory = await session.scalar(
            select(InventoryItem).where(
                InventoryItem.product_id == product.id,
                InventoryItem.pharmacy_id == pharmacy.id,
            )
        )
        if inventory is None:
            inventory = InventoryItem(
                product_id=product.id,
                pharmacy_id=pharmacy.id,
                stock_count=int(item["stock_count"]),
                reorder_level=int(item["reorder_level"]),
                unit_price=Decimal(str(item["price"])),
                preorder_supported=bool(item["preorder_supported"]),
                estimated_restock_date=datetime.now(UTC) + timedelta(days=7 + inserted % 9),
                is_active=True,
            )
            session.add(inventory)
        else:
            inventory.stock_count = int(item["stock_count"])
            inventory.reorder_level = int(item["reorder_level"])
            inventory.unit_price = Decimal(str(item["price"]))
            inventory.preorder_supported = bool(item["preorder_supported"])
            inventory.estimated_restock_date = datetime.now(UTC) + timedelta(days=7 + inserted % 9)
            inventory.is_active = True
    return inserted


async def seed_public_catalog() -> dict[str, int]:
    async with AsyncSessionLocal() as session:
        owner = await fetch_seed_owner(session)
        if owner is None:
            raise RuntimeError(
                "No platform administrator exists yet. Create one with `python -m app.cli create-admin ...` "
                "before running the public catalogue seed."
            )
        pharmacies = await seed_pharmacies(session, owner.id)
        inserted = await seed_products(session, pharmacies)
        await session.commit()
        return {"pharmacies": len(pharmacies), "products": len(PRODUCT_SEEDS), "new_products": inserted}


def main() -> None:
    parser = argparse.ArgumentParser(prog="python -m app.db.seed")
    parser.add_argument("--verbose", action="store_true", help="Print verbose output")
    args = parser.parse_args()
    try:
        result = asyncio.run(seed_public_catalog())
    except RuntimeError as exc:
        raise SystemExit(str(exc)) from exc
    print(
        "Public catalog seed complete: "
        f"{result['pharmacies']} approved pharmacies, {result['products']} public products."
    )
    if args.verbose:
        print(f"Inserted new product rows: {result['new_products']}")


if __name__ == "__main__":
    main()
