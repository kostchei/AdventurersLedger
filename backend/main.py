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

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FRONTEND_DIR = os.path.join(BASE_DIR, "frontend")
DIST_DIR = os.path.join(FRONTEND_DIR, "dist")
USE_DIST = os.path.isdir(DIST_DIR)

ASSETS_DIR = os.path.join(DIST_DIR, "assets") if USE_DIST else None

@app.get("/")
async def read_root():
    base_dir = DIST_DIR if USE_DIST else FRONTEND_DIR
    return FileResponse(os.path.join(base_dir, "index.html"))

@app.get("/create-character")
async def create_character_page():
    return FileResponse(os.path.join(FRONTEND_DIR, "create_character.html"))

@app.get("/character/{character_id}")
async def character_sheet_page(character_id: int):
    return FileResponse(os.path.join(FRONTEND_DIR, "character_sheet.html"))

@app.get("/health")
async def health_check():
    return {"status": "ok", "version": "0.1.0"}

# Static mounts should come last so API routes win.
if USE_DIST:
    if ASSETS_DIR and os.path.isdir(ASSETS_DIR):
        app.mount("/assets", StaticFiles(directory=ASSETS_DIR), name="assets")
    # Serve the built SPA (and static assets like /vite.svg).
    app.mount("/", StaticFiles(directory=DIST_DIR, html=True), name="frontend")
else:
    # Dev fallback: serve raw frontend files (requires Vite for modules).
    app.mount("/static", StaticFiles(directory=FRONTEND_DIR), name="static")
