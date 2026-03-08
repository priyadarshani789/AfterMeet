import React from 'react';

export default function ProjectList({
  projects,
  onProjectSelected,
  onCreateProject,
  onDeleteProject,
  loading
}) {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Your Projects</h2>
          <p className="text-gray-600">Select a project to manage tasks or create a new one</p>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <p className="text-gray-600">Loading projects...</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-6">No projects created yet</p>
            <button
              onClick={onCreateProject}
              className="px-8 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg font-bold hover:from-blue-600 hover:to-indigo-700 transition"
            >
              + Create Your First Project
            </button>
          </div>
        ) : (
          <>
            {/* Projects Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="border border-gray-200 rounded-lg p-6 hover:shadow-lg hover:border-blue-400 transition cursor-pointer group"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600">
                        {project.name}
                      </h3>
                      {project.description && (
                        <p className="text-gray-600 text-sm mt-2">{project.description}</p>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteProject(project.id);
                      }}
                      className="text-red-500 hover:text-red-700 font-medium text-sm"
                    >
                      Delete
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-600 mb-4 border-t pt-4">
                    <span>📊 {project.tasks?.length || 0} tasks</span>
                    <span>👥 {project.users?.length || 0} team members</span>
                  </div>

                  <button
                    onClick={() => onProjectSelected(project)}
                    className="w-full px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-indigo-700 transition"
                  >
                    Open Project
                  </button>
                </div>
              ))}
            </div>

            {/* Create New Button */}
            <div className="text-center pt-8 border-t">
              <button
                onClick={onCreateProject}
                className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-bold hover:from-green-600 hover:to-emerald-700 transition"
              >
                + Create New Project
              </button>
            </div>
          </>
        )}
      </div>

      {/* Project Stats */}
      {projects.length > 0 && (
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-3xl font-bold text-blue-600">{projects.length}</p>
            <p className="text-gray-600 text-sm mt-2">Total Projects</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-3xl font-bold text-indigo-600">
              {projects.reduce((sum, p) => sum + (p.tasks?.length || 0), 0)}
            </p>
            <p className="text-gray-600 text-sm mt-2">Total Tasks</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-3xl font-bold text-purple-600">
              {projects.reduce((sum, p) => sum + (p.users?.length || 0), 0)}
            </p>
            <p className="text-gray-600 text-sm mt-2">Team Members</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-3xl font-bold text-green-600">
              {projects.reduce((sum, p) => sum + (p.tasks?.filter(t => t.status === 'done')?.length || 0), 0)}
            </p>
            <p className="text-gray-600 text-sm mt-2">Completed Tasks</p>
          </div>
        </div>
      )}
    </div>
  );
}
