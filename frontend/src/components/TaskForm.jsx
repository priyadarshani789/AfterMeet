import React, { useState } from 'react';
import { extractTasks } from '../utils/api';

export default function TaskForm({ onTasksExtracted, loading = false }) {
  const [transcript, setTranscript] = useState('');
  const [taskOwner, setTaskOwner] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false); // Prevent double submission

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Prevent double submission
    if (isSubmitting || isLoading) {
      console.warn('Form already submitting, ignoring click');
      return;
    }
    
    setError(null);
    setIsLoading(true);
    setIsSubmitting(true);

    try {
      console.log('Submitting transcript for extraction...');
      const tasks = await extractTasks(transcript);
      console.log(`Received ${tasks.length} tasks from API:`, tasks);
      console.log('Triggering Kanban refresh...');
      onTasksExtracted(tasks);
      console.log('✅ Kanban refresh triggered');
      setTranscript('');
      setTaskOwner('');
    } catch (err) {
      setError('Failed to extract tasks. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Upload Meeting Transcript</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="transcript" className="block text-sm font-medium text-gray-700 mb-2">
            Transcript Text
          </label>
          <textarea
            id="transcript"
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder="Paste your meeting transcript here..."
            className="w-full h-40 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            disabled={isLoading || isSubmitting}
          />
        </div>

        <div>
          <label htmlFor="taskOwner" className="block text-sm font-medium text-gray-700 mb-2">
            Default Task Owner (Optional)
          </label>
          <input
            id="taskOwner"
            type="text"
            value={taskOwner}
            onChange={(e) => setTaskOwner(e.target.value)}
            placeholder="Leave blank for auto-assignment"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading || isSubmitting}
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading || isSubmitting || !transcript.trim()}
          className={`w-full py-2 px-4 rounded-lg font-semibold transition-colors ${
            isLoading || isSubmitting || !transcript.trim()
              ? 'bg-gray-300 text-gray-700 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isLoading || isSubmitting ? 'Extracting Tasks...' : 'Extract Tasks'}
        </button>
      </form>
    </div>
  );
}
