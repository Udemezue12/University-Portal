# ---------- Build React Frontend ----------
FROM node:18-bookworm AS frontend-builder

# Set working directory inside the container for frontend
WORKDIR /app/frontend

# Install frontend dependencies
COPY frontend/package.json frontend/package-lock.json ./
RUN npm install

# Copy all frontend source files and build
COPY frontend/ ./
RUN npm run build


# ---------- Build FastAPI Backend ----------
FROM python:3.11-slim-bookworm AS backend

# Set working directory inside the container for backend
WORKDIR /app

# Set Python import path so FastAPI can find modules inside backend/
ENV PYTHONPATH="/app/backend"

# Install system dependencies
RUN apt-get update && apt-get install -y build-essential && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend application code
COPY backend/ ./backend
COPY backend/crm.db ./backend/crm.db

# Copy the React build folder into backend so it's served by FastAPI
COPY --from=frontend-builder /app/frontend/build ./frontend/build

#  Copy environment variables
# COPY .env .

# Expose port
EXPOSE 8000

# Start the FastAPI app using Uvicorn
CMD ["uvicorn", "backend.app:app", "--host", "0.0.0.0", "--port", "8000"]
