import os
import json
import re
import time
from typing import List, Dict, Optional
import logging
from fastapi import HTTPException

logger = logging.getLogger(__name__)

# Track API calls to detect concurrent requests
api_call_count = 0
concurrent_calls = 0
max_concurrent = 0

# Determine which provider to use
USE_GEMINI = os.getenv("USE_GEMINI", "false").lower() == "true"

if USE_GEMINI:
    from google import genai
    # Initialize with API key - new package handles config differently
    api_key = os.getenv("GEMINI_API_KEY")
    client_gemini = genai.Client(api_key=api_key)
    GEMINI_MODEL = "gemini-2.5-flash-lite"  # Most free-tier friendly model
    logger.info(f"Using model: {GEMINI_MODEL}")
    logger.info("Retry policy: ENABLED with exponential backoff (free-tier optimized)")
else:
    from openai import AzureOpenAI
    client = AzureOpenAI(
        api_key=os.getenv("AZURE_OPENAI_API_KEY"),
        api_version=os.getenv("AZURE_OPENAI_API_VERSION", "2024-02-01"),
        azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT")
    )
    CHAT_DEPLOYMENT = os.getenv("AZURE_CHAT_MODEL_DEPLOYMENT", "hackathon-model-grp-02")
    EMBEDDING_DEPLOYMENT = os.getenv("AZURE_EMBEDDING_MODEL_DEPLOYMENT", "hackathon-embed-grp-02")
    logger.info(f"Using Azure OpenAI deployment: {CHAT_DEPLOYMENT}")


async def get_embedding(text: str) -> Optional[List[float]]:
    """Generate embedding for given text"""
    try:
        if not text or not text.strip():
            return None
        
        if USE_GEMINI:
            # Gemini doesn't have built-in embedding, return None for now
            logger.info("Gemini provider doesn't require embeddings for this task")
            return None
        else:
            # Use Azure OpenAI embeddings
            response = client.embeddings.create(
                input=text.strip(),
                model=EMBEDDING_DEPLOYMENT
            )
            return response.data[0].embedding
    except Exception as e:
        logger.error(f"Error generating embedding: {e}")
        return None


async def extract_tasks_from_transcript(
    transcript: str,
    context: Optional[str] = None,
    default_owner_id: Optional[str] = None
) -> List[Dict]:
    """Extract tasks from transcript using Gemini or Azure OpenAI"""
    try:
        logger.info(f"Starting task extraction from transcript of {len(transcript)} chars using {'Gemini' if USE_GEMINI else 'Azure'}")
        
        tasks_data = []
        
        if USE_GEMINI:
            # Use Gemini API
            return await _extract_tasks_gemini(transcript, context)
        else:
            # Use Azure OpenAI
            return await _extract_tasks_azure(transcript, context)

    except Exception as e:
        logger.error(f"Error extracting tasks from transcript: {e}", exc_info=True)
        raise


