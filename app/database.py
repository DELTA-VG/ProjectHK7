from pymongo import MongoClient
from pymongo.errors import ConnectionFailure
from app.config import settings

# MongoDB Client
client = None
db = None


def connect_to_mongo():

    global client, db
    try:
        client = MongoClient(settings.MONGODB_URL)
        client.admin.command('ping')
        db = client[settings.MONGODB_DB_NAME]
        print(f"✅ Connected to MongoDB: {settings.MONGODB_DB_NAME}")

        create_indexes()

        return db
    except ConnectionFailure as e:
        print(f"Could not connect to MongoDB: {e}")
        raise


def create_indexes():
    global db

    db.users.create_index("email", unique=True)
    db.users.create_index("role")

    db.products.create_index("category")
    db.products.create_index("name")
    db.products.create_index("is_available")

    # Favourites indexes
    db.favourites.create_index([("user_id", 1), ("product_id", 1)], unique=True)
    db.favourites.create_index("user_id")
    db.favourites.create_index("product_id")
    db.favourites.create_index("created_at")

    # Cart indexes
    db.cart.create_index([("user_id", 1), ("product_id", 1)], unique=True)
    db.cart.create_index("user_id")
    db.cart.create_index("product_id")
    db.cart.create_index("created_at")

    print("✅ Database indexes created")


def close_mongo_connection():
    global client
    if client:
        client.close()
        print("🔌 Disconnected from MongoDB")


def get_database():
    return db