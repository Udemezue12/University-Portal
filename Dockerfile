# ////FOR RENDER////////

# ---------- Build React Frontend ----------
# FROM node:18-bookworm AS frontend-builder

# WORKDIR /app/frontend

# COPY frontend/package.json frontend/package-lock.json ./
# RUN npm install

# COPY frontend/ ./
# RUN npm run build

# # ---------- Build FastAPI Backend ----------
# FROM python:3.11-slim-bookworm AS backend

# WORKDIR /app

# ENV PYTHONPATH="/app/backend"

# RUN apt-get update && apt-get install -y build-essential && rm -rf /var/lib/apt/lists/*

# COPY requirements.txt .
# RUN pip install --no-cache-dir -r requirements.txt

# # Copy backend files including alembic
# COPY backend/ ./backend
# COPY backend/alembic.ini ./alembic.ini
# COPY backend/alembic ./alembic


# # Copy built frontend into backend to serve with FastAPI
# COPY --from=frontend-builder /app/frontend/build ./frontend/build

# # Expose app port
# EXPOSE 8000

# # Run Alembic migration and start the app
# CMD alembic upgrade head && uvicorn backend.app:app --host 0.0.0.0 --port 8000


# /////FOR SEVALLA/////
# Use slim Python base image
FROM python:3.11-slim-bookworm

# Set working directory
WORKDIR /app

# Install system and build dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    gcc \
    g++ \
    libffi-dev \
    libpq-dev \
    libssl-dev \
    python3-dev \
    curl \
    gnupg \
    ca-certificates \
    && apt-get clean

# Upgrade pip and install Python build tools
RUN pip install --upgrade pip setuptools wheel build

# ---- FRONTEND BUILD ----

# Copy frontend code and build it
COPY frontend/ ./frontend
WORKDIR /app/frontend

# Install Node.js 18 and build React frontend
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get install -y nodejs && \
    npm install -g npm && \
    npm install && npm run build

# Return to base directory
WORKDIR /app

# ---- BACKEND SETUP ----

# Set Python path so FastAPI can find the backend
ENV PYTHONPATH="/app/backend"

# Copy backend code (before installing requirements in case of local packages)
COPY backend/ ./backend
COPY backend/alembic.ini ./alembic.ini
COPY backend/alembic ./alembic

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# ---- FINAL CONFIG ----

# Expose backend port
EXPOSE 8000

# Healthcheck endpoint (optional)
HEALTHCHECK CMD curl --fail http://localhost:${PORT:-8000}/health || exit 1

# Run Alembic DB migrations and start FastAPI app
CMD ["sh", "-c", "alembic upgrade head && uvicorn backend.app:app --host 0.0.0.0 --port ${PORT:-8000}"]
