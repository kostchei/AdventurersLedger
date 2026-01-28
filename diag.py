from backend.database import SessionLocal
from backend.models import User, Character

db = SessionLocal()
try:
    print("Testing connection...")
    user = db.query(User).first()
    print(f"Found user: {user.email if user else 'None'}")
    
    if user:
        print(f"User ID: {user.id}")
        print("Fetching characters for user...")
        chars = user.characters
        print(f"Character count: {len(chars)}")
except Exception as e:
    print(f"Error caught: {e}")
    import traceback
    traceback.print_exc()
finally:
    db.close()
