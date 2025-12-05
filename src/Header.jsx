import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import TransitionLink from './TransitionLink'
import './Header.css'

export default function Header() {
  const [cartCount] = useState(0)
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)
  const [notificationCount, setNotificationCount] = useState(0)
  const token = localStorage.getItem('token')
  const userRole = localStorage.getItem('userRole')
  const navigate = useNavigate()

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('userRole')
    navigate('/auth')
  }

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      if (currentScrollY > lastScrollY && currentScrollY > 80) {
        setIsVisible(false)
      } else {
        setIsVisible(true)
      }
      setLastScrollY(currentScrollY)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY])

  useEffect(() => {
    if (!token) return
    
    const fetchNotifications = async () => {
      try {
        if (userRole === 'admin') {
          // Admin: đếm câu hỏi chưa trả lời
          const res = await fetch('/api/questions', {
            headers: { Authorization: `Bearer ${token}` }
          })
          if (res.ok) {
            const data = await res.json()
            setNotificationCount(data.length)
          }
        } else {
          // User: đếm câu trả lời mới
          const res = await fetch('/api/questions/me', {
            headers: { Authorization: `Bearer ${token}` }
          })
          if (res.ok) {
            const data = await res.json()
            const unread = data.filter(q => q.answered).length
            setNotificationCount(unread)
          }
        }
      } catch (err) {
        console.error(err)
      }
    }
    
    fetchNotifications()
    // Polling mỗi 30s
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [token, userRole])
  const handleAdminClick = (event) => {
  if (userRole?.toLowerCase() !== 'admin') {
    event.preventDefault()
    alert('Bạn không phải admin nên không thể truy cập trang này.')
  }
}
  return (
    <header className={`header ${isVisible ? 'header-visible' : 'header-hidden'}`}>
      <div className="header-container">
        <Link to="/" className="logo">
          <span className="logo-icon">🍰</span>
          <span className="logo-text">Sweet Bakery</span>
        </Link>
        
        <nav className="nav">
          <TransitionLink to="/home" className="nav-link">Home</TransitionLink>
          <TransitionLink to="/about" className="nav-link">About</TransitionLink>
          <TransitionLink to="/menu" className="nav-link">Menu</TransitionLink>
          <TransitionLink to="/shop" className="nav-link">Shop</TransitionLink>
          <TransitionLink to="/faq" className="nav-link">FAQ</TransitionLink>
          <TransitionLink to="/contact" className="nav-link">Contact</TransitionLink>
          <TransitionLink
    to="/admin/questions"
    className="nav-link"
    onClick={handleAdminClick}
  >
    Admin Panel
  </TransitionLink>
        </nav>
        <div className="header-actions">
          <a href="tel:+1234567890" className="phone-btn">📞 Call Now</a>
          {token && (
            <>
              <TransitionLink 
                to={userRole === 'admin' ? '/admin/questions' : '/notifications'} 
                className="notification-btn"
              >
                🔔
                {notificationCount > 0 && (
                  <span className="notification-badge">{notificationCount}</span>
                )}
              </TransitionLink>
              <button onClick={handleLogout} className="logout-btn">
                Đăng xuất
              </button>
            </>
          )}
          <Link to="/cart" className="cart-btn">
            🛒 Cart
            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </Link>
        </div>
      </div>
    </header>
  )
}