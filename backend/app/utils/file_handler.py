import json
import os
from pathlib import Path
from typing import Any, List, Dict
import asyncio
from datetime import datetime
import uuid

DB_PATH = Path(__file__).parent.parent / "db"
USERS_FILE = DB_PATH / "users.json"
TASKS_FILE = DB_PATH / "tasks.json"
PROJECTS_FILE = DB_PATH / "projects.json"
TRANSCRIPTS_FILE = DB_PATH / "transcripts.json"


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
    
    if not PROJECTS_FILE.exists():
        write_json(PROJECTS_FILE, [])
    
    if not TRANSCRIPTS_FILE.exists():
        write_json(TRANSCRIPTS_FILE, [])


def read_json(filepath: Path) -> Any:
    """Read JSON file with error handling"""
    try:
        if not filepath.exists():
            return []
        
        with open(filepath, 'r', encoding='utf-8-sig') as f:
            data = json.load(f)
            # Ensure we always return a list for data files
            return data if isinstance(data, list) else []
    except Exception as e:
        print(f"Error reading {filepath}: {e}")
        return []


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


def add_user(user_data: Dict) -> Dict:
    """Add a new user to global users list (if not already exists)"""
    ensure_db_exists()
    users = get_users()
    
    # Check if user already exists by name
    existing_user = next((u for u in users if u.get("name", "").lower() == user_data.get("name", "").lower()), None)
    if not existing_user:
        # Assign ID if not provided
        if "id" not in user_data:
            user_data["id"] = str(len(users) + 1)
        users.append(user_data)
        write_json(USERS_FILE, users)
        return user_data
    
    return existing_user


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


# ==================== PROJECT MANAGEMENT ====================

def get_projects() -> List[Dict]:
    """Get all projects"""
    ensure_db_exists()
    return read_json(PROJECTS_FILE)


def create_project(name: str, description: str = None) -> Dict:
    """Create a new project"""
    ensure_db_exists()
    projects = get_projects()
    
    project_id = str(uuid.uuid4())[:8]
    new_project = {
        "id": project_id,
        "name": name,
        "description": description or "",
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat(),
        "tasks": [],
        "users": []
    }
    
    projects.append(new_project)
    write_json(PROJECTS_FILE, projects)
    return new_project


def get_project(project_id: str) -> Dict:
    """Get a specific project by ID"""
    projects = get_projects()
    for project in projects:
        if project["id"] == project_id:
            return project
    raise ValueError(f"Project {project_id} not found")


def delete_project(project_id: str) -> bool:
    """Delete a project"""
    ensure_db_exists()
    projects = get_projects()
    original_len = len(projects)
    projects = [p for p in projects if p["id"] != project_id]
    write_json(PROJECTS_FILE, projects)
    return len(projects) < original_len


def add_task_to_project(project_id: str, task_data: Dict) -> Dict:
    """Add a task to a specific project"""
    ensure_db_exists()
    projects = get_projects()
    
    for i, project in enumerate(projects):
        if project["id"] == project_id:
            projects[i]["tasks"].append(task_data)
            projects[i]["updated_at"] = datetime.now().isoformat()
            write_json(PROJECTS_FILE, projects)
            return task_data
    
    raise ValueError(f"Project {project_id} not found")


def get_project_tasks(project_id: str) -> List[Dict]:
    """Get all tasks in a project"""
    project = get_project(project_id)
    return project.get("tasks", [])


def get_project_users(project_id: str) -> List[Dict]:
    """Get all users in a project"""
    project = get_project(project_id)
    return project.get("users", [])


