
import os
import uvicorn
from pathlib import Path
from starlette.middleware.sessions import SessionMiddleware
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from passlib.context import CryptContext
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from passkey_views.passkey_routes import passkey_router
from auth.auth_routes import auth_router
from school_views.course_routes import router as course_router
from school_routes.assign_routes import router as assign_router
from school_views.department_routes import router as department_router
from school_views.enrollment_routes import router as enrollment_router
from school_views.faculty_routes import router as faculty_router
from school_views.lecturer_routes import router as lecturer_router
from school_views.admin_views import admin_router
from school_views.student_result import result_router
from school_views.schoolLevels import router as levels_router
from school_views.assignment import router as assignment_router
from school_views.ai_routes import openai_router
from school_views.session_routes import router as session_router
from school_views.student_routes import router as student_router
from session_views import session_router as session_views
from Apptoken import csrf_router
from session import SessionTimeoutMiddleware as TimeOut
from notify import manager
from configs import UPLOAD_DIR
from validators import SECRET_KEY
app = FastAPI()
BASE_DIR = Path(__file__).resolve().parent

app.include_router(csrf_router)
app.include_router(result_router)
app.include_router(admin_router)
app.include_router(auth_router)
app.include_router(passkey_router)
app.include_router(course_router)
app.include_router(assignment_router)
app.include_router(assign_router)
app.include_router(department_router)
app.include_router(enrollment_router)
app.include_router(faculty_router)
app.include_router(lecturer_router)
app.include_router(levels_router)
app.include_router(session_router)
app.include_router(student_router)
app.include_router(openai_router)
app.include_router(session_views)
app.include_router(auth_router)

# app.add_middleware(TimeOut, timeout_minutes=5)

app.add_middleware(
    CORSMiddleware,
    allow_origins=['http://localhost:7000',
                   'http://locahost:5000', 'http://localhost:3000'],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
pwd_context = CryptContext(schemes=['bcrypt'], deprecated='auto')
app.mount(
    "/static",
    StaticFiles(directory=BASE_DIR.parent / "frontend" / "build" / "static"),
    name="static"
)


app.mount(
    "/uploads",
    StaticFiles(directory=BASE_DIR / "uploads"),
    name="uploads"
)


@app.on_event("startup")
def create_upload_folder():
    try:
        os.makedirs(UPLOAD_DIR, exist_ok=True)
    except Exception as e:
        print(f"Upload folder creation failed: {e}")


@app.get("/")
def read_index():
    return FileResponse(BASE_DIR.parent / "frontend" / "build" / "index.html")


@app.get("/{full_path:path}")
async def catch_all(full_path: str):
    potential_file = BASE_DIR.parent / "frontend" / "build" / full_path
    if potential_file.exists() and potential_file.is_file():
        return FileResponse(potential_file)
    return FileResponse(BASE_DIR.parent / "frontend" / "build" / "index.html")


@app.websocket("/ws/notifications")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

app.add_middleware(
    SessionMiddleware, secret_key=SECRET_KEY)
if __name__ == "__main__":

    uvicorn.run(app, host="127.0.0.1", port=8000, reload=True)
