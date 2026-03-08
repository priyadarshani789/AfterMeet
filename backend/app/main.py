from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

from app.routes import router
from app.utils.file_handler import ensure_db_exists

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="AfterMeet API",
    description="Meeting transcript to tasks converter using Azure OpenAI",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Change to specific origins in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure database exists on startup
@app.on_event("startup")
async def startup_event():
    """Initialize database on startup"""
    ensure_db_exists()
    logger.info("Database initialized")
    logger.info(f"Azure OpenAI Endpoint: {os.getenv('AZURE_OPENAI_ENDPOINT')}")
    logger.info(f"Chat Model Deployment: {os.getenv('AZURE_CHAT_MODEL_DEPLOYMENT')}")
    logger.info(f"Embedding Model Deployment: {os.getenv('AZURE_EMBEDDING_MODEL_DEPLOYMENT')}")

# Include routes
app.include_router(router)

@app.get("/")
async def root():
    """API health check"""
    return {
        "message": "AfterMeet API is running",
        "version": "1.0.0"
    }

@app.get("/health")
async def health():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "AfterMeet API"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
