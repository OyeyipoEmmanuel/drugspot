"""Compatibility re-exports for the shared application dependencies."""

from ..auth.deps import get_current_user, require_roles
from ..database import get_db

__all__ = ["get_current_user", "get_db", "require_roles"]
