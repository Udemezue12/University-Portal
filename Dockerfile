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
FROM python:3.11-slim-bookworm

# Set working directory
WORKDIR /app

# Set PYTHONPATH so FastAPI can find the backend
ENV PYTHONPATH="/app/backend"

# Install system dependencies
RUN apt-get update && apt-get install -y build-essential curl && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend/ ./backend
COPY backend/alembic.ini ./alembic.ini
COPY backend/alembic ./alembic

# Copy prebuilt frontend (React) static files
COPY frontend/build ./frontend/build

# Expose default port
EXPOSE 8000

# Healthcheck for deployment platforms
HEALTHCHECK CMD curl --fail http://localhost:${PORT:-8000}/health || exit 1

# Run DB migrations and start the FastAPI server
CMD ["/bin/sh", "-c", "alembic upgrade head && uvicorn backend.app:app --host 0.0.0.0 --port ${PORT:-8000}"]
