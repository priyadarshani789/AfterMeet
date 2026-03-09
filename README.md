# AfterMeet - Meeting Transcript to Tasks Converter

## Overview
AfterMeet automatically converts meeting transcripts into actionable tasks using Google Gemini API. It features:
- 🤖 **AI-powered task extraction** from transcripts using Gemini 2.5 Flash Lite
- 👥 **Automatic task owner assignment** based on mentioned names with intelligent fallback
- 📊 **Kanban board task management** (To Do → In Progress → Done columns)
- ⚡ **Free-tier optimized** with retry logic and transcript trimming
- 🎯 **Smart task extraction** with priority and deadline detection
- React + TailwindCSS frontend with FastAPI backend

## Tech Stack
- **Frontend**: React 18 + TailwindCSS + Vite + Axios
- **Backend**: FastAPI + Pydantic
- **Storage**: JSON files (users.json, tasks.json)
- **AI**: Google Gemini API (gemini-2.5-flash-lite model)
- **Free-tier optimized**: Exponential backoff retry (2s → 5s → 10s)

## Project Structure

```
AfterMeet/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── TaskForm.jsx           # Transcript upload & processing
│   │   │   ├── KanbanBoard.jsx        # Task management board
│   │   │   ├── TaskCard.jsx           # Individual task display
│   │   │   └── TaskEditModal.jsx      # Task editor modal
│   │   ├── utils/
│   │   │   └── api.js                 # API client
│   │   ├── App.jsx                    # Main component
│   │   ├── main.jsx                   # Entry point
│   │   └── index.css                  # TailwindCSS styles
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── postcss.config.js
│
└── backend/
    ├── app/
    │   ├── services/
    │   │   ├── ai_service.py          # Google Gemini API integration
    │   │   │                          # Features: retry logic, transcript trimming
    │   │   │                          # Retry: 3 attempts with exponential backoff
    │   │   └── task_service.py        # Task extraction & auto-assignment logic
    │   ├── utils/
    │   │   └── file_handler.py        # JSON database operations
    │   ├── db/
    │   │   ├── users.json             # Pre-registered users
    │   │   └── tasks.json             # Task storage
    │   ├── models.py                  # Pydantic models
    │   ├── routes.py                  # API endpoints
    │   ├── main.py                    # FastAPI app
    │   └── __init__.py
    ├── requirements.txt
    ├── .env                           # Environment 
```

## Setup Instructions

### Prerequisites
- Python 3.8+
- Node.js 16+
- npm or yarn

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Create and activate virtual environment:
```bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Create .env file with Google Gemini API credentials:
```bash
# Copy from .env.example or create new
cp .env.example .env
```

**Fill in your Gemini API credentials in `.env`:**
```env
USE_GEMINI=true
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_PROJECT_ID=projects/your_project_id
```

**Get your Gemini API key:**
1. Go to https://ai.google.dev/
2. Click "Get API key"
3. Create a new project or select existing
4. Copy the API key
5. (Optional but recommended) Enable billing in Google Cloud Console for higher quota

5. Run the backend:
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend will be available at: `http://localhost:8000`

### Frontend Setup

1. In a new terminal, navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

Frontend will be available at: `http://localhost:3000`

## API Endpoints

### Users
- **GET** `/users` - Get all registered users

### Tasks
- **GET** `/tasks` - Get all tasks
- **GET** `/tasks/{task_id}` - Get specific task
- **POST** `/extract-tasks` - Extract tasks from transcript
  - Body: `{ "transcript": "...", "owner_id": "optional" }`
- **PUT** `/tasks/{task_id}` - Update task details
  - Body: `{ "title": "...", "status": "...", "priority": "...", "deadline": "...", "owner_id": "..." }`
- **DELETE** `/tasks/{task_id}` - Delete task

### Health
- **GET** `/` - API info
- **GET** `/health` - Health check

## Features

