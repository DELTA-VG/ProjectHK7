import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'
import { useAuth } from './contexts/AuthContext'
import { useToast } from './contexts/ToastContext'
import ConfirmModal from './ConfirmModal'
import './AdminOrdersPage.css'

const API_URL = '/api'

export default function AdminOrdersPage() {
  const navigate = useNavigate()
  const { token } = useAuth()
  const toast = useToast()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [stats, setStats] = useState(null)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, orderId: null, newStatus: '' })

  const userRole = localStorage.getItem('userRole')

  useEffect(() => {
    if (userRole !== 'admin') {
      toast.error('Bạn không có quyền truy cập')
      navigate('/')
      return
    }
    fetchOrders()
    fetchStats()
  }, [filter, userRole, navigate])

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const url = filter === 'all' 
        ? `${API_URL}/orders` 
        : `${API_URL}/orders?status=${filter}`
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        setOrders(await res.json())
      }
    } catch (err) {
      console.error('Error fetching orders:', err)
      toast.error('Không thể tải đơn hàng')
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_URL}/orders/stats/count`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        setStats(await res.json())
      }
    } catch (err) {
      console.error('Error fetching stats:', err)
    }
  }

  const handleStatusChange = (orderId, newStatus) => {
    setConfirmModal({ isOpen: true, orderId, newStatus })
  }

  const confirmStatusChange = async () => {
    const { orderId, newStatus } = confirmModal
    setConfirmModal({ isOpen: false, orderId: null, newStatus: '' })

    try {
      const res = await fetch(`${API_URL}/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      })

      if (res.ok) {
        toast.success(`Đã cập nhật trạng thái thành ${statusLabels[newStatus]}`)
        fetchOrders()
        fetchStats()
      } else {
        const error = await res.json()
        toast.error(error.detail || 'Không thể cập nhật trạng thái')
      }
    } catch (err) {
      toast.error('Lỗi khi cập nhật trạng thái')
    }
  }

  const statusLabels = {
    pending: 'Chờ thanh toán',
    paid: 'Đã thanh toán',
    confirmed: 'Đã xác nhận',
    shipping: 'Đang giao',
    delivered: 'Đã giao',
    cancelled: 'Đã hủy'
  }

  const statusColors = {
    pending: '#ff9800',
    paid: '#2196f3',
    confirmed: '#9c27b0',
    shipping: '#00bcd4',
    delivered: '#4caf50',
    cancelled: '#f44336'
  }

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleString('vi-VN')
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN').format(price) + ' đ'
  }

  return (
    <div className="admin-orders-page">
      <Header />
      
      <section className="admin-orders-section">
        <div className="admin-orders-container">
          <h1 className="page-title">📦 Quản lý đơn hàng</h1>

          {/* Stats */}
          {stats && (
            <div className="order-stats">
              <div className="stat-card" onClick={() => setFilter('all')}>
                <span className="stat-number">{stats.total}</span>
                <span className="stat-label">Tổng đơn</span>
              </div>
              <div className="stat-card pending" onClick={() => setFilter('pending')}>
                <span className="stat-number">{stats.pending}</span>
                <span className="stat-label">Chờ thanh toán</span>
              </div>
              <div className="stat-card paid" onClick={() => setFilter('paid')}>
                <span className="stat-number">{stats.paid}</span>
                <span className="stat-label">Đã thanh toán</span>
              </div>
              <div className="stat-card confirmed" onClick={() => setFilter('confirmed')}>
                <span className="stat-number">{stats.confirmed}</span>
                <span className="stat-label">Đã xác nhận</span>
              </div>
              <div className="stat-card shipping" onClick={() => setFilter('shipping')}>
                <span className="stat-number">{stats.shipping}</span>
                <span className="stat-label">Đang giao</span>
              </div>
              <div className="stat-card delivered" onClick={() => setFilter('delivered')}>
                <span className="stat-number">{stats.delivered}</span>
                <span className="stat-label">Đã giao</span>
              </div>
            </div>
          )}

          {/* Filter Tabs */}
          <div className="filter-tabs">
            {['all', 'pending', 'paid', 'confirmed', 'shipping', 'delivered', 'cancelled'].map(status => (
              <button
                key={status}
                className={`filter-tab ${filter === status ? 'active' : ''}`}
                onClick={() => setFilter(status)}
              >
                {status === 'all' ? 'Tất cả' : statusLabels[status]}
              </button>
            ))}
          </div>

          {/* Orders List */}
          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Đang tải...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="empty-state">
              <p>Không có đơn hàng nào</p>
            </div>
          ) : (
            <div className="orders-table-wrapper">
              <table className="orders-table">
                <thead>
                  <tr>
                    <th>Mã đơn</th>
                    <th>Khách hàng</th>
                    <th>Sản phẩm</th>
                    <th>Tổng tiền</th>
                    <th>Thanh toán</th>
                    <th>Trạng thái</th>
                    <th>Ngày tạo</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(order => (
                    <tr key={order.id}>
                      <td className="order-id">#{order.id.slice(-8)}</td>
                      <td className="customer-info">
                        <div>{order.phone}</div>
                        <small>{order.shipping_address?.slice(0, 30)}...</small>
                      </td>
                      <td className="items-cell">
                        {order.items.slice(0, 2).map((item, idx) => (
                          <div key={idx} className="item-mini">
                            {item.name} x{item.quantity}
                          </div>
                        ))}
                        {order.items.length > 2 && (
                          <small>+{order.items.length - 2} sản phẩm khác</small>
                        )}
                      </td>
                      <td className="price-cell">${order.total_amount.toFixed(2)}</td>
                      <td>
                        <span className={`payment-badge ${order.payment_status}`}>
                          {order.payment_method === 'cod' ? 'COD' : 'PayOS'}
                        </span>
                      </td>
                      <td>
                        <span 
                          className="status-badge"
                          style={{ background: statusColors[order.status] }}
                        >
                          {statusLabels[order.status]}
                        </span>
                      </td>
                      <td className="date-cell">{formatDate(order.created_at)}</td>
                      <td className="actions-cell">
                        <select
                          value={order.status}
                          onChange={(e) => handleStatusChange(order.id, e.target.value)}
                          className="status-select"
                        >
                          <option value="pending">Chờ thanh toán</option>
                          <option value="paid">Đã thanh toán</option>
                          <option value="confirmed">Đã xác nhận</option>
                          <option value="shipping">Đang giao</option>
                          <option value="delivered">Đã giao</option>
                          <option value="cancelled">Đã hủy</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      <Footer />

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title="Cập nhật trạng thái"
        message={`Bạn có chắc muốn chuyển đơn hàng sang "${statusLabels[confirmModal.newStatus]}"?`}
        confirmText="Xác nhận"
        cancelText="Hủy"
        type="warning"
        onConfirm={confirmStatusChange}
        onCancel={() => setConfirmModal({ isOpen: false, orderId: null, newStatus: '' })}
      />
    </div>
  )
}
