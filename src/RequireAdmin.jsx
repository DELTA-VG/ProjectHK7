import { Navigate, Outlet } from 'react-router-dom'
import { useEffect } from 'react'
import { useToast } from './contexts/ToastContext'

export default function RequireAdmin() {
  const token = localStorage.getItem('token')
  const userRole = localStorage.getItem('userRole')
  const toast = useToast()
  
  useEffect(() => {
    if (token && userRole !== 'admin') {
      toast.error('Bạn không có quyền truy cập trang này!')
    }
  }, [token, userRole])

  if (!token) {
    return <Navigate to="/auth" replace />
  }
  
  if (userRole !== 'admin') {
    return <Navigate to="/home" replace />
  }
  
  return <Outlet />
}