async def _extract_tasks_gemini(transcript: str, context: Optional[str] = None) -> List[Dict]:
    """Extract tasks using Google Gemini"""
    global api_call_count, concurrent_calls, max_concurrent
    
    try:
        # Track concurrent calls
        concurrent_calls += 1
        api_call_count += 1
        if concurrent_calls > max_concurrent:
            max_concurrent = concurrent_calls
        
        current_call_id = api_call_count
        logger.warning(f"[GEMINI CALL #{current_call_id}] Starting. Concurrent calls: {concurrent_calls}/{max_concurrent}")
        
        import time
        
        # Optimize transcript for free tier: trim to 4000 chars
        if len(transcript) > 4000:
            logger.warning(f"[GEMINI CALL #{current_call_id}] Transcript {len(transcript)} chars exceeds 4000 limit, trimming...")
            transcript = transcript[:4000]
            logger.info(f"[GEMINI CALL #{current_call_id}] Trimmed to {len(transcript)} chars")
        
        user_prompt = f"""
You are an AI assistant that extracts actionable tasks from meeting transcripts.

Rules:
- Identify only clear action items.
- Ignore discussions without actions.
- If owner is not mentioned, set owner to null.
- Priority must be one of: high, medium, low.
- If not specified, use medium.
- Deadline must be YYYY-MM-DD format or null.
- Return ONLY valid JSON.
- Do NOT add explanations.

Output format:
[
  {{
    "title": "task description",
    "owner": "person name or null",
    "priority": "high | medium | low",
    "deadline": "YYYY-MM-DD or null"
  }}
]

Example:

Transcript:
"John will prepare the project report. Sarah should review the design."

Output:
[
  {{
    "title": "Prepare the project report",
    "owner": "John",
    "priority": "medium",
    "deadline": null
  }},
  {{
    "title": "Review the design",
    "owner": "Sarah",
    "priority": "medium",
    "deadline": null
  }}
]

Transcript:
{transcript}

Return only the JSON array.
"""

        logger.warning(f"[GEMINI CALL #{current_call_id}] Calling Gemini API...")
        logger.info(f"[GEMINI CALL #{current_call_id}] Prompt tokens: ~{len(user_prompt.split())}")
        call_start = time.time()
        
        # Retry logic for free-tier rate limits (429 errors)
        max_retries = 3
        retry_delays = [2, 5, 10]  # Exponential backoff: 2s, 5s, 10s
        
        response = None
        last_error = None
        
        for attempt in range(max_retries):
            try:
                logger.info(f"[GEMINI CALL #{current_call_id}] Request attempt {attempt + 1}/{max_retries}")
                # Use new google.genai package with exponential backoff
                response = client_gemini.models.generate_content(
                    model=GEMINI_MODEL,
                    contents=user_prompt,
                    config={
                        "safety_settings": [
                            {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE"},
                            {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE"},
                            {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE"},
                            {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE"},
                        ]
                    }
                )
                call_duration = time.time() - call_start
                logger.warning(f"[GEMINI CALL #{current_call_id}] ✅ API response received in {call_duration:.2f}s")
                logger.info(f"[GEMINI CALL #{current_call_id}] Response status: success")
                break  # Success, exit retry loop
                
            except Exception as e:
                error_msg = str(e)
                last_error = error_msg
                logger.warning(f"[GEMINI CALL #{current_call_id}] Attempt {attempt + 1} failed: {error_msg[:100]}")
                
                # Check if 429 (rate limit) and retries remaining
                if ("429" in error_msg or "quota" in error_msg.lower()) and attempt < max_retries - 1:
                    wait_time = retry_delays[attempt]
                    logger.warning(f"[GEMINI CALL #{current_call_id}] Free-tier rate limit hit. Retrying in {wait_time}s...")
                    time.sleep(wait_time)
                else:
                    # Not a 429 or no retries left
                    logger.error(f"[GEMINI CALL #{current_call_id}] ❌ API error (no retries): {error_msg[:200]}")
                    if "429" in error_msg or "quota" in error_msg.lower():
                        logger.error(f"[GEMINI CALL #{current_call_id}] Quota exceeded - Enable billing: https://console.cloud.google.com/billing")
                        raise HTTPException(
                            status_code=429,
                            detail="Gemini API quota exceeded after retries. Please enable billing or wait for quota reset."
                        )
                    raise
        
        if response is None:
            logger.error(f"[GEMINI CALL #{current_call_id}] ❌ Failed after {max_retries} retries: {last_error}")
            raise HTTPException(status_code=503, detail="Gemini API unavailable after retries")

        extracted_text = response.text.strip() if hasattr(response, 'text') and response.text else ""
        logger.warning(f"[GEMINI CALL #{current_call_id}] Response length: {len(extracted_text)} chars")
        logger.info(f"[GEMINI CALL #{current_call_id}] Raw response preview: {extracted_text[:100]}...")

        # Parse the response
        tasks_data = []
        if extracted_text:
            logger.info(f"[GEMINI CALL #{current_call_id}] Attempting JSON parse...")
            try:
                tasks_data = json.loads(extracted_text)
                logger.info(f"[GEMINI CALL #{current_call_id}] ✅ Direct JSON parse successful")
            except json.JSONDecodeError:
                logger.warning(f"[GEMINI CALL #{current_call_id}] Direct JSON parse failed, trying regex extraction...")
                json_match = re.search(r'\[[\s\S]*\]', extracted_text)
                if json_match:
                    try:
                        tasks_data = json.loads(json_match.group())
                        logger.info(f"[GEMINI CALL #{current_call_id}] ✅ Regex JSON extraction successful")
                    except json.JSONDecodeError:
                        logger.warning(f"[GEMINI CALL #{current_call_id}] Regex parse failed, using text fallback...")
                        tasks_data = _parse_text_tasks(extracted_text)
                else:
                    logger.warning(f"[GEMINI CALL #{current_call_id}] No JSON array found, using text fallback...")
                    tasks_data = _parse_text_tasks(extracted_text)
        else:
            logger.warning(f"[GEMINI CALL #{current_call_id}] Empty response text")

        # Ensure it's a list
        if not isinstance(tasks_data, list):
            logger.warning(f"[GEMINI CALL #{current_call_id}] Response is not a list, converting...")
            tasks_data = [tasks_data] if isinstance(tasks_data, dict) else []

        logger.info(f"[GEMINI CALL #{current_call_id}] Parsed data count: {len(tasks_data)}")
        
        # Format tasks
        formatted_tasks = []
        for idx, task in enumerate(tasks_data):
            if isinstance(task, dict):
                formatted_task = {
                    "title": task.get("title", "Untitled Task"),
                    "owner": task.get("owner"),
                    "priority": task.get("priority", "medium").lower(),
                    "deadline": task.get("deadline"),
                    "status": "todo"
                }
                formatted_tasks.append(formatted_task)
                logger.info(f"[GEMINI CALL #{current_call_id}] Task {idx+1}: {formatted_task['title'][:50]} | Owner: {formatted_task['owner']} | Priority: {formatted_task['priority']} | Status: {formatted_task['status']}")

        logger.warning(f"[GEMINI CALL #{current_call_id}] ✅ Extracted {len(formatted_tasks)} tasks. Concurrent calls now: {concurrent_calls - 1}")
        concurrent_calls -= 1
        return formatted_tasks

    except HTTPException:
        concurrent_calls -= 1
        raise
    except Exception as e:
        concurrent_calls -= 1
        logger.error(f"Gemini extraction error: {e}", exc_info=True)
        raise


async def _extract_tasks_azure(transcript: str, context: Optional[str] = None) -> List[Dict]:
    """Extract tasks using Azure OpenAI - Optimized for single request"""
    try:
        # Concise system message to reduce token usage
        system_message = """Extract actionable tasks from meeting transcripts.
Return ONLY valid JSON array. Format: [{"title":"task","owner":"name","priority":"high/medium/low","deadline":"YYYY-MM-DD or null"}]"""

        user_message = f"""Extract all tasks from this transcript:

{transcript}

JSON array only:"""
        
        logger.info("Calling Azure OpenAI API for task extraction")
        response = client.chat.completions.create(
            model=CHAT_DEPLOYMENT,
            messages=[
                {"role": "system", "content": system_message},
                {"role": "user", "content": user_message}
            ],
            max_completion_tokens=2000
        )

        extracted_text = response.choices[0].message.content.strip() if response.choices[0].message.content else ""
        
        # Parse the response
        tasks_data = []
        if extracted_text:
            try:
                tasks_data = json.loads(extracted_text)
                logger.info(f"Parsed JSON from Azure, found {len(tasks_data)} tasks")
            except json.JSONDecodeError:
                json_match = re.search(r'\[[\s\S]*\]', extracted_text)
                if json_match:
                    try:
                        tasks_data = json.loads(json_match.group())
                    except json.JSONDecodeError:
                        logger.warning("Failed to parse Azure response, using text parsing fallback")
                        tasks_data = _parse_text_tasks(extracted_text)
                else:
                    tasks_data = _parse_text_tasks(extracted_text)
        else:
            logger.warning("Empty response from Azure")

        # Ensure it's a list
        if not isinstance(tasks_data, list):
            tasks_data = [tasks_data] if isinstance(tasks_data, dict) else []

        # Format tasks
        formatted_tasks = []
        for task in tasks_data:
            if isinstance(task, dict):
                formatted_tasks.append({
                    "title": task.get("title", "Untitled Task"),
                    "owner": task.get("owner"),
                    "priority": task.get("priority", "medium").lower(),
                    "deadline": task.get("deadline"),
                    "status": "todo"
                })

        logger.info(f"Extracted {len(formatted_tasks)} tasks from Azure OpenAI")
        return formatted_tasks

    except Exception as e:
        logger.error(f"Azure extraction error: {e}")
        raise


def _parse_text_tasks(text: str) -> List[Dict]:
    """Fallback: Parse tasks from plain text format if JSON parsing fails"""
    logger.info("Using text parsing fallback")
    tasks = []
    
    # Look for patterns like "- Task: ..., Owner: ..., Priority: ..."
    task_pattern = r'(?:task|action item|todo)[:\s]*([^,\n]+)(?:,?\s*owner[:\s]*([^,\n]+))?(?:,?\s*priority[:\s]*([^,\n]+))?'
    matches = re.finditer(task_pattern, text, re.IGNORECASE)
    
    for match in matches:
        title = match.group(1).strip() if match.group(1) else None
        owner = match.group(2).strip() if match.group(2) else None
        priority = match.group(3).strip() if match.group(3) else "medium"
        
        if title:
            tasks.append({
                "title": title,
                "owner": owner,
                "priority": priority.lower(),
                "deadline": None,
                "status": "todo"
            })
    
    logger.info(f"Text parsing found {len(tasks)} tasks")
    return tasks


async def query_previous_transcripts_for_context(
    embedding: List[float],
    top_k: int = 3
) -> Optional[str]:
    """Query similar transcripts using embeddings for RAG context"""
    # This is a placeholder for RAG functionality
    # In a full implementation, you would:
    # 1. Store embeddings of previous transcripts
    # 2. Use similarity search to find related transcripts
    # 3. Return summaries as context
    
    try:
        # For now, return None as we don't have stored embeddings
        return None
    except Exception as e:
        logger.error(f"Error querying transcript context: {e}")
        return None
