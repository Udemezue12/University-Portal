from dotenv import load_dotenv
import os


BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

load_dotenv(os.path.join(BASE_DIR, ".env"))



PRIVATE_KEY_PATH = os.path.join(BASE_DIR, os.getenv("PRIVATE_KEY_PATH"))
PUBLIC_KEY_PATH = os.path.join(BASE_DIR, os.getenv("PUBLIC_KEY_PATH"))

# Read keys
with open(PRIVATE_KEY_PATH, "r") as f:
    PRIVATE_KEY = f.read()

with open(PUBLIC_KEY_PATH, "r") as f:
    PUBLIC_KEY = f.read()


# JWT Algorithm
R_ALGORITHM = os.getenv("R_ALGORITHM")