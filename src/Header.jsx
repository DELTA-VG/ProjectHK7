import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import { useCart } from './contexts/CartContext'
import LoginModal from './LoginModal'
import './Header.css'

export default function Header() {
  const { user, logout } = useAuth()
  const { cartTotal } = useCart()
  const navigate = useNavigate()
  
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const menuRef = useRef(null)

  const isAdmin = user?.role?.toLowerCase() === 'admin'

  const handleLogout = () => {
    logout()
    setShowUserMenu(false)
    navigate('/')
  }

  // Hide header on scroll down
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

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowUserMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <header className={`header ${isVisible ? 'header-visible' : 'header-hidden'}`}>
      <div className="header-container">
        <Link to="/" className="logo">
          <span className="logo-icon">🍰</span>
          <span className="logo-text">Sweet Bakery</span>
        </Link>
        
        <nav className="nav">
          <Link to="/" className="nav-link">Home</Link>
          <Link to="/about" className="nav-link">About</Link>
          <Link to="/menu" className="nav-link">Menu</Link>
          <Link to="/shop" className="nav-link">Shop</Link>
          <Link to="/faq" className="nav-link">FAQ</Link>
          <Link to="/contact" className="nav-link">Contact</Link>
        </nav>

        <div className="header-actions">
          <a href="tel:+1234567890" className="phone-btn">📞 Call Now</a>
          
          <Link to="/cart" className="cart-btn">
            🛒 Cart
            {cartTotal.total_items > 0 && (
              <span className="cart-badge">{cartTotal.total_items}</span>
            )}
          </Link>

          {user ? (
            <div className="user-menu-wrapper" ref={menuRef}>
              <button 
                className="user-btn" 
                onClick={() => setShowUserMenu(!showUserMenu)}
              >
                👤 {user.full_name?.split(' ')[0] || 'Account'}
                <span className="dropdown-arrow">{showUserMenu ? '▲' : '▼'}</span>
              </button>
              
              {showUserMenu && (
                <div className="user-dropdown">
                  <div className="dropdown-header">
                    <span className="user-name">{user.full_name}</span>
                    <span className="user-email">{user.email}</span>
                  </div>
                  <div className="dropdown-divider"></div>
                  
                  <Link to="/my-orders" onClick={() => setShowUserMenu(false)}>
                    📦 Đơn hàng của tôi
                  </Link>
                  <Link to="/favourites" onClick={() => setShowUserMenu(false)}>
                    ❤️ Yêu thích
                  </Link>
                  <Link to="/notifications" onClick={() => setShowUserMenu(false)}>
                    🔔 Thông báo
                  </Link>
                  
                  {isAdmin && (
                    <>
                      <div className="dropdown-divider"></div>
                      <div className="dropdown-section-title">Admin Panel</div>
                      <Link to="/admin/products" onClick={() => setShowUserMenu(false)}>
                        📦 Quản lý sản phẩm
                      </Link>
                      <Link to="/admin/questions" onClick={() => setShowUserMenu(false)}>
                        ❓ Quản lý câu hỏi
                      </Link>
                      <Link to="/admin/reviews" onClick={() => setShowUserMenu(false)}>
                        ⭐ Quản lý đánh giá
                      </Link>
                    </>
                  )}
                  
                  <div className="dropdown-divider"></div>
                  <button onClick={handleLogout} className="logout-item">
                    🚪 Đăng xuất
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button className="login-btn" onClick={() => setShowLoginModal(true)}>
              Đăng nhập
            </button>
          )}
        </div>
      </div>
      
      <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
    </header>
  )
}
