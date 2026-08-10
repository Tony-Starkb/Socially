import importlib
import sys
from pathlib import Path

from sqlalchemy import inspect

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))


def test_create_tables_creates_users_table(monkeypatch):
    monkeypatch.setenv("DATABASE_URL", "sqlite:///:memory:")

    import database.database as database_module

    importlib.reload(database_module)
    database_module.create_tables()

    inspector = inspect(database_module.engine)
    assert "users" in inspector.get_table_names()
