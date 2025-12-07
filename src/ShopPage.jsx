import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import Header from './Header'
import SocialSidebar from './SocialSidebar'
import ChatButton from './ChatButton'
import Footer from './Footer'
import { useToast } from './contexts/ToastContext'
import './ShopPage.css'
import api from './services/api'

export default function ShopPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const toast = useToast()
  const [viewMode, setViewMode] = useState(4)
  const [itemsPerPage, setItemsPerPage] = useState(12)
  const [sortBy, setSortBy] = useState('default')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedProduct, setSelectedProduct] = useState(null)
  
  // ===== STATE CHO API DATA =====
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [totalProducts, setTotalProducts] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // ===== STATE CHO FAVOURITES =====
  const [favouriteIds, setFavouriteIds] = useState(new Set())
  const [favouriteLoading, setFavouriteLoading] = useState({})
  const [favouritesLoaded, setFavouritesLoaded] = useState(false)
  
  // ===== STATE CHO CART ===== 
  const [cartLoading, setCartLoading] = useState({})

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
  
  // ===== INGREDIENTS STATE =====
  const [availableIngredients, setAvailableIngredients] = useState([])
  const [selectedIngredients, setSelectedIngredients] = useState([])

  // ===== REVIEW STATE =====
  const [productReviews, setProductReviews] = useState([])
  const [productRating, setProductRating] = useState(null)
  const [canReview, setCanReview] = useState(null)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    comment: ''
  })
  const [reviewLoading, setReviewLoading] = useState(false)

  const token = localStorage.getItem('token')
  const userRole = localStorage.getItem('userRole')
  const isAdmin = !!token && userRole === 'admin'

  // ===== FETCH CATEGORIES & FAVOURITES & INGREDIENTS KHI MOUNT =====
  useEffect(() => {
    const initData = async () => {
      await fetchCategories()
      await fetchFavouriteIds()
      if (isAdmin) {
        await fetchAvailableIngredients()
      }
    }
    initData()
  }, [isAdmin])

  // ===== HANDLE PRODUCT QUERY PARAM (từ chatbot) =====
  useEffect(() => {
    const productId = searchParams.get('product')
    if (productId && products.length > 0) {
      // Tìm sản phẩm trong danh sách hiện tại
      const product = products.find(p => p.id === productId)
      if (product) {
        setSelectedProduct(product)
        // Xóa query param sau khi mở modal
        setSearchParams({})
      } else {
        // Nếu không tìm thấy, fetch trực tiếp
        api.getProduct(productId).then(p => {
          if (p) {
            setSelectedProduct(p)
            setSearchParams({})
          }
        }).catch(console.error)
      }
    }
  }, [searchParams, products])

  // ===== FETCH PRODUCTS SAU KHI FAVOURITES ĐÃ LOAD =====
  useEffect(() => {
    if (favouritesLoaded) {
      fetchProducts()
    }
  }, [currentPage, itemsPerPage, selectedCategory, sortBy, favouritesLoaded])

  // ===== FETCH REVIEWS KHI MỞ MODAL =====
  useEffect(() => {
    if (selectedProduct) {
      fetchProductReviews(selectedProduct.id)
      fetchProductRating(selectedProduct.id)
      checkCanReview(selectedProduct.id)
    }
  }, [selectedProduct])

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const data = await api.getCategories()
      setCategories(data)
    } catch (err) {
      console.error('Error fetching categories:', err)
    }
  }

  // Fetch favourite IDs
  const fetchFavouriteIds = async () => {
    console.log('🔍 [FETCH FAV] Starting to fetch favourites...')
    
    try {
      const token = localStorage.getItem('token')
      console.log('🔑 [FETCH FAV] Token exists:', !!token)
      
      if (!token) {
        console.log('⚠️ [FETCH FAV] No token, skipping favourites fetch')
        setFavouritesLoaded(true)
        return
      }

      console.log('📡 [FETCH FAV] Calling API...')
      const favourites = await api.getFavourites({ skip: 0, limit: 100 })
      console.log('📦 [FETCH FAV] Raw API response:', favourites)
      
      const ids = new Set(favourites.map(fav => fav.product.id))
      console.log('✅ [FETCH FAV] Favourite IDs Set:', Array.from(ids))
      
      setFavouriteIds(ids)
      
    } catch (err) {
      console.error('❌ [FETCH FAV] Error fetching favourites:', err)
      
      if (err.message === 'Session expired') {
        return
      }
    } finally {
      console.log('🏁 [FETCH FAV] Finished, setting favouritesLoaded = true')
      setFavouritesLoaded(true)
    }
  }

  // Fetch available ingredients (Admin only)
  const fetchAvailableIngredients = async () => {
    try {
      const data = await api.getIngredients()
      setAvailableIngredients(data)
    } catch (err) {
      console.error('Error fetching ingredients:', err)
    }
  }

  // Fetch products
  const fetchProducts = async () => {
    console.log('🛍️ [FETCH PRODUCTS] Starting to fetch products...')
    console.log('💖 [FETCH PRODUCTS] Current favouriteIds:', Array.from(favouriteIds))
    
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
      
      console.log('✅ [FETCH PRODUCTS] Products loaded:', sortedProducts.length)
      
    } catch (err) {
      console.error('Error fetching products:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Fetch reviews của sản phẩm
  const fetchProductReviews = async (productId) => {
    try {
      const reviews = await api.getProductReviews(productId)
      console.log('📦 Reviews data:', reviews)
      setProductReviews(reviews)
    } catch (err) {
      console.error('Error fetching reviews:', err)
      setProductReviews([])
    }
  }

  // Fetch rating của sản phẩm
  const fetchProductRating = async (productId) => {
    try {
      const rating = await api.getProductRating(productId)
      setProductRating(rating)
    } catch (err) {
      console.error('Error fetching rating:', err)
      setProductRating(null)
    }
  }

  // Kiểm tra có thể review không
  const checkCanReview = async (productId) => {
    try {
      const result = await api.canReview(productId)
      setCanReview(result)
    } catch (err) {
      console.error('Error checking can review:', err)
      setCanReview(null)
    }
  }

  // Submit review
  const handleReviewSubmit = async (e) => {
    e.preventDefault()
    
    if (!selectedProduct) return
    
    setReviewLoading(true)
    
    try {
      await api.createReview(
        selectedProduct.id,
        reviewForm.rating,
        reviewForm.comment
      )
      
      toast.success('Đánh giá đã gửi! Đang chờ admin duyệt.')
      
      // Reset form
      setReviewForm({ rating: 5, comment: '' })
      setShowReviewForm(false)
      
      // Refresh data
      fetchProductReviews(selectedProduct.id)
      fetchProductRating(selectedProduct.id)
      checkCanReview(selectedProduct.id)
      
    } catch (err) {
      console.error('Error submitting review:', err)
      toast.error(err.message || 'Không thể gửi đánh giá')
    } finally {
      setReviewLoading(false)
    }
  }

  // Render star rating
  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={`star ${i < rating ? 'filled' : ''}`}>
        ★
      </span>
    ))
  }

  // ===== INGREDIENT MANAGEMENT =====
  const addIngredientToProduct = () => {
    setSelectedIngredients([
      ...selectedIngredients,
      { ingredient_id: '', quantity: '' }
    ])
  }

  const removeIngredientFromProduct = (index) => {
    setSelectedIngredients(selectedIngredients.filter((_, i) => i !== index))
  }

  const updateIngredientInList = (index, field, value) => {
    const updated = [...selectedIngredients]
    updated[index][field] = value
    setSelectedIngredients(updated)
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
    setSelectedIngredients([])
  }

  const handleAdminFormChange = (e) => {
    const { name, value } = e.target
    setAdminForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleAdminSubmit = async (e) => {
    e.preventDefault()

    if (!isAdmin) {
      toast.error('Bạn không có quyền admin')
      return
    }

    const payload = {
      ...adminForm,
      price: Number(adminForm.price),
      badge: adminForm.badge || null,
      ingredients: selectedIngredients
        .filter(ing => ing.ingredient_id && ing.quantity)
        .map(ing => ({
          ingredient_id: ing.ingredient_id,
          quantity: parseFloat(ing.quantity)
        }))
    }

    if (Number.isNaN(payload.price)) {
      toast.error('Giá phải là số')
      return
    }

    try {
      if (editingProduct) {
        await api.updateProduct(editingProduct.id, payload)
        toast.success('Cập nhật sản phẩm thành công!')
      } else {
        await api.createProduct(payload)
        toast.success('Thêm sản phẩm thành công!')
      }

      resetAdminForm()
      setShowAdminForm(false)
      fetchProducts()
      fetchCategories()
    } catch (err) {
      console.error(err)
      toast.error(err.message || 'Có lỗi xảy ra')
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
    
    setSelectedIngredients(
      product.ingredients?.map(ing => ({
        ingredient_id: ing.ingredient_id,
        quantity: String(ing.quantity_needed)
      })) || []
    )
    
    setShowAdminForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDeleteProduct = async (id) => {
    if (!isAdmin) return
    if (!window.confirm('Delete this product?')) return

    try {
      await api.deleteProduct(id)
      toast.success('Xóa sản phẩm thành công!')
      fetchProducts()
      fetchCategories()
    } catch (err) {
      console.error(err)
      toast.error(err.message || 'Lỗi khi xóa sản phẩm')
    }
  }

  const toggleFavourite = async (productId) => {
    console.log(`🔄 [TOGGLE] Product ID: ${productId}`)
    console.log(`💖 [TOGGLE] Before - favouriteIds:`, Array.from(favouriteIds))
    console.log(`🔍 [TOGGLE] Is currently favourite:`, favouriteIds.has(productId))
    
    setFavouriteLoading(prev => ({ ...prev, [productId]: true }))
    
    try {
      const isFavourite = favouriteIds.has(productId)
      
      if (isFavourite) {
        console.log(`💔 [TOGGLE] Removing ${productId} from favourites...`)
        await api.removeFromFavourites(productId)
        setFavouriteIds(prev => {
          const newSet = new Set(prev)
          newSet.delete(productId)
          console.log(`💔 [TOGGLE] After remove - favouriteIds:`, Array.from(newSet))
          return newSet
        })
      } else {
        console.log(`❤️ [TOGGLE] Adding ${productId} to favourites...`)
        await api.addToFavourites(productId)
        setFavouriteIds(prev => {
          const newSet = new Set(prev).add(productId)
          console.log(`❤️ [TOGGLE] After add - favouriteIds:`, Array.from(newSet))
          return newSet
        })
      }
    } catch (err) {
      console.error('❌ [TOGGLE] Error toggling favourite:', err)
      toast.error(err.message || 'Không thể cập nhật yêu thích')
    } finally {
      setFavouriteLoading(prev => ({ ...prev, [productId]: false }))
    }
  }

  const addToCart = async (productId, e) => {
    e.stopPropagation()
    
    const token = localStorage.getItem('token')
    if (!token) {
      toast.warning('Vui lòng đăng nhập để thêm vào giỏ hàng')
      return
    }

    console.log('🛒 [ADD TO CART] Product ID:', productId)
    setCartLoading(prev => ({ ...prev, [productId]: true }))
    
    try {
      await api.addToCart(productId, 1)
      toast.success('Đã thêm vào giỏ hàng!')
    } catch (err) {
      console.error('❌ [ADD TO CART] Error:', err)
      toast.error(err.message || 'Không thể thêm vào giỏ hàng')
    } finally {
      setCartLoading(prev => ({ ...prev, [productId]: false }))
    }
  }

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

          <div className="shop-main">
            <div className="shop-toolbar">
              <div className="toolbar-left">
                <p className="results-count">
                  Showing {((currentPage - 1) * itemsPerPage) + 1}–{Math.min(currentPage * itemsPerPage, totalProducts)} of {totalProducts} results
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
                      ? 'Edit Product'
                      : showAdminForm
                      ? 'Close Form'
                      : '+ Add Product'}
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
                  onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
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

            {isAdmin && showAdminForm && (
              <div className="admin-product-panel">
                <h3 className="admin-panel-title">
                  {editingProduct ? 'Edit Product' : 'Add New Product'}
                </h3>
                <form className="admin-product-form" onSubmit={handleAdminSubmit}>
                  <label>
                    Product Name
                    <input
                      name="name"
                      value={adminForm.name}
                      onChange={handleAdminFormChange}
                      required
                    />
                  </label>

                  <label>
                    Category
                    <select
                      name="category"
                      value={adminForm.category}
                      onChange={handleAdminFormChange}
                    >
                      <option value="birthday-cakes">Birthday Cakes</option>
                      <option value="bread-savory">Bread &amp; Savory</option>
                      <option value="cookies-minicakes">Cookies &amp; Minicakes</option>
                      <option value="beverages">Beverages</option>
                    </select>
                  </label>

                  <label>
                    Price ($)
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
                    Image URL
                    <input
                      name="image"
                      value={adminForm.image}
                      onChange={handleAdminFormChange}
                      required
                    />
                  </label>

                  <label>
                    Badge (NEW, SPECIAL, POPULAR, etc.)
                    <input
                      name="badge"
                      value={adminForm.badge}
                      onChange={handleAdminFormChange}
                    />
                  </label>

                  <label className="admin-form-full">
                    Description
                    <textarea
                      name="description"
                      rows={3}
                      value={adminForm.description}
                      onChange={handleAdminFormChange}
                      required
                    />
                  </label>

                  <div className="admin-form-full">
                    <label className="ingredients-section-label">
                      Ingredients (Optional)
                      <button
                        type="button"
                        className="add-ingredient-btn"
                        onClick={addIngredientToProduct}
                      >
                        + Add Ingredient
                      </button>
                    </label>
                    
                    <div className="ingredients-list">
                      {selectedIngredients.map((ing, index) => (
                        <div key={index} className="ingredient-row">
                          <select
                            value={ing.ingredient_id}
                            onChange={(e) => updateIngredientInList(index, 'ingredient_id', e.target.value)}
                            className="ingredient-select"
                          >
                            <option value="">Select ingredient...</option>
                            {availableIngredients.map(avail => (
                              <option key={avail.id} value={avail.id}>
                                {avail.name} ({avail.quantity} {avail.unit} available)
                              </option>
                            ))}
                          </select>
                          
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="Quantity needed"
                            value={ing.quantity}
                            onChange={(e) => updateIngredientInList(index, 'quantity', e.target.value)}
                            className="ingredient-quantity"
                          />
                          
                          <button
                            type="button"
                            className="remove-ingredient-btn"
                            onClick={() => removeIngredientFromProduct(index)}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                      
                      {selectedIngredients.length === 0 && (
                        <p className="no-ingredients-text">No ingredients added yet</p>
                      )}
                    </div>
                  </div>

                  <div className="admin-form-actions">
                    <button type="submit" className="admin-save-btn">
                      {editingProduct ? 'Save Changes' : 'Add Product'}
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
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              </div>
            )}

            <div className={`product-grid cols-${viewMode}`}>
              {products.map(product => {
                const isFav = favouriteIds.has(product.id)
                
                return (
                  <div key={product.id} className="product-card">
                    <button
                      type="button"
                      className="product-info-icon"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedProduct(product)
                      }}
                      title="View description"
                    >
                      i
                    </button>

                    <div className="product-image-wrapper">
                      <img src={product.image} alt={product.name} className="product-image" />
                      {product.badge && (
                        <span className={`product-badge badge-${product.badge.toLowerCase()}`}>
                          {product.badge}
                        </span>
                      )}
                      
                      <button 
                        className={`shop-favourite-btn ${isFav ? 'is-favourite' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleFavourite(product.id)
                        }}
                        disabled={favouriteLoading[product.id]}
                        title={isFav ? 'Remove from favourites' : 'Add to favourites'}
                      >
                        {favouriteLoading[product.id] ? '...' : '❤️'}
                      </button>

                      <button 
                        className="shop-cart-btn"
                        onClick={(e) => addToCart(product.id, e)}
                        disabled={cartLoading[product.id]}
                        title="Add to cart"
                      >
                        {cartLoading[product.id] ? '...' : '🛒'}
                      </button>
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
                          Edit
                        </button>
                        <button
                          type="button"
                          className="admin-delete-btn"
                          onClick={() => handleDeleteProduct(product.id)}
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {selectedProduct && (
  <div
    className="product-modal-backdrop"
    onClick={() => {
      setSelectedProduct(null)
      setShowReviewForm(false)
      setReviewForm({ rating: 5, comment: '' })
    }}
  >
    <div
      className="product-modal"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        className="product-modal-close"
        onClick={() => {
          setSelectedProduct(null)
          setShowReviewForm(false)
          setReviewForm({ rating: 5, comment: '' })
        }}
      >
        ×
      </button>

      <h2 className="product-modal-title">{selectedProduct.name}</h2>

      <p className="product-modal-price">
        ${selectedProduct.price?.toFixed(2)}
      </p>

      {productRating && productRating.total_reviews > 0 && (
        <div className="product-rating-summary">
          <div className="rating-stars">
            {renderStars(Math.round(productRating.avg_rating))}
          </div>
          <span className="rating-text">
            {productRating.avg_rating.toFixed(1)} / 5.0 ({productRating.total_reviews} reviews)
          </span>
        </div>
      )}

      {selectedProduct.image && (
        <img
          src={selectedProduct.image}
          alt={selectedProduct.name}
          className="product-modal-image"
        />
      )}

      <p className="product-modal-description">
        {selectedProduct.description || 'No description available for this product.'}
      </p>

      {/* ===== ADD TO CART BUTTON ===== */}
      <div className="modal-cart-section">
        <button
          className="modal-add-to-cart-btn"
          onClick={(e) => {
            e.stopPropagation()
            addToCart(selectedProduct.id, e)
          }}
          disabled={cartLoading[selectedProduct.id]}
        >
          {cartLoading[selectedProduct.id] ? (
            <>
              <span className="btn-spinner"></span>
              Adding...
            </>
          ) : (
            <>
              🛒 Buy
            </>
          )}
        </button>
      </div>

      {/* ===== INGREDIENTS SECTION - LUÔN HIỂN THỊ ===== */}
      <div className="product-modal-ingredients">
        <h3 className="ingredients-title">🥘 Ingredients</h3>
        {selectedProduct.ingredients && selectedProduct.ingredients.length > 0 ? (
          <ul className="ingredients-list-modal">
            {selectedProduct.ingredients.map((ing, idx) => (
              <li key={idx} className="ingredient-item">
                <span className="ingredient-name">{ing.name}</span>
                <span className="ingredient-quantity">
                  {ing.quantity_needed} {ing.unit}
                </span>
                {!ing.is_sufficient && (
                  <span className="ingredient-warning">
                    ⚠️ Low stock ({ing.available_stock} {ing.unit} left)
                  </span>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="empty-field-text">Ingredients: </p>
        )}
      </div>

      {/* ===== RECIPE SECTION - LUÔN HIỂN THỊ TẤT CẢ FIELDS ===== */}
      <div className="product-recipe-section">
        <h3 className="recipe-main-title">📖 Recipe Information</h3>

        {/* Recipe Ingredients */}
        <div className="recipe-subsection">
          <h3 className="recipe-subtitle">🍳 Recipe Ingredients</h3>
          {selectedProduct.recipe?.ingredients && selectedProduct.recipe.ingredients.length > 0 ? (
            <ul className="recipe-ingredients-list">
              {selectedProduct.recipe.ingredients.map((ing, idx) => (
                <li key={idx} className="recipe-ingredient-item">
                  <span className="ingredient-name">{ing.name}</span>
                  <span className="ingredient-quantity">
                    {ing.quantity} {ing.unit}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="empty-field-text">Recipe Ingredients: </p>
          )}
        </div>

        {/* Instructions */}
        <div className="recipe-subsection">
          <h3 className="recipe-subtitle">📝 Instructions</h3>
          <p className="recipe-text">
            {selectedProduct.recipe?.instructions || 'Instructions: '}
          </p>
        </div>

        {/* Origin */}
        <div className="recipe-subsection">
          <h3 className="recipe-subtitle">🌍 Origin</h3>
          <p className="recipe-text">
            {selectedProduct.recipe?.origin || 'Origin: '}
          </p>
        </div>

        {/* Story */}
        <div className="recipe-subsection">
          <h3 className="recipe-subtitle">📖 Story</h3>
          <p className="recipe-text">
            {selectedProduct.recipe?.story || 'Story: '}
          </p>
        </div>

        {/* History */}
        <div className="recipe-subsection">
          <h3 className="recipe-subtitle">🕰️ History</h3>
          <p className="recipe-text">
            {selectedProduct.recipe?.history || 'History: '}
          </p>
        </div>

        {/* Time Info */}
        <div className="recipe-subsection">
          <h3 className="recipe-subtitle">⏱️ Time & Servings</h3>
          <div className="recipe-time-info">
            <span className="time-item">
              ⏱️ Prep Time: {selectedProduct.recipe?.prep_time || 0} mins
            </span>
            <span className="time-item">
              🍳 Cook Time: {selectedProduct.recipe?.cook_time || 0} mins
            </span>
            <span className="time-item">
              🍽️ Servings: {selectedProduct.recipe?.servings || 0}
            </span>
          </div>
        </div>
      </div>

      {/* ===== REVIEWS SECTION ===== */}
      <div className="product-reviews-section">
        <h3 className="reviews-title">⭐ Customer Reviews</h3>

        {canReview && canReview.can_review && (
          <div className="review-form-container">
            {!showReviewForm ? (
              <button
                type="button"
                className="write-review-btn"
                onClick={() => setShowReviewForm(true)}
              >
                ✍️ Write a Review
              </button>
            ) : (
              <form className="review-form" onSubmit={handleReviewSubmit}>
                <div className="form-group">
                  <label>Rating</label>
                  <div className="star-rating-input">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        type="button"
                        className={`star-btn ${star <= reviewForm.rating ? 'active' : ''}`}
                        onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label>Comment (Optional)</label>
                  <textarea
                    value={reviewForm.comment}
                    onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                    placeholder="Share your experience with this product..."
                    rows={4}
                  />
                </div>

                <div className="form-actions">
                  <button
                    type="submit"
                    className="submit-review-btn"
                    disabled={reviewLoading}
                  >
                    {reviewLoading ? 'Submitting...' : 'Submit Review'}
                  </button>
                  <button
                    type="button"
                    className="cancel-review-btn"
                    onClick={() => {
                      setShowReviewForm(false)
                      setReviewForm({ rating: 5, comment: '' })
                    }}
                    disabled={reviewLoading}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {canReview && !canReview.can_review && (
          <div className="cannot-review-notice">
            <p>ℹ️ {canReview.reason}</p>
          </div>
        )}

        {productReviews.length > 0 ? (
          <div className="reviews-list">
            {productReviews.map(review => (
              <div key={review.id} className="review-item">
                <div className="review-header">
                  <span className="review-user">
                    {review.user_name || 'Anonymous'}
                    {review.is_pending && (
                      <span className="pending-badge" title="Pending admin approval">
                        ⏳ Pending
                      </span>
                    )}
                  </span>
                  <div className="review-rating">
                    {renderStars(review.rating)}
                  </div>
                  <span className="review-date">
                    {new Date(review.created_at).toLocaleDateString()}
                  </span>
                </div>
                {review.comment && (
                  <p className="review-comment">{review.comment}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="no-reviews-text">No reviews yet. Be the first to review!</p>
        )}
      </div>
    </div>
  </div>
)}
            {products.length === 0 && !loading && (
              <div className="empty-state">
                <p>No products found in this category.</p>
              </div>
            )}

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