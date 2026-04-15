import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Get token from Zustand persist store
    const authStorage = localStorage.getItem('auth-storage')
    if (authStorage) {
      try {
        const { state } = JSON.parse(authStorage)
        const token = state?.accessToken
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
      } catch (error) {
        console.error('Failed to parse auth storage:', error)
      }
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    
    // Only try to refresh token if we have one and not already retrying
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Get refresh token from Zustand persist store
      const authStorage = localStorage.getItem('auth-storage')
      let refreshToken = null
      
      if (authStorage) {
        try {
          const { state } = JSON.parse(authStorage)
          refreshToken = state?.refreshToken
        } catch (error) {
          console.error('Failed to parse auth storage:', error)
        }
      }
      
      // Don't try to refresh if we don't have a refresh token
      // or if it's a login/auth endpoint
      if (!refreshToken || originalRequest.url?.includes('/auth/')) {
        return Promise.reject(error)
      }
      
      originalRequest._retry = true
      
      try {
        const { data } = await axios.post('http://localhost:3000/api/auth/refresh', { refreshToken })
        
        // Update token in Zustand persist store
        const newAccessToken = data.data.accessToken
        if (authStorage) {
          const parsed = JSON.parse(authStorage)
          parsed.state.accessToken = newAccessToken
          localStorage.setItem('auth-storage', JSON.stringify(parsed))
        }
        
        api.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`
        
        return api(originalRequest)
      } catch (err) {
        // Clear auth storage on refresh failure
        localStorage.removeItem('auth-storage')
        // Only redirect if not on login page already
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login'
        }
        return Promise.reject(err)
      }
    }
    
    return Promise.reject(error)
  }
)

export default api
