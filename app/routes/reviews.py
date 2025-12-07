from fastapi import APIRouter, HTTPException, status, Depends
from typing import List
from app.schemas.review import ReviewCreate, ReviewResponse, ProductRating, CanReviewResponse
from app.models.review import ReviewModel
from app.utils.dependencies import get_current_active_user, get_current_active_admin
from app.database import get_database

router = APIRouter(prefix="/api/reviews", tags=["Reviews"])


@router.post("", response_model=ReviewResponse, status_code=status.HTTP_201_CREATED)
async def create_review(
    data: ReviewCreate,
    current_user: dict = Depends(get_current_active_user)
):
    """
    Tạo review (User - phải đã mua và nhận hàng)
    Review sẽ hiển thị ngay sau khi tạo
    """
    db = get_database()
    
    # Kiểm tra đã mua và nhận hàng chưa
    check = ReviewModel.check_can_review(db, str(current_user["_id"]), data.product_id)
    if not check["can_review"]:
        raise HTTPException(status_code=400, detail=check["reason"])
    
    order_id = check.get("order_id")
    
    review = ReviewModel.create_review(db, {
        "user_id": str(current_user["_id"]),
        "product_id": data.product_id,
        "order_id": order_id,
        "rating": data.rating,
        "comment": data.comment
    })
    
    return ReviewModel.review_to_dict(review, db, include_user=True)


@router.get("/product/{product_id}", response_model=List[ReviewResponse])
async def get_product_reviews(product_id: str):
    """
    Lấy reviews của sản phẩm (Public)
    Chỉ hiển thị reviews không bị admin ẩn
    """
    db = get_database()
    reviews = ReviewModel.find_by_product(db, product_id)
    return [ReviewModel.review_to_dict(r, db, include_user=True) for r in reviews]


@router.get("/product/{product_id}/rating", response_model=ProductRating)
async def get_product_rating(product_id: str):
    """Lấy rating trung bình của sản phẩm (Public)"""
    db = get_database()
    return ReviewModel.get_product_rating(db, product_id)


@router.get("/product/{product_id}/can-review", response_model=CanReviewResponse)
async def check_can_review(
    product_id: str,
    current_user: dict = Depends(get_current_active_user)
):
    """Kiểm tra user có thể review sản phẩm không"""
    db = get_database()
    return ReviewModel.check_can_review(db, str(current_user["_id"]), product_id)


@router.get("/me", response_model=List[ReviewResponse])
async def get_my_reviews(
    current_user: dict = Depends(get_current_active_user)
):
    """Lấy reviews của tôi"""
    db = get_database()
    reviews = ReviewModel.find_by_user(db, str(current_user["_id"]))
    return [ReviewModel.review_to_dict(r, db, include_user=True) for r in reviews]


# ============ ADMIN ============

@router.get("/pending", response_model=List[ReviewResponse])
async def get_pending_reviews(
    admin: dict = Depends(get_current_active_admin)
):
    """Lấy reviews chờ duyệt (Admin)"""
    db = get_database()
    reviews = ReviewModel.find_pending(db)
    return [ReviewModel.review_to_dict(r, db, include_user=True) for r in reviews]


@router.post("/{review_id}/approve", response_model=ReviewResponse)
async def approve_review(
    review_id: str,
    admin: dict = Depends(get_current_active_admin)
):
    """Duyệt review (Admin)"""
    db = get_database()
    review = ReviewModel.approve_review(db, review_id)
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    return ReviewModel.review_to_dict(review, db, include_user=True)


@router.post("/{review_id}/hide", response_model=ReviewResponse)
async def hide_review(
    review_id: str,
    admin: dict = Depends(get_current_active_admin)
):
    """Ẩn review (Admin) - dùng khi review có dấu hiệu sai sự thật"""
    db = get_database()
    review = ReviewModel.hide_review(db, review_id)
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    return ReviewModel.review_to_dict(review, db, include_user=True)


@router.post("/{review_id}/unhide", response_model=ReviewResponse)
async def unhide_review(
    review_id: str,
    admin: dict = Depends(get_current_active_admin)
):
    """Hiện lại review đã ẩn (Admin)"""
    db = get_database()
    review = ReviewModel.unhide_review(db, review_id)
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    return ReviewModel.review_to_dict(review, db, include_user=True)


@router.get("/all", response_model=List[ReviewResponse])
async def get_all_reviews(
    admin: dict = Depends(get_current_active_admin)
):
    """Lấy tất cả reviews (Admin)"""
    db = get_database()
    reviews = list(db.reviews.find().sort("created_at", -1))
    return [ReviewModel.review_to_dict(r, db, include_user=True) for r in reviews]


@router.delete("/{review_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_review(
    review_id: str,
    admin: dict = Depends(get_current_active_admin)
):
    """Xóa review (Admin)"""
    db = get_database()
    from bson import ObjectId
    result = db.reviews.delete_one({"_id": ObjectId(review_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Review not found")
    return None
