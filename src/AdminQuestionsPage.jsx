import React, { useState, useEffect } from 'react'
import Header from './Header'
import Footer from './Footer'
import SocialSidebar from './SocialSidebar'
import ChatButton from './ChatButton'
import './AdminQuestionsPage.css'

export default function AdminQuestionsPage() {
  const [questions, setQuestions] = useState([])
  const [replyText, setReplyText] = useState({})
  const [filter, setFilter] = useState('all') // all, answered, pending
  const [loading, setLoading] = useState(true)
  const token = localStorage.getItem('token')

  const loadQuestions = async () => {
    setLoading(true)
    const res = await fetch('/api/questions', {
      headers: { Authorization: `Bearer ${token}` }
    })
    if (res.ok) {
      const data = await res.json()
      setQuestions(data)
    }
    setLoading(false)
  }

  const handleReply = async (questionId) => {
    const answer = replyText[questionId]
    if (!answer || !answer.trim()) {
      alert('Vui lòng nhập câu trả lời!')
      return
    }

    const res = await fetch(`/api/questions/${questionId}/reply`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}` 
      },
      body: JSON.stringify({ answer })
    })

    if (res.ok) {
      alert('✅ Đã trả lời thành công!')
      setReplyText({ ...replyText, [questionId]: '' })
      loadQuestions()
    } else {
      alert('❌ Có lỗi xảy ra, vui lòng thử lại!')
    }
  }

  useEffect(() => {
    loadQuestions()
  }, [])

  const filteredQuestions = questions.filter(q => {
    if (filter === 'answered') return q.answered
    if (filter === 'pending') return !q.answered
    return true
  })

  const stats = {
    total: questions.length,
    answered: questions.filter(q => q.answered).length,
    pending: questions.filter(q => !q.answered).length
  }

  return (
    <div className="admin-questions-page">
      <Header />
      
      <section className="page-banner">
        <div className="page-banner-container">
          <h1 className="page-title">Quản lý câu hỏi</h1>
          <div className="breadcrumb">
            <a href="/">🏠</a>
            <span className="separator">»</span>
            <a href="/admin">Admin</a>
            <span className="separator">»</span>
            <span>Questions</span>
          </div>
        </div>
      </section>

      <section className="admin-questions-section">
        <div className="admin-questions-container">
          
          {/* Stats Cards */}
          <div className="stats-grid">
            <div className="stat-card stat-total">
              <div className="stat-icon">📬</div>
              <div className="stat-content">
                <div className="stat-number">{stats.total}</div>
                <div className="stat-label">Tổng câu hỏi</div>
              </div>
            </div>
            <div className="stat-card stat-pending">
              <div className="stat-icon">⏳</div>
              <div className="stat-content">
                <div className="stat-number">{stats.pending}</div>
                <div className="stat-label">Chờ trả lời</div>
              </div>
            </div>
            <div className="stat-card stat-answered">
              <div className="stat-icon">✅</div>
              <div className="stat-content">
                <div className="stat-number">{stats.answered}</div>
                <div className="stat-label">Đã trả lời</div>
              </div>
            </div>
          </div>

          {/* Filter & Actions Bar */}
          <div className="admin-toolbar">
            <div className="filter-tabs">
              <button 
                className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
                onClick={() => setFilter('all')}
              >
                Tất cả ({stats.total})
              </button>
              <button 
                className={`filter-tab ${filter === 'pending' ? 'active' : ''}`}
                onClick={() => setFilter('pending')}
              >
                Chờ trả lời ({stats.pending})
              </button>
              <button 
                className={`filter-tab ${filter === 'answered' ? 'active' : ''}`}
                onClick={() => setFilter('answered')}
              >
                Đã trả lời ({stats.answered})
              </button>
            </div>
            <button onClick={loadQuestions} className="refresh-btn" disabled={loading}>
              {loading ? '⏳' : '🔄'} Tải lại
            </button>
          </div>

          {/* Questions List */}
          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Đang tải câu hỏi...</p>
            </div>
          ) : filteredQuestions.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📭</div>
              <h3>Không có câu hỏi nào</h3>
              <p>
                {filter === 'all' 
                  ? 'Chưa có câu hỏi nào từ khách hàng'
                  : filter === 'answered'
                  ? 'Chưa có câu hỏi nào được trả lời'
                  : 'Không có câu hỏi nào đang chờ xử lý'}
              </p>
            </div>
          ) : (
            <div className="questions-list">
              {filteredQuestions.map((q) => (
                <div key={q.id} className={`question-card ${q.answered ? 'answered' : 'pending'}`}>
                  <div className="question-header">
                    <div className="question-status">
                      {q.answered ? (
                        <span className="status-badge status-answered">
                          <span className="badge-icon">✓</span> Đã trả lời
                        </span>
                      ) : (
                        <span className="status-badge status-pending">
                          <span className="badge-icon">⏳</span> Chờ trả lời
                        </span>
                      )}
                    </div>
                    <div className="question-meta">
                      <span className="department-badge">{q.department}</span>
                      <span className="question-date">
                        {new Date(q.created_at).toLocaleDateString('vi-VN', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="question-body">
                    <h3 className="question-subject">{q.subject}</h3>
                    
                    <div className="question-info">
                      <div className="info-row">
                        <span className="info-label">👤 Người gửi:</span>
                        <span className="info-value">{q.name}</span>
                      </div>
                      <div className="info-row">
                        <span className="info-label">📧 Email:</span>
                        <span className="info-value">{q.email}</span>
                      </div>
                      {q.phone && (
                        <div className="info-row">
                          <span className="info-label">📞 Số điện thoại:</span>
                          <span className="info-value">{q.phone}</span>
                        </div>
                      )}
                    </div>

                    <div className="question-content">
                      <div className="content-label">
                        <span className="label-icon">❓</span>
                        Nội dung câu hỏi:
                      </div>
                      <p className="question-text">{q.question}</p>
                    </div>

                    {q.answered && q.answer && (
                      <div className="answer-content">
                        <div className="content-label">
                          <span className="label-icon">💬</span>
                          Câu trả lời đã gửi:
                        </div>
                        <div className="answer-box">
                          <p>{q.answer}</p>
                        </div>
                      </div>
                    )}

                    {!q.answered && (
                      <div className="reply-section">
                        <div className="content-label">
                          <span className="label-icon">✍️</span>
                          Trả lời câu hỏi:
                        </div>
                        <textarea
                          className="reply-textarea"
                          placeholder="Nhập câu trả lời của bạn tại đây..."
                          rows="5"
                          value={replyText[q.id] || ''}
                          onChange={(e) => setReplyText({ ...replyText, [q.id]: e.target.value })}
                        />
                        <button 
                          className="reply-btn" 
                          onClick={() => handleReply(q.id)}
                          disabled={!replyText[q.id] || !replyText[q.id].trim()}
                        >
                          <span className="btn-icon">📤</span>
                          Gửi trả lời
                        </button>
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