def add_user_to_project(project_id: str, user_data: Dict) -> Dict:
    """Add a user to a project (extracted from transcript)"""
    ensure_db_exists()
    projects = get_projects()
    
    for i, project in enumerate(projects):
        if project["id"] == project_id:
            # Check if user already exists in project
            existing_user = next((u for u in project["users"] if u.get("name") == user_data.get("name")), None)
            if not existing_user:
                # Add to project
                projects[i]["users"].append(user_data)
                projects[i]["updated_at"] = datetime.now().isoformat()
                write_json(PROJECTS_FILE, projects)
                
                # Also add to global users.json
                try:
                    add_user(user_data)
                except Exception as e:
                    print(f"Warning: Failed to add user to global users.json: {e}")
            
            return user_data
    
    raise ValueError(f"Project {project_id} not found")


def update_project_task(project_id: str, task_id: str, updates: Dict) -> Dict:
    """Update a task in a project"""
    ensure_db_exists()
    projects = get_projects()
    
    for i, project in enumerate(projects):
        if project["id"] == project_id:
            for j, task in enumerate(project["tasks"]):
                if task["id"] == task_id:
                    project["tasks"][j].update(updates)
                    project["tasks"][j]["updated_at"] = datetime.now().isoformat()
                    projects[i]["updated_at"] = datetime.now().isoformat()
                    write_json(PROJECTS_FILE, projects)
                    return project["tasks"][j]
            raise ValueError(f"Task {task_id} not found in project")
    
    raise ValueError(f"Project {project_id} not found")


def delete_project_task(project_id: str, task_id: str) -> bool:
    """Delete a task from a project"""
    ensure_db_exists()
    projects = get_projects()
    
    for i, project in enumerate(projects):
        if project["id"] == project_id:
            original_len = len(project["tasks"])
            project["tasks"] = [t for t in project["tasks"] if t["id"] != task_id]
            if len(project["tasks"]) < original_len:
                projects[i]["updated_at"] = datetime.now().isoformat()
                write_json(PROJECTS_FILE, projects)
                return True
            return False
    
    raise ValueError(f"Project {project_id} not found")


def store_transcript_in_project(project_id: str, transcript: str, tasks_extracted: int = 0) -> Dict:
    """Store transcript in both project history and dedicated transcripts database with project metadata"""
    ensure_db_exists()
    projects = get_projects()
    
    # Find project and get its name
    project_name = None
    for project in projects:
        if project["id"] == project_id:
            project_name = project.get("name", "Unknown Project")
            break
    
    if not project_name:
        raise ValueError(f"Project {project_id} not found")
    
    # Create transcript record with metadata including project name
    transcript_record = {
        "id": str(uuid.uuid4()),
        "project_id": project_id,
        "project_name": project_name,
        "content": transcript,
        "tasks_extracted": tasks_extracted,
        "created_at": datetime.now().isoformat(),
        "length": len(transcript)
    }
    
    # Store in project's transcripts array
    for i, project in enumerate(projects):
        if project["id"] == project_id:
            # Initialize transcripts array if it doesn't exist
            if "transcripts" not in project:
                project["transcripts"] = []
            
            project["transcripts"].append(transcript_record)
            projects[i]["updated_at"] = datetime.now().isoformat()
            write_json(PROJECTS_FILE, projects)
            break
    
    # Also store in dedicated transcripts database
    transcripts = read_json(TRANSCRIPTS_FILE)
    transcripts.append(transcript_record)
    write_json(TRANSCRIPTS_FILE, transcripts)
    
    return transcript_record


def get_project_transcripts(project_id: str) -> List[Dict]:
    """Get all transcripts for a specific project from the transcripts database"""
    ensure_db_exists()
    transcripts = read_json(TRANSCRIPTS_FILE)
    # Filter transcripts for this project and sort by date (newest first)
    project_transcripts = [t for t in transcripts if t.get("project_id") == project_id]
    return sorted(project_transcripts, key=lambda x: x.get("created_at", ""), reverse=True)


def get_all_transcripts() -> List[Dict]:
    """Get all transcripts from the database"""
    ensure_db_exists()
    transcripts = read_json(TRANSCRIPTS_FILE)
    return sorted(transcripts, key=lambda x: x.get("created_at", ""), reverse=True)
