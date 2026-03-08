import React, { useState, useEffect } from 'react';
import TaskCard from './TaskCard';
import TaskEditModal from './TaskEditModal';
import axios from 'axios';

export default function KanbanBoard({ refreshTrigger, users = [], projectId = null }) {
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log(`🔄 Kanban refresh triggered. ProjectID: ${projectId}, RefreshTrigger: ${refreshTrigger}`);
    loadTasks();
  }, [refreshTrigger, projectId]);

  const loadTasks = async () => {
    setIsLoading(true);
    setError(null);
    try {
      console.log(`📥 Fetching tasks for projectId: ${projectId}`);
      
      const endpoint = projectId
        ? `http://localhost:8000/projects/${projectId}/tasks`
        : 'http://localhost:8000/tasks';
      
      console.log(`📍 Endpoint: ${endpoint}`);
      
      const response = await axios.get(endpoint);
      const fetchedTasks = response.data;
      
      console.log(`✅ Fetched ${fetchedTasks.length} tasks:`, fetchedTasks);
      console.log('Full tasks response:', JSON.stringify(fetchedTasks, null, 2));
      
      setTasks(fetchedTasks);
      console.log('✅ Tasks state updated');
    } catch (error) {
      console.error('❌ Error loading tasks:', error);
      console.error('Error details:', error.response?.data || error.message);
      setError(error.response?.data?.detail || error.message);
      setTasks([]);
    } finally {
      setIsLoading(false);
    }
  };

  const groupedTasks = {
    todo: tasks.filter((t) => t.status === 'todo'),
    in_progress: tasks.filter((t) => t.status === 'in_progress'),
    done: tasks.filter((t) => t.status === 'done'),
  };

  console.log(`📊 Task grouping: todo=${groupedTasks.todo.length}, in_progress=${groupedTasks.in_progress.length}, done=${groupedTasks.done.length}`);
  console.log('Grouped tasks details:', groupedTasks);

  const handleEditTask = (task) => {
    console.log('✏️ Editing task:', task);
    setSelectedTask(task);
  };

  const handleSaveTask = () => {
    console.log('💾 Task saved, reloading tasks...');
    loadTasks();
  };

  return (
    <div className="bg-gray-50 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">📊 Task Kanban Board</h2>
        <button
          onClick={loadTasks}
          disabled={isLoading}
          className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? '🔄 Refreshing...' : '🔄 Refresh'}
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          ⚠️ Error loading tasks: {error}
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center h-96">
          <p className="text-gray-500">🔄 Loading tasks...</p>
        </div>
      ) : tasks.length === 0 ? (
        <div className="flex items-center justify-center h-96 bg-white rounded-lg">
          <div className="text-center">
            <p className="text-gray-500 text-lg mb-2">📭 No tasks yet</p>
            <p className="text-gray-400 text-sm">Upload a transcript above to extract tasks</p>
            {projectId && (
              <p className="text-gray-400 text-xs mt-2">Project ID: {projectId}</p>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* To Do Column */}
          <div className="bg-white rounded-lg p-4 shadow hover:shadow-md transition">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center">
              <span className="inline-block w-3 h-3 bg-gray-400 rounded-full mr-2"></span>
              📋 To Do ({groupedTasks.todo.length})
            </h3>
            <div className="space-y-3 min-h-80">
              {groupedTasks.todo.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onEdit={handleEditTask}
                  projectId={projectId}
                  onDelete={loadTasks}
                />
              ))}
              {groupedTasks.todo.length === 0 && (
                <p className="text-gray-400 text-sm">No tasks yet</p>
              )}
            </div>
          </div>

          {/* In Progress Column */}
          <div className="bg-white rounded-lg p-4 shadow hover:shadow-md transition">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center">
              <span className="inline-block w-3 h-3 bg-blue-400 rounded-full mr-2"></span>
              ⚙️ In Progress ({groupedTasks.in_progress.length})
            </h3>
            <div className="space-y-3 min-h-80">
              {groupedTasks.in_progress.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onEdit={handleEditTask}
                  projectId={projectId}
                  onDelete={loadTasks}
                />
              ))}
              {groupedTasks.in_progress.length === 0 && (
                <p className="text-gray-400 text-sm">No tasks yet</p>
              )}
            </div>
          </div>

          {/* Done Column */}
          <div className="bg-white rounded-lg p-4 shadow hover:shadow-md transition">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center">
              <span className="inline-block w-3 h-3 bg-green-400 rounded-full mr-2"></span>
              ✅ Done ({groupedTasks.done.length})
            </h3>
            <div className="space-y-3 min-h-80">
              {groupedTasks.done.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onEdit={handleEditTask}
                  projectId={projectId}
                  onDelete={loadTasks}
                />
              ))}
              {groupedTasks.done.length === 0 && (
                <p className="text-gray-400 text-sm">No tasks yet</p>
              )}
            </div>
          </div>
        </div>
      )}

      {selectedTask && (
        <TaskEditModal
          task={selectedTask}
          users={users}
          onClose={() => setSelectedTask(null)}
          onSave={handleSaveTask}
          projectId={projectId}
        />
      )}
    </div>
  );
}
