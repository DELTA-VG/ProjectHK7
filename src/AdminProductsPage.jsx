import React, { useEffect, useState } from 'react'
import Header from './Header'
import Footer from './Footer'
import { useToast } from './contexts/ToastContext'
import ConfirmModal from './ConfirmModal'
import api from './services/api'
import './ShopPage.css' // tái dùng style thẻ sản phẩm

export default function AdminProductsPage() {
  const toast = useToast()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(false)
  const [editing, setEditing] = useState(null)
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, productId: null, productName: '' })
  const [form, setForm] = useState({
    name: '',
    category: 'birthday-cakes',
    price: '',
    description: '',
    image: '',
    badge: '',
  })

  // token admin sau khi login
  const token = localStorage.getItem('token')

  const loadProducts = async () => {
    try {
      setLoading(true)
      const data = await api.getProducts({ skip: 0, limit: 200 })
      setProducts(data)
    } catch (e) {
      console.error(e)
      toast.error('Không tải được sản phẩm')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProducts()
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const resetForm = () => {
    setEditing(null)
    setForm({
      name: '',
      category: 'birthday-cakes',
      price: '',
      description: '',
      image: '',
      badge: '',
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!token) {
      toast.error('Bạn chưa đăng nhập')
      return
    }

    const priceNumber = parseFloat(form.price)
    if (Number.isNaN(priceNumber)) {
      toast.error('Giá phải là số')
      return
    }

    const payload = {
      name: form.name,
      category: form.category,
      price: priceNumber,
      description: form.description,
      image: form.image,
      badge: form.badge || null,
    }

    try {
      if (editing) {
        // UPDATE
        await api.updateProduct(editing.id, payload, token)
        toast.success('Cập nhật sản phẩm thành công')
      } else {
        // CREATE
        await api.createProduct(payload, token)
        toast.success('Thêm sản phẩm thành công')
      }

      resetForm()
      loadProducts()
    } catch (err) {
      console.error('Error saving product:', err)
      toast.error('Lưu sản phẩm thất bại')
    }
  }

  const handleEditClick = (p) => {
    setEditing(p)
    setForm({
      name: p.name || '',
      category: p.category || 'birthday-cakes',
      price: p.price != null ? String(p.price) : '',
      description: p.description || '',
      image: p.image || '',
      badge: p.badge || '',
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const openDeleteModal = (product) => {
    setConfirmModal({ isOpen: true, productId: product.id, productName: product.name })
  }

  const closeDeleteModal = () => {
    setConfirmModal({ isOpen: false, productId: null, productName: '' })
  }

  const handleDelete = async () => {
    if (!token) {
      toast.error('Bạn chưa đăng nhập')
      closeDeleteModal()
      return
    }

    try {
      await api.deleteProduct(confirmModal.productId, token)
      toast.success('Xóa sản phẩm thành công')
      loadProducts()
    } catch (err) {
      console.error('Error deleting product:', err)
      toast.error('Xóa sản phẩm thất bại')
    } finally {
      closeDeleteModal()
    }
  }

  return (
    <div className="shop-page">
      <Header />

      <section className="page-banner">
        <div className="page-banner-container">
          <h1 className="page-title">Quản lý sản phẩm (Admin)</h1>
          <div className="breadcrumb">
            <a href="/home">🏠</a>
            <span className="separator">»</span>
            <span>Admin Products</span>
          </div>
        </div>
      </section>

      <section className="shop-section" style={{ paddingTop: 24 }}>
        <div className="shop-container">
          {/* FORM THÊM / SỬA */}
          <aside className="shop-sidebar">
            <div className="category-card">
              <h3 className="sidebar-title">
                {editing ? 'Sửa sản phẩm' : 'Thêm sản phẩm mới'}
              </h3>

              <form onSubmit={handleSubmit} className="filter-form">
                <label>
                  Tên sản phẩm
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    required
                  />
                </label>

                <label>
                  Danh mục
                  <select
                    name="category"
                    value={form.category}
                    onChange={handleChange}
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
                    value={form.price}
                    onChange={handleChange}
                    required
                  />
                </label>

                <label>
                  Ảnh (URL)
                  <input
                    name="image"
                    value={form.image}
                    onChange={handleChange}
                    required
                  />
                </label>

                <label>
                  Badge (NEW, SPECIAL, POPULAR,...)
                  <input
                    name="badge"
                    value={form.badge}
                    onChange={handleChange}
                  />
                </label>

                <label>
                  Mô tả
                  <textarea
                    name="description"
                    rows={3}
                    value={form.description}
                    onChange={handleChange}
                    required
                  />
                </label>

                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="submit" className="filter-button">
                    {editing ? 'Lưu thay đổi' : 'Thêm sản phẩm'}
                  </button>
                  {editing && (
                    <button
                      type="button"
                      className="reset-button"
                      onClick={resetForm}
                    >
                      Hủy
                    </button>
                  )}
                </div>
              </form>
            </div>
          </aside>

          {/* DANH SÁCH SẢN PHẨM */}
          <div className="shop-content">
            <div className="shop-header">
              <h2 className="shop-heading">Danh sách sản phẩm</h2>
            </div>

            {loading ? (
              <p>Đang tải...</p>
            ) : (
              <div className="shop-grid">
                {products.map((p) => (
                  <div key={p.id} className="product-card">
                    <div className="product-image-wrapper">
                      <img
                        src={p.image}
                        alt={p.name}
                        className="product-image"
                      />
                      {p.badge && (
                        <span className="product-badge">{p.badge}</span>
                      )}
                    </div>
                    <div className="product-info">
                      <span className="product-category">{p.category}</span>
                      <h3 className="product-name">{p.name}</h3>
                      <p className="product-description">
                        {p.description}
                      </p>
                      <div className="product-footer">
                        <span className="product-price">
                          ${Number(p.price).toFixed(2)}
                        </span>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            type="button"
                            className="product-button secondary"
                            onClick={() => handleEditClick(p)}
                          >
                            Sửa
                          </button>
                          <button
                            type="button"
                            className="product-button danger"
                            onClick={() => openDeleteModal(p)}
                          >
                            Xóa
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {products.length === 0 && <p>Chưa có sản phẩm nào</p>}
              </div>
            )}
          </div>
        </div>
      </section>

      <Footer />

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title="Xóa sản phẩm"
        message={`Bạn có chắc muốn xóa "${confirmModal.productName}"?`}
        confirmText="Xóa"
        cancelText="Hủy"
        type="danger"
        onConfirm={handleDelete}
        onCancel={closeDeleteModal}
      />
    </div>
  )
}