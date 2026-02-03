import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API_URL = `${BACKEND_URL}/api`;

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('volleypro_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('volleypro_token');
      localStorage.removeItem('volleypro_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
};

// Tournament API
export const tournamentApi = {
  getAll: () => api.get('/tournaments'),
  getOne: (id) => api.get(`/tournaments/${id}`),
  create: (data) => api.post('/tournaments', data),
  delete: (id) => api.delete(`/tournaments/${id}`),
  
  // Teams
  addTeam: (tournamentId, data) => api.post(`/tournaments/${tournamentId}/teams`, data),
  updateTeam: (tournamentId, teamId, data) => api.put(`/tournaments/${tournamentId}/teams/${teamId}`, data),
  deleteTeam: (tournamentId, teamId) => api.delete(`/tournaments/${tournamentId}/teams/${teamId}`),
  
  // Groups
  assignGroups: (tournamentId, auto = true) => api.post(`/tournaments/${tournamentId}/assign-groups?auto=${auto}`),
  manualAssignGroup: (tournamentId, teamId, groupIndex) => 
    api.post(`/tournaments/${tournamentId}/manual-assign-group?team_id=${teamId}&group_index=${groupIndex}`),
  
  // Knockout
  startKnockout: (tournamentId) => api.post(`/tournaments/${tournamentId}/start-knockout`),
  
  // Matches
  updateMatchScore: (tournamentId, matchId, data) => 
    api.put(`/tournaments/${tournamentId}/matches/${matchId}/score`, data),
  scheduleMatch: (tournamentId, matchId, court, time) => 
    api.put(`/tournaments/${tournamentId}/matches/${matchId}/schedule?court=${court}&scheduled_time=${time}`),
  
  // Export
  exportPdf: (tournamentId) => api.get(`/tournaments/${tournamentId}/export-pdf`, { responseType: 'blob' }),
};

export default api;
