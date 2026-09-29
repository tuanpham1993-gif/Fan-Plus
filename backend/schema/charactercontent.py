from pydantic import BaseModel, ConfigDict


class CharacterContentCreate(BaseModel):
    content_id: int
    character_id: int


class CharacterContentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    content_id: int
    character_id: int