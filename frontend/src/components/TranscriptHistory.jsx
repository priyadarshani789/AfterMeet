import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function TranscriptHistory({ projectId, refreshTrigger = 0 }) {
  const [transcripts, setTranscripts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (projectId) {
      fetchTranscripts();
    }
  }, [projectId, refreshTrigger]);

  const fetchTranscripts = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await axios.get(
        `http://localhost:8000/projects/${projectId}/transcripts`
      );
      console.log('📜 Transcripts loaded:', response.data);
      setTranscripts(response.data);
    } catch (error) {
      console.error('Error fetching transcripts:', error);
      if (error.response?.status === 404) {
        setTranscripts([]);
      } else {
        setError('Failed to load transcript history');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (isoDate) => {
    const date = new Date(isoDate);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const truncateText = (text, length = 100) => {
    if (text.length > length) {
      return text.substring(0, length) + '...';
    }
    return text;
  };

  if (loading) {
    return (
      <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
        <h3 className="font-bold text-gray-900 mb-4">📜 Transcript History</h3>
        <p className="text-gray-600">Loading transcripts...</p>
      </div>
    );
  }

  return (
    <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
      <h3 className="font-bold text-gray-900 mb-4">📜 Transcript History</h3>

      {error && (
        <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg mb-4">
          ⚠️ {error}
        </div>
      )}

      {transcripts.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p className="text-lg">📭 No transcripts yet</p>
          <p className="text-sm mt-2">Transcripts will be saved here when you extract tasks</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {transcripts.map((transcript, index) => (
            <div
              key={transcript.id}
              className="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-md transition"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-900">
                      #{index + 1}
                    </span>
                    <span className="text-xs text-gray-600">
                      {formatDate(transcript.created_at)}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-700 mt-2 leading-relaxed">
                    {expandedId === transcript.id
                      ? transcript.content
                      : truncateText(transcript.content)}
                  </p>

                  <div className="flex items-center gap-4 mt-3 text-sm">
                    <span className="text-gray-600">
                      📏 {transcript.length} characters
                    </span>
                    <span className="text-green-600 font-medium">
                      ✅ {transcript.tasks_extracted} tasks extracted
                    </span>
                  </div>
                </div>

                {transcript.content.length > 100 && (
                  <button
                    onClick={() =>
                      setExpandedId(expandedId === transcript.id ? null : transcript.id)
                    }
                    className="mt-2 px-3 py-1 text-xs font-medium text-blue-600 hover:bg-blue-100 rounded transition whitespace-nowrap"
                  >
                    {expandedId === transcript.id ? '▼ Hide' : '▶ View'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={fetchTranscripts}
        className="mt-4 px-3 py-1 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition"
      >
        🔄 Refresh
      </button>
    </div>
  );
}
