import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from './Header'
import SocialSidebar from './SocialSidebar'
import ChatButton from './ChatButton'
import Footer from './Footer'
import api from './services/api'
import './CartPage.css'

export default function CartPage() {
  const [cartItems, setCartItems] = useState([])
  const [cartTotal, setCartTotal] = useState({ subtotal: 0, shipping: 0, total: 0, total_items: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    fetchCart()
  }, [])

  const fetchCart = async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    
    try {
      const [items, total] = await Promise.all([
        api.getCart(),
        api.getCartTotal()
      ])
      
      console.log('✅ Cart items:', items)
      console.log('✅ Cart total:', total)
      
      setCartItems(items)
      setCartTotal(total)
    } catch (err) {
      console.error('❌ Error fetching cart:', err)
      setError(err.message || 'Failed to load cart')
    } finally {
      setLoading(false)
    }
  }

  const updateQuantity = async (productId, newQuantity) => {
    if (newQuantity < 1) return
    
    try {
      await api.updateCartQuantity(productId, newQuantity)
      await fetchCart()
    } catch (err) {
      console.error('❌ Error updating quantity:', err)
      alert(err.message || 'Failed to update quantity')
    }
  }

  const removeItem = async (productId) => {
    if (!confirm('Remove this item from cart?')) return
    
    try {
      await api.removeFromCart(productId)
      await fetchCart()
    } catch (err) {
      console.error('❌ Error removing item:', err)
      alert(err.message || 'Failed to remove item')
    }
  }

  const handleCheckout = () => {
    alert('🎉 Checkout feature coming soon!')
  }

  if (loading) {
    return (
      <div className="cart-page">
        <Header />
        <section className="page-banner">
          <div className="page-banner-container">
            <h1 className="page-title">Shopping Cart</h1>
          </div>
        </section>
        <section className="cart-section">
          <div className="cart-container">
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading your cart...</p>
            </div>
          </div>
        </section>
        <Footer />
      </div>
    )
  }

  if (error) {
    return (
      <div className="cart-page">
        <Header />
        <section className="page-banner">
          <div className="page-banner-container">
            <h1 className="page-title">Shopping Cart</h1>
          </div>
        </section>
        <section className="cart-section">
          <div className="cart-container">
            <div className="error-state">
              <div className="error-icon">⚠️</div>
              <h2>Unable to Load Cart</h2>
              <p>{error}</p>
              <button onClick={fetchCart} className="retry-btn">
                🔄 Try Again
              </button>
            </div>
          </div>
        </section>
        <Footer />
      </div>
    )
  }

  const token = localStorage.getItem('token')
  if (!token) {
    return (
      <div className="cart-page">
        <Header />
        <section className="page-banner">
          <div className="page-banner-container">
            <h1 className="page-title">Shopping Cart</h1>
          </div>
        </section>
        <section className="cart-section">
          <div className="cart-container">
            <div className="empty-state">
              <div className="empty-icon">🔒</div>
              <h2>Please Login</h2>
              <p>You need to login to view your cart.</p>
              <button onClick={() => navigate('/login')} className="login-btn">
                Login Now
              </button>
            </div>
          </div>
        </section>
        <Footer />
      </div>
    )
  }

  return (
    <div className="cart-page">
      <Header />
      
      <section className="page-banner">
        <div className="page-banner-container">
          <h1 className="page-title">Shopping Cart</h1>
          <div className="breadcrumb">
            <a href="/">🏠</a>
            <span className="separator">»</span>
            <a href="/shop">Shop</a>
            <span className="separator">»</span>
            <span>Cart</span>
          </div>
        </div>
      </section>

      <section className="cart-section">
        <div className="cart-container">
          {cartItems.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🛒</div>
              <h2>Your cart is empty</h2>
              <p>Looks like you haven't added anything to your cart yet.</p>
              <button onClick={() => navigate('/shop')} className="shop-btn">
                Start Shopping
              </button>
            </div>
          ) : (
            <div className="cart-content">
              {/* Cart Items Table */}
              <div className="cart-table-wrapper">
                <div className="cart-header">
                  <h2>Your Items ({cartTotal.total_items})</h2>
                </div>
                
                <table className="cart-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Price</th>
                      <th>Quantity</th>
                      <th>Subtotal</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {cartItems.map(item => (
                      <tr key={item.cart_id} className="cart-item">
                        <td className="product-col">
                          <div className="product-info">
                            <img 
                              src={item.product.image} 
                              alt={item.product.name} 
                              className="product-thumb" 
                            />
                            <div className="product-details">
                              <span className="product-name">{item.product.name}</span>
                              {item.product.badge && (
                                <span className={`product-badge badge-${item.product.badge.toLowerCase()}`}>
                                  {item.product.badge}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="price-col">
                          <span className="price">${item.product.price.toFixed(2)}</span>
                        </td>
                        <td className="quantity-col">
                          <div className="quantity-input">
                            <button 
                              onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                              className="qty-btn"
                              disabled={item.quantity <= 1}
                            >
                              −
                            </button>
                            <input 
                              type="number" 
                              value={item.quantity} 
                              readOnly
                              className="qty-value"
                            />
                            <button 
                              onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                              className="qty-btn"
                            >
                              +
                            </button>
                          </div>
                        </td>
                        <td className="subtotal-col">
                          <span className="subtotal">${(item.product.price * item.quantity).toFixed(2)}</span>
                        </td>
                        <td className="remove-col">
                          <button 
                            onClick={() => removeItem(item.product.id)} 
                            className="remove-btn"
                            title="Remove from cart"
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="cart-actions">
                  <button onClick={() => navigate('/shop')} className="continue-btn">
                    ← Continue Shopping
                  </button>
                  <button onClick={fetchCart} className="update-btn">
                    🔄 Refresh Cart
                  </button>
                </div>
              </div>

              {/* Cart Totals */}
              <div className="cart-totals">
                <h2 className="totals-title">Order Summary</h2>
                <div className="totals-content">
                  <div className="total-row">
                    <span className="total-label">Subtotal ({cartTotal.total_items} items)</span>
                    <span className="total-value">${cartTotal.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="total-row shipping-row">
                    <span className="total-label">
                      Shipping
                      {cartTotal.shipping === 0 && (
                        <span className="free-badge">FREE</span>
                      )}
                    </span>
                    <span className="total-value">
                      {cartTotal.shipping === 0 ? 'Free' : `$${cartTotal.shipping.toFixed(2)}`}
                    </span>
                  </div>
                  {cartTotal.subtotal < 50 && cartTotal.subtotal > 0 && (
                    <div className="shipping-notice">
                      💡 Add ${(50 - cartTotal.subtotal).toFixed(2)} more for free shipping!
                    </div>
                  )}
                  <div className="total-divider"></div>
                  <div className="total-row total-final">
                    <span className="total-label">Total</span>
                    <span className="total-value">${cartTotal.total.toFixed(2)}</span>
                  </div>
                  <button onClick={handleCheckout} className="checkout-btn">
                    Proceed to Checkout →
                  </button>
                  <div className="secure-notice">
                    🔒 Secure Checkout
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      <SocialSidebar />
      <ChatButton />
      <Footer />
    </div>
  )
}