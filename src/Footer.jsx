import React from 'react'
import './Footer.css'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        {/* Left Column - Logo & Contact */}
        <div className="footer-column footer-brand">
          <div className="footer-logo">
            <div className="logo-icon">🍰</div>
            <span className="logo-text">Đức An Việt</span>
          </div>

          <div className="footer-contact">
            <div className="contact-item">
              <span className="contact-icon">📍</span>
              <div>
                <div className="contact-label">ĐỊA CHỈ</div>
                <div className="contact-value">Số 8 Lê Thái Tổ, Hoàn Kiếm, Hà Nội</div>
              </div>
            </div>

            <div className="contact-item">
              <span className="contact-icon">📞</span>
              <div>
                <div className="contact-label">TEL</div>
                <a href="tel:+842439999999" className="contact-value">+84 24 3999 9999</a>
              </div>
            </div>

            <div className="contact-item">
              <span className="contact-icon">📞</span>
              <div>
                <div className="contact-label">TEL</div>
                <a href="tel:+84901234567" className="contact-value">+84 90 123 4567</a>
              </div>
            </div>
          </div>
        </div>

        {/* Middle Column - Working Hours */}
        <div className="footer-column footer-hours">
          <h3 className="footer-title">Giờ mở cửa</h3>
          
          <div className="hours-section">
            <div className="hours-label">
              <span className="hours-icon">🕒</span>
              GIỜ HOẠT ĐỘNG
            </div>
            <div className="hours-time">Thứ 2 - Thứ 7: 7:00 AM - 10:00 PM</div>
          </div>

          <div className="hours-section">
            <div className="hours-label">
              <span className="hours-icon">🍳</span>
              GIỜ HOẠT ĐỘNG
            </div>
            <div className="hours-time"> Chủ nhật: 7:00 AM - 09:00 PM</div>
          </div>
        </div>

        {/* Right Column - Map */}
        <div className="footer-column footer-map">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3724.096890183977!2d105.84117631533315!3d21.028511793005486!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3135ab953357c995%3A0x516b63e99c972d80!2zSOG7kyBMw6ogVGjhuqEgVMO0LCBIb8OgbiBLaWVtLCBIw6AgTuG7mWk!5e0!3m2!1svi!2s!4v1670000000000!5m2!1svi!2s"
            width="100%"
            height="300"
            style={{ border: 0, borderRadius: '12px' }}
            allowFullScreen=""
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Đức An Việt Location"
          ></iframe>
        </div>
      </div>

      {/* Copyright Bar */}
      <div className="footer-bottom">
        <div className="footer-bottom-container">
          <p>© 2025 Đức An Việt. All rights reserved.</p>
          <div className="footer-links">
            <a href="/privacy">Chính sách bảo mật</a>
            <a href="/terms">Điều khoản sử dụng</a>
          </div>
        </div>
      </div>
    </footer>
  )
}