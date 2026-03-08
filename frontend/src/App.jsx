import React, { useState, useEffect } from 'react';
import TaskForm from './components/TaskForm';
import KanbanBoard from './components/KanbanBoard';
import ProjectList from './components/ProjectList';
import ProjectCreation from './components/ProjectCreation';
import TranscriptHistory from './components/TranscriptHistory';
import GlobalTranscriptHistory from './components/GlobalTranscriptHistory';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import axios from 'axios';

export default function App() {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [refreshKanban, setRefreshKanban] = useState(0);
  const [refreshTranscripts, setRefreshTranscripts] = useState(0);
  const [projectUsers, setProjectUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:8000/projects');
      setProjects(response.data);
      console.log('📋 Projects loaded:', response.data);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjectUsers = async (projectId) => {
    try {
      const response = await axios.get(`http://localhost:8000/projects/${projectId}/users`);
      setProjectUsers(response.data);
      console.log(`👥 Users for project ${projectId}:`, response.data);
    } catch (error) {
      console.error('Error fetching project users:', error);
      setProjectUsers([]);
    }
  };

  const handleProjectSelected = (project) => {
    console.log('✅ Project selected:', project.name);
    setSelectedProject(project);
    fetchProjectUsers(project.id);
  };

  const handleSelectProjectFromTranscript = (projectId) => {
    console.log('📜 Selecting project from transcript:', projectId);
    const project = projects.find(p => p.id === projectId);
    if (project) {
      handleProjectSelected(project);
    }
  };

  const handleCreateProject = (project) => {
    console.log('✅ Project ready:', project);
    setProjects([...projects, project]);
    setShowCreateProject(false);
    setSelectedProject(project);
    fetchProjectUsers(project.id);
  };

  const handleTasksExtracted = async () => {
    console.log('📥 Tasks extracted - refreshing project data...');
    
    setRefreshKanban((prev) => prev + 1);
    setRefreshTranscripts((prev) => prev + 1);
    
    if (selectedProject) {
      fetchProjectUsers(selectedProject.id);
    }
    
    if (selectedProject) {
      try {
        const response = await axios.get(`http://localhost:8000/projects/${selectedProject.id}`);
        setSelectedProject(response.data);
        console.log('✅ Project data refreshed:', response.data);
        
        setProjects(prevProjects =>
          prevProjects.map(p => p.id === selectedProject.id ? response.data : p)
        );
        console.log('✅ Projects list updated with new task count');
      } catch (error) {
        console.error('Error refreshing project:', error);
      }
    }
  };

  const handleDeleteProject = async (projectId) => {
    if (!window.confirm('Are you sure you want to delete this project?')) {
      return;
    }
    
    try {
      await axios.delete(`http://localhost:8000/projects/${projectId}`);
      console.log('🗑️ Project deleted:', projectId);
      setProjects(projects.filter(p => p.id !== projectId));
      if (selectedProject?.id === projectId) {
        setSelectedProject(null);
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      alert('Failed to delete project');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <Navbar />

      {/* Main Layout with Sidebar */}
      <div className="flex pt-16">
        {/* Sidebar */}
        <Sidebar
          projects={projects}
          selectedProject={selectedProject}
          onProjectSelected={handleProjectSelected}
          onCreateProject={() => setShowCreateProject(true)}
          onDeleteProject={handleDeleteProject}
          loading={loading}
        />

        {/* Main Content Area */}
        <main className="flex-1 ml-64 transition-all">
          {/* Project Selection or Creation */}
          {!selectedProject ? (
            <div className="p-8">
              {showCreateProject ? (
                <div className="max-w-4xl">
                  <button
                    onClick={() => setShowCreateProject(false)}
                    className="mb-6 flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium"
                  >
                    ← Back to Projects
                  </button>
                  <ProjectCreation 
                    onProjectCreated={handleCreateProject}
                    onCancel={() => setShowCreateProject(false)}
                  />
                </div>
              ) : (
                <>
                  {/* Welcome Section */}
                  <div className="mb-8">
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome to AfterMeet</h2>
                    <p className="text-gray-600">
                      Convert meeting transcripts into actionable tasks automatically
                    </p>
                  </div>

                  {/* Projects Grid */}
                  <ProjectList
                    projects={projects}
                    onProjectSelected={handleProjectSelected}
                    onCreateProject={() => setShowCreateProject(true)}
                    onDeleteProject={handleDeleteProject}
                    loading={loading}
                  />
                </>
              )}
            </div>
          ) : (
            <div className="p-8">
              {/* Project Content */}
              <div className="mb-8">
                {/* Project Header */}
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900">{selectedProject.name}</h2>
                    {selectedProject.description && (
                      <p className="text-gray-600 mt-2">{selectedProject.description}</p>
                    )}
                    <div className="mt-4 flex gap-6 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">📊</span>
                        <div>
                          <p className="text-gray-500 text-xs">Tasks</p>
                          <p className="font-bold text-gray-900">{selectedProject.tasks?.length || 0}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">👥</span>
                        <div>
                          <p className="text-gray-500 text-xs">Team Members</p>
                          <p className="font-bold text-gray-900">{projectUsers.length}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedProject(null)}
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition"
                  >
                    ← Back
                  </button>
                </div>
              </div>

              {/* Task Form */}
              <div className="mb-8">
                <TaskForm 
                  onTasksExtracted={handleTasksExtracted}
                  projectId={selectedProject.id}
                />
              </div>

              {/* Kanban Board */}
              <div className="mb-8">
                <KanbanBoard 
                  refreshTrigger={refreshKanban} 
                  users={projectUsers}
                  projectId={selectedProject.id}
                />
              </div>

              {/* Transcript History */}
              <div className="mb-8">
                <TranscriptHistory projectId={selectedProject.id} refreshTrigger={refreshTranscripts} />
              </div>
            </div>
          )}

          {/* Global Transcript Database */}
          <div className="px-8 pb-8 border-t border-gray-200 mt-12 pt-8">
            <GlobalTranscriptHistory onSelectProject={handleSelectProjectFromTranscript} />
          </div>
        </main>
      </div>
    </div>
  );
}
