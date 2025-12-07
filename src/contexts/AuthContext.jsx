import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

const API_URL = '/api'

// Load cached user from localStorage immediately
const getCachedUser = () => {
  try {
    const cached = localStorage.getItem('user')
    return cached ? JSON.parse(cached) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem('token'))
  // Initialize with cached user for instant display
  const [user, setUser] = useState(token ? getCachedUser() : null)
  // If we have cached user, don't show loading
  const [loading, setLoading] = useState(token && !getCachedUser())

  useEffect(() => {
    if (token) {
      fetchUser()
    } else {
      setLoading(false)
    }
  }, [token])

  const fetchUser = async () => {
    try {
      const res = await fetch(`${API_URL}/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setUser(data)
        // Cache user for next page load
        localStorage.setItem('user', JSON.stringify(data))
        localStorage.setItem('userRole', data.role?.toLowerCase() || '')
      } else {
        logout()
      }
    } catch (err) {
      console.error('Auth error:', err)
    } finally {
      setLoading(false)
    }
  }

  const login = async (email, password) => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.detail || 'Login failed')
    
    localStorage.setItem('token', data.access_token)
    localStorage.setItem('user', JSON.stringify(data.user))
    localStorage.setItem('userRole', data.user.role?.toLowerCase() || '')
    setToken(data.access_token)
    setUser(data.user)
    return data
  }

  const register = async (userData) => {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.detail || 'Registration failed')
    return data
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('userRole')
    setToken(null)
    setUser(null)
  }

  const updateUser = (updatedUser) => {
    setUser(updatedUser)
    localStorage.setItem('user', JSON.stringify(updatedUser))
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
