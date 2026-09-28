"""Administrative command-line helpers."""

import argparse
import asyncio

from sqlalchemy import or_, select

from .auth.models import User, UserRole
from .auth.service import hash_password
from .database import AsyncSessionLocal
from .models import add_audit_log
from .pharmacy_verification import models as pharmacy_models  # noqa: F401


async def create_admin(args: argparse.Namespace) -> None:
    async with AsyncSessionLocal() as session:
        existing = await session.scalar(
            select(User).where(or_(User.email == args.email.lower(), User.phone == args.phone))
        )
        if existing:
            raise SystemExit("A user with that email or phone already exists")
        user = User(
            first_name=args.first_name,
            last_name=args.last_name,
            email=args.email.lower(),
            phone=args.phone,
            password_hash=hash_password(args.password),
            role=UserRole.PLATFORM_ADMIN,
            onboarding_complete=True,
            is_email_verified=True,
        )
        session.add(user)
        await session.flush()
        add_audit_log(
            session,
            actor_id=user.id,
            entity_type="user",
            entity_id=user.id,
            action="platform_admin_bootstrapped",
        )
        await session.commit()
        print(f"Created platform administrator {user.email}")


def main() -> None:
    parser = argparse.ArgumentParser(prog="python -m app.cli")
    commands = parser.add_subparsers(dest="command", required=True)
    admin = commands.add_parser("create-admin", help="Create the first platform administrator")
    admin.add_argument("--email", required=True)
    admin.add_argument("--phone", required=True)
    admin.add_argument("--first-name", required=True)
    admin.add_argument("--last-name", required=True)
    admin.add_argument("--password", required=True)
    args = parser.parse_args()
    if args.command == "create-admin":
        asyncio.run(create_admin(args))


if __name__ == "__main__":
    main()
