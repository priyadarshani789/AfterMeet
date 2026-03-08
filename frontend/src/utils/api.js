import axios from 'axios';

const API_BASE = 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 120000, // 120 second timeout for long AI operations
});

// Disable axios default retries to prevent multiple duplicate requests
api.defaults.httpAgent = undefined;
api.defaults.httpsAgent = undefined;

export const fetchTasks = async () => {
  try {
    console.log('Fetching tasks...');
    const response = await api.get('/tasks');
    return response.data;
  } catch (error) {
    console.error('Error fetching tasks:', error);
    throw error;
  }
};

export const extractTasks = async (transcriptText) => {
  try {
    console.log('Sending transcript for extraction (single request)...');
    const response = await api.post('/extract-tasks', {
      transcript: transcriptText,
    });
    console.log('Extract response received');
    return response.data;
  } catch (error) {
    console.error('Error extracting tasks:', error);
    throw error;
  }
};

export const updateTask = async (taskId, data) => {
  try {
    const response = await api.put(`/tasks/${taskId}`, data);
    return response.data;
  } catch (error) {
    console.error('Error updating task:', error);
    throw error;
  }
};

export const deleteTask = async (taskId) => {
  try {
    const response = await api.delete(`/tasks/${taskId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting task:', error);
    throw error;
  }
};

export default api;
