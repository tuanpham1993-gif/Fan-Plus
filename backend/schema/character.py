import os

from pydantic import BaseModel, ConfigDict
from typing import Optional


ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
MAX_IMAGE_SIZE = 2 * 1024 * 1024


def validate_image_file(file_obj):
    """Validates uploaded image file size and extension."""
    if not file_obj:
        return True, None

    filename = getattr(file_obj, "filename", "")

    if not filename:
        return True, None

    ext = os.path.splitext(filename)[1].lower()

    if ext not in ALLOWED_IMAGE_EXTENSIONS:
        return False, "Invalid image extension. Allowed: .jpg, .jpeg, .png, .webp"

    file_obj.seek(0, os.SEEK_END)
    size = file_obj.tell()
    file_obj.seek(0)

    if size > MAX_IMAGE_SIZE:
        return False, "Image size exceeds maximum limit of 2MB"

    return True, None


def validate_image_url(url_str):
    """Validates image URL or filename extension if provided."""
    if not url_str or not isinstance(url_str, str):
        return True, None

    clean_url = url_str.split("?")[0].split("#")[0]
    ext = os.path.splitext(clean_url)[1].lower()

    if ext and ext not in ALLOWED_IMAGE_EXTENSIONS:
        return False, "Invalid image extension. Allowed: .jpg, .jpeg, .png, .webp"

    return True, None


class CharacterCreate(BaseModel):
    category_id: int
    name: str
    bio: Optional[str] = None
    image_url: Optional[str] = None


class CharacterUpdate(BaseModel):
    category_id: Optional[int] = None
    name: Optional[str] = None
    bio: Optional[str] = None
    image_url: Optional[str] = None


class CharacterResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    character_id: int
    category_id: int
    name: str
    bio: Optional[str] = None
    image_url: Optional[str] = None
