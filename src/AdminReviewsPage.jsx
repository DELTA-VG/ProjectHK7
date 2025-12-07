import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'
import { useToast } from './contexts/ToastContext'
import ConfirmModal from './ConfirmModal'
import api from './services/api'
import './AdminReviewsPage.css'

export default function AdminReviewsPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const [reviews, setReviews] = useState([])
  const [filter, setFilter] = useState('pending') // 'pending', 'all', 'approved', 'hidden'
  const [loading, setLoading] = useState(true)
  const [processingIds, setProcessingIds] = useState(new Set())
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, type: '', reviewId: null })

  const userRole = localStorage.getItem('userRole')
  
  useEffect(() => {
    if (userRole !== 'admin') {
      toast.error('Bạn không có quyền truy cập')
      navigate('/')
      return
    }
    fetchReviews()
  }, [filter, userRole, navigate])

  const fetchReviews = async () => {
    setLoading(true)
    try {
      let data
      if (filter === 'pending') {
        data = await api.getPendingReviews()
      } else {
        data = await api.getAllReviews()
        
        // Filter theo trạng thái
        if (filter === 'approved') {
          data = data.filter(r => r.is_approved && !r.is_hidden)
        } else if (filter === 'hidden') {
          data = data.filter(r => r.is_hidden)
        }
      }
      setReviews(data)
    } catch (err) {
      console.error('Error fetching reviews:', err)
      toast.error('Không thể tải đánh giá')
    } finally {
      setLoading(false)
    }
  }

  const openConfirmModal = (type, reviewId) => {
    setConfirmModal({ isOpen: true, type, reviewId })
  }

  const closeConfirmModal = () => {
    setConfirmModal({ isOpen: false, type: '', reviewId: null })
  }

  const handleConfirm = async () => {
    const { type, reviewId } = confirmModal
    closeConfirmModal()

    if (processingIds.has(reviewId)) return
    setProcessingIds(prev => new Set(prev).add(reviewId))

    try {
      if (type === 'approve') {
        await api.approveReview(reviewId)
        toast.success('Đã duyệt đánh giá')
      } else if (type === 'hide') {
        await api.hideReview(reviewId)
        toast.success('Đã ẩn đánh giá')
      } else if (type === 'delete') {
        await api.deleteReview(reviewId)
        toast.success('Đã xóa đánh giá')
      }
      fetchReviews()
    } catch (err) {
      console.error(`Error ${type} review:`, err)
      toast.error(`Không thể ${type === 'approve' ? 'duyệt' : type === 'hide' ? 'ẩn' : 'xóa'} đánh giá`)
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(reviewId)
        return newSet
      })
    }
  }

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={`star ${i < rating ? 'filled' : ''}`}>
        ★
      </span>
    ))
  }

  const getStatusBadge = (review) => {
    if (review.is_hidden) {
      return <span className="status-badge hidden">Hidden</span>
    }
    if (review.is_approved) {
      return <span className="status-badge approved">Approved</span>
    }
    return <span className="status-badge pending">Pending</span>
  }

  return (
    <div className="admin-reviews-page">
      <Header />
      
      <section className="admin-reviews-section">
        <div className="admin-reviews-container">
          <div className="admin-header">
            <h1 className="page-title">📝 Review Management</h1>
            
            <div className="filter-tabs">
              <button 
                className={`filter-tab ${filter === 'pending' ? 'active' : ''}`}
                onClick={() => setFilter('pending')}
              >
                ⏳ Pending
              </button>
              <button 
                className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
                onClick={() => setFilter('all')}
              >
                📋 All
              </button>
              <button 
                className={`filter-tab ${filter === 'approved' ? 'active' : ''}`}
                onClick={() => setFilter('approved')}
              >
                ✅ Approved
              </button>
              <button 
                className={`filter-tab ${filter === 'hidden' ? 'active' : ''}`}
                onClick={() => setFilter('hidden')}
              >
                🚫 Hidden
              </button>
            </div>
          </div>

          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading reviews...</p>
            </div>
          ) : reviews.length === 0 ? (
            <div className="empty-state">
              <p>No reviews found.</p>
            </div>
          ) : (
            <div className="reviews-list">
              {reviews.map(review => (
                <div key={review.id} className="admin-review-card">
                  <div className="review-header">
                    <div className="review-user-info">
                      <span className="user-name">{review.user_name || 'Anonymous'}</span>
                      {getStatusBadge(review)}
                    </div>
                    <div className="review-meta">
                      <div className="rating-stars">
                        {renderStars(review.rating)}
                      </div>
                      <span className="review-date">
                        {new Date(review.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="review-body">
                    <p className="review-product">
                      <strong>Product ID:</strong> {review.product_id}
                    </p>
                    {review.comment && (
                      <p className="review-comment">"{review.comment}"</p>
                    )}
                  </div>

                  <div className="review-actions">
                    {!review.is_approved && (
                      <button
                        className="action-btn approve-btn"
                        onClick={() => openConfirmModal('approve', review.id)}
                        disabled={processingIds.has(review.id)}
                      >
                        {processingIds.has(review.id) ? '...' : '✅ Duyệt'}
                      </button>
                    )}
                    
                    {!review.is_hidden && (
                      <button
                        className="action-btn hide-btn"
                        onClick={() => openConfirmModal('hide', review.id)}
                        disabled={processingIds.has(review.id)}
                      >
                        {processingIds.has(review.id) ? '...' : '🚫 Ẩn'}
                      </button>
                    )}
                    
                    <button
                      className="action-btn delete-btn"
                      onClick={() => openConfirmModal('delete', review.id)}
                      disabled={processingIds.has(review.id)}
                    >
                      {processingIds.has(review.id) ? '...' : '🗑️ Xóa'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={
          confirmModal.type === 'approve' ? 'Duyệt đánh giá' :
          confirmModal.type === 'hide' ? 'Ẩn đánh giá' : 'Xóa đánh giá'
        }
        message={
          confirmModal.type === 'approve' ? 'Bạn có chắc muốn duyệt đánh giá này?' :
          confirmModal.type === 'hide' ? 'Bạn có chắc muốn ẩn đánh giá này?' :
          'Bạn có chắc muốn xóa vĩnh viễn đánh giá này?'
        }
        confirmText={
          confirmModal.type === 'approve' ? 'Duyệt' :
          confirmModal.type === 'hide' ? 'Ẩn' : 'Xóa'
        }
        cancelText="Hủy"
        type={confirmModal.type === 'delete' ? 'danger' : 'warning'}
        onConfirm={handleConfirm}
        onCancel={closeConfirmModal}
      />
    </div>
  )
}