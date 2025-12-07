import { useState, useEffect, useRef } from 'react'
import api from './services/api'
import ConfirmModal from './ConfirmModal'
import './Chatbot.css'

const DEFAULT_MESSAGE = {
  role: 'assistant',
  content: 'Xin chào! Đức An Việt xin phục vụ quý khách. Tôi có thể giúp gì cho bạn?',
  timestamp: new Date().toISOString()
}

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([DEFAULT_MESSAGE])
  const [inputMessage, setInputMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [imageLoading, setImageLoading] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const fileInputRef = useRef(null)
  const currentUserRef = useRef(localStorage.getItem('token'))

  // Reset chat khi user thay đổi (đăng xuất/đăng nhập user khác)
  useEffect(() => {
    const checkUserChange = () => {
      const currentToken = localStorage.getItem('token')
      if (currentToken !== currentUserRef.current) {
        // User đã thay đổi → reset chat
        currentUserRef.current = currentToken
        setMessages([{...DEFAULT_MESSAGE, timestamp: new Date().toISOString()}])
        
        // Xóa history trên server nếu có token cũ
        if (!currentToken) {
          api.clearChatHistory().catch(() => {})
        }
      }
    }

    // Check mỗi khi window focus (user có thể đăng xuất ở tab khác)
    window.addEventListener('focus', checkUserChange)
    
    // Check định kỳ
    const interval = setInterval(checkUserChange, 2000)

    return () => {
      window.removeEventListener('focus', checkUserChange)
      clearInterval(interval)
    }
  }, [])

  // Auto scroll to bottom khi có message mới
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Focus input khi mở chatbot
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    
    if (!inputMessage.trim() || loading) return

    const userMessage = {
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date().toISOString()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setLoading(true)

    try {
      const response = await api.chat(userMessage.content)
      
      const botMessage = {
        role: 'assistant',
        content: response.response,
        products: response.products || [], // Sản phẩm được đề cử
        timestamp: new Date().toISOString()
      }

      setMessages(prev => [...prev, botMessage])
    } catch (err) {
      console.error('Error sending message:', err)
      
      // Check if rate limit error
      const isRateLimit = err.message?.includes('rate') || err.message?.includes('quota')
      
      const errorMessage = {
        role: 'assistant',
        content: isRateLimit 
          ? 'Hệ thống đang bận, vui lòng đợi vài giây rồi thử lại nhé!'
          : 'Xin lỗi, tôi đang gặp sự cố. Vui lòng thử lại sau hoặc liên hệ hotline 0901 234 567.',
        timestamp: new Date().toISOString()
      }

      setMessages(prev => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  const handleClearChat = async () => {
    setShowClearConfirm(false)
    // Reset local state
    setMessages([{...DEFAULT_MESSAGE, timestamp: new Date().toISOString()}])
    // Xóa trên server (không cần await)
    api.clearChatHistory().catch(() => {})
  }

  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
  }

  // Handle image upload for cake recognition
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Vui lòng chọn file ảnh (jpg, png, etc.)',
        timestamp: new Date().toISOString()
      }])
      return
    }

    // Show user's image message
    const imageUrl = URL.createObjectURL(file)
    setMessages(prev => [...prev, {
      role: 'user',
      content: '📷 Đang tìm bánh từ ảnh...',
      imagePreview: imageUrl,
      timestamp: new Date().toISOString()
    }])

    setImageLoading(true)

    try {
      // Convert to base64
      const reader = new FileReader()
      reader.onload = async () => {
        const base64 = reader.result.split(',')[1] // Remove data:image/...;base64, prefix
        
        const response = await fetch('/api/chatbot/camera/base64', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image_base64: base64,
            mime_type: file.type
          })
        })

        const data = await response.json()

        if (data.found && data.product) {
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: `🎯 ${data.message}! Đây là sản phẩm bạn đang tìm:`,
            products: [data.product],
            timestamp: new Date().toISOString()
          }])
        } else {
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: data.message || 'Không tìm thấy sản phẩm tương ứng trong cửa hàng. Bạn có thể mô tả thêm hoặc thử ảnh khác nhé!',
            timestamp: new Date().toISOString()
          }])
        }
      }
      reader.readAsDataURL(file)
    } catch (err) {
      console.error('Error recognizing image:', err)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Xin lỗi, không thể phân tích ảnh. Vui lòng thử lại sau.',
        timestamp: new Date().toISOString()
      }])
    } finally {
      setImageLoading(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  return (
    <>
      {/* Chat Button */}
      <button 
        className={`chatbot-toggle-btn ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        title="Chat với chúng tôi"
      >
        {isOpen ? '✕' : '💬'}
      </button>

      {/* Confirm Clear Modal */}
      <ConfirmModal
        isOpen={showClearConfirm}
        title="Xóa lịch sử chat"
        message="Bạn có chắc muốn xóa toàn bộ lịch sử chat?"
        confirmText="Xóa"
        cancelText="Hủy"
        type="danger"
        onConfirm={handleClearChat}
        onCancel={() => setShowClearConfirm(false)}
      />

      {/* Chat Window */}
      {isOpen && (
        <div className="chatbot-window">
          {/* Header */}
          <div className="chatbot-header">
            <div className="chatbot-header-info">
              <div className="chatbot-avatar">🍰</div>
              <div>
                <h3>Đức An Việt</h3>
                <span className="chatbot-status">● Online</span>
              </div>
            </div>
            <button 
              className="chatbot-clear-btn"
              onClick={() => setShowClearConfirm(true)}
              title="Xóa lịch sử chat"
            >
              🗑️
            </button>
          </div>

          {/* Messages */}
          <div className="chatbot-messages">
            {messages.map((msg, index) => (
              <div 
                key={index} 
                className={`chatbot-message ${msg.role === 'user' ? 'user' : 'assistant'}`}
              >
                <div className="message-content">
                  {/* Image preview if user uploaded */}
                  {msg.imagePreview && (
                    <img 
                      src={msg.imagePreview} 
                      alt="Uploaded" 
                      className="message-image-preview"
                    />
                  )}
                  <p>{msg.content}</p>
                  
                  {/* Hiển thị sản phẩm được đề cử */}
                  {msg.products && msg.products.length > 0 && (
                    <div className="suggested-products">
                      {msg.products.map((product) => (
                        <a 
                          key={product.id}
                          href={`/shop?product=${product.id}`}
                          className="suggested-product"
                          onClick={(e) => {
                            e.preventDefault()
                            window.location.href = `/shop?product=${product.id}`
                          }}
                        >
                          {product.image && (
                            <img src={product.image} alt={product.name} />
                          )}
                          <div className="product-info">
                            <span className="product-name">{product.name}</span>
                            <span className="product-price">{product.price.toLocaleString()}đ</span>
                          </div>
                        </a>
                      ))}
                    </div>
                  )}
                  
                  <span className="message-time">{formatTime(msg.timestamp)}</span>
                </div>
              </div>
            ))}
            
            {loading && (
              <div className="chatbot-message assistant">
                <div className="message-content">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form className="chatbot-input-form" onSubmit={handleSendMessage}>
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              style={{ display: 'none' }}
            />
            
            {/* Image upload button */}
            <button
              type="button"
              className="chatbot-image-btn"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading || imageLoading}
              title="Tìm bánh bằng ảnh"
            >
              📷
            </button>
            
            <input
              ref={inputRef}
              type="text"
              className="chatbot-input"
              placeholder="Nhập tin nhắn..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              disabled={loading || imageLoading}
            />
            <button 
              type="submit" 
              className="chatbot-send-btn"
              disabled={loading || imageLoading || !inputMessage.trim()}
            >
              ➤
            </button>
          </form>
        </div>
      )}
    </>
  )
}