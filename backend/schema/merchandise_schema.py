from pydantic import BaseModel, ConfigDict
from typing import Optional, Literal


class MerchandiseCreate(BaseModel):
    category_id: int
    character_id: Optional[int] = None
    name: str
    tag: Optional[Literal[
        "Limited Edition",
        "Pre-Order",
        "Collectible"
    ]] = None
    is_upcoming: bool = False
    image_url: Optional[str] = None


class MerchandiseUpdate(BaseModel):
    category_id: Optional[int] = None
    character_id: Optional[int] = None
    name: Optional[str] = None
    tag: Optional[Literal[
        "Limited Edition",
        "Pre-Order",
        "Collectible"
    ]] = None
    is_upcoming: Optional[bool] = None
    image_url: Optional[str] = None


class MerchandiseResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    item_id: int
    category_id: int
    character_id: Optional[int] = None
    name: str
    tag: Optional[str] = None
    is_upcoming: bool
    image_url: Optional[str] = None