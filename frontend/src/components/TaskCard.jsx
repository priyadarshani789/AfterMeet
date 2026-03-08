import React, { useState } from 'react';
import axios from 'axios';

export default function TaskCard({ task, onEdit, projectId = null, onDelete = null, onStatusChange = null }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const priorityColors = {
    high: 'bg-red-100 text-red-800 border-red-300',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    low: 'bg-green-100 text-green-800 border-green-300',
  };

  const priorityEmoji = {
    high: '🔴',
    medium: '🟡',
    low: '🟢',
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    
    if (!window.confirm('Are you sure you want to delete this task?')) {
      return;
    }

    setIsDeleting(true);

    try {
      const endpoint = projectId
        ? `http://localhost:8000/projects/${projectId}/tasks/${task.id}`
        : `http://localhost:8000/tasks/${task.id}`;
      
      console.log(`🗑️ Deleting task from: ${endpoint}`);
      await axios.delete(endpoint);
      console.log('✅ Task deleted successfully');
      
      if (onDelete) {
        onDelete();
      } else {
        setTimeout(() => window.location.reload(), 500);
      }
    } catch (error) {
      console.error('❌ Error deleting task:', error);
      alert('Failed to delete task: ' + (error.response?.data?.detail || error.message));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleStatusChange = async (e, newStatus) => {
    e.stopPropagation();
    setIsUpdatingStatus(true);

    try {
      const endpoint = projectId
        ? `http://localhost:8000/projects/${projectId}/tasks/${task.id}`
        : `http://localhost:8000/tasks/${task.id}`;
      
      console.log(`📝 Updating task status to: ${newStatus}`);
      await axios.put(endpoint, { status: newStatus });
      console.log('✅ Task status updated successfully');
      
      if (onStatusChange) {
        onStatusChange();
      }
    } catch (error) {
      console.error('❌ Error updating task status:', error);
      alert('Failed to update task: ' + (error.response?.data?.detail || error.message));
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const getStatusButtons = () => {
    const buttons = [];
    const currentStatus = task.status || 'todo';

    if (currentStatus === 'todo') {
      buttons.push(
        <button
          key="start"
          onClick={(e) => handleStatusChange(e, 'in_progress')}
          disabled={isUpdatingStatus}
          className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 disabled:opacity-50 transition"
          title="Move to In Progress"
        >
          {isUpdatingStatus ? '⏳' : '→ Start'}
        </button>
      );
    } else if (currentStatus === 'in_progress') {
      buttons.push(
        <button
          key="back"
          onClick={(e) => handleStatusChange(e, 'todo')}
          disabled={isUpdatingStatus}
          className="px-2 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600 disabled:opacity-50 transition"
          title="Move back to To Do"
        >
          {isUpdatingStatus ? '⏳' : '← Back'}
        </button>
      );
      buttons.push(
        <button
          key="done"
          onClick={(e) => handleStatusChange(e, 'done')}
          disabled={isUpdatingStatus}
          className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600 disabled:opacity-50 transition"
          title="Mark as Done"
        >
          {isUpdatingStatus ? '⏳' : '✅ Done'}
        </button>
      );
    } else if (currentStatus === 'done') {
      buttons.push(
        <button
          key="reopen"
          onClick={(e) => handleStatusChange(e, 'in_progress')}
          disabled={isUpdatingStatus}
          className="px-2 py-1 bg-yellow-500 text-white text-xs rounded hover:bg-yellow-600 disabled:opacity-50 transition"
          title="Reopen task"
        >
          {isUpdatingStatus ? '⏳' : '↩️ Reopen'}
        </button>
      );
    }

    return buttons;
  };

  return (
    <div
      onClick={() => onEdit(task)}
      className="bg-white p-4 rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-blue-500 relative group"
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-semibold text-gray-900 line-clamp-2 flex-1">{task.title}</h3>
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="ml-2 text-gray-400 group-hover:text-red-500 hover:text-red-700 transition opacity-0 group-hover:opacity-100 disabled:opacity-50"
          title="Delete task"
        >
          {isDeleting ? '⏳' : '✕'}
        </button>
      </div>
      
      <div className="mb-3 space-y-1">
        <p className="text-sm text-gray-600">
          <span className="font-medium">👤 Owner:</span> {task.owner_name || 'Unassigned'}
        </p>
        {task.deadline && (
          <p className="text-sm text-gray-600">
            <span className="font-medium">📅 Deadline:</span> {task.deadline}
          </p>
        )}
      </div>

      <div className="flex justify-between items-center gap-2">
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold border flex items-center gap-1 ${
            priorityColors[task.priority] || priorityColors.low
          }`}
        >
          {priorityEmoji[task.priority] || priorityEmoji.low}
          {task.priority?.charAt(0).toUpperCase() + task.priority?.slice(1) || 'Low'}
        </span>
      </div>

      {/* Status Movement Buttons */}
      <div className="flex gap-1 mt-3 flex-wrap">
        {getStatusButtons()}
      </div>
    </div>
  );
}
