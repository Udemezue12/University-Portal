from dotenv import load_dotenv
from pathlib import Path
import os


# BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))





# PRIVATE_KEY_PATH = os.path.join(BASE_DIR, os.getenv("PRIVATE_KEY_PATH"))
# PUBLIC_KEY_PATH = os.path.join(BASE_DIR, os.getenv("PUBLIC_KEY_PATH"))

BASE_DIR = Path(__file__).resolve().parent
PRIVATE_KEY_PATH = BASE_DIR / "keys" / "private.pem"
PUBLIC_KEY_PATH = BASE_DIR / "keys" / "public.pem"

with open(PRIVATE_KEY_PATH, "r") as f:
    PRIVATE_KEY = f.read()

with open(PUBLIC_KEY_PATH, "r") as f:
    PUBLIC_KEY = f.read()
with open(PRIVATE_KEY_PATH, "r") as f:
    PRIVATE_KEY = f.read()

with open(PUBLIC_KEY_PATH, "r") as f:
    PUBLIC_KEY = f.read()



R_ALGORITHM = "RS256"