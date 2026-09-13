import axios, { type AxiosRequestConfig, type AxiosResponse } from 'axios'

// VITE_API_URL se define en .env.local → http://localhost:51141/api
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:51141/api',
  headers: {
    'Content-Type': 'application/json'
  }
})

api.interceptors.request.use((config: AxiosRequestConfig) => {
  const token = localStorage.getItem('token')
  if (token && config.headers) {
    config.headers['Authorization'] = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response: AxiosResponse) => response.data,
  (error: unknown) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api