from pydantic import BaseModel, ConfigDict
from datetime import datetime


class ContentMediaCreate(BaseModel):
    content_id: int
    media_type: str
    media_url: str
    display_order: int = 0

class ContentMediaResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    content_id: int
    media_type: str
    media_url: str
    display_order: int
    created_at: datetime