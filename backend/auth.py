import os
from fastapi import APIRouter, Request, HTTPException, Depends
from starlette.responses import RedirectResponse
from authlib.integrations.starlette_client import OAuth
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()

oauth = OAuth()
oauth.register(
    name='google',
    client_id=os.getenv('GOOGLE_CLIENT_ID'),
    client_secret=os.getenv('GOOGLE_CLIENT_SECRET'),
    server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
    client_kwargs={
        'scope': 'openid email profile'
    }
)

@router.get("/login")
async def login(request: Request):
    """
    Redirects the user to the Google OAuth login page.
    IMPORTANT: The redirect_uri must match exactly what is configured in Google Cloud Console.
    For local dev, usually http://127.0.0.1:8000/auth/callback
    """
    redirect_uri = request.url_for('auth_callback')
    return await oauth.google.authorize_redirect(request, redirect_uri)

@router.get("/auth/callback")
async def auth_callback(request: Request):
    try:
        token = await oauth.google.authorize_access_token(request)
    except Exception as e:
        # Initial error handling if token exchange fails
        return {"error": str(e)}
        
    user_info = token.get('userinfo')
    
    if user_info:
        # Store user info in session
        request.session['user'] = dict(user_info)
        # Redirect to frontend dashboard or home
        return RedirectResponse(url='/')
    
    raise HTTPException(status_code=400, detail="Failed to retrieve user info")

@router.get("/logout")
async def logout(request: Request):
    request.session.pop('user', None)
    return RedirectResponse(url='/')

async def get_current_user(request: Request):
    user = request.session.get('user')
    if user:
        return user
    return None

@router.get("/user/me")
async def read_users_me(user: dict = Depends(get_current_user)):
    return user
