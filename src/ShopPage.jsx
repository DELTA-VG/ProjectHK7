import React, { useState, useEffect } from 'react'
import Header from './Header'
import SocialSidebar from './SocialSidebar'
import ChatButton from './ChatButton'
import Footer from './Footer'
import './ShopPage.css'
import api from './services/api'  // ← Import API service

export default function ShopPage() {
  const [viewMode, setViewMode] = useState(4)
  const [itemsPerPage, setItemsPerPage] = useState(12)
  const [sortBy, setSortBy] = useState('default')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedCategory, setSelectedCategory] = useState('all')
  
  // ===== STATE CHO API DATA =====
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [totalProducts, setTotalProducts] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // ===== FETCH CATEGORIES KHI MOUNT =====
  useEffect(() => {
    fetchCategories()
  }, [])

  // ===== FETCH PRODUCTS KHI PARAMS THAY ĐỔI =====
  useEffect(() => {
    fetchProducts()
  }, [currentPage, itemsPerPage, selectedCategory, sortBy])

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const data = await api.getCategories()
      setCategories(data)
    } catch (err) {
      console.error('Error fetching categories:', err)
    }
  }

  // Fetch products
  const fetchProducts = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Tính skip cho pagination
      const skip = (currentPage - 1) * itemsPerPage
      
      // Gọi API lấy products
      const productsData = await api.getProducts({
        skip,
        limit: itemsPerPage,
        category: selectedCategory === 'all' ? null : selectedCategory,
      })
      
      // Gọi API đếm tổng số products
      const count = await api.getProductCount(
        selectedCategory === 'all' ? null : selectedCategory
      )
      
      // Sort ở frontend (vì backend chưa có sort)
      let sortedProducts = [...productsData]
      
      switch (sortBy) {
        case 'price-low':
          sortedProducts.sort((a, b) => a.price - b.price)
          break
        case 'price-high':
          sortedProducts.sort((a, b) => b.price - a.price)
          break
        case 'name-az':
          sortedProducts.sort((a, b) => a.name.localeCompare(b.name))
          break
        case 'name-za':
          sortedProducts.sort((a, b) => b.name.localeCompare(a.name))
          break
        default:
          // Default order from backend (created_at desc)
          break
      }
      
      setProducts(sortedProducts)
      setTotalProducts(count)
      setTotalPages(Math.ceil(count / itemsPerPage))
      setLoading(false)
      
    } catch (err) {
      console.error('Error fetching products:', err)
      setError(err.message)
      setLoading(false)
    }
  }

  // Handle category change
  const handleCategoryChange = (categoryId) => {
    setSelectedCategory(categoryId)
    setCurrentPage(1)  // Reset về trang 1
  }

  // Handle sort change
  const handleSortChange = (newSort) => {
    setSortBy(newSort)
    setCurrentPage(1)
  }

  // Handle items per page change
  const handleItemsPerPageChange = (newLimit) => {
    setItemsPerPage(newLimit)
    setCurrentPage(1)
  }

  // ===== LOADING STATE =====
  if (loading && products.length === 0) {
    return (
      <div className="shop-page">
        <Header />
        <section className="page-banner">
          <div className="page-banner-container">
            <h1 className="page-title">Shop</h1>
            <div className="breadcrumb">
              <a href="/">🏠</a>
              <span className="separator">»</span>
              <span>Shop</span>
            </div>
          </div>
        </section>
        <section className="shop-section">
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading products...</p>
          </div>
        </section>
        <Footer />
      </div>
    )
  }

  // ===== ERROR STATE =====
  if (error) {
    return (
      <div className="shop-page">
        <Header />
        <section className="page-banner">
          <div className="page-banner-container">
            <h1 className="page-title">Shop</h1>
          </div>
        </section>
        <section className="shop-section">
          <div className="error-state">
            <h2>⚠️ Error Loading Products</h2>
            <p>{error}</p>
            <button onClick={fetchProducts} className="retry-btn">
              Try Again
            </button>
          </div>
        </section>
        <Footer />
      </div>
    )
  }

  // ===== MAIN RENDER =====
  return (
    <div className="shop-page">
      <Header />
      
      <section className="page-banner">
        <div className="page-banner-container">
          <h1 className="page-title">Shop</h1>
          <div className="breadcrumb">
            <a href="/">🏠</a>
            <span className="separator">»</span>
            <span>Shop</span>
          </div>
        </div>
      </section>

      <section className="shop-section">
        <div className="shop-container">
          
          {/* Sidebar */}
          <aside className="shop-sidebar">
            <h3 className="sidebar-title">Categories</h3>
            <ul className="category-list">
              {categories.map(cat => (
                <li key={cat.id}>
                  <button
                    className={`category-btn ${selectedCategory === cat.id ? 'active' : ''}`}
                    onClick={() => handleCategoryChange(cat.id)}
                  >
                    <span className="category-name">{cat.name}</span>
                    <span className="category-count">({cat.product_count})</span>
                  </button>
                </li>
              ))}
            </ul>
          </aside>

          {/* Main Content */}
          <div className="shop-main">
            {/* Toolbar */}
            <div className="shop-toolbar">
              <div className="toolbar-left">
                <p className="results-count">
                  Showing {((currentPage - 1) * itemsPerPage) + 1}–{Math.min(currentPage * itemsPerPage, totalProducts)} of {totalProducts} results
                </p>
              </div>

              <div className="toolbar-right">
                {/* View Mode */}
                <div className="view-mode">
                  <button 
                    className={`view-btn ${viewMode === 2 ? 'active' : ''}`}
                    onClick={() => setViewMode(2)}
                    title="2 columns"
                  >
                    <span className="grid-icon grid-2"></span>
                  </button>
                  <button 
                    className={`view-btn ${viewMode === 3 ? 'active' : ''}`}
                    onClick={() => setViewMode(3)}
                    title="3 columns"
                  >
                    <span className="grid-icon grid-3"></span>
                  </button>
                  <button 
                    className={`view-btn ${viewMode === 4 ? 'active' : ''}`}
                    onClick={() => setViewMode(4)}
                    title="4 columns"
                  >
                    <span className="grid-icon grid-4"></span>
                  </button>
                </div>

                {/* Items per page */}
                <select 
                  className="toolbar-select"
                  value={itemsPerPage}
                  onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                >
                  <option value={12}>12 Products</option>
                  <option value={24}>24 Products</option>
                  <option value={36}>36 Products</option>
                </select>

                {/* Sort */}
                <select 
                  className="toolbar-select"
                  value={sortBy}
                  onChange={(e) => handleSortChange(e.target.value)}
                >
                  <option value="default">Default Sorting</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="name-az">Name: A to Z</option>
                  <option value="name-za">Name: Z to A</option>
                </select>
              </div>
            </div>

            {/* Product Grid */}
            <div className={`product-grid cols-${viewMode}`}>
              {products.map(product => (
                <div key={product.id} className="product-card">
                  <div className="product-image-wrapper">
                    <img src={product.image} alt={product.name} className="product-image" />
                    {product.badge && (
                      <span className={`product-badge badge-${product.badge.toLowerCase()}`}>
                        {product.badge}
                      </span>
                    )}
                  </div>
                  <div className="product-info">
                    <h3 className="product-name">{product.name}</h3>
                    <p className="product-price">${product.price.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Empty State */}
            {products.length === 0 && !loading && (
              <div className="empty-state">
                <p>No products found in this category.</p>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pagination">
                <button 
                  className="page-btn"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  ←
                </button>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    className={`page-btn ${currentPage === page ? 'active' : ''}`}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </button>
                ))}
                
                <button 
                  className="page-btn"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  →
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      <SocialSidebar />
      <ChatButton />
      <Footer />
    </div>
  )
}