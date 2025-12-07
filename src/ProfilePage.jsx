import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'
import { useAuth } from './contexts/AuthContext'
import { useToast } from './contexts/ToastContext'
import './ProfilePage.css'

const API_URL = '/api'

export default function ProfilePage() {
  const navigate = useNavigate()
  const { user, token, updateUser } = useAuth()
  const toast = useToast()
  
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    full_name: '',
    phone: ''
  })
  
  // Password change
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [passwordData, setPasswordData] = useState({
    old_password: '',
    new_password: '',
    confirm_password: ''
  })
  const [passwordLoading, setPasswordLoading] = useState(false)

  useEffect(() => {
    if (!user) {
      navigate('/auth')
      return
    }
    setFormData({
      full_name: user.full_name || '',
      phone: user.phone || ''
    })
  }, [user, navigate])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handlePasswordChange = (e) => {
    const { name, value } = e.target
    setPasswordData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch(`${API_URL}/auth/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })

      if (res.ok) {
        const updatedUser = await res.json()
        updateUser(updatedUser)
        toast.success('Cập nhật thông tin thành công!')
      } else {
        const error = await res.json()
        toast.error(error.detail || 'Không thể cập nhật thông tin')
      }
    } catch (err) {
      toast.error('Lỗi khi cập nhật thông tin')
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    
    if (passwordData.new_password !== passwordData.confirm_password) {
      toast.error('Mật khẩu mới không khớp')
      return
    }
    
    if (passwordData.new_password.length < 6) {
      toast.error('Mật khẩu mới phải có ít nhất 6 ký tự')
      return
    }

    setPasswordLoading(true)

    try {
      const res = await fetch(`${API_URL}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          old_password: passwordData.old_password,
          new_password: passwordData.new_password
        })
      })

      if (res.ok) {
        toast.success('Đổi mật khẩu thành công!')
        setPasswordData({ old_password: '', new_password: '', confirm_password: '' })
        setShowPasswordForm(false)
      } else {
        const error = await res.json()
        toast.error(error.detail || 'Không thể đổi mật khẩu')
      }
    } catch (err) {
      toast.error('Lỗi khi đổi mật khẩu')
    } finally {
      setPasswordLoading(false)
    }
  }

  if (!user) return null

  return (
    <div className="profile-page">
      <Header />
      
      <section className="page-banner">
        <div className="page-banner-container">
          <h1 className="page-title">Tài khoản</h1>
          <div className="breadcrumb">
            <Link to="/">🏠</Link>
            <span className="separator">»</span>
            <span>Tài khoản</span>
          </div>
        </div>
      </section>

      <section className="profile-section">
        <div className="profile-container">
          <div className="profile-sidebar">
            <div className="user-avatar">
              <span className="avatar-icon">👤</span>
            </div>
            <h3 className="user-name">{user.full_name}</h3>
            <p className="user-email">{user.email}</p>
            <span className={`user-role ${user.role}`}>
              {user.role === 'admin' ? '👑 Admin' : '👤 User'}
            </span>
          </div>

          <div className="profile-content">
            <div className="profile-card">
              <h2>Thông tin cá nhân</h2>
              
              <form onSubmit={handleSubmit} className="profile-form">
                <div className="form-group">
                  <label>Email</label>
                  <input 
                    type="email" 
                    value={user.email} 
                    disabled 
                    className="input-disabled"
                  />
                  <small>Email không thể thay đổi</small>
                </div>

                <div className="form-group">
                  <label>Họ và tên</label>
                  <input
                    type="text"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    required
                    minLength={2}
                  />
                </div>

                <div className="form-group">
                  <label>Số điện thoại</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    minLength={10}
                    maxLength={15}
                  />
                </div>

                <button type="submit" className="btn-save" disabled={loading}>
                  {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </form>
            </div>

            <div className="profile-card">
              <h2>Bảo mật</h2>
              
              {!showPasswordForm ? (
                <button 
                  className="btn-change-password"
                  onClick={() => setShowPasswordForm(true)}
                >
                  🔒 Đổi mật khẩu
                </button>
              ) : (
                <form onSubmit={handlePasswordSubmit} className="password-form">
                  <div className="form-group">
                    <label>Mật khẩu hiện tại</label>
                    <input
                      type="password"
                      name="old_password"
                      value={passwordData.old_password}
                      onChange={handlePasswordChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Mật khẩu mới</label>
                    <input
                      type="password"
                      name="new_password"
                      value={passwordData.new_password}
                      onChange={handlePasswordChange}
                      required
                      minLength={6}
                    />
                  </div>

                  <div className="form-group">
                    <label>Xác nhận mật khẩu mới</label>
                    <input
                      type="password"
                      name="confirm_password"
                      value={passwordData.confirm_password}
                      onChange={handlePasswordChange}
                      required
                    />
                  </div>

                  <div className="password-actions">
                    <button type="submit" className="btn-save" disabled={passwordLoading}>
                      {passwordLoading ? 'Đang xử lý...' : 'Đổi mật khẩu'}
                    </button>
                    <button 
                      type="button" 
                      className="btn-cancel"
                      onClick={() => {
                        setShowPasswordForm(false)
                        setPasswordData({ old_password: '', new_password: '', confirm_password: '' })
                      }}
                    >
                      Hủy
                    </button>
                  </div>
                </form>
              )}
            </div>

            <div className="profile-card">
              <h2>Liên kết nhanh</h2>
              <div className="quick-links">
                <Link to="/my-orders" className="quick-link">
                  📦 Đơn hàng của tôi
                </Link>
                <Link to="/favourites" className="quick-link">
                  ❤️ Sản phẩm yêu thích
                </Link>
                <Link to="/notifications" className="quick-link">
                  🔔 Thông báo
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
