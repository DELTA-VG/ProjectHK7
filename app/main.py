from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.database import connect_to_mongo, close_mongo_connection
from app.config import settings
from app.models.user import UserModel
from app.utils.security import verify_password

# Import từng router với try-except
from app.routes import auth, products, questions, favourites

print("✓ Auth router imported")
print("✓ Products router imported")
print("✓ Questions router imported")
print("✓ Favourites router imported")

# Import cart riêng để bắt lỗi
try:
    from app.routes import cart
    print("✓ Cart router imported successfully!")
    print(f"  Cart prefix: {cart.router.prefix}")
    print(f"  Cart routes: {len(cart.router.routes)}")
except ImportError as e:
    print(f"❌ IMPORT ERROR: {e}")
    import traceback
    traceback.print_exc()
    # Tạo dummy để app vẫn chạy
    class DummyCart:
        class DummyRouter:
            prefix = "/api/cart"
            routes = []
        router = DummyRouter()
    cart = DummyCart()
except Exception as e:
    print(f"❌ OTHER ERROR: {e}")
    import traceback
    traceback.print_exc()
    class DummyCart:
        class DummyRouter:
            prefix = "/api/cart"
            routes = []
        router = DummyRouter()
    cart = DummyCart()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup and shutdown events"""
    print("Starting up...")
    db = connect_to_mongo()
    create_default_admin(db)
    yield
    print("Shutting down...")
    close_mongo_connection()


def create_default_admin(db):
    """Create default admin user on startup if not exists"""
    admin_email = "admin111@sweetbakery.com"
    admin_password = "admin111"

    existing_admin = UserModel.find_by_email(db, admin_email)

    if not existing_admin:
        print(f"Creating default admin user: {admin_email}")
        UserModel.create_user(db, {
            "email": admin_email,
            "password": admin_password,
            "full_name": "Default Admin",
            "phone": "0000000000"
        }, role="admin")
        print(f"✓ Default admin created successfully!")
        print(f"  Email: {admin_email}")
        print(f"  Password: {admin_password}")
    else:
        if verify_password(admin_password, existing_admin["password"]):
            print(f"✓ Default admin already exists: {admin_email}")
        else:
            print(f"✓ Admin user exists: {admin_email}")


app = FastAPI(
    title="Sweet Bakery API",
    description="Backend API for Sweet Bakery",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:8080",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(products.router)
app.include_router(questions.router)
app.include_router(favourites.router)

print(f"⚙️ Including cart router...")
try:
    app.include_router(cart.router)
    print(f"✓ Cart router included successfully!")
except Exception as e:
    print(f"❌ FAILED TO INCLUDE CART ROUTER: {e}")
    import traceback
    traceback.print_exc()

# Debug: Print all routes
print("\n===== REGISTERED ROUTES =====")
for route in app.routes:
    if hasattr(route, 'methods') and hasattr(route, 'path'):
        methods = ', '.join(route.methods)
        print(f"{methods:15} {route.path}")
print("=============================\n")


@app.get("/")
async def root():
    return {
        "message": "Welcome to Sweet Bakery API",
        "docs": "/docs",
        "version": "1.0.0"
    }


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "database": "connected",
        "version": "1.0.0"
    }