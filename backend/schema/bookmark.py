from pydantic import BaseModel, ConfigDict
from datetime import datetime


class BookmarkCreate(BaseModel):
    content_id: int

class BookmarkResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    content_id: int
    created_at: datetime
    