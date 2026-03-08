import uuid
from datetime import datetime, timedelta
from typing import List, Dict, Optional
from app.utils.file_handler import get_users, get_tasks, add_task
import logging
import random

logger = logging.getLogger(__name__)


def auto_assign_owner(mentioned_name: Optional[str] = None, available_users: Optional[List[Dict]] = None) -> tuple[Optional[str], Optional[str]]:
    """
    Auto-assign task owner based on mentioned name or random selection.
    Only assigns to available team members.
    Returns tuple of (owner_id, owner_name)
    
    Args:
        mentioned_name: Name to search for in users
        available_users: List of users to choose from. If None, uses global users.
    """
    # Use provided users or get from global list
    if available_users is None:
        users = get_users()
    else:
        users = available_users
    
    if not users:
        return None, None
    
    # Filter only available users (default availability is True if not specified)
    available_members = [u for u in users if u.get("availability", True)]
    
    # If no available members, fall back to all users
    if not available_members:
        logger.warning("⚠️ No available team members. Falling back to all members.")
        available_members = users
    
    # If owner is mentioned, try to find matching available user
    if mentioned_name:
        mentioned_lower = mentioned_name.lower().strip()
        for user in available_members:
            if mentioned_lower in user["name"].lower():
                availability_status = "✅ available" if user.get("availability", True) else "❌ unavailable"
                logger.info(f"Found matching user: {user['name']} ({availability_status})")
                return user["id"], user["name"]
    
    # If not found or not mentioned, randomly assign from available members
    selected_user = random.choice(available_members)
    availability_status = "✅ available" if selected_user.get("availability", True) else "❌ unavailable"
    logger.info(f"Auto-assigned task to: {selected_user['name']} ({availability_status})")
    return selected_user["id"], selected_user["name"]


def create_task_from_extracted_data(
    title: str,
    owner_name: Optional[str] = None,
    priority: str = "medium",
    deadline: Optional[str] = None,
    status: str = "todo",
    available_users: Optional[List[Dict]] = None
) -> Dict:
    """Create a task object with auto-assignment if needed"""
    
    owner_id, assigned_owner_name = auto_assign_owner(owner_name, available_users)
    
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
    default_owner_id: Optional[str] = None,
    available_users: Optional[List[Dict]] = None
) -> List[Dict]:
    """
    Process extracted tasks and save them to database.
    Apply auto-assignment logic.
    
    Args:
        extracted_tasks: List of tasks from AI extraction
        default_owner_id: Default owner if not found
        available_users: List of users to choose from for assignment. If None, uses global users.
    """
    saved_tasks = []
    
    for task_data in extracted_tasks:
        # Create task with auto-assignment
        task = create_task_from_extracted_data(
            title=task_data.get("title", "Untitled Task"),
            owner_name=task_data.get("owner", default_owner_id),
            priority=task_data.get("priority", "medium"),
            deadline=task_data.get("deadline"),
            status="todo",
            available_users=available_users
        )
        
        # Save to database
        saved_task = add_task(task)
        saved_tasks.append(saved_task)
    
    return saved_tasks


def validate_task_data(task_data: Dict) -> bool:
    """Validate task data before saving"""
    required_fields = ["title"]
    return all(field in task_data and task_data[field] for field in required_fields)
