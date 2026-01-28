from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from starlette.middleware.sessions import SessionMiddleware
from backend.auth import router as auth_router
from backend.routers import characters
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Adventurers Ledger", description="A mobile-first D&D 5e 2024 Companion")

# Session Middleware is required for Authlib to store state (like 'nonces' and user info)
# In production, use a secure, random string for secret_key
app.add_middleware(SessionMiddleware, secret_key=os.getenv("SECRET_KEY", "unsafe-secret-key"))

# Include Auth Router
app.include_router(auth_router)
app.include_router(characters.router)

# Get absolute path to frontend directory
# Assuming main.py is in /backend/ and frontend is in /frontend/
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FRONTEND_DIR = os.path.join(BASE_DIR, "frontend")

# Mount static files
app.mount("/static", StaticFiles(directory=FRONTEND_DIR), name="static")

@app.get("/")
async def read_root():
    return FileResponse(os.path.join(FRONTEND_DIR, "index.html"))

@app.get("/create-character")
async def create_character_page():
    return FileResponse(os.path.join(FRONTEND_DIR, "create_character.html"))

@app.get("/character/{character_id}")
async def character_sheet_page(character_id: int):
    return FileResponse(os.path.join(FRONTEND_DIR, "character_sheet.html"))

@app.get("/health")
async def health_check():
    return {"status": "ok", "version": "0.1.0"}
