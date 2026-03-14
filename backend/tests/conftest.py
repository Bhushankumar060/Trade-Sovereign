import sys
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

# Ensure repo root is on sys.path so backend package is importable when tests run from within backend/
# The backend package lives in the parent directory of this backend/ folder.
ROOT_DIR = Path(__file__).resolve().parents[2]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from backend import server


@pytest.fixture(scope="session")
def client():
    """Create a TestClient for the FastAPI app.

    This fixture is used for local testing. When `REACT_APP_BACKEND_URL` is set,
    tests will hit that remote backend instead.
    """
    with TestClient(server.app) as c:
        yield c
