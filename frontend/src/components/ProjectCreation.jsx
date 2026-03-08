import React, { useState } from 'react';

export default function ProjectCreation({ onProjectCreated, onCancel }) {
  const [step, setStep] = useState('basic'); // 'basic', 'team', 'gchat', 'done'
  const [projectData, setProjectData] = useState({
    name: '',
    description: ''
  });
  const [teamMembers, setTeamMembers] = useState([]);
  const [currentMember, setCurrentMember] = useState({
    name: '',
    role: '',
    availability: true
  });
  const [gchatData, setGchatData] = useState({
    useGchat: false,
    webhookUrl: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const roles = ['Product Manager', 'Developer', 'Designer', 'QA Engineer', 'Manager', 'Other'];

  const handleBasicSubmit = async (e) => {
    e.preventDefault();
    
    if (!projectData.name.trim()) {
      setError('Project name is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('🆕 Creating project...', projectData);
      const response = await fetch('http://localhost:8000/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectData)
      });

      if (!response.ok) {
        throw new Error('Failed to create project');
      }

      const project = await response.json();
      console.log('✅ Project created:', project);
      
      setProjectData(prev => ({ ...prev, projectId: project.id, project }));
      setStep('team');
    } catch (err) {
      setError(err.message);
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = (e) => {
    e.preventDefault();

    if (!currentMember.name.trim() || !currentMember.role.trim()) {
      setError('Please fill in all fields');
      return;
    }

    setError('');
    setTeamMembers([...teamMembers, { ...currentMember, id: Date.now().toString() }]);
    setCurrentMember({ name: '', role: '', availability: true });
    console.log('👤 Member added:', currentMember);
  };

  const handleRemoveMember = (id) => {
    setTeamMembers(teamMembers.filter(m => m.id !== id));
  };

  const handleFinish = async () => {
    setLoading(true);
    setError('');

    try {
      for (const member of teamMembers) {
        console.log(`➕ Adding member ${member.name} (${member.availability ? '✅ Available' : '❌ Unavailable'}) to project...`);
        await fetch(
          `http://localhost:8000/projects/${projectData.project.id}/users`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: member.name,
              role: member.role,
              availability: member.availability
            })
          }
        );
      }

      console.log('✅ All team members added with availability status');
      setStep('done');
      
      // Fetch the latest project data from backend to include all team members
      setTimeout(async () => {
        try {
          const response = await fetch(
            `http://localhost:8000/projects/${projectData.project.id}`
          );
          const updatedProject = await response.json();
          console.log('✅ Fetched updated project with team members:', updatedProject);
          onProjectCreated(updatedProject);
        } catch (err) {
          console.error('Error fetching updated project:', err);
          // Fallback to original project if fetch fails
          onProjectCreated(projectData.project);
        }
      }, 500);
    } catch (err) {
      setError(err.message);
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSkipTeamSetup = () => {
    console.log('⏭️ Skipping team setup');
    onProjectCreated(projectData.project);
  };

  // Step 1: Basic Project Info
  if (step === 'basic') {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-3xl font-bold text-gray-900">📋 Create New Project</h2>
              <div className="text-sm text-gray-600">Step 1 of 3</div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full w-1/3"></div>
            </div>
          </div>

          <form onSubmit={handleBasicSubmit} className="space-y-6">
            <div>
              <label className="block text-gray-700 font-bold mb-2">Project Name *</label>
              <input
                type="text"
                value={projectData.name}
                onChange={(e) => setProjectData({ ...projectData, name: e.target.value })}
                placeholder="e.g., JadeNova, Mobile App, Website Redesign"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              />
              <p className="text-gray-600 text-sm mt-1">
                Give your project a meaningful name to identify it easily
              </p>
            </div>

            <div>
              <label className="block text-gray-700 font-bold mb-2">Description (Optional)</label>
              <textarea
                value={projectData.description}
                onChange={(e) => setProjectData({ ...projectData, description: e.target.value })}
                placeholder="Add more details about this project..."
                rows="4"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              />
              <p className="text-gray-600 text-sm mt-1">
                This helps you remember what this project is about
              </p>
            </div>

            {error && (
              <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                {error}
              </div>
            )}

            <div className="flex gap-4 pt-6 border-t">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg font-bold hover:from-blue-600 hover:to-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '🔄 Creating...' : '➜ Next: Add Team Members'}
              </button>
              <button
                type="button"
                onClick={onCancel}
                disabled={loading}
                className="flex-1 px-6 py-3 bg-gray-200 text-gray-800 rounded-lg font-bold hover:bg-gray-300 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Step 2: Team Members Setup
  if (step === 'team') {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-3xl font-bold text-gray-900">👥 Add Team Members</h2>
              <div className="text-sm text-gray-600">Step 2 of 3</div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full w-2/3"></div>
            </div>
          </div>

          <p className="text-gray-600 mb-6">
            Add the members of your team. They will be available for task assignment when you extract tasks.
          </p>

          {teamMembers.length > 0 && (
            <div className="mb-8 bg-gray-50 rounded-lg p-6">
              <h3 className="font-bold text-gray-900 mb-4">📊 Current Team ({teamMembers.length})</h3>
              <div className="space-y-2">
                {teamMembers.map((member) => (
                  <div key={member.id} className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{member.name}</p>
                      <p className="text-sm text-gray-600">{member.role}</p>
                      <div className="mt-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={member.availability}
                            onChange={(e) => {
                              setTeamMembers(teamMembers.map(m => 
                                m.id === member.id ? {...m, availability: e.target.checked} : m
                              ));
                            }}
                            className="w-4 h-4"
                          />
                          <span className={`text-sm font-medium ${member.availability ? 'text-green-600' : 'text-red-600'}`}>
                            {member.availability ? '✅ Available' : '❌ Unavailable'}
                          </span>
                        </label>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveMember(member.id)}
                      className="text-red-500 hover:text-red-700 font-bold"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={handleAddMember} className="space-y-4 mb-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="font-bold text-gray-900 mb-4">➕ Add New Member</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 font-medium mb-2">Member Name</label>
                <input
                  type="text"
                  value={currentMember.name}
                  onChange={(e) => setCurrentMember({ ...currentMember, name: e.target.value })}
                  placeholder="e.g., Sarah, John"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">Role</label>
                <select
                  value={currentMember.role}
                  onChange={(e) => setCurrentMember({ ...currentMember, role: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loading}
                >
                  <option value="">Select a role</option>
                  {roles.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-white p-3 rounded-lg border border-blue-300">
              <input
                type="checkbox"
                checked={currentMember.availability}
                onChange={(e) => setCurrentMember({ ...currentMember, availability: e.target.checked })}
                className="w-4 h-4"
                disabled={loading}
              />
              <label className="text-gray-700 font-medium cursor-pointer flex-1">
                {currentMember.availability ? '✅ Available for Task Assignment' : '❌ Currently Unavailable'}
              </label>
            </div>

            <button
              type="submit"
              disabled={loading || !currentMember.name.trim() || !currentMember.role.trim()}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              + Add Member
            </button>
          </form>

          {error && (
            <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg mb-6">
              {error}
            </div>
          )}

          <div className="flex gap-4 pt-6 border-t">
            <button
              onClick={async () => {
                // Save team members and go to gchat step
                setLoading(true);
                setError('');
                try {
                  for (const member of teamMembers) {
                    await fetch(
                      `http://localhost:8000/projects/${projectData.project.id}/users`,
                      {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          name: member.name,
                          role: member.role,
                          availability: member.availability
                        })
                      }
                    );
                  }
                  console.log('✅ Team members added, moving to Google Chat setup...');
                  setStep('gchat');
                } catch (err) {
                  setError(err.message);
                } finally {
                  setLoading(false);
                }
              }}
              disabled={loading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg font-bold hover:from-blue-600 hover:to-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '🔄 Saving...' : `➜ Next: Google Chat Setup`}
            </button>

            <button
              onClick={async () => {
                // Skip team members and go to gchat step
                setStep('gchat');
              }}
              disabled={loading}
              className="flex-1 px-6 py-3 bg-gray-200 text-gray-800 rounded-lg font-bold hover:bg-gray-300 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ⏭️ Skip Team
            </button>
          </div>

          <p className="text-center text-gray-600 text-sm mt-4">
            💡 You can add more team members later from the project settings
          </p>
        </div>
      </div>
    );
  }

  // Step 3: Google Chat Integration
  if (step === 'gchat') {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-3xl font-bold text-gray-900">💬 Google Chat Integration</h2>
              <div className="text-sm text-gray-600">Step 3 of 3</div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full" style={{ width: '100%' }}></div>
            </div>
          </div>

          <p className="text-gray-600 mb-6">
            🚀 Get real-time notifications in Google Chat when new tasks are extracted from transcripts!
          </p>

          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-bold text-blue-900 mb-2">✨ How It Works</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>✔️ Create a Google Chat space for your project</li>
              <li>✔️ Generate a webhook URL from Google Chat</li>
              <li>✔️ Paste it below to connect AfterMeet</li>
              <li>✔️ Whenever tasks are extracted, they'll appear in your Chat space!</li>
            </ul>
          </div>

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!gchatData.useGchat || !gchatData.webhookUrl.trim()) {
                setError('Please enter a valid webhook URL');
                return;
              }

              setLoading(true);
              setError('');
              try {
                console.log('🔗 Configuring Google Chat webhook...');
                const response = await fetch(
                  `http://localhost:8000/projects/${projectData.project.id}/webhook`,
                  {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      webhook_url: gchatData.webhookUrl
                    })
                  }
                );

                if (!response.ok) {
                  const error = await response.json();
                  throw new Error(error.detail || 'Failed to configure webhook');
                }

                const result = await response.json();
                console.log('✅ Google Chat webhook configured:', result);

                // Complete the project creation
                setTimeout(() => {
                  try {
                    const updatedProject = { ...projectData.project };
                    console.log('✅ Project created and Google Chat integrated!');
                    onProjectCreated(updatedProject);
                  } catch (err) {
                    onProjectCreated(projectData.project);
                  }
                }, 500);
              } catch (err) {
                setError(err.message || 'Failed to configure webhook');
                console.error('Error:', err);
              } finally {
                setLoading(false);
              }
            }}
            className="space-y-6 mb-6"
          >
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={gchatData.useGchat}
                  onChange={(e) => setGchatData({ ...gchatData, useGchat: e.target.checked })}
                  className="w-5 h-5"
                  disabled={loading}
                />
                <div>
                  <p className="font-semibold text-gray-900">Enable Google Chat Notifications</p>
                  <p className="text-sm text-gray-600">Get task updates sent to your Google Chat space</p>
                </div>
              </label>

              {gchatData.useGchat && (
                <div className="mt-4 p-4 bg-white border border-blue-200 rounded-lg">
                  <label className="block text-gray-700 font-bold mb-2">🔗 Google Chat Webhook URL</label>
                  <input
                    type="password"
                    value={gchatData.webhookUrl}
                    onChange={(e) => setGchatData({ ...gchatData, webhookUrl: e.target.value })}
                    placeholder="Paste your webhook URL here (kept secret for security)"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    disabled={loading}
                  />
                  <p className="text-xs text-gray-600 mt-2">
                    🔒 Your webhook URL is kept secure and never displayed • 📖 <a href="https://developers.google.com/chat/how-tos/webhooks" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      Learn how to get your webhook URL
                    </a>
                  </p>
                </div>
              )}
            </div>

            {error && (
              <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                {error}
              </div>
            )}

            <div className="flex gap-4 pt-6 border-t">
              <button
                type="submit"
                disabled={loading || !gchatData.useGchat || !gchatData.webhookUrl.trim()}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-bold hover:from-green-600 hover:to-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '🔄 Configuring...' : '✅ Create Project with Chat'}
              </button>

              <button
                type="button"
                onClick={() => {
                  // Skip Google Chat and finish
                  try {
                    onProjectCreated(projectData.project);
                  } catch (err) {
                    console.error('Error:', err);
                  }
                }}
                disabled={loading}
                className="flex-1 px-6 py-3 bg-gray-200 text-gray-800 rounded-lg font-bold hover:bg-gray-300 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ⏭️ Skip & Finish
              </button>
            </div>
          </form>

          <p className="text-center text-gray-600 text-sm mt-4">
            💡 You can configure Google Chat later from project settings
          </p>
        </div>
      </div>
    );
  }

  return null;
}
