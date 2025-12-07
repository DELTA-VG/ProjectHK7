import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './HeroSection.css'
import api from './services/api'

export default function HeroSection() {
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFeaturedProducts()
  }, [])

  const fetchFeaturedProducts = async () => {
    try {
      // Lấy 4 sản phẩm đầu tiên
      const data = await api.getProducts({ skip: 0, limit: 4 })
      setProducts(data)
    } catch (err) {
      console.error('Error fetching featured products:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-container">
          {/* Left content */}
          <div className="hero-content">
            <h1 className="hero-title">
               <span className="highlight"> Crafted with Passion, Served with a Smile</span>
            </h1>
            <p className="hero-description">
              A bakery or cake shop is an establishment that primarily offers a variety of freshly baked goods such as cakes, pastries, cookies, and bread, made with quality ingredients and crafted with care.
            </p>
          </div>

          {/* Right image */}
          <div className="hero-image">
            <img 
              src="https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&q=80" 
              alt="Coffee shop interior" 
            />
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="featured-products">
        <div className="featured-container">
          <h2 className="featured-title">
            So much More<br />
            than a <span className="highlight-orange">bakery</span>
          </h2>

          {loading ? (
            <p className="loading-text">Loading products...</p>
          ) : (
            <>
              <div className="featured-grid">
                {products.map(product => (
                  <div key={product.id} className="featured-card">
                    <div className="featured-image-wrapper">
                      <img 
                        src={product.image} 
                        alt={product.name}
                        className="featured-image"
                      />
                    </div>
                    <div className="featured-info">
                      <h3 className="featured-product-name">{product.name}</h3>
                      <span className="featured-product-price">${product.price.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>

              <button 
                className="view-all-btn"
                onClick={() => navigate('/shop')}
              >
                <span className="btn-icon">🍰</span>
                VIEW ALL PRODUCTS
              </button>
            </>
          )}
        </div>
      </section>
    </>
  )
}