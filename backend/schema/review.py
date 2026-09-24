from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime
from typing import Optional


class ReviewCreate(BaseModel):
    content_id: int
    rating: int = Field(ge=0, le=5)
    comment: Optional[str] = None


class ReviewUpdate(BaseModel):
    rating: Optional[int] = Field(
        default=None,
        ge=0,
        le=5
    )
    comment: Optional[str] = None


class ReviewResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    content_id: int
    rating: int
    comment: Optional[str]
    created_at: datetime
    updated_at: datetime