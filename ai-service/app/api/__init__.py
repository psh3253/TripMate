from fastapi import APIRouter
from app.api.recommend import router as recommend_router

router = APIRouter()
router.include_router(recommend_router)
