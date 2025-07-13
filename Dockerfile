# ---------- Build React Frontend ----------
FROM node:18-bookworm AS frontend-builder

WORKDIR /app/frontend

COPY frontend/package.json frontend/package-lock.json ./
RUN npm install

COPY frontend/ ./
RUN npm run build

# ---------- Build FastAPI Backend ----------
FROM python:3.11-slim-bookworm AS backend

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y build-essential && apt-get clean


COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend 
COPY backend/ ./backend

# Copy built React  files into backend
COPY --from=frontend-builder /app/frontend/build ./frontend/build

# Copy environment variables
COPY .env .

EXPOSE 8000

CMD ["uvicorn", "backend.app:app", "--host", "0.0.0.0", "--port", "8000"]
