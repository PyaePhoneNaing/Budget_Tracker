import axios from 'axios'

// Use relative URL - Vercel will proxy /api/* to backend via vercel.json
// For local development, use localhost
const apiUrl = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:3001/api' : '/api');
console.log('API Base URL:', apiUrl); // Debug log

const api = axios.create({
  baseURL: apiUrl,
})

// Add token to requests if available
const token = localStorage.getItem('token')
if (token) {
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`
}

// Set default Content-Type for JSON requests
api.defaults.headers.common['Content-Type'] = 'application/json'

// Interceptor to remove Content-Type for FormData (file uploads)
api.interceptors.request.use((config) => {
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type']
  }
  return config
})

export default api
