import uuid
from datetime import datetime, timedelta
from typing import List, Dict, Optional
from app.utils.file_handler import get_users, get_tasks, add_task
import logging
import random

logger = logging.getLogger(__name__)


def auto_assign_owner(mentioned_name: Optional[str] = None) -> tuple[Optional[str], Optional[str]]:
    """
    Auto-assign task owner based on mentioned name or random selection.
    Returns tuple of (owner_id, owner_name)
    """
    users = get_users()
    
    if not users:
        return None, None
    
    # If owner is mentioned, try to find matching user
    if mentioned_name:
        mentioned_lower = mentioned_name.lower().strip()
        for user in users:
            if mentioned_lower in user["name"].lower():
                return user["id"], user["name"]
    
    # If not found or not mentioned, randomly assign
    selected_user = random.choice(users)
    return selected_user["id"], selected_user["name"]


def create_task_from_extracted_data(
    title: str,
    owner_name: Optional[str] = None,
    priority: str = "medium",
    deadline: Optional[str] = None,
    status: str = "todo"
) -> Dict:
    """Create a task object with auto-assignment if needed"""
    
    owner_id, assigned_owner_name = auto_assign_owner(owner_name)
    
    now = datetime.now().isoformat()
    task = {
        "id": str(uuid.uuid4()),
        "title": title,
        "owner_id": owner_id,
        "owner_name": assigned_owner_name,
        "priority": priority.lower() if priority else "medium",
        "status": status,
        "deadline": deadline,
        "created_at": now,
        "updated_at": now
    }
    
    return task


def process_and_save_tasks(
    extracted_tasks: List[Dict],
    default_owner_id: Optional[str] = None
) -> List[Dict]:
    """
    Process extracted tasks and save them to database.
    Apply auto-assignment logic.
    """
    saved_tasks = []
    
    for task_data in extracted_tasks:
        # Create task with auto-assignment
        task = create_task_from_extracted_data(
            title=task_data.get("title", "Untitled Task"),
            owner_name=task_data.get("owner", default_owner_id),
            priority=task_data.get("priority", "medium"),
            deadline=task_data.get("deadline"),
            status="todo"
        )
        
        # Save to database
        saved_task = add_task(task)
        saved_tasks.append(saved_task)
    
    return saved_tasks


def validate_task_data(task_data: Dict) -> bool:
    """Validate task data before saving"""
    required_fields = ["title"]
    return all(field in task_data and task_data[field] for field in required_fields)
