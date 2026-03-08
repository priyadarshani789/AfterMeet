import React, { useState, useEffect } from 'react';
import TaskForm from './components/TaskForm';
import KanbanBoard from './components/KanbanBoard';
import axios from 'axios';

export default function App() {
  const [refreshKanban, setRefreshKanban] = useState(0);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get('http://localhost:8000/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleTasksExtracted = () => {
    setRefreshKanban((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 text-center mb-2">AfterMeet</h1>
          <p className="text-center text-gray-600">
            Convert meeting transcripts into actionable tasks automatically
          </p>
        </div>

        {/* Task Form */}
        <TaskForm onTasksExtracted={handleTasksExtracted} />

        {/* Kanban Board */}
        <KanbanBoard refreshTrigger={refreshKanban} users={users} />
      </div>
    </div>
  );
}
