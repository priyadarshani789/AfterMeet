import React from 'react';

export default function TaskCard({ task, onEdit }) {
  const priorityColors = {
    high: 'bg-red-100 text-red-800 border-red-300',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    low: 'bg-green-100 text-green-800 border-green-300',
  };

  return (
    <div
      onClick={() => onEdit(task)}
      className="bg-white p-4 rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-blue-500"
    >
      <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{task.title}</h3>
      
      <div className="mb-3 space-y-1">
        <p className="text-sm text-gray-600">
          <span className="font-medium">Owner:</span> {task.owner_name || 'Unassigned'}
        </p>
        <p className="text-sm text-gray-600">
          <span className="font-medium">Deadline:</span> {task.deadline || 'Not set'}
        </p>
      </div>

      <div className="flex justify-between items-center">
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold border ${
            priorityColors[task.priority] || priorityColors.low
          }`}
        >
          {task.priority?.charAt(0).toUpperCase() + task.priority?.slice(1) || 'Low'}
        </span>
      </div>
    </div>
  );
}
