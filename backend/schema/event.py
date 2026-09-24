from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional
from decimal import Decimal


class EventCreate(BaseModel):
    content_id: int
    location_name: str
    city: str
    latitude: Decimal
    longitude: Decimal
    start_time: datetime
    end_time: Optional[datetime] = None
    register_url: Optional[str] = None


class EventUpdate(BaseModel):
    location_name: Optional[str] = None
    city: Optional[str] = None
    latitude: Optional[Decimal] = None
    longitude: Optional[Decimal] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    register_url: Optional[str] = None


class EventResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    content_id: int
    location_name: str
    city: str
    latitude: Decimal
    longitude: Decimal
    start_time: datetime
    end_time: Optional[datetime]
    register_url: Optional[str]
    created_at: datetime
    updated_at: datetime