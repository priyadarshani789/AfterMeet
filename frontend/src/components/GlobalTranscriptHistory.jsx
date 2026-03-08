import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function GlobalTranscriptHistory({ onSelectProject }) {
  const [transcripts, setTranscripts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProject, setFilterProject] = useState('');
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    fetchAllTranscripts();
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await axios.get('http://localhost:8000/projects');
      setProjects(response.data);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const fetchAllTranscripts = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await axios.get('http://localhost:8000/transcripts');
      console.log('📜 All transcripts loaded:', response.data);
      setTranscripts(response.data);
    } catch (error) {
      console.error('Error fetching transcripts:', error);
      setError('Failed to load transcript history');
      setTranscripts([]);
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

  const filteredTranscripts = transcripts.filter(t => {
    const matchesSearch = t.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProject = !filterProject || t.project_id === filterProject;
    return matchesSearch && matchesProject;
  });

  if (loading) {
    return (
      <div className="bg-purple-50 rounded-lg p-6 border border-purple-200">
        <h3 className="font-bold text-gray-900 mb-4">📚 All Transcripts Database</h3>
        <p className="text-gray-600">Loading transcripts...</p>
      </div>
    );
  }

  return (
    <div className="bg-purple-50 rounded-lg p-6 border border-purple-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-900">📚 All Transcripts Database</h3>
        <span className="text-sm font-medium text-purple-600 bg-white px-3 py-1 rounded-full">
          {filteredTranscripts.length} transcript{filteredTranscripts.length !== 1 ? 's' : ''}
        </span>
      </div>

      {error && (
        <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg mb-4">
          ⚠️ {error}
        </div>
      )}

      {/* Filter Section */}
      <div className="mb-4 space-y-3">
        {/* Search Bar */}
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="🔍 Search transcripts..."
          className="w-full px-4 py-2 border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
        
        {/* Project Filter */}
        {projects.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setFilterProject('')}
              className={`px-3 py-1 text-sm rounded-full transition ${
                !filterProject 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-white border border-purple-300 text-gray-700 hover:bg-purple-50'
              }`}
            >
              All Projects
            </button>
            {projects.map(p => (
              <button
                key={p.id}
                onClick={() => setFilterProject(p.id)}
                className={`px-3 py-1 text-sm rounded-full transition ${
                  filterProject === p.id 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-white border border-indigo-300 text-gray-700 hover:bg-indigo-50'
                }`}
              >
                📁 {p.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {transcripts.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p className="text-lg">📭 No transcripts stored yet</p>
          <p className="text-sm mt-2">Transcripts from all projects will appear here</p>
        </div>
      ) : filteredTranscripts.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p className="text-lg">🔍 No matching transcripts</p>
          <p className="text-sm mt-2">Try a different search term</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {filteredTranscripts.map((transcript, index) => (
            <div
              key={transcript.id}
              className="bg-white rounded-lg p-4 border border-purple-200 hover:shadow-md transition"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <span className="text-sm font-semibold text-gray-900">
                      #{index + 1}
                    </span>
                    <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                      {formatDate(transcript.created_at)}
                    </span>
                  </div>
                  
                  {/* Project Link - Prominent Display */}
                  <div className="mb-3 flex items-center gap-2">
                    <span className="text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-indigo-500 px-3 py-1 rounded-full">
                      📁 {transcript.project_name || transcript.project_id}
                    </span>
                    {onSelectProject && (
                      <button
                        onClick={() => onSelectProject(transcript.project_id)}
                        className="text-xs font-medium text-indigo-600 hover:text-indigo-800 hover:underline"
                      >
                        View Project →
                      </button>
                    )}
                  </div>
                  
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {expandedId === transcript.id
                      ? transcript.content
                      : truncateText(transcript.content)}
                  </p>

                  <div className="flex items-center gap-4 mt-3 text-sm flex-wrap">
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
                    className="mt-2 px-3 py-1 text-xs font-medium text-purple-600 hover:bg-purple-100 rounded transition whitespace-nowrap"
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
        onClick={fetchAllTranscripts}
        className="mt-4 px-3 py-1 text-xs font-medium text-purple-600 hover:text-purple-900 hover:bg-purple-200 rounded transition"
      >
        🔄 Refresh Database
      </button>
    </div>
  );
}
