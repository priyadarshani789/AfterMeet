import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function TaskForm({ onTasksExtracted, loading = false, projectId = null }) {
  const [transcript, setTranscript] = useState('');
  const [taskOwner, setTaskOwner] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [warning, setWarning] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [teamAvailability, setTeamAvailability] = useState([]);
  const [showAvailabilityPanel, setShowAvailabilityPanel] = useState(false);
  const [fetchingAvailability, setFetchingAvailability] = useState(false);

  // Fetch team availability status when projectId changes
  useEffect(() => {
    if (projectId) {
      fetchTeamAvailability();
    }
  }, [projectId]);

  const fetchTeamAvailability = async () => {
    try {
      setFetchingAvailability(true);
      const response = await axios.get(`http://localhost:8000/projects/${projectId}/users/availability`);
      setTeamAvailability(response.data.members || []);
      console.log('📊 Team availability loaded:', response.data);
    } catch (error) {
      console.error('Error fetching team availability:', error);
      setTeamAvailability([]);
    } finally {
      setFetchingAvailability(false);
    }
  };

  const updateMemberAvailability = async (userId, isAvailable) => {
    try {
      await axios.put(
        `http://localhost:8000/projects/${projectId}/users/${userId}/availability`,
        { availability: isAvailable }
      );
      console.log(`✅ Updated availability for ${userId}`);
      
      // Update local state
      setTeamAvailability(teamAvailability.map(m =>
        m.id === userId ? { ...m, availability: isAvailable } : m
      ));
    } catch (error) {
      console.error('Error updating availability:', error);
      alert('Failed to update availability status');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isSubmitting || isLoading) {
      console.warn('Form already submitting, ignoring click');
      return;
    }
    
    setError(null);
    setWarning(null);
    setIsLoading(true);
    setIsSubmitting(true);

    try {
      console.log('📝 Submitting transcript for extraction...');
      
      const endpoint = projectId
        ? `http://localhost:8000/projects/${projectId}/extract-tasks`
        : 'http://localhost:8000/extract-tasks';
      
      const payload = {
        transcript: transcript,
        owner_id: taskOwner || undefined
      };

      const response = await axios.post(endpoint, payload);
      
      // Handle new response format with warning
      let tasks = [];
      if (Array.isArray(response.data)) {
        // Old format: just array of tasks
        tasks = response.data;
      } else if (response.data.tasks) {
        // New format: { tasks: [], warning: null }
        tasks = response.data.tasks;
        if (response.data.warning) {
          setWarning(response.data.warning);
          console.warn('⚠️ Warning:', response.data.warning);
        }
      }
      
      console.log(`✅ Received ${tasks.length} tasks from API:`, tasks);
      console.log('🔄 Triggering Kanban refresh...');
      onTasksExtracted(tasks);
      console.log('✅ Kanban refresh triggered');
      
      setTranscript('');
      setTaskOwner('');
    } catch (err) {
      const errorMessage = err.response?.data?.detail || 'Failed to extract tasks. Please try again.';
      setError(errorMessage);
      console.error('❌ Error:', err);
    } finally {
      setIsLoading(false);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">📝 Upload Meeting Transcript</h2>
      
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
          <p className="text-xs text-gray-500 mt-1">💡 Tip: Include names of team members in the transcript for automatic task assignment</p>
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

        {/* Team Availability Panel */}
        {projectId && teamAvailability.length > 0 && (
          <div className="border border-green-200 bg-green-50 rounded-lg p-4">
            <button
              type="button"
              onClick={() => setShowAvailabilityPanel(!showAvailabilityPanel)}
              className="w-full flex items-center justify-between font-semibold text-gray-900 hover:text-blue-600 transition"
            >
              <span>
                👥 Team Availability ({teamAvailability.filter(m => m.availability).length}/{teamAvailability.length} available)
              </span>
              <span>{showAvailabilityPanel ? '▼' : '▶'}</span>
            </button>

            {showAvailabilityPanel && (
              <div className="mt-4 space-y-2 pt-4 border-t border-green-200">
                {fetchingAvailability ? (
                  <p className="text-gray-600">Loading availability status...</p>
                ) : (
                  teamAvailability.map(member => (
                    <div key={member.id} className="flex items-center justify-between bg-white p-3 rounded border border-green-200">
                      <div>
                        <p className="font-medium text-gray-900">{member.name}</p>
                        <p className="text-xs text-gray-600">{member.role}</p>
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={member.availability}
                          onChange={(e) => updateMemberAvailability(member.id, e.target.checked)}
                          className="w-4 h-4"
                          disabled={isLoading || isSubmitting}
                        />
                        <span className={`text-sm font-medium ${member.availability ? 'text-green-600' : 'text-red-600'}`}>
                          {member.availability ? '✅ Available' : '❌ Unavailable'}
                        </span>
                      </label>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            ⚠️ {error}
          </div>
        )}

        {warning && (
          <div className="bg-amber-50 border border-amber-300 text-amber-900 px-4 py-3 rounded">
            <p className="font-semibold">📋 {warning}</p>
            <p className="text-sm mt-2">Suggestions:</p>
            <ul className="text-sm list-disc list-inside space-y-1 mt-1">
              <li>✓ Create a new project with these team members</li>
              <li>✓ Add team members with matching names to this project</li>
              <li>✓ Make sure transcript mentions your team members by name</li>
            </ul>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading || isSubmitting || !transcript.trim()}
          className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors ${
            isLoading || isSubmitting || !transcript.trim()
              ? 'bg-gray-300 text-gray-700 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700'
          }`}
        >
          {isLoading || isSubmitting ? '🔄 Extracting Tasks...' : '✨ Extract Tasks'}
        </button>
      </form>

      {/* Info Box */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-900 font-semibold mb-2">📌 How it works:</p>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>✓ Paste your meeting transcript above</li>
          <li>✓ Check team member availability (expand panel above)</li>
          <li>✓ AI extracts actionable tasks automatically</li>
          <li>✓ Tasks assigned only to available team members</li>
          <li>✓ Tasks appear in the Kanban board below</li>
          <li>✓ Mentions of team members are tracked</li>
        </ul>
      </div>
    </div>
  );
}