### Frontend
- 📝 **Transcript Upload**: Paste meeting transcripts for AI processing
- 📊 **Kanban Board**: Organize tasks in To Do → In Progress → Done columns
- ✏️ **Task Editing**: Edit task details, assign owners, set priorities and deadlines
- � **Google Chat Integration**: Send task updates to Google Chat channels
- �👥 **Auto-assignment**: Tasks auto-assigned to team members (if not specified)
- 📅 **Deadline Management**: Set and track task deadlines
- 🔄 **Real-time updates**: Board refreshes automatically after task extraction

### Backend
- 🤖 **Google Gemini Integration**:
  - Model: `gemini-2.5-flash-lite` (free-tier optimized, lightweight)
  - Task extraction from transcripts using advanced prompting
  - Single API call per request (no unnecessary retries)
- 🎯 **Intelligent Auto-Assignment**: 
  - Assigns owners based on mentioned names
  - Falls back to random assignment if no match found
  - Respects existing owner mentions in transcript
- ⚡ **Free-tier Optimized**:
  - Exponential backoff retry: 2s → 5s → 10s delays
  - Automatic transcript trimming (max 4000 chars)
  - Prevents 429 rate limit errors
  - Single request per upload (no automatic retries)
- 💾 **JSON Storage**: Persistent storage of users and tasks
- 📊 **Comprehensive Logging**: Detailed request tracking and debugging info

## Users Database (db/users.json)

Pre-registered team members:
```json
[
  {"id": "1", "name": "Alice Johnson", "role": "Product Manager"},
  {"id": "2", "name": "Bob Smith", "role": "Developer"},
  {"id": "3", "name": "Carol White", "role": "Designer"},
  {"id": "4", "name": "David Brown", "role": "QA Engineer"}
]
```

Add more users by editing `backend/app/db/users.json`.

## Task Priority Levels
- **High** - Urgent, needs immediate attention
- **Medium** - Normal priority
- **Low** - Can wait, lower priority

## Task Status
- **todo** - Not started
- **in_progress** - Currently being worked on
- **done** - Completed

## Environment Variables

### Backend (.env)
```env
# AI Provider
USE_GEMINI=true

# Google Gemini Configuration
GEMINI_API_KEY=your_api_key_from_https://ai.google.dev/
GEMINI_PROJECT_ID=projects/your_project_id
```

## How It Works

### Task Extraction Flow
1. User uploads transcript via React frontend
2. Frontend sends POST `/extract-tasks` request to backend
3. Backend validates transcript (trims to 4000 chars if needed)
4. Gemini API processes transcript with detailed extraction prompt
5. AI returns JSON array of tasks with: title, owner, priority, deadline
6. Backend auto-assigns owners by matching names against user database
7. Tasks saved to `backend/app/db/tasks.json`
8. Frontend refreshes Kanban board with new tasks

## Overview
## Create Project
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/22b4fb66-21f8-4cf0-9b76-a48d8237b2f8" />
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/16db1dc4-96c8-440a-8358-7df22ac98ae2" />
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/4c222af4-0cd2-4625-8c5d-f57a1bbc052d" />
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/144f60f4-8849-4d14-988c-fb7cc19276c9" />

## Upload Transcript
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/f9f2ab38-f51c-45d2-840c-d60232a65eb2" />

## Kanban Board
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/7b59b60d-f2bd-4216-a7f9-273b6b808f4f" />

## Transcript History
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/12e76657-7679-4c99-8633-5c29f5274056" />

## Future Enhancements

- 📂 Recording Upload Support – Allow users to upload meeting recordings directly, automatically convert them to transcripts, and generate tasks from the discussion.
- 🔐 User Authentication – Add login and role-based access for team members.
- 🗄️ Database Integration – Replace JSON storage with databases like PostgreSQL or MongoDB.
- 🌐 Multi-language Support – Extract tasks from meetings in multiple languages.



