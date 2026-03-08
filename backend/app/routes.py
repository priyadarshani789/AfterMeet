from fastapi import APIRouter, HTTPException, status
from fastapi.responses import JSONResponse
from typing import List
import logging
import time

from app.models import Task, TaskRequest, TranscriptRequest, TaskUpdate
from app.services import ai_service, task_service
from app.utils.file_handler import (
    get_users, get_tasks, update_task, delete_task, get_task_by_id
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
