import React, { useState, useEffect } from 'react'
import Header from './Header'
import Footer from './Footer'
import SocialSidebar from './SocialSidebar'
import ChatButton from './ChatButton'
import './NotificationsPage.css'

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all, answered, pending

  const loadNotifications = async () => {
    setLoading(true)
    const token = localStorage.getItem('token')
    try {
      const response = await fetch('/api/questions/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setNotifications(data)
      }
    } catch (error) {
      console.error('Failed to load notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadNotifications()
  }, [])

  const filteredNotifications = notifications.filter(item => {
    if (filter === 'answered') return item.answered
    if (filter === 'pending') return !item.answered
    return true
  })

  const stats = {
    total: notifications.length,
    answered: notifications.filter(n => n.answered).length,
    pending: notifications.filter(n => !n.answered).length
  }

  return (
    <div className="notifications-page">
      <Header />
      
      <section className="page-banner">
        <div className="page-banner-container">
          <h1 className="page-title">Notifications</h1>
          <div className="breadcrumb">
            <a href="/">🏠</a>
            <span className="separator">»</span>
            <span>Notifications</span>
          </div>
        </div>
      </section>

      <section className="notifications-section">
        <div className="notifications-container">
          
          {/* Stats Cards */}
          <div className="stats-grid">
            <div className="stat-card stat-total">
              <div className="stat-icon">📬</div>
              <div className="stat-content">
                <div className="stat-number">{stats.total}</div>
                <div className="stat-label">Tổng thông báo</div>
              </div>
            </div>
            <div className="stat-card stat-answered">
              <div className="stat-icon">✅</div>
              <div className="stat-content">
                <div className="stat-number">{stats.answered}</div>
                <div className="stat-label">Đã trả lời</div>
              </div>
            </div>
            <div className="stat-card stat-pending">
              <div className="stat-icon">⏳</div>
              <div className="stat-content">
                <div className="stat-number">{stats.pending}</div>
                <div className="stat-label">Đang chờ</div>
              </div>
            </div>
          </div>

          {/* Filter & Actions Bar */}
          <div className="notifications-toolbar">
            <div className="filter-tabs">
              <button 
                className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
                onClick={() => setFilter('all')}
              >
                Tất cả ({stats.total})
              </button>
              <button 
                className={`filter-tab ${filter === 'answered' ? 'active' : ''}`}
                onClick={() => setFilter('answered')}
              >
                Đã trả lời ({stats.answered})
              </button>
              <button 
                className={`filter-tab ${filter === 'pending' ? 'active' : ''}`}
                onClick={() => setFilter('pending')}
              >
                Đang chờ ({stats.pending})
              </button>
            </div>
            <button onClick={loadNotifications} className="refresh-btn" disabled={loading}>
              {loading ? '⏳' : '🔄'} Tải lại
            </button>
          </div>

          {/* Notifications List */}
          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Đang tải thông báo...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📭</div>
              <h3>Chưa có thông báo nào</h3>
              <p>
                {filter === 'all' 
                  ? 'Bạn chưa có thông báo nào. Gửi câu hỏi để nhận phản hồi từ chúng tôi!'
                  : filter === 'answered'
                  ? 'Chưa có câu hỏi nào được trả lời'
                  : 'Không có câu hỏi nào đang chờ xử lý'}
              </p>
            </div>
          ) : (
            <div className="notification-list">
              {filteredNotifications.map((item) => (
                <div 
                  key={item.id} 
                  className={`notification-card ${item.answered ? 'answered' : 'pending'}`}
                >
                  <div className="notification-header">
                    <div className="notification-status">
                      {item.answered ? (
                        <span className="status-badge status-answered">
                          <span className="badge-icon">✓</span> Đã trả lời
                        </span>
                      ) : (
                        <span className="status-badge status-pending">
                          <span className="badge-icon">⏳</span> Đang chờ
                        </span>
                      )}
                    </div>
                    <div className="notification-date">
                      {new Date(item.created_at).toLocaleDateString('vi-VN', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>

                  <div className="notification-body">
                    <h3 className="notification-subject">{item.subject}</h3>
                    
                    <div className="question-section">
                      <div className="section-label">
                        <span className="label-icon">❓</span>
                        Câu hỏi của bạn:
                      </div>
                      <p className="question-text">{item.question}</p>
                    </div>

                    {item.answer && (
                      <div className="answer-section">
                        <div className="section-label">
                          <span className="label-icon">💬</span>
                          Phản hồi từ Sweet Bakery:
                        </div>
                        <div className="answer-box">
                          <p>{item.answer}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
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