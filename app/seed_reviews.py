"""
Seed data cho Reviews
Chạy: python -m app.seed_reviews
"""

from datetime import datetime, timedelta
from bson import ObjectId
from pymongo import MongoClient
from app.config import settings
import random

# Kết nối MongoDB
client = MongoClient(settings.MONGODB_URL)
db = client[settings.MONGODB_DB_NAME]

# Sample comments
POSITIVE_COMMENTS = [
    "Bánh rất ngon, gia đình tôi ai cũng thích!",
    "Chất lượng tuyệt vời, sẽ mua lại lần sau.",
    "Giao hàng nhanh, bánh tươi ngon.",
    "Đóng gói cẩn thận, bánh không bị hư.",
    "Vị ngọt vừa phải, rất hợp khẩu vị.",
    "Bánh mềm, thơm, đúng như mô tả.",
    "Giá cả hợp lý, chất lượng tốt.",
    "Sẽ giới thiệu cho bạn bè!",
    "Lần đầu mua và rất hài lòng.",
    "Bánh sinh nhật đẹp, con tôi rất thích!",
]

NEUTRAL_COMMENTS = [
    "Bánh ổn, không có gì đặc biệt.",
    "Giao hàng hơi chậm nhưng bánh vẫn ngon.",
    "Vị hơi ngọt so với khẩu vị của tôi.",
    "Bánh nhỏ hơn tôi tưởng.",
]

NEGATIVE_COMMENTS = [
    "Bánh hơi khô, không như kỳ vọng.",
    "Giao hàng chậm, bánh bị méo.",
]


def seed_reviews():
    """Tạo seed data cho reviews"""
    
    # Lấy danh sách users (không phải admin)
    users = list(db.users.find({"role": {"$ne": "admin"}}).limit(10))
    if not users:
        print("❌ Không có user nào trong database. Hãy tạo user trước!")
        return
    
    # Lấy danh sách products
    products = list(db.products.find({"is_available": True}).limit(20))
    if not products:
        print("❌ Không có product nào trong database. Hãy tạo product trước!")
        return
    
    # Lấy danh sách orders đã delivered
    orders = list(db.orders.find({"status": "delivered"}).limit(20))
    
    print(f"📊 Found {len(users)} users, {len(products)} products, {len(orders)} delivered orders")
    
    # Xóa reviews cũ (optional)
    # db.reviews.delete_many({})
    # print("🗑️ Deleted old reviews")
    
    reviews_to_insert = []
    
    # Tạo reviews từ orders đã delivered
    for order in orders:
        user_id = order["user_id"]
        
        for item in order.get("items", []):
            product_id = item.get("product_id")
            if not product_id:
                continue
            
            # Kiểm tra đã review chưa
            existing = db.reviews.find_one({
                "user_id": ObjectId(user_id) if isinstance(user_id, str) else user_id,
                "product_id": ObjectId(product_id) if isinstance(product_id, str) else product_id
            })
            if existing:
                continue
            
            # Random rating và comment
            rating = random.choices([5, 4, 3, 2, 1], weights=[40, 30, 15, 10, 5])[0]
            
            if rating >= 4:
                comment = random.choice(POSITIVE_COMMENTS)
            elif rating == 3:
                comment = random.choice(NEUTRAL_COMMENTS)
            else:
                comment = random.choice(NEGATIVE_COMMENTS)
            
            # Random ngày tạo (trong 30 ngày gần đây)
            days_ago = random.randint(1, 30)
            created_at = datetime.utcnow() - timedelta(days=days_ago)
            
            review = {
                "user_id": ObjectId(user_id) if isinstance(user_id, str) else user_id,
                "product_id": ObjectId(product_id) if isinstance(product_id, str) else product_id,
                "order_id": order["_id"],
                "rating": rating,
                "comment": comment,
                "is_approved": True,
                "is_hidden": False,
                "created_at": created_at,
                "updated_at": created_at
            }
            reviews_to_insert.append(review)
    
    # Nếu không có orders, tạo reviews giả từ users và products
    if not reviews_to_insert:
        print("⚠️ Không có orders delivered, tạo reviews giả...")
        
        for i, product in enumerate(products[:10]):
            # Chọn random user
            user = random.choice(users)
            
            # Random rating
            rating = random.choices([5, 4, 3, 2, 1], weights=[40, 30, 15, 10, 5])[0]
            
            if rating >= 4:
                comment = random.choice(POSITIVE_COMMENTS)
            elif rating == 3:
                comment = random.choice(NEUTRAL_COMMENTS)
            else:
                comment = random.choice(NEGATIVE_COMMENTS)
            
            days_ago = random.randint(1, 30)
            created_at = datetime.utcnow() - timedelta(days=days_ago)
            
            review = {
                "user_id": user["_id"],
                "product_id": product["_id"],
                "order_id": None,  # Không có order thật
                "rating": rating,
                "comment": comment,
                "is_approved": True,
                "is_hidden": random.random() < 0.1,  # 10% bị ẩn
                "created_at": created_at,
                "updated_at": created_at
            }
            reviews_to_insert.append(review)
    
    # Insert reviews
    if reviews_to_insert:
        result = db.reviews.insert_many(reviews_to_insert)
        print(f"✅ Inserted {len(result.inserted_ids)} reviews")
    else:
        print("⚠️ Không có reviews nào để insert")
    
    # Hiển thị thống kê
    total = db.reviews.count_documents({})
    visible = db.reviews.count_documents({"is_hidden": False})
    hidden = db.reviews.count_documents({"is_hidden": True})
    
    print(f"\n📊 Review Statistics:")
    print(f"   Total: {total}")
    print(f"   Visible: {visible}")
    print(f"   Hidden: {hidden}")


if __name__ == "__main__":
    seed_reviews()
    client.close()
