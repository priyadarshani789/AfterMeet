import React, { useState, useEffect } from 'react';
import TaskCard from './TaskCard';
import TaskEditModal from './TaskEditModal';
import { fetchTasks } from '../utils/api';

export default function KanbanBoard({ refreshTrigger, users = [] }) {
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log('🔄 Kanban refresh triggered, loading tasks...');
    loadTasks();
  }, [refreshTrigger]);

  const loadTasks = async () => {
    setIsLoading(true);
    try {
      console.log('📥 Fetching tasks from API...');
      const fetchedTasks = await fetchTasks();
      console.log(`✅ Fetched ${fetchedTasks.length} tasks:`, fetchedTasks);
      setTasks(fetchedTasks);
      console.log('Tasks state updated');
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const groupedTasks = {
    todo: tasks.filter((t) => t.status === 'todo'),
    in_progress: tasks.filter((t) => t.status === 'in_progress'),
    done: tasks.filter((t) => t.status === 'done'),
  };

  // Debug logging
  console.log(`📊 Task grouping: todo=${groupedTasks.todo.length}, in_progress=${groupedTasks.in_progress.length}, done=${groupedTasks.done.length}`);

  const handleEditTask = (task) => {
    setSelectedTask(task);
  };

  const handleSaveTask = () => {
    loadTasks();
  };

  return (
    <div className="bg-gray-50 rounded-lg p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Task Kanban Board</h2>

      {isLoading ? (
        <div className="flex items-center justify-center h-96">
          <p className="text-gray-500">Loading tasks...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* To Do Column */}
          <div className="bg-white rounded-lg p-4 shadow">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center">
              <span className="inline-block w-3 h-3 bg-gray-400 rounded-full mr-2"></span>
              To Do ({groupedTasks.todo.length})
            </h3>
            <div className="space-y-3 min-h-80">
              {groupedTasks.todo.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onEdit={handleEditTask}
                />
              ))}
              {groupedTasks.todo.length === 0 && (
                <p className="text-gray-400 text-sm">No tasks yet</p>
              )}
            </div>
          </div>

          {/* In Progress Column */}
          <div className="bg-white rounded-lg p-4 shadow">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center">
              <span className="inline-block w-3 h-3 bg-blue-400 rounded-full mr-2"></span>
              In Progress ({groupedTasks.in_progress.length})
            </h3>
            <div className="space-y-3 min-h-80">
              {groupedTasks.in_progress.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onEdit={handleEditTask}
                />
              ))}
              {groupedTasks.in_progress.length === 0 && (
                <p className="text-gray-400 text-sm">No tasks yet</p>
              )}
            </div>
          </div>

          {/* Done Column */}
          <div className="bg-white rounded-lg p-4 shadow">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center">
              <span className="inline-block w-3 h-3 bg-green-400 rounded-full mr-2"></span>
              Done ({groupedTasks.done.length})
            </h3>
            <div className="space-y-3 min-h-80">
              {groupedTasks.done.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onEdit={handleEditTask}
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
        />
      )}
    </div>
  );
}
