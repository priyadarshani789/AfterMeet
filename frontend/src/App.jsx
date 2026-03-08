import React, { useState, useEffect } from 'react';
import TaskForm from './components/TaskForm';
import KanbanBoard from './components/KanbanBoard';
import ProjectList from './components/ProjectList';
import ProjectCreation from './components/ProjectCreation';
import TranscriptHistory from './components/TranscriptHistory';
import GlobalTranscriptHistory from './components/GlobalTranscriptHistory';
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
    // Project is already created by ProjectCreation component
    // Just update the state and select it
    console.log('✅ Project ready:', project);
    setProjects([...projects, project]);
    setShowCreateProject(false);
    setSelectedProject(project);
    fetchProjectUsers(project.id);
  };

  const handleTasksExtracted = async () => {
    console.log('📥 Tasks extracted - refreshing project data...');
    
    // Refresh Kanban board
    setRefreshKanban((prev) => prev + 1);
    
    // Refresh transcript history
    setRefreshTranscripts((prev) => prev + 1);
    
    // Refresh project users when tasks are extracted
    if (selectedProject) {
      fetchProjectUsers(selectedProject.id);
    }
    
    // Refresh project data to update task count in header AND projects list
    if (selectedProject) {
      try {
        const response = await axios.get(`http://localhost:8000/projects/${selectedProject.id}`);
        setSelectedProject(response.data);
        console.log('✅ Project data refreshed:', response.data);
        
        // Also update the project in the projects array so the list shows updated counts
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 text-center mb-2">AfterMeet</h1>
          <p className="text-center text-gray-600">
            Convert meeting transcripts into actionable tasks automatically
          </p>
        </div>

        {/* Project Selection or Creation */}
        {!selectedProject ? (
          <>
            {showCreateProject ? (
              <ProjectCreation 
                onProjectCreated={handleCreateProject}
                onCancel={() => setShowCreateProject(false)}
              />
            ) : (
              <ProjectList
                projects={projects}
                onProjectSelected={handleProjectSelected}
                onCreateProject={() => setShowCreateProject(true)}
                onDeleteProject={handleDeleteProject}
                loading={loading}
              />
            )}
          </>
        ) : (
          <>
            {/* Project Header */}
            <div className="mb-8 bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedProject.name}</h2>
                  {selectedProject.description && (
                    <p className="text-gray-600 mt-2">{selectedProject.description}</p>
                  )}
                  <div className="mt-4 flex gap-4 text-sm text-gray-600">
                    <span>📊 Tasks: {selectedProject.tasks?.length || 0}</span>
                    <span>👥 Team Members: {projectUsers.length}</span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedProject(null)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium"
                >
                  ← Back to Projects
                </button>
              </div>
            </div>

            {/* Task Form */}
            <TaskForm 
              onTasksExtracted={handleTasksExtracted}
              projectId={selectedProject.id}
            />

            {/* Kanban Board */}
            <KanbanBoard 
              refreshTrigger={refreshKanban} 
              users={projectUsers}
              projectId={selectedProject.id}
            />

            {/* Transcript History */}
            <div className="mt-8">
              <TranscriptHistory projectId={selectedProject.id} refreshTrigger={refreshTranscripts} />
            </div>
          </>
        )}

        {/* Global Transcript Database - Always Visible */}
        <div className="mt-12 border-t-2 border-gray-300 pt-8">
          <GlobalTranscriptHistory onSelectProject={handleSelectProjectFromTranscript} />
        </div>
      </div>
    </div>
  );
}
