import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'
import { useAuth } from './contexts/AuthContext'
import './OrderSuccessPage.css'

const API_URL = '/api'

export default function OrderSuccessPage() {
  const { orderId } = useParams()
  const { token } = useAuth()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [paymentData, setPaymentData] = useState(null)

  useEffect(() => {
    fetchOrder()
  }, [orderId])

  const fetchOrder = async () => {
    try {
      const res = await fetch(`${API_URL}/orders/${orderId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        setOrder(await res.json())
      }
    } catch (err) {
      console.error('Error fetching order:', err)
    } finally {
      setLoading(false)
    }
  }

  const handlePayNow = async () => {
    setPaymentLoading(true)
    try {
      const res = await fetch(`${API_URL}/payments/payos/${orderId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (res.ok) {
        const data = await res.json()
        setPaymentData(data)
      } else {
        const error = await res.json()
        alert(error.detail || 'Không thể tạo link thanh toán')
      }
    } catch (err) {
      alert('Lỗi khi tạo link thanh toán')
    } finally {
      setPaymentLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="order-success-page">
        <Header />
        <section className="success-section">
          <div className="success-container"><p>Loading...</p></div>
        </section>
        <Footer />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="order-success-page">
        <Header />
        <section className="success-section">
          <div className="success-container">
            <p>Order not found</p>
            <Link to="/shop" className="btn-primary">Continue Shopping</Link>
          </div>
        </section>
        <Footer />
      </div>
    )
  }

  const statusLabels = {
    pending: 'Pending Payment',
    paid: 'Paid',
    confirmed: 'Confirmed',
    shipping: 'Shipping',
    delivered: 'Delivered',
    cancelled: 'Cancelled'
  }

  return (
    <div className="order-success-page">
      <Header />
      
      <section className="success-section">
        <div className="success-container">
          <div className="success-icon">✓</div>
          <h1>Order Placed Successfully!</h1>
          <p className="order-id">Order ID: <strong>{order.id}</strong></p>
          
          <div className="order-details">
            <div className="detail-section">
              <h3>Trạng thái đơn hàng</h3>
              <span className={`status-badge ${order.status}`}>
                {statusLabels[order.status]}
              </span>
              
              {/* COD note */}
              {order.payment_method === 'cod' && order.payment_status === 'unpaid' && (
                <p className="cod-note">💵 Thanh toán ${order.total_amount.toFixed(2)} khi nhận hàng</p>
              )}
              
              {/* PayOS pending payment */}
              {order.status === 'pending' && order.payment_method === 'payos' && (
                <div className="payment-pending-section">
                  <p className="pending-note">⏳ Đơn hàng đang chờ thanh toán</p>
                  
                  {!paymentData ? (
                    <button 
                      className="btn-pay-now" 
                      onClick={handlePayNow}
                      disabled={paymentLoading}
                    >
                      {paymentLoading ? 'Đang tạo...' : '💳 Thanh toán ngay'}
                    </button>
                  ) : (
                    <div className="payment-qr-section">
                      <p>Quét mã QR hoặc click link để thanh toán:</p>
                      {paymentData.qr_code && (
                        <img 
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(paymentData.qr_code)}`}
                          alt="Payment QR Code"
                          className="payment-qr-image"
                        />
                      )}
                      <a 
                        href={paymentData.payment_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="btn-payment-link"
                      >
                        Mở trang thanh toán →
                      </a>
                      <p className="payment-amount">Số tiền: <strong>${order.total_amount.toFixed(2)}</strong></p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="detail-section">
              <h3>Shipping Address</h3>
              <p>{order.shipping_address}</p>
              <p>📞 {order.phone}</p>
            </div>

            <div className="detail-section">
              <h3>Order Items</h3>
              <div className="order-items">
                {order.items.map((item, idx) => (
                  <div key={idx} className="order-item">
                    <img src={item.image} alt={item.name} />
                    <div className="item-info">
                      <span className="item-name">{item.name}</span>
                      <span className="item-qty">Qty: {item.quantity}</span>
                    </div>
                    <span className="item-price">${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="detail-section total-section">
              <div className="total-row">
                <span>Payment Method</span>
                <span>{order.payment_method === 'cod' ? 'Cash on Delivery' : 'PayOS'}</span>
              </div>
              <div className="total-row grand-total">
                <span>Total Amount</span>
                <span>${order.total_amount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="success-actions">
            <Link to="/my-orders" className="btn-secondary">View My Orders</Link>
            <Link to="/shop" className="btn-primary">Continue Shopping</Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
