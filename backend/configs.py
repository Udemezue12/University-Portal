import os
from pathlib import Path
BASE_URL = os.getenv("BASE_URL", "http://localhost:8000")
UPLOAD_DIR = "./uploads"
UPLOAD_URL_PREFIX= "/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)



def convert_to_url(file_path: str) -> str:
    if not file_path:
        return None
    path = Path(file_path)
    filename = path.name
    return f"{BASE_URL.rstrip('/')}/uploads/{filename}"
