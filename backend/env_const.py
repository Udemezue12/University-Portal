import os
from datetime import datetime, timedelta

from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
RP_ID = os.getenv("DEV_RP_ID")
ORIGIN = os.getenv("DEV_ORIGIN")
login_challenges = {}
register_challenges = {}
jwt_expiration = datetime.utcnow() + timedelta(hours=1)
SECURE = os.getenv("secure")
