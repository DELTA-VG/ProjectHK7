import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import Header from './Header'
import Footer from './Footer'
import { useToast } from './contexts/ToastContext'
import './ReportsPage.css'

const API_URL = '/api'

const COLORS = ['#d4a574', '#8B6F5C', '#E8B4A8', '#4caf50', '#2196f3', '#ff9800']

export default function ReportsPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const token = localStorage.getItem('token')
  const userRole = localStorage.getItem('userRole')
  
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalProducts: 0,
    totalCost: 0,
    profit: 0,
    profitMargin: 0,
    ordersByStatus: [],
    revenueByDay: [],
    topProducts: []
  })
  const [dateRange, setDateRange] = useState('month')

  useEffect(() => {
    if (userRole !== 'admin') {
      toast.error('Bạn không có quyền truy cập')
      navigate('/home')
      return
    }
    fetchStats()
  }, [dateRange])

  const fetchStats = async () => {
    setLoading(true)
    try {
      const ordersRes = await fetch(`${API_URL}/orders`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const orders = ordersRes.ok ? await ordersRes.json() : []

      const productsRes = await fetch(`${API_URL}/products/count`)
      const productsCount = productsRes.ok ? await productsRes.json() : { count: 0 }

      // Fetch profit data
      const profitRes = await fetch(`${API_URL}/reports/profit?period=${dateRange}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const profitData = profitRes.ok ? await profitRes.json() : { total_cost: 0, profit: 0, profit_margin: 0 }

      // Filter by date range
      const now = new Date()
      let startDate = new Date()
      let days = 7
      
      if (dateRange === 'week') {
        startDate.setDate(now.getDate() - 7)
        days = 7
      } else if (dateRange === 'month') {
        startDate.setMonth(now.getMonth() - 1)
        days = 30
      } else {
        startDate.setFullYear(now.getFullYear() - 1)
        days = 365
      }

      const filteredOrders = orders.filter(o => new Date(o.created_at) >= startDate)
      
      const totalRevenue = filteredOrders
        .filter(o => o.status !== 'cancelled')
        .reduce((sum, o) => sum + o.total_amount, 0)

      // Orders by status for Pie chart
      const statusCount = filteredOrders.reduce((acc, o) => {
        acc[o.status] = (acc[o.status] || 0) + 1
        return acc
      }, {})
      
      const statusLabels = {
        pending: 'Chờ xử lý',
        paid: 'Đã thanh toán',
        confirmed: 'Đã xác nhận',
        shipping: 'Đang giao',
        delivered: 'Đã giao',
        cancelled: 'Đã hủy'
      }
      
      const ordersByStatus = Object.entries(statusCount).map(([status, count]) => ({
        name: statusLabels[status] || status,
        value: count
      }))

      // Revenue by day for Line chart
      const revenueByDay = []
      const dayMs = 24 * 60 * 60 * 1000
      const groupDays = dateRange === 'year' ? 30 : (dateRange === 'month' ? 3 : 1)
      
      for (let i = days; i >= 0; i -= groupDays) {
        const dayStart = new Date(now.getTime() - i * dayMs)
        const dayEnd = new Date(dayStart.getTime() + groupDays * dayMs)
        
        const dayOrders = filteredOrders.filter(o => {
          const orderDate = new Date(o.created_at)
          return orderDate >= dayStart && orderDate < dayEnd && o.status !== 'cancelled'
        })
        
        const dayRevenue = dayOrders.reduce((sum, o) => sum + o.total_amount, 0)
        const dayCount = dayOrders.length
        
        revenueByDay.push({
          date: dayStart.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
          revenue: dayRevenue,
          orders: dayCount
        })
      }

      // Top products for Bar chart
      const productSales = {}
      filteredOrders.forEach(order => {
        order.items?.forEach(item => {
          if (!productSales[item.name]) {
            productSales[item.name] = { name: item.name, quantity: 0, revenue: 0 }
          }
          productSales[item.name].quantity += item.quantity
          productSales[item.name].revenue += item.price * item.quantity
        })
      })
      const topProducts = Object.values(productSales)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 6)
        .map(p => ({ ...p, name: p.name.length > 15 ? p.name.slice(0, 15) + '...' : p.name }))

      setStats({
        totalRevenue,
        totalOrders: filteredOrders.length,
        totalProducts: productsCount.count || 0,
        totalCost: profitData.total_cost || 0,
        profit: profitData.profit || 0,
        profitMargin: profitData.profit_margin || 0,
        ordersByStatus,
        revenueByDay,
        topProducts
      })
    } catch (err) {
      console.error('Error fetching stats:', err)
      toast.error('Không thể tải dữ liệu thống kê')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount) => {
    if (amount >= 1000000) return (amount / 1000000).toFixed(1) + 'M'
    if (amount >= 1000) return (amount / 1000).toFixed(0) + 'K'
    return amount.toLocaleString() + 'đ'
  }

  const formatFullCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN').format(amount) + 'đ'
  }

  if (userRole !== 'admin') return null

  return (
    <div className="reports-page">
      <Header />
      
      <section className="page-banner">
        <div className="page-banner-container">
          <h1 className="page-title">Báo cáo & Thống kê</h1>
          <div className="breadcrumb">
            <Link to="/">🏠</Link>
            <span className="separator">»</span>
            <span>Reports</span>
          </div>
        </div>
      </section>

      <section className="reports-section">
        <div className="reports-container">
          {/* Date Range Filter */}
          <div className="date-filter">
            <button className={dateRange === 'week' ? 'active' : ''} onClick={() => setDateRange('week')}>
              7 ngày
            </button>
            <button className={dateRange === 'month' ? 'active' : ''} onClick={() => setDateRange('month')}>
              30 ngày
            </button>
            <button className={dateRange === 'year' ? 'active' : ''} onClick={() => setDateRange('year')}>
              1 năm
            </button>
          </div>

          {loading ? (
            <div className="loading">Đang tải...</div>
          ) : (
            <>
              {/* Stats Cards */}
              <div className="stats-grid">
                <div className="stat-card revenue">
                  <div className="stat-icon">💰</div>
                  <div className="stat-info">
                    <span className="stat-value">{formatFullCurrency(stats.totalRevenue)}</span>
                    <span className="stat-label">Doanh thu</span>
                  </div>
                </div>
                <div className="stat-card cost">
                  <div className="stat-icon">📉</div>
                  <div className="stat-info">
                    <span className="stat-value">{formatFullCurrency(stats.totalCost)}</span>
                    <span className="stat-label">Chi phí NL</span>
                  </div>
                </div>
                <div className={`stat-card ${stats.profit >= 0 ? 'profit' : 'loss'}`}>
                  <div className="stat-icon">{stats.profit >= 0 ? '📈' : '📉'}</div>
                  <div className="stat-info">
                    <span className="stat-value">{formatFullCurrency(Math.abs(stats.profit))}</span>
                    <span className="stat-label">{stats.profit >= 0 ? 'Lợi nhuận' : 'Lỗ'}</span>
                  </div>
                </div>
                <div className="stat-card margin">
                  <div className="stat-icon">%</div>
                  <div className="stat-info">
                    <span className="stat-value" style={{ color: stats.profitMargin >= 0 ? '#4caf50' : '#f44336' }}>
                      {stats.profitMargin.toFixed(1)}%
                    </span>
                    <span className="stat-label">Biên lợi nhuận</span>
                  </div>
                </div>
              </div>

              {/* Stats Cards Row 2 */}
              <div className="stats-grid">
                <div className="stat-card orders">
                  <div className="stat-icon">📦</div>
                  <div className="stat-info">
                    <span className="stat-value">{stats.totalOrders}</span>
                    <span className="stat-label">Đơn hàng</span>
                  </div>
                </div>
                <div className="stat-card products">
                  <div className="stat-icon">🧁</div>
                  <div className="stat-info">
                    <span className="stat-value">{stats.totalProducts}</span>
                    <span className="stat-label">Sản phẩm</span>
                  </div>
                </div>
                <div className="stat-card avg">
                  <div className="stat-icon">💵</div>
                  <div className="stat-info">
                    <span className="stat-value">
                      {stats.totalOrders > 0 ? formatFullCurrency(stats.totalRevenue / stats.totalOrders) : '0đ'}
                    </span>
                    <span className="stat-label">TB/đơn</span>
                  </div>
                </div>
                <div className="stat-card avg-profit">
                  <div className="stat-icon">💎</div>
                  <div className="stat-info">
                    <span className="stat-value">
                      {stats.totalOrders > 0 ? formatFullCurrency(stats.profit / stats.totalOrders) : '0đ'}
                    </span>
                    <span className="stat-label">Lời TB/đơn</span>
                  </div>
                </div>
              </div>

              {/* Charts Row 1 */}
              <div className="charts-row">
                {/* Revenue Line Chart */}
                <div className="chart-card">
                  <h3>📈 Doanh thu theo thời gian</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={stats.revenueByDay}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" fontSize={12} />
                      <YAxis tickFormatter={formatCurrency} fontSize={12} />
                      <Tooltip formatter={(value) => formatFullCurrency(value)} />
                      <Legend />
                      <Line type="monotone" dataKey="revenue" name="Doanh thu" stroke="#d4a574" strokeWidth={3} dot={{ fill: '#d4a574' }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Orders Pie Chart */}
                <div className="chart-card">
                  <h3>📊 Trạng thái đơn hàng</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={stats.ordersByStatus}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {stats.ordersByStatus.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Charts Row 2 */}
              <div className="charts-row">
                {/* Top Products Bar Chart */}
                <div className="chart-card full-width">
                  <h3>🏆 Top sản phẩm bán chạy</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={stats.topProducts} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" tickFormatter={formatCurrency} fontSize={12} />
                      <YAxis type="category" dataKey="name" width={120} fontSize={12} />
                      <Tooltip formatter={(value) => formatFullCurrency(value)} />
                      <Legend />
                      <Bar dataKey="revenue" name="Doanh thu" fill="#d4a574" radius={[0, 4, 4, 0]} />
                      <Bar dataKey="quantity" name="Số lượng" fill="#8B6F5C" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Orders by Day */}
              <div className="chart-card full-width">
                <h3>📦 Số đơn hàng theo ngày</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={stats.revenueByDay}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip />
                    <Bar dataKey="orders" name="Đơn hàng" fill="#E8B4A8" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </div>
      </section>

      <Footer />
    </div>
  )
}
