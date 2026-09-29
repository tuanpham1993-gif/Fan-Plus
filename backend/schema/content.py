from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional


class ContentCreate(BaseModel):
    category_id: int
    title: str
    body: str
    content_type: str


class ContentUpdate(BaseModel):
    category_id: Optional[int] = None
    title: Optional[str] = None
    body: Optional[str] = None
    content_type: Optional[str] = None
    status: Optional[str] = None


class ContentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    author_id: int
    category_id: int
    title: str
    body: str
    content_type: str
    status: str
    created_at: datetime
    updated_at: datetime