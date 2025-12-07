import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from './contexts/ToastContext'
import './AuthPage.css'
import TransitionLink from './TransitionLink'

export default function AuthPage() {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ email: '', password: '', full_name: '', phone: '' })
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const toast = useToast()

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    
    const url = mode === 'login' ? '/api/auth/login' : '/api/auth/register'
    const payload = mode === 'login'
      ? { email: form.email, password: form.password }
      : form

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await response.json()
      
      if (!response.ok) {
        toast.error(data.detail || 'Đăng nhập/đăng ký thất bại')
        return
      }

      localStorage.setItem('token', data.access_token)
      localStorage.setItem('user', JSON.stringify(data.user))
      localStorage.setItem('userRole', data.user.role?.toLowerCase?.() ?? '')
      
      toast.success(mode === 'login' ? 'Đăng nhập thành công!' : 'Đăng ký thành công!')
      navigate('/home')
    } catch (err) {
      toast.error('Có lỗi xảy ra, vui lòng thử lại')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <h1>{mode === 'login' ? 'Đăng nhập' : 'Đăng ký'}</h1>
          <p>Đức An Việt - trải nghiệm ngọt ngào</p>
        </div>
        <form className="auth-form" onSubmit={handleSubmit}>
          <input name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} required />
          <input name="password" type="password" placeholder="Mật khẩu" value={form.password} onChange={handleChange} required />
          {mode === 'register' && (
            <>
              <input name="full_name" placeholder="Họ và tên" value={form.full_name} onChange={handleChange} required />
              <input name="phone" placeholder="Số điện thoại" value={form.phone} onChange={handleChange} required />
            </>
          )}
          <button type="submit" className="primary-btn" disabled={loading}>
            {loading ? 'Đang xử lý...' : (mode === 'login' ? 'Đăng nhập' : 'Đăng ký')}
          </button>
        </form>
        <div className="auth-toggle">
          <span>
            {mode === 'login' ? 'Chưa có tài khoản?' : 'Đã có tài khoản?'}
          </span>
          <button type="button" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
            {mode === 'login' ? 'Đăng ký' : 'Đăng nhập'}
          </button>
        </div>
        <TransitionLink to="/">Quay về trang chủ</TransitionLink>
      </div>
    </div>
  )
}
