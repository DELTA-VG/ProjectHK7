import React, { useState, useEffect } from 'react'
import Header from './Header'
import SocialSidebar from './SocialSidebar'
import ChatButton from './ChatButton'
import Footer from './Footer'
import './ShopPage.css'
import api from './services/api'

// =====================
//  SHOP PAGE + ADMIN CRUD
// =====================
export default function ShopPage() {
  const [viewMode, setViewMode] = useState(4)
  const [itemsPerPage, setItemsPerPage] = useState(12)
  const [sortBy, setSortBy] = useState('default')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedProduct, setSelectedProduct] = useState(null)


  // API state
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [totalProducts, setTotalProducts] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // ===== ADMIN STATE =====
  const [showAdminForm, setShowAdminForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [adminForm, setAdminForm] = useState({
    name: '',
    category: 'birthday-cakes',
    price: '',
    description: '',
    image: '',
    badge: '',
  })

  const token = localStorage.getItem('token')
  const userRole = localStorage.getItem('userRole')
  const isAdmin = !!token && userRole === 'admin'

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

      const skip = (currentPage - 1) * itemsPerPage

      const productsData = await api.getProducts({
        skip,
        limit: itemsPerPage,
        category: selectedCategory === 'all' ? null : selectedCategory,
      })

      const count = await api.getProductCount(
        selectedCategory === 'all' ? null : selectedCategory
      )

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

  // ====== ADMIN FORM HANDLERS ======
  const resetAdminForm = () => {
    setEditingProduct(null)
    setAdminForm({
      name: '',
      category: 'birthday-cakes',
      price: '',
      description: '',
      image: '',
      badge: '',
    })
  }

  const handleAdminFormChange = (e) => {
    const { name, value } = e.target
    setAdminForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleAdminSubmit = async (e) => {
    e.preventDefault()

    if (!isAdmin) {
      alert('Bạn không có quyền admin')
      return
    }

    const payload = {
      ...adminForm,
      price: Number(adminForm.price),
      badge: adminForm.badge || null,
    }

    if (Number.isNaN(payload.price)) {
      alert('Giá phải là số')
      return
    }

    try {
      if (editingProduct) {
        // UPDATE
        await api.updateProduct(editingProduct.id, payload, token)
        alert('Cập nhật sản phẩm thành công')
      } else {
        // CREATE
        await api.createProduct(payload, token)
        alert('Thêm sản phẩm thành công')
      }

      resetAdminForm()
      setShowAdminForm(false)
      // reload data
      fetchProducts()
      fetchCategories()
    } catch (err) {
      console.error(err)
      alert(err.message || 'Có lỗi xảy ra')
    }
  }

  const handleEditProduct = (product) => {
    if (!isAdmin) return
    setEditingProduct(product)
    setAdminForm({
      name: product.name,
      category: product.category,
      price: String(product.price),
      description: product.description,
      image: product.image || '',
      badge: product.badge || '',
    })
    setShowAdminForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDeleteProduct = async (id) => {
    if (!isAdmin) return
    if (!window.confirm('Xóa sản phẩm này?')) return

    try {
      await api.deleteProduct(id, token)
      alert('Xóa sản phẩm thành công')
      fetchProducts()
      fetchCategories()
    } catch (err) {
      console.error(err)
      alert(err.message || 'Có lỗi xảy ra khi xóa')
    }
  }

  // ===== HANDLERS KHÁC =====
  const handleCategoryChange = (categoryId) => {
    setSelectedCategory(categoryId)
    setCurrentPage(1)
  }

  const handleSortChange = (newSort) => {
    setSortBy(newSort)
    setCurrentPage(1)
  }

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
            <div className="spinner" />
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
          {/* SIDEBAR */}
          <aside className="shop-sidebar">
            <h3 className="sidebar-title">Categories</h3>
            <ul className="category-list">
              {categories.map((cat) => (
                <li key={cat.id}>
                  <button
                    className={`category-btn ${
                      selectedCategory === cat.id ? 'active' : ''
                    }`}
                    onClick={() => handleCategoryChange(cat.id)}
                  >
                    <span className="category-name">{cat.name}</span>
                    <span className="category-count">
                      ({cat.product_count})
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </aside>

          {/* MAIN CONTENT */}
          <div className="shop-main">
            {/* TOOLBAR */}
            <div className="shop-toolbar">
              <div className="toolbar-left">
                <p className="results-count">
                  Showing {(currentPage - 1) * itemsPerPage + 1}–
                  {Math.min(currentPage * itemsPerPage, totalProducts)} of{' '}
                  {totalProducts} results
                </p>
              </div>

              <div className="toolbar-right">
                {isAdmin && (
                  <button
                    type="button"
                    className="admin-add-btn"
                    onClick={() => {
                      if (showAdminForm && editingProduct) {
                        resetAdminForm()
                      }
                      setShowAdminForm((prev) => !prev)
                    }}
                  >
                    {editingProduct
                      ? 'Sửa sản phẩm'
                      : showAdminForm
                      ? 'Đóng form'
                      : '+ Thêm sản phẩm'}
                  </button>
                )}

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

                <select
                  className="toolbar-select"
                  value={itemsPerPage}
                  onChange={(e) =>
                    handleItemsPerPageChange(Number(e.target.value))
                  }
                >
                  <option value={12}>12 Products</option>
                  <option value={24}>24 Products</option>
                  <option value={36}>36 Products</option>
                </select>

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

            {/* ===== ADMIN FORM (ADD / EDIT) ===== */}
            {isAdmin && showAdminForm && (
              <div className="admin-product-panel">
                <h3 className="admin-panel-title">
                  {editingProduct ? 'Sửa sản phẩm' : 'Thêm sản phẩm mới'}
                </h3>
                <form className="admin-product-form" onSubmit={handleAdminSubmit}>
                  <label>
                    Tên sản phẩm
                    <input
                      name="name"
                      value={adminForm.name}
                      onChange={handleAdminFormChange}
                      required
                    />
                  </label>

                  <label>
                    Danh mục
                    <select
                      name="category"
                      value={adminForm.category}
                      onChange={handleAdminFormChange}
                    >
                      <option value="birthday-cakes">Birthday Cakes</option>
                      <option value="bread-savory">Bread &amp; Savory</option>
                      <option value="cookies-minicakes">
                        Cookies &amp; Minicakes
                      </option>
                      <option value="beverages">Beverages</option>
                    </select>
                  </label>

                  <label>
                    Giá ($)
                    <input
                      type="number"
                      name="price"
                      min="0"
                      step="0.01"
                      value={adminForm.price}
                      onChange={handleAdminFormChange}
                      required
                    />
                  </label>

                  <label>
                    Ảnh (URL)
                    <input
                      name="image"
                      value={adminForm.image}
                      onChange={handleAdminFormChange}
                      required
                    />
                  </label>

                  <label>
                    Badge (NEW, SPECIAL, POPULAR,...)
                    <input
                      name="badge"
                      value={adminForm.badge}
                      onChange={handleAdminFormChange}
                    />
                  </label>

                  <label className="admin-form-full">
                    Mô tả
                    <textarea
                      name="description"
                      rows={3}
                      value={adminForm.description}
                      onChange={handleAdminFormChange}
                      required
                    />
                  </label>

                  <div className="admin-form-actions">
                    <button type="submit" className="admin-save-btn">
                      {editingProduct ? 'Lưu thay đổi' : 'Thêm sản phẩm'}
                    </button>
                    {editingProduct && (
                      <button
                        type="button"
                        className="admin-cancel-btn"
                        onClick={() => {
                          resetAdminForm()
                          setShowAdminForm(false)
                        }}
                      >
                        Hủy
                      </button>
                    )}
                  </div>
                </form>
              </div>
            )}

          {/* PRODUCT GRID */}
          <div className={`product-grid cols-${viewMode}`}>
            {products.map(product => (
              <div key={product.id} className="product-card">

                {/* ICON MÔ TẢ Ở GÓC TRÊN TRÁI */}
                <button
                  type="button"
                  className="product-info-icon"
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedProduct(product)   // 👈 set sản phẩm đang chọn
                  }}
                  title="Xem mô tả"
                >
                  i
                </button>

                <div className="product-image-wrapper">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="product-image"
                  />
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

                {isAdmin && (
                  <div className="admin-product-actions">
                    <button
                      type="button"
                      className="admin-edit-btn"
                      onClick={() => handleEditProduct(product)}
                    >
                      Sửa
                    </button>
                    <button
                      type="button"
                      className="admin-delete-btn"
                      onClick={() => handleDeleteProduct(product.id)}
                    >
                      Xóa
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>


          {/* MODAL MÔ TẢ SẢN PHẨM */}
          {selectedProduct && (
            <div
              className="product-modal-backdrop"
              onClick={() => setSelectedProduct(null)}
            >
              <div
                className="product-modal"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  className="product-modal-close"
                  onClick={() => setSelectedProduct(null)}
                >
                  ×
                </button>

                <h2 className="product-modal-title">{selectedProduct.name}</h2>

                <p className="product-modal-price">
                  ${selectedProduct.price?.toFixed(2)}
                </p>

                {selectedProduct.image && (
                  <img
                    src={selectedProduct.image}
                    alt={selectedProduct.name}
                    className="product-modal-image"
                  />
                )}

                <p className="product-modal-description">
                  {selectedProduct.description || 'Chưa có mô tả cho sản phẩm này.'}
                </p>

                {selectedProduct.story && (
                  <p className="product-modal-story">
                    {selectedProduct.story}
                  </p>
                )}
              </div>
            </div>
          )}




            {/* EMPTY STATE */}
            {products.length === 0 && !loading && (
              <div className="empty-state">
                <p>No products found in this category.</p>
              </div>
            )}

            {/* PAGINATION */}
            {totalPages > 1 && (
              <div className="pagination">
                <button
                  className="page-btn"
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                >
                  ←
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <button
                      key={page}
                      className={`page-btn ${
                        currentPage === page ? 'active' : ''
                      }`}
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </button>
                  )
                )}

                <button
                  className="page-btn"
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
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
