import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from './Header'
import SocialSidebar from './SocialSidebar'
import ChatButton from './ChatButton'
import Footer from './Footer'
import ConfirmModal from './ConfirmModal'
import { useToast } from './contexts/ToastContext'
import api from './services/api'
import './CartPage.css'

export default function CartPage() {
  const toast = useToast()
  const [cartItems, setCartItems] = useState([])
  const [cartTotal, setCartTotal] = useState({ subtotal: 0, shipping: 0, total: 0, total_items: 0 })
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState(null)
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, productId: null, productName: '' })
  
  // Suggested products
  const [suggestedProducts, setSuggestedProducts] = useState([])
  const [addingToCart, setAddingToCart] = useState({})
  
  const navigate = useNavigate()

  useEffect(() => {
    fetchCart(true)
    fetchSuggestedProducts()
  }, [])

  const fetchCart = async (isInitial = false) => {
    const token = localStorage.getItem('token')
    if (!token) {
      setLoading(false)
      return
    }

    if (isInitial) {
      setLoading(true)
    }
    setError(null)
    
    try {
      const [items, total] = await Promise.all([
        api.getCart(),
        api.getCartTotal()
      ])
      
      setCartItems(items)
      setCartTotal(total)
    } catch (err) {
      console.error('❌ Error fetching cart:', err)
      
      if (err.message === 'Session expired') {
        return
      }
      
      setError(err.message || 'Failed to load cart')
    } finally {
      setLoading(false)
    }
  }

  const updateQuantity = async (productId, newQuantity) => {
    if (newQuantity < 1 || updating) return
    
    // Optimistic update - cập nhật UI ngay lập tức
    setCartItems(prev => prev.map(item => 
      item.product.id === productId 
        ? { ...item, quantity: newQuantity }
        : item
    ))
    
    // Cập nhật total tạm thời
    const item = cartItems.find(i => i.product.id === productId)
    if (item) {
      const diff = newQuantity - item.quantity
      setCartTotal(prev => ({
        ...prev,
        subtotal: prev.subtotal + (item.product.price * diff),
        total: prev.total + (item.product.price * diff),
        total_items: prev.total_items + diff
      }))
    }
    
    setUpdating(true)
    try {
      await api.updateCartQuantity(productId, newQuantity)
      // Fetch lại để đồng bộ với server (không show loading)
      await fetchCart(false)
    } catch (err) {
      console.error('❌ Error updating quantity:', err)
      // Rollback nếu lỗi
      await fetchCart(false)
      toast.error(err.message || 'Không thể cập nhật số lượng')
    } finally {
      setUpdating(false)
    }
  }

  const openRemoveConfirm = (productId, productName) => {
    setConfirmModal({ isOpen: true, productId, productName })
  }

  const closeConfirmModal = () => {
    setConfirmModal({ isOpen: false, productId: null, productName: '' })
  }

  const handleConfirmRemove = async () => {
    const { productId } = confirmModal
    closeConfirmModal()
    
    try {
      await api.removeFromCart(productId)
      await fetchCart()
      toast.success('Đã xóa khỏi giỏ hàng')
    } catch (err) {
      console.error('❌ Error removing item:', err)
      toast.error(err.message || 'Không thể xóa sản phẩm')
    }
  }

  const handleCheckout = () => {
    navigate('/checkout')
  }

  // Fetch random suggested products
  const fetchSuggestedProducts = async () => {
    try {
      const products = await api.getProducts({ limit: 20 })
      // Lọc bỏ sản phẩm đã có trong giỏ và random 4 sản phẩm
      const cartProductIds = cartItems.map(item => item.product?.id)
      const filtered = products.filter(p => !cartProductIds.includes(p.id))
      const shuffled = filtered.sort(() => 0.5 - Math.random())
      setSuggestedProducts(shuffled.slice(0, 4))
    } catch (err) {
      console.error('Error fetching suggested products:', err)
    }
  }

  // Refresh suggestions khi cart thay đổi
  useEffect(() => {
    if (cartItems.length > 0) {
      const cartProductIds = cartItems.map(item => item.product?.id)
      setSuggestedProducts(prev => prev.filter(p => !cartProductIds.includes(p.id)))
    }
  }, [cartItems])

  // Add suggested product to cart
  const addSuggestedToCart = async (productId) => {
    const token = localStorage.getItem('token')
    if (!token) {
      toast.warning('Vui lòng đăng nhập để thêm vào giỏ hàng')
      return
    }

    setAddingToCart(prev => ({ ...prev, [productId]: true }))
    
    try {
      await api.addToCart(productId, 1)
      toast.success('Đã thêm vào giỏ hàng!')
      await fetchCart(false)
      // Xóa sản phẩm vừa thêm khỏi gợi ý
      setSuggestedProducts(prev => prev.filter(p => p.id !== productId))
    } catch (err) {
      console.error('Error adding to cart:', err)
      toast.error(err.message || 'Không thể thêm vào giỏ hàng')
    } finally {
      setAddingToCart(prev => ({ ...prev, [productId]: false }))
    }
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
              <div className="empty-icon">🛒</div>
              <h2>Giỏ hàng trống</h2>
              <p>Đăng nhập để thêm sản phẩm vào giỏ hàng và mua sắm.</p>
              <div className="empty-actions">
                <button onClick={() => navigate('/shop')} className="shop-btn">
                  🛍️ Xem sản phẩm
                </button>
                <button onClick={() => navigate('/auth')} className="login-btn">
                  Đăng nhập
                </button>
              </div>
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
                              disabled={item.quantity <= 1 || updating}
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
                              disabled={updating}
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
                            onClick={() => openRemoveConfirm(item.product.id, item.product.name)} 
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
                      {cartTotal.shipping === 0 ? 'Free' : `${cartTotal.shipping.toFixed(2)}`}
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

      {/* Suggested Products */}
      {suggestedProducts.length > 0 && (
        <section className="suggested-section">
          <div className="suggested-container">
            <h2 className="suggested-title">🎁 Có thể bạn cũng thích</h2>
            <div className="suggested-grid">
              {suggestedProducts.map(product => (
                <div key={product.id} className="suggested-card">
                  <div className="suggested-image-wrapper">
                    <img src={product.image} alt={product.name} className="suggested-image" />
                    {product.badge && (
                      <span className={`suggested-badge badge-${product.badge.toLowerCase()}`}>
                        {product.badge}
                      </span>
                    )}
                  </div>
                  <div className="suggested-info">
                    <h3 className="suggested-name">{product.name}</h3>
                    <p className="suggested-price">${product.price.toFixed(2)}</p>
                    <button
                      className="suggested-add-btn"
                      onClick={() => addSuggestedToCart(product.id)}
                      disabled={addingToCart[product.id]}
                    >
                      {addingToCart[product.id] ? 'Đang thêm...' : '🛒 Thêm vào giỏ'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <SocialSidebar />
      <ChatButton />
      <Footer />
      
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title="Xóa sản phẩm"
        message={`Bạn có chắc muốn xóa "${confirmModal.productName}" khỏi giỏ hàng?`}
        confirmText="Xóa"
        cancelText="Hủy"
        type="danger"
        onConfirm={handleConfirmRemove}
        onCancel={closeConfirmModal}
      />
    </div>
  )
}
