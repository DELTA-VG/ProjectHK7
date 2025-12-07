import React, { useState } from 'react'
import Header from './Header'
import SocialSidebar from './SocialSidebar'
import ChatButton from './ChatButton'
import './AboutPage.css'
import Footer from './Footer'

export default function AboutPage() {
  // State cho testimonials slider
  const [currentSlide, setCurrentSlide] = useState(0)

  const testimonials = [
    {
      id: 1,
      text: "Sweet Bakery luôn khiến mình mê mẩn với bánh ngọt mới nướng mỗi sáng. Cửa tiệm lúc nào cũng thơm mùi bơ, và nhân viên thì dễ thương nữa. Mỗi lần tới là một lần được nuông chiều vị giác.",
      name: "Jane Carter",
      role: "Food Blogger",
      avatar: "https://randomuser.me/api/portraits/women/44.jpg"
    },
    {
      id: 2,
      text: "Không chỉ cà phê thơm, bánh ngọt ở đây còn đậm đà và đẹp như tác phẩm nghệ thuật. Mình thường ghé Sweet mỗi cuối tuần, vừa ăn vừa làm việc – cảm giác rất chill.",
      name: "David Smith",
      role: "Designer",
      avatar: "https://randomuser.me/api/portraits/men/32.jpg"
    },
    {
      id: 3,
      text: "Bánh kem ở Sweet là một trong những điều mình luôn giới thiệu với bạn bè. Từng chiếc bánh đều tươi mới, topping sáng tạo và đúng chuẩn hương vị Âu-Á.",
      name: "Sarah Johnson",
      role: "Event Planner",
      avatar: "https://randomuser.me/api/portraits/women/68.jpg"
    },
    {
      id: 4,
      text: "Không gian ấm cúng + bánh chất lượng = combo hoàn hảo của Sweet Bakery. Tôi đưa khách hàng tới đây vì vừa tiện làm việc, vừa tận hưởng đồ ăn ngon.",
      name: "Michael Brown",
      role: "Entrepreneur",
      avatar: "https://randomuser.me/api/portraits/men/52.jpg"
    }
  ]

  // Data cho Expert Chefs
  // ...existing code...
  const chefs = [
    {
      id: 1,
      name: "Jimmy Roland",
      role: "Founder & Master Baker",
      image: "https://png.pngtree.com/png-clipart/20240325/original/pngtree-chef-cook-baker-holding-serving-pastry-bakery-products-png-image_14672762.png"
    },
    {
      id: 2,
      name: "Nicolas Xavier",
      role: "Signature Pastry Chef",
      image: "https://png.pngtree.com/png-clipart/20231019/original/pngtree-chef-cook-baker-holding-serving-pastry-bakery-products-png-image_13363500.png"
    },
    {
      id: 3,
      name: "Alex Hernandez",
      role: "Artisan Chocolate Chef",
      image: "https://c.pxhere.com/images/9a/5a/5e5ce6847f632abda54c8abc2500-1683548.jpg!d"
    },
    {
      id: 4,
      name: "Robert Gray",
      role: "Experience Barista",
      image: "https://chefjob.vn/wp-content/uploads/2019/07/guong-mat-vang-trong-lang-banh-ngot.jpg"
    }
  ]
// ...existing code...

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 2 >= testimonials.length ? 0 : prev + 2))
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 2 < 0 ? testimonials.length - 2 : prev - 2))
  }

  const totalPages = Math.ceil(testimonials.length / 2)
  const currentPage = Math.floor(currentSlide / 2)

  return (
    <div className="about-page">
      <Header />
      
      {/* Page Banner */}
      <section className="page-banner">
        <div className="page-banner-container">
          <h1 className="page-title">About</h1>
          <div className="breadcrumb">
            <a href="/">🏠</a>
            <span className="separator">»</span>
            <span>About</span>
          </div>
        </div>
      </section>

      {/* Our History Section */}
      <section className="our-history">
        <div className="our-history-container">
          <div className="history-content">
            <h2 className="section-title">
              Our <span className="highlight">Bakery Story</span>
            </h2>
            <p className="history-text">
              Khởi nguồn từ một tiệm bánh nhỏ vào năm 1998 giữa lòng Hà Nội, Sweet Bakery đã mở rộng thành chuỗi bánh ngọt tinh tế, nơi kết hợp giữa truyền thống làm bánh Âu và nguyên liệu vùng ven. Mỗi ổ bánh, từng lát pastry đều được tạo nên bởi thợ cả tận tâm, cam kết giữ đúng hương vị nguyên bản dù đã lan rộng ra hơn 50 cửa hàng trên toàn quốc.
            </p>
          </div>
          <div className="history-image">
            <img 
              src="https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=900&q=80" 
              alt="Artisan bakery display" 
            />
          </div>
        </div>
      </section>

      {/* Stats Counter */}
      <section className="stats-section">
        <div className="stats-container">
          <div className="stat-item">
            <div className="stat-number">52<span className="plus">+</span></div>
            <div className="stat-label">Bánh Signature</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">120<span className="plus">+</span></div>
            <div className="stat-label">Xuất khẩu mỗi tháng</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">250<span className="k">k</span></div>
            <div className="stat-label">Khách hàng happy</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">90<span className="plus">+</span></div>
            <div className="stat-label">Cửa hàng toàn quốc</div>
          </div>
        </div>
      </section>

      {/* Enjoy Having Section */}
      <section className="enjoy-section">
        <div className="enjoy-container">
          <div className="enjoy-image">
            <img 
              src="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&q=80" 
              alt="Baker preparing pastries" 
            />
          </div>
          <div className="enjoy-content">
            <h2 className="section-title">
              <span className="highlight">Enjoy</span> Fresh Bakes & <span className="highlight">Sweet Moments</span>
            </h2>
            <p className="enjoy-text">
              Tại Sweet Bakery, mỗi sản phẩm đều được làm với nguyên liệu sạch, quá trình lên men thủ công và trang trí tinh tế. Chúng tôi biến những khoảnh khắc nhỏ thành kỷ niệm ngọt ngào cho bạn, từ những ly cà phê sáng tới tiệc cưới hoành tráng.
            </p>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="testimonials-section">
        <div className="testimonials-container">
          <h2 className="section-title-center">
            Our <span className="highlight">Testimonials</span>
          </h2>

          <div className="testimonials-slider">
            <button className="slider-btn prev-btn" onClick={prevSlide} aria-label="Previous testimonials">
              ←
            </button>

            <div className="testimonials-cards">
              {testimonials.slice(currentSlide, currentSlide + 2).map((testimonial) => (
                <div key={testimonial.id} className="testimonial-card">
                  <p className="testimonial-text">"{testimonial.text}"</p>
                  <div className="testimonial-author">
                    <img 
                      src={testimonial.avatar} 
                      alt={testimonial.name}
                      className="author-avatar"
                    />
                    <div className="author-info">
                      <div className="author-name">{testimonial.name}</div>
                      <div className="author-role">{testimonial.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button className="slider-btn next-btn" onClick={nextSlide} aria-label="Next testimonials">
              →
            </button>
          </div>

          <div className="slider-dots">
            {Array.from({ length: totalPages }).map((_, index) => (
              <button
                key={index}
                className={`dot ${currentPage === index ? 'active' : ''}`}
                onClick={() => setCurrentSlide(index * 2)}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Expert Chefs Section */}
      <section className="chefs-section">
        <div className="chefs-container">
          <h2 className="section-title-center-dark">
            Our <span className="highlight">Expert Chefs</span>
          </h2>
          <p className="chefs-subtitle">Những nghệ nhân làm bánh hàng đầu</p>

          <div className="chefs-grid">
            {chefs.map((chef) => (
              <div key={chef.id} className="chef-card">
                <div className="chef-image">
                  <img src={chef.image} alt={chef.name} />
                </div>
                <div className="chef-info">
                  <h3 className="chef-name">{chef.name}</h3>
                  <p className="chef-role">{chef.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <SocialSidebar />
      <ChatButton />
      <Footer />
    </div>
  )
}