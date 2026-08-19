"""Start the MiniCRM web app.

    python run.py            -> http://127.0.0.1:8000
"""
import sys
from pathlib import Path

import uvicorn

sys.path.insert(0, str(Path(__file__).resolve().parent))

if __name__ == "__main__":
    from core import db
    db.init_db()
    print("MiniCRM running at http://127.0.0.1:8000   (API docs: /docs)")
    uvicorn.run("web.app:app", host="127.0.0.1", port=8000, reload=False)
