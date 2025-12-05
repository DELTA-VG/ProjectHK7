from datetime import datetime
from typing import Optional, List
from bson import ObjectId


class FavouriteModel:
    """Favourite model for MongoDB operations"""

    @staticmethod
    def add_favourite(db, user_id: str, product_id: str) -> dict:
        """Add product to user's favourites"""
        favourite_doc = {
            "user_id": ObjectId(user_id),
            "product_id": ObjectId(product_id),
            "created_at": datetime.utcnow()
        }

        # Check if already exists
        existing = db.favourites.find_one({
            "user_id": ObjectId(user_id),
            "product_id": ObjectId(product_id)
        })

        if existing:
            return existing

        result = db.favourites.insert_one(favourite_doc)
        favourite_doc["_id"] = result.inserted_id
        return favourite_doc

    @staticmethod
    def remove_favourite(db, user_id: str, product_id: str) -> bool:
        """Remove product from user's favourites"""
        try:
            result = db.favourites.delete_one({
                "user_id": ObjectId(user_id),
                "product_id": ObjectId(product_id)
            })
            return result.deleted_count > 0
        except:
            return False

    @staticmethod
    def get_user_favourites(db, user_id: str, skip: int = 0, limit: int = 50) -> List[dict]:
        """Get all favourites for a user with product details"""
        try:
            pipeline = [
                # Match favourites for this user
                {
                    "$match": {"user_id": ObjectId(user_id)}
                },
                # Lookup product details
                {
                    "$lookup": {
                        "from": "products",
                        "localField": "product_id",
                        "foreignField": "_id",
                        "as": "product"
                    }
                },
                # Unwind product array
                {
                    "$unwind": "$product"
                },
                # Filter only available products
                {
                    "$match": {"product.is_available": True}
                },
                # Sort by newest first
                {
                    "$sort": {"created_at": -1}
                },
                # Pagination
                {
                    "$skip": skip
                },
                {
                    "$limit": limit
                },
                # Project fields
                {
                    "$project": {
                        "_id": 0,
                        "favourite_id": {"$toString": "$_id"},
                        "added_at": "$created_at",
                        "product": {
                            "id": {"$toString": "$product._id"},
                            "name": "$product.name",
                            "category": "$product.category",
                            "price": "$product.price",
                            "description": "$product.description",
                            "image": "$product.image",
                            "badge": "$product.badge",
                            "is_available": "$product.is_available"
                        }
                    }
                }
            ]

            favourites = list(db.favourites.aggregate(pipeline))
            return favourites
        except Exception as e:
            print(f"Error getting favourites: {e}")
            return []

    @staticmethod
    def check_is_favourite(db, user_id: str, product_id: str) -> bool:
        """Check if product is in user's favourites"""
        try:
            exists = db.favourites.find_one({
                "user_id": ObjectId(user_id),
                "product_id": ObjectId(product_id)
            })
            return exists is not None
        except:
            return False

    @staticmethod
    def count_user_favourites(db, user_id: str) -> int:
        """Count user's favourites"""
        try:
            return db.favourites.count_documents({"user_id": ObjectId(user_id)})
        except:
            return 0

    @staticmethod
    def clear_user_favourites(db, user_id: str) -> bool:
        """Clear all favourites for a user"""
        try:
            result = db.favourites.delete_many({"user_id": ObjectId(user_id)})
            return result.deleted_count > 0
        except:
            return False