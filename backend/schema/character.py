from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional


class CharacterCreate(BaseModel):
    name: str
    description: str
    image_url: str
    category_id: int


class CharacterUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    category_id: Optional[int] = None


class CharacterResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    description: str
    image_url: str
    category_id: int
    created_at: datetime
    updated_at: datetime
>>>>>>> HoaSaving
