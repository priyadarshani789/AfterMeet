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
    ├── .env                           # Environment variables
    └── .env.example
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
- 👥 **Auto-assignment**: Tasks auto-assigned to team members (if not specified)
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

**Important Notes:**
- Free tier quota resets daily at 00:00 UTC
- Recommended: Enable billing for production use (very cheap: ~$0.0001 per 1000 requests)
- If you hit 429 quota errors, wait for reset or enable billing

## Example Workflow

1. **Start both servers** (in separate terminals):
   - Backend: 
     ```bash
     cd backend
     venv\Scripts\activate  # or source venv/bin/activate on macOS/Linux
     uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
     ```
   - Frontend: 
     ```bash
     cd frontend
     npm run dev
     ```

2. **Access the app**: Open `http://localhost:5173` (or shown in terminal)

3. **Upload meeting transcript**:
   - Copy and paste transcript text in the form
   - (Optional) Specify a default task owner
   - Click "Extract Tasks" button

4. **View extracted tasks**:
   - Gemini API processes transcript (1.5-3 seconds typically)
   - Tasks appear in "To Do" column of Kanban board
   - Each task automatically assigned when owner is mentioned
   - Check browser console for extraction logs

5. **Manage tasks**:
   - Click on any task card to edit details
   - Update: title, priority, deadline, owner
   - Drag or click to move between columns (To Do → In Progress → Done)
   - Changes save automatically to backend

## Troubleshooting

### 429 "Too Many Requests" Error
**Problem**: "You exceeded your current quota"
**Solutions** (in order):
1. Wait 60+ seconds for quota to reset
2. Create a new Gemini API key at https://ai.google.dev/
3. Enable billing in Google Cloud Console (very affordable)

### Tasks Not Showing in Kanban Board
**Debug steps**:
1. Open browser DevTools (F12) → Console tab
2. Extract a transcript and look for logs:
   - `✅ Fetched X tasks`
   - `📊 Task grouping: todo=X`
3. If tasks are 0, check backend logs for extraction errors
4. Hard refresh browser: `Ctrl+Shift+R`

### Backend Connection Issues
**Check**:
- Backend running on port 8000: `http://localhost:8000`
- Frontend can reach backend: No CORS errors in console
- Database files exist: `backend/app/db/tasks.json` and `users.json`

## Development Notes

### Adding More Users
Edit `backend/app/db/users.json` and add new users with unique IDs:
```json
{
  "id": "5",
  "name": "Emma Davis",
  "role": "Marketing Manager"
}
```

### Customizing Task Extraction
The AI prompt can be customized in `backend/app/services/ai_service.py`:
- Modify the System prompt to change extraction behavior
- Adjust priority detection rules
- Change deadline format expectations
- Add/remove task classification rules

### Gemini Model Information
- **Model**: `gemini-2.5-flash-lite`
- **Why this model?**: Fastest, smallest, best for free-tier
- **Costs**: Free tier: 1M tokens/day; With billing: ~$0.0001 per 1000 input tokens
- **Latency**: Typically 1-3 seconds per request
- **Limits**: 10 requests/minute (free tier), 1000/day cumulative

### Building Frontend for Production
```bash
cd frontend
npm run build
# Output files in dist/
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

### Error Handling & Retries
- **Free-tier protection**: Transcript auto-trimmed to 4000 characters
- **Rate limit handling**: 3 automatic retry attempts with exponential backoff
- **Retry delays**: 2 seconds → 5 seconds → 10 seconds
- **No API retry spam**: Retries are at application level, not SDK level
- **Fails gracefully**: 503 error if all retries exhausted

## Limitations & Known Issues

- **Free-tier quota**: Resets daily, may be shared across users on same IP
- **Transcript length**: Limited to 4000 characters for stability
- **Owner matching**: Case-insensitive but requires name substring match
- **Storage**: JSON files (not suitable for very large datasets)
- **No persistence**: Database stored in files, not in cloud

## Future Enhancements

- 📦 File upload support (.txt, .docx, .pdf, audio files)
- 🔐 User authentication and multi-user support
- 🗄️ Database migration (PostgreSQL/MongoDB)
- 📊 Analytics dashboard and reporting
- 🔔 Task reminders and notifications
- 🌐 Multi-language support
- 🎨 Custom themes and UI personalization
- ⚡ Batch transcript processing
- 🧠 Learn from past extractions (ML-based suggestions)

## License

This project is open source and available for educational and commercial use.

## Support & Contributing

For issues, feature requests, or contributions:
1. Check existing documentation
2. Review troubleshooting section
3. Check browser console for error details
4. Share backend logs when reporting issues
