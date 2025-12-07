import React, { useState } from 'react'
import Header from './Header'
import SocialSidebar from './SocialSidebar'
import ChatButton from './ChatButton'
import Footer from './Footer'
import './FAQPage.css'

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState(0)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    department: 'Business Department',
    question: ''
  })
  const [statusMessage, setStatusMessage] = useState('')

const faqs = [
  {
    id: 1,
    question: 'Tiệm bánh mở cửa lúc mấy giờ?',
    answer: 'Chúng tôi mở cửa hàng ngày từ 7:00 sáng đến 9:00 tối. Giờ mở cửa có thể thay đổi vào ngày lễ và dịp đặc biệt.'
  },
  {
    id: 2,
    question: 'Tôi có thể đặt bánh sinh nhật trước không?',
    answer: 'Có chứ! Bạn nên đặt trước ít nhất 2-3 ngày để chúng tôi chuẩn bị kỹ lưỡng. Với bánh custom design thì nên đặt trước 5-7 ngày nhé.'
  },
  {
    id: 3,
    question: 'Bánh của Sweet Bakery có dùng nguyên liệu sạch không?',
    answer: 'Tất nhiên rồi! Chúng tôi cam kết sử dụng 100% bơ tươi, trứng gà ta, bột mì nhập khẩu và chocolate chất lượng cao. Không chất bảo quản.'
  },
  {
    id: 4,
    question: 'Có ship bánh tận nhà không?',
    answer: 'Có ạ! Chúng tôi giao hàng miễn phí trong bán kính 5km. Ngoài khu vực đó sẽ tính phí ship theo khoảng cách.'
  },
  {
    id: 5,
    question: 'Tiệm có bánh cho người ăn chay hoặc không gluten không?',
    answer: 'Có! Chúng tôi có dòng bánh vegan (không trứng sữa) và bánh gluten-free. Vui lòng đặt trước để được tư vấn kỹ hơn nhé.'
  },
  {
    id: 6,
    question: 'Tôi muốn đặt bánh cho tiệc cưới/sự kiện lớn thì làm thế nào?',
    answer: 'Bạn liên hệ trực tiếp với bộ phận Catering & Events của chúng tôi. Chúng tôi có kinh nghiệm phục vụ tiệc từ 50-500 khách với nhiều mẫu bánh đa dạng.'
  },
  {
    id: 7,
    question: 'Bánh để được bao lâu?',
    answer: 'Bánh kem nên dùng trong 1-2 ngày và bảo quản trong tủ lạnh. Bánh cookies, brownies có thể để 4-5 ngày ở nhiệt độ phòng trong hộp kín.'
  },
  {
    id: 8,
    question: 'Có chương trình khuyến mãi hoặc thẻ thành viên không?',
    answer: 'Có! Chúng tôi có chương trình tích điểm cho khách hàng thân thiết và ưu đãi đặc biệt vào sinh nhật. Mua từ 500k trở lên được giảm 10%.'
  }
]

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const token = localStorage.getItem('token')
    const userRole = localStorage.getItem('userRole')
    
    // Chặn admin gửi câu hỏi
    if (userRole?.toLowerCase() === 'admin') {
      setStatusMessage('✗ Admin không thể gửi câu hỏi!')
      return
    }
    
    try {
      const response = await fetch('/api/questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          subject: formData.subject,
          department: formData.department,
          question: formData.question
        })
      })

      if (!response.ok) {
        throw new Error('Không thể gửi câu hỏi')
      }

      setStatusMessage('✓ Câu hỏi đã được gửi! Chúng tôi sẽ phản hồi sớm.')
      setFormData({
        name: '',
        email: '',
        subject: '',
        department: 'Business Department',
        question: ''
      })
    } catch (error) {
      setStatusMessage('✗ ' + error.message)
    }
  }

  return (
    <div className="faq-page">
      <Header />
      
      <section className="page-banner">
        <div className="page-banner-container">
          <h1 className="page-title">FAQ</h1>
          <div className="breadcrumb">
            <a href="/">🏠</a>
            <span className="separator">»</span>
            <span>FAQ</span>
          </div>
        </div>
      </section>

      <section className="faq-section">
        <div className="faq-container">
          <div className="faq-left">
            <div className="faq-hero">
              <img 
                src="https://bizweb.dktcdn.net/100/438/465/files/banh-croissant-sapo.png?v=1713352654660" 
                alt="Espresso Machine" 
                className="hero-image"
              />
              <div className="hero-content">
                <h2 className="hero-title">
                  Do You Have Any <span className="highlight">Questions?</span>
                </h2>
                <p className="hero-text">
                  Please read questions bellow and if you can not find your answer, 
                  please send us your question. we will answer you as soon as possible.
                </p>
                <div className="faqs-badge">
                  <span className="badge-icon">❓</span>
                  <span className="badge-text">F.A.Qs</span>
                </div>
              </div>
            </div>

            <div className="ask-form-section">
              <div className="ask-header">
                <span className="ask-icon">💬</span>
                <h3 className="ask-title">ASK US</h3>
              </div>
              <form onSubmit={handleSubmit} className="ask-form">
                <div className="form-group">
                  <label>Your Name (*)</label>
                  <input 
                    type="text" 
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Your Email (*)</label>
                  <input 
                    type="email" 
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Subject</label>
                  <input 
                    type="text" 
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label>Department</label>
                  <select 
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                  >
                    <option>Business Department</option>
                    <option>Customer Service</option>
                    <option>Technical Support</option>
                    <option>Catering & Events</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Your Question</label>
                  <textarea 
                    name="question"
                    rows="5"
                    value={formData.question}
                    onChange={handleInputChange}
                    required
                  ></textarea>
                </div>
                <button type="submit" className="ask-button">Ask</button>
              </form>
              {statusMessage && (
                <p className="status-message">{statusMessage}</p>
              )}
            </div>
          </div>

          <div className="faq-right">
            <div className="faq-list">
              {faqs.map((faq, index) => (
                <div 
                  key={faq.id} 
                  className={`faq-item ${openIndex === index ? 'active' : ''}`}
                >
                  <button 
                    className="faq-question"
                    onClick={() => toggleFAQ(index)}
                  >
                    <span>{faq.question}</span>
                    <span className="faq-icon">
                      {openIndex === index ? '▲' : '▼'}
                    </span>
                  </button>
                  <div className={`faq-answer ${openIndex === index ? 'open' : ''}`}>
                    <p>{faq.answer}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <SocialSidebar />
      <ChatButton />
      <Footer />
    </div>
  )
}
