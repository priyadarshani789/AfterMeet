import React, { useState } from 'react';

const Sidebar = ({ projects, selectedProject, onProjectSelected, onCreateProject, onDeleteProject, loading }) => {
  const [expandedMenu, setExpandedMenu] = useState(null);

  return (
    <aside className="fixed left-0 top-16 w-64 h-[calc(100vh-64px)] bg-gray-900 text-white overflow-y-auto shadow-lg z-30">
      {/* Sidebar Header */}
      <div className="p-6 border-b border-gray-700">
        <button
          onClick={onCreateProject}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-2 px-4 rounded-lg transition flex items-center justify-center gap-2"
        >
          <span>➕</span>
          New Project
        </button>
      </div>

      {/* Projects List */}
      <div className="p-4">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Projects</h3>
        
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-xs text-gray-400 mt-2">Loading...</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-gray-400">No projects yet</p>
            <p className="text-xs text-gray-500 mt-1">Create one to get started</p>
          </div>
        ) : (
          <div className="space-y-2">
            {projects.map((project) => (
              <div key={project.id} className="group">
                <button
                  onClick={() => onProjectSelected(project)}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
                    selectedProject?.id === project.id
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-800'
                  }`}
                >
                  <div className="font-medium text-sm truncate">{project.name}</div>
                  <div className="text-xs opacity-75 mt-1">
                    📊 {project.tasks?.length || 0} tasks
                  </div>
                </button>
                
                {selectedProject?.id === project.id && (
                  <button
                    onClick={() => {
                      if (window.confirm(`Delete "${project.name}"?`)) {
                        onDeleteProject(project.id);
                      }
                    }}
                    className="w-full mx-auto mt-1 text-xs text-gray-400 hover:text-red-400 transition px-4 py-1 rounded"
                  >
                    🗑️ Delete
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sidebar Footer */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-700 bg-gray-800/50">
        <p className="text-xs text-gray-500 text-center">
          v1.0 • 2026
        </p>
      </div>
    </aside>
  );
};

export default Sidebar;
