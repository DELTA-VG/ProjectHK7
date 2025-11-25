import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import './Header.css'
import TransitionLink from './TransitionLink'

export default function Header() {
  const [cartCount] = useState(0)
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)

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

    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [lastScrollY])

  return (
    <header className={`header ${isVisible ? 'header-visible' : 'header-hidden'}`}>
      <div className="header-container">
        {/* Logo */}
        <TransitionLink to="/" className="logo">
          <div className="logo-icon">🧁</div>
          <span className="logo-text">Sweet Bakery</span>
        </TransitionLink>

        {/* Navigation */}
        <nav className="nav">
          <TransitionLink to="/" className="nav-link">Home</TransitionLink>
          <TransitionLink to="/about" className="nav-link">About</TransitionLink>
          <TransitionLink to="/menu" className="nav-link">Our Menu</TransitionLink>
          <TransitionLink to="/blog" className="nav-link">Blog</TransitionLink>
          <TransitionLink to="/shop" className="nav-link">Shop</TransitionLink>
          <TransitionLink to="/faq" className="nav-link">FAQ</TransitionLink>
          <TransitionLink to="/contact" className="nav-link">Contact</TransitionLink>
        </nav>

        {/* Right side */}
        <div className="header-actions">
          <a href="tel:+18882467" className="phone-btn">
            📞 +1 (888) 24 675
          </a>
          <Link to="/cart" className="cart-btn">
            🛒 CART
            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </Link>
        </div>
      </div>
    </header>
  )
}