from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class User(BaseModel):
    id: str
    name: str
    role: str

class Task(BaseModel):
    id: str = Field(default_factory=lambda: str(datetime.now().timestamp()))
    title: str
    owner_id: Optional[str] = None
    owner_name: Optional[str] = None
    priority: str = "medium"  # high, medium, low
    status: str = "todo"  # todo, in_progress, done
    deadline: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

class TaskRequest(BaseModel):
    title: str
    owner_id: Optional[str] = None
    owner_name: Optional[str] = None
    priority: str = "medium"
    deadline: Optional[str] = None

class TranscriptRequest(BaseModel):
    transcript: str
    owner_id: Optional[str] = None

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    owner_id: Optional[str] = None
    owner_name: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    deadline: Optional[str] = None
