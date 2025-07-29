# ////FOR RENDER////////

---------- Build React Frontend ----------
FROM node:18-bookworm AS frontend-builder

WORKDIR /app/frontend

COPY frontend/package.json frontend/package-lock.json ./
RUN npm install

COPY frontend/ ./
RUN npm run build

# ---------- Build FastAPI Backend ----------
FROM python:3.11-slim-bookworm AS backend

WORKDIR /app

ENV PYTHONPATH="/app/backend"

RUN apt-get update && apt-get install -y build-essential && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend files including alembic
COPY backend/ ./backend
COPY backend/alembic.ini ./alembic.ini
COPY backend/alembic ./alembic


# Copy built frontend into backend to serve with FastAPI
COPY --from=frontend-builder /app/frontend/build ./frontend/build

# Expose app port
EXPOSE 8000


CMD alembic upgrade head && uvicorn backend.app:app --host 0.0.0.0 --port 8000


# /////FOR SEVALLA/////
# ---------- Stage 1: Build React Frontend ----------
# FROM node:18-bookworm AS frontend-builder

# WORKDIR /app/frontend

# COPY frontend/package.json frontend/package-lock.json ./
# RUN npm install

# COPY frontend/ ./
# RUN npm run build

# # ---------- Stage 2: Backend + Final Container ----------
# FROM python:3.11-slim-bookworm AS final

# # Environment Setup
# ENV PYTHONDONTWRITEBYTECODE=1 \
#     PYTHONUNBUFFERED=1 \
#     PYTHONPATH=/app/backend 

# # Create work directory
# WORKDIR /app

# # Install system dependencies
# RUN apt-get update && apt-get install -y \
#     gcc \
#     libpq-dev \
#     openssl \
#     && rm -rf /var/lib/apt/lists/*

# # Install Python dependencies
# COPY requirements.txt .
# RUN pip install --upgrade pip && pip install -r requirements.txt

# # Copy backend source
# COPY backend/ ./backend

# # Copy alembic (if used)
# COPY backend/alembic.ini ./alembic.ini
# COPY backend/alembic ./alembic

# # Generate RSA keys inside container
# RUN mkdir -p /app/backend/keys && \
#     openssl genrsa -out /app/backend/keys/private.pem 2048 && \
#     openssl rsa -in /app/backend/keys/private.pem -pubout -out /app/backend/keys/public.pem

# # Copy built frontend into backend for FastAPI to serve
# COPY --from=frontend-builder /app/frontend/build ./frontend/build


# EXPOSE 8000


# CMD alembic upgrade head && uvicorn backend.app:app --host 0.0.0.0 --port 8000
