from fastapi import APIRouter, HTTPException, status
from fastapi.responses import JSONResponse
from typing import List
import logging
import time

from app.models import Task, TaskRequest, TranscriptRequest, TaskUpdate, ProjectCreateRequest, ProjectTranscriptRequest
from app.services import ai_service, task_service
from app.utils.file_handler import (
    get_users, get_tasks, update_task, delete_task, get_task_by_id,
    get_projects, create_project, get_project, delete_project,
    add_task_to_project, get_project_tasks, get_project_users,
    add_user_to_project, update_project_task, delete_project_task,
    store_transcript_in_project, get_project_transcripts
)

logger = logging.getLogger(__name__)
router = APIRouter()

# Track concurrent extract-tasks requests
extract_request_count = 0
last_extract_request_time = 0


@router.get("/users", response_model=List[dict])
async def get_all_users():
    """Get all registered users"""
    try:
        users = get_users()
        return users
    except Exception as e:
        logger.error(f"Error fetching users: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch users")


@router.get("/tasks", response_model=List[dict])
async def get_all_tasks():
    """Get all tasks"""
    try:
        tasks = get_tasks()
        return tasks
    except Exception as e:
        logger.error(f"Error fetching tasks: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch tasks")


@router.get("/tasks/{task_id}", response_model=dict)
async def get_task(task_id: str):
    """Get a specific task by ID"""
    try:
        task = get_task_by_id(task_id)
        return task
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error fetching task {task_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch task")


@router.post("/extract-tasks", response_model=List[dict])
async def extract_tasks_endpoint(request: TranscriptRequest):
    """
    Extract tasks from meeting transcript using Gemini or Azure OpenAI.
    
    - Accept transcript text
    - Send transcript to AI model
    - Extract structured tasks
    - Save tasks to database
    - Return list of created tasks
    """
    global extract_request_count, last_extract_request_time
    
    extract_request_count += 1
    current_count = extract_request_count
    current_time = time.time()
    time_since_last = current_time - last_extract_request_time if last_extract_request_time else 0
    last_extract_request_time = current_time
    
    logger.warning(f"[REQUEST #{current_count}] Extract-tasks endpoint called. Time since last request: {time_since_last:.2f}s")
    
    try:
        if not request.transcript or not request.transcript.strip():
            raise HTTPException(
                status_code=400,
                detail="Transcript text cannot be empty"
            )

        logger.warning(f"[REQUEST #{current_count}] Starting AI extraction...")
        # Extract tasks from transcript (single API call - no embeddings needed)
        extracted_tasks = await ai_service.extract_tasks_from_transcript(
            transcript=request.transcript,
            context=None,
            default_owner_id=request.owner_id
        )
        logger.warning(f"[REQUEST #{current_count}] AI extraction complete. Got {len(extracted_tasks)} tasks")

        # Process and save tasks with auto-assignment
        saved_tasks = task_service.process_and_save_tasks(
            extracted_tasks=extracted_tasks,
            default_owner_id=request.owner_id
        )
        
        logger.warning(f"[REQUEST #{current_count}] Tasks saved. Returning to client")
        return saved_tasks

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[REQUEST #{current_count}] Error extracting tasks: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to extract tasks: {str(e)}"
        )


@router.put("/tasks/{task_id}", response_model=dict)
async def update_task_endpoint(task_id: str, updates: TaskUpdate):
    """Update a task"""
    try:
        # Filter out None values to only update provided fields
        update_data = {k: v for k, v in updates.dict().items() if v is not None}
        
        if not update_data:
            raise HTTPException(
                status_code=400,
                detail="No fields to update"
            )
        
        updated_task = update_task(task_id, update_data)
        return updated_task

    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating task {task_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to update task")


@router.delete("/tasks/{task_id}")
async def delete_task_endpoint(task_id: str):
    """Delete a task"""
    try:
        success = delete_task(task_id)
        if not success:
            raise HTTPException(status_code=404, detail="Task not found")
        
        return {"message": "Task deleted successfully"}

    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error deleting task {task_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete task")


# ==================== PROJECT MANAGEMENT ====================

@router.get("/projects", response_model=List[dict])
async def get_all_projects():
    """Get all projects"""
    try:
        projects = get_projects()
        return projects
    except Exception as e:
        logger.error(f"Error fetching projects: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch projects")


@router.post("/projects", response_model=dict)
async def create_project_endpoint(request: ProjectCreateRequest):
    """Create a new project"""
    try:
        if not request.name or not request.name.strip():
            raise HTTPException(
                status_code=400,
                detail="Project name cannot be empty"
            )
        
        project = create_project(request.name, request.description)
        logger.info(f"✅ Project created: {project['name']} (ID: {project['id']})")
        return project
    except Exception as e:
        logger.error(f"Error creating project: {e}")
        raise HTTPException(status_code=500, detail="Failed to create project")


@router.get("/projects/{project_id}", response_model=dict)
async def get_project_endpoint(project_id: str):
    """Get a specific project"""
    try:
        project = get_project(project_id)
        return project
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error fetching project {project_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch project")


@router.delete("/projects/{project_id}")
async def delete_project_endpoint(project_id: str):
    """Delete a project"""
    try:
        success = delete_project(project_id)
        if not success:
            raise HTTPException(status_code=404, detail="Project not found")
        
        return {"message": "Project deleted successfully"}
    except Exception as e:
        logger.error(f"Error deleting project {project_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete project")


@router.get("/projects/{project_id}/tasks", response_model=List[dict])
async def get_project_tasks_endpoint(project_id: str):
    """Get all tasks in a project"""
    try:
        tasks = get_project_tasks(project_id)
        return tasks
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error fetching tasks for project {project_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch tasks")


@router.get("/projects/{project_id}/users", response_model=List[dict])
async def get_project_users_endpoint(project_id: str):
    """Get all users in a project (extracted from transcripts)"""
    try:
        users = get_project_users(project_id)
        return users
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error fetching users for project {project_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch users")


@router.post("/projects/{project_id}/users", response_model=dict)
async def add_user_to_project_endpoint(project_id: str, user_data: dict):
    """Add a team member to a project"""
    try:
        # Verify project exists
        get_project(project_id)
        
        if not user_data.get("name"):
            raise HTTPException(
                status_code=400,
                detail="User name is required"
            )
        
        user = {
            "id": str(time.time()),
            "name": user_data.get("name"),
            "role": user_data.get("role", "Team Member")
        }
        
        added_user = add_user_to_project(project_id, user)
        logger.info(f"✅ User {user['name']} added to project {project_id}")
        return added_user
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error adding user to project {project_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to add user")


@router.get("/projects/{project_id}/transcripts", response_model=List[dict])
async def get_project_transcripts_endpoint(project_id: str):
    """Get all stored transcripts for a project"""
    try:
        transcripts = get_project_transcripts(project_id)
        logger.info(f"Retrieved {len(transcripts)} transcripts for project {project_id}")
        return transcripts
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error fetching transcripts for project {project_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch transcripts")


@router.post("/projects/{project_id}/extract-tasks", response_model=dict)
async def extract_tasks_to_project(project_id: str, request: ProjectTranscriptRequest):
    """Extract tasks from transcript and save to a specific project"""
    global extract_request_count, last_extract_request_time
    
    extract_request_count += 1
    current_count = extract_request_count
    current_time = time.time()
    time_since_last = current_time - last_extract_request_time if last_extract_request_time else 0
    last_extract_request_time = current_time
    
    logger.warning(f"[REQUEST #{current_count}] Extract-tasks for project {project_id}. Time since last request: {time_since_last:.2f}s")
    
    try:
        # Verify project exists and get its users
        project = get_project(project_id)
        project_users = project.get("users", [])
        
        if not request.transcript or not request.transcript.strip():
            raise HTTPException(
                status_code=400,
                detail="Transcript text cannot be empty"
            )

        logger.warning(f"[REQUEST #{current_count}] Starting AI extraction...")
        # Extract tasks from transcript
        extracted_tasks = await ai_service.extract_tasks_from_transcript(
            transcript=request.transcript,
            context=None,
            default_owner_id=request.owner_id
        )
        logger.warning(f"[REQUEST #{current_count}] AI extraction complete. Got {len(extracted_tasks)} tasks")

        # Process and save tasks with auto-assignment using project's team members
        saved_tasks = task_service.process_and_save_tasks(
            extracted_tasks=extracted_tasks,
            default_owner_id=request.owner_id,
            available_users=project_users if project_users else None
        )
        
        # Store transcript in project history
        transcript_record = store_transcript_in_project(
            project_id=project_id,
            transcript=request.transcript,
            tasks_extracted=len(saved_tasks)
        )
        logger.info(f"📝 Transcript stored in project {project_id}")
        
        # Validate team member assignment
        assigned_count = sum(1 for task in saved_tasks if task.get("owner_name"))
        team_member_names = [u.get("name", "").lower() for u in project_users]
        tasks_assigned_to_team = 0
        
        for task in saved_tasks:
            if task.get("owner_name"):
                if any(member_name in task["owner_name"].lower() for member_name in team_member_names):
                    tasks_assigned_to_team += 1
        
        # Check if we have issues
        warning_message = None
        if not project_users:
            warning_message = "⚠️ No team members added to this project. Please add team members first."
        elif tasks_assigned_to_team == 0 and assigned_count > 0:
            warning_message = f"⚠️ No team members mentioned in transcript ({assigned_count} tasks extracted). Names mentioned don't match your team. Please add new team members or update their names."
        
        if warning_message:
            logger.warning(f"[REQUEST #{current_count}] {warning_message}")
        
        # Add tasks to project
        tasks_in_project = []
        for task in saved_tasks:
            add_task_to_project(project_id, task)
            tasks_in_project.append(task)
            
            # Extract and add users from task owner mention if not already in project
            if task.get("owner_name"):
                user_data = {
                    "id": str(time.time()),
                    "name": task["owner_name"],
                    "role": "Team Member"
                }
                try:
                    add_user_to_project(project_id, user_data)
                except:
                    pass
        
        logger.warning(f"[REQUEST #{current_count}] {len(tasks_in_project)} tasks added to project {project_id}")
        
        # Return tasks with warning if applicable
        response = {
            "tasks": tasks_in_project,
            "warning": warning_message
        }
        return response

    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[REQUEST #{current_count}] Error extracting tasks for project: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to extract tasks: {str(e)}"
        )


@router.put("/projects/{project_id}/tasks/{task_id}", response_model=dict)
async def update_project_task_endpoint(project_id: str, task_id: str, updates: TaskUpdate):
    """Update a task in a project"""
    try:
        # Verify project exists
        get_project(project_id)
        
        # Filter out None values
        update_data = {k: v for k, v in updates.dict().items() if v is not None}
        
        if not update_data:
            raise HTTPException(
                status_code=400,
                detail="No fields to update"
            )
        
        updated_task = update_project_task(project_id, task_id, update_data)
        return updated_task

    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating task {task_id} in project {project_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to update task")


@router.delete("/projects/{project_id}/tasks/{task_id}")
async def delete_project_task_endpoint(project_id: str, task_id: str):
    """Delete a task from a project"""
    try:
        # Verify project exists
        get_project(project_id)
        
        success = delete_project_task(project_id, task_id)
        if not success:
            raise HTTPException(status_code=404, detail="Task not found in project")
        
        return {"message": "Task deleted from project successfully"}

    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error deleting task {task_id} from project {project_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete task")
