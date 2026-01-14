from datetime import datetime
from typing import Optional
from pydantic import BaseModel

class SensorDataRegion1(BaseModel):
    id: int
    getaran: float
    suhu: Optional[float] = None
    gas: Optional[float] = None
    timestamp: datetime
    wilayah: Optional[str] = "region1"

class SensorDataRegion2(BaseModel):
    id: int
    getaran: float
    tekanan: Optional[float] = None
    timestamp: datetime
    wilayah: Optional[str] = "region2"

class ServoCommand(BaseModel):
    angle: Optional[int] = None  # 0..180
    action: Optional[str] = None # "open"|"close"|"center"