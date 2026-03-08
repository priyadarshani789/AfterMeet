import json
import os
from pathlib import Path
from typing import Any, List, Dict
import asyncio

DB_PATH = Path(__file__).parent.parent / "db"
USERS_FILE = DB_PATH / "users.json"
TASKS_FILE = DB_PATH / "tasks.json"


def ensure_db_exists():
    """Ensure database directory and files exist"""
    DB_PATH.mkdir(parents=True, exist_ok=True)
    
    if not USERS_FILE.exists():
        default_users = [
            {"id": "1", "name": "Alice Johnson", "role": "Product Manager"},
            {"id": "2", "name": "Bob Smith", "role": "Developer"},
            {"id": "3", "name": "Carol White", "role": "Designer"},
            {"id": "4", "name": "David Brown", "role": "QA Engineer"},
        ]
        write_json(USERS_FILE, default_users)
    
    if not TASKS_FILE.exists():
        write_json(TASKS_FILE, [])


def read_json(filepath: Path) -> Any:
    """Read JSON file with error handling"""
    try:
        if not filepath.exists():
            return [] if "tasks" in str(filepath) else {}
        
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"Error reading {filepath}: {e}")
        return [] if "tasks" in str(filepath) else {}


def write_json(filepath: Path, data: Any) -> bool:
    """Write JSON file with error handling"""
    try:
        filepath.parent.mkdir(parents=True, exist_ok=True)
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        return True
    except Exception as e:
        print(f"Error writing {filepath}: {e}")
        return False


def get_users() -> List[Dict]:
    """Get all users"""
    ensure_db_exists()
    return read_json(USERS_FILE)


def get_tasks() -> List[Dict]:
    """Get all tasks"""
    ensure_db_exists()
    return read_json(TASKS_FILE)


def add_task(task_data: Dict) -> Dict:
    """Add a new task"""
    ensure_db_exists()
    tasks = get_tasks()
    tasks.append(task_data)
    write_json(TASKS_FILE, tasks)
    return task_data


def update_task(task_id: str, updates: Dict) -> Dict:
    """Update an existing task"""
    ensure_db_exists()
    tasks = get_tasks()
    
    for i, task in enumerate(tasks):
        if task["id"] == task_id:
            tasks[i].update(updates)
            tasks[i]["updated_at"] = str(datetime.now().isoformat())
            write_json(TASKS_FILE, tasks)
            return tasks[i]
    
    raise ValueError(f"Task {task_id} not found")


def delete_task(task_id: str) -> bool:
    """Delete a task"""
    ensure_db_exists()
    tasks = get_tasks()
    original_len = len(tasks)
    tasks = [t for t in tasks if t["id"] != task_id]
    write_json(TASKS_FILE, tasks)
    return len(tasks) < original_len


def get_task_by_id(task_id: str) -> Dict:
    """Get a specific task"""
    tasks = get_tasks()
    for task in tasks:
        if task["id"] == task_id:
            return task
    raise ValueError(f"Task {task_id} not found")


from datetime import datetime
