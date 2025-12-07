import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'
import ConfirmModal from './ConfirmModal'
import { useToast } from './contexts/ToastContext'
import api from './services/api'
import './RecipesPage.css'

export default function RecipesPage() {
  const [products, setProducts] = useState([])
  const [recipes, setRecipes] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [showForm, setShowForm] = useState(false)
  
  // Ingredients từ kho
  const [availableIngredients, setAvailableIngredients] = useState([])
  const [selectedIngredients, setSelectedIngredients] = useState([])
  
  // Confirm Modal
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null
  })
  
  const [formData, setFormData] = useState({
    instructions: '',
    origin: '',
    story: '',
    history: '',
    prep_time: 0,
    cook_time: 0,
    servings: 1
  })

  const navigate = useNavigate()
  const toast = useToast()
  const token = localStorage.getItem('token')
  const userRole = localStorage.getItem('userRole')

  useEffect(() => {
    if (!token || userRole !== 'admin') {
      toast.error('Chỉ admin mới có quyền truy cập trang này')
      navigate('/home')
      return
    }
    fetchData()
    fetchIngredients()
  }, [token, userRole, navigate])
  
  // Fetch danh sách nguyên liệu từ kho
  const fetchIngredients = async () => {
    try {
      const data = await api.getIngredients()
      setAvailableIngredients(data)
    } catch (err) {
      console.error('Error fetching ingredients:', err)
    }
  }

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const productsData = await api.getProducts({ limit: 100 })
      setProducts(productsData)
      
      // Fetch recipes cho từng product
      const recipePromises = productsData.map(async (product) => {
        try {
          const recipe = await api.getRecipeByProduct(product.id)
          return { productId: product.id, recipe }
        } catch {
          return { productId: product.id, recipe: null }
        }
      })
      
      const recipeResults = await Promise.all(recipePromises)
      const recipesMap = {}
      recipeResults.forEach(({ productId, recipe }) => {
        recipesMap[productId] = recipe
      })
      
      setRecipes(recipesMap)
    } catch (err) {
      console.error('Error fetching data:', err)
      setError(err.message || 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  // Quản lý ingredients trong form
  const addIngredient = () => {
    setSelectedIngredients([...selectedIngredients, { ingredient_id: '', quantity: '', unit: '' }])
  }
  
  const removeIngredient = (index) => {
    setSelectedIngredients(selectedIngredients.filter((_, i) => i !== index))
  }
  
  const updateIngredient = (index, field, value) => {
    const updated = [...selectedIngredients]
    updated[index][field] = value
    
    // Tự động lấy unit khi chọn ingredient
    if (field === 'ingredient_id' && value) {
      const ing = availableIngredients.find(i => i.id === value)
      if (ing) {
        updated[index].unit = ing.unit
      }
    }
    
    setSelectedIngredients(updated)
  }

  const resetForm = () => {
    setFormData({
      instructions: '',
      origin: '',
      story: '',
      history: '',
      prep_time: 0,
      cook_time: 0,
      servings: 1
    })
    setSelectedIngredients([])
    setSelectedProduct(null)
    setShowForm(false)
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleCreateOrUpdate = (product) => {
    setSelectedProduct(product)
    const existingRecipe = recipes[product.id]
    
    if (existingRecipe) {
      setFormData({
        instructions: existingRecipe.instructions || '',
        origin: existingRecipe.origin || '',
        story: existingRecipe.story || '',
        history: existingRecipe.history || '',
        prep_time: existingRecipe.prep_time || 0,
        cook_time: existingRecipe.cook_time || 0,
        servings: existingRecipe.servings || 1
      })
      
      // Load ingredients từ recipe
      setSelectedIngredients(
        existingRecipe.ingredients?.map(ing => ({
          ingredient_id: ing.ingredient_id,
          quantity: String(ing.quantity),
          unit: ing.unit || ''
        })) || []
      )
    } else {
      // Load từ product nếu có
      setSelectedIngredients(
        product.ingredients?.map(ing => ({
          ingredient_id: ing.ingredient_id,
          quantity: String(ing.quantity_needed),
          unit: ing.unit || ''
        })) || []
      )
    }
    
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const payload = {
      product_id: selectedProduct.id,
      ingredients: selectedIngredients
        .filter(ing => ing.ingredient_id && ing.quantity)
        .map(ing => ({
          ingredient_id: ing.ingredient_id,
          quantity: parseFloat(ing.quantity),
          unit: ing.unit
        })),
      instructions: formData.instructions,
      origin: formData.origin,
      story: formData.story,
      history: formData.history,
      prep_time: parseInt(formData.prep_time),
      cook_time: parseInt(formData.cook_time),
      servings: parseInt(formData.servings)
    }

    try {
      const existingRecipe = recipes[selectedProduct.id]
      
      if (existingRecipe) {
        await api.updateRecipe(existingRecipe.id, payload)
        toast.success('Cập nhật công thức thành công!')
      } else {
        await api.createRecipe(payload)
        toast.success('Tạo công thức thành công!')
      }

      resetForm()
      fetchData()
    } catch (err) {
      console.error('Error saving recipe:', err)
      toast.error(err.message || 'Không thể lưu công thức')
    }
  }

  const handleDelete = (productId) => {
    const recipe = recipes[productId]
    if (!recipe) return
    
    setConfirmModal({
      isOpen: true,
      title: 'Xóa công thức',
      message: 'Bạn có chắc muốn xóa công thức này?',
      onConfirm: async () => {
        try {
          await api.deleteRecipe(recipe.id)
          toast.success('Xóa công thức thành công!')
          fetchData()
        } catch (err) {
          console.error('Error deleting recipe:', err)
          toast.error(err.message || 'Không thể xóa công thức')
        }
        setConfirmModal({ ...confirmModal, isOpen: false })
      }
    })
  }
  
  const closeConfirmModal = () => {
    setConfirmModal({ ...confirmModal, isOpen: false })
  }

  if (loading) {
    return (
      <div className="recipes-page">
        <Header />
        <section className="page-banner">
          <div className="page-banner-container">
            <h1 className="page-title">Recipes Management</h1>
          </div>
        </section>
        <section className="recipes-section">
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading recipes...</p>
          </div>
        </section>
        <Footer />
      </div>
    )
  }

  if (error) {
    return (
      <div className="recipes-page">
        <Header />
        <section className="page-banner">
          <div className="page-banner-container">
            <h1 className="page-title">Recipes Management</h1>
          </div>
        </section>
        <section className="recipes-section">
          <div className="error-state">
            <h2>⚠️ Error Loading Recipes</h2>
            <p>{error}</p>
            <button onClick={fetchData} className="retry-btn">
              Try Again
            </button>
          </div>
        </section>
        <Footer />
      </div>
    )
  }

  return (
    <div className="recipes-page">
      <Header />

      <section className="page-banner">
        <div className="page-banner-container">
          <h1 className="page-title">Recipes</h1>
          <div className="breadcrumb">
            <a href="/">🏠</a>
            <span className="separator">»</span>
            <a href="/admin/questions">Admin</a>
            <span className="separator">»</span>
            <span>Recipes</span>
          </div>
        </div>
      </section>

      <section className="recipes-section">
        <div className="recipes-container">
          
          {/* Form Panel */}
          {showForm && selectedProduct && (
            <div className="recipe-form-panel">
              <h3>
                {recipes[selectedProduct.id] ? 'Edit Recipe' : 'Create Recipe'} for "{selectedProduct.name}"
              </h3>
              <form onSubmit={handleSubmit} className="recipe-form">
                <label className="form-full">
                  Instructions
                  <textarea
                    name="instructions"
                    rows="4"
                    value={formData.instructions}
                    onChange={handleInputChange}
                    placeholder="Step-by-step instructions..."
                  />
                </label>

                <label className="form-full">
                  Origin
                  <textarea
                    name="origin"
                    rows="3"
                    value={formData.origin}
                    onChange={handleInputChange}
                    placeholder="Where do the ingredients come from?"
                  />
                </label>

                <label className="form-full">
                  Story
                  <textarea
                    name="story"
                    rows="3"
                    value={formData.story}
                    onChange={handleInputChange}
                    placeholder="The story behind this product..."
                  />
                </label>

                <label className="form-full">
                  History
                  <textarea
                    name="history"
                    rows="3"
                    value={formData.history}
                    onChange={handleInputChange}
                    placeholder="Historical background..."
                  />
                </label>

                <div className="form-row">
                  <label>
                    Prep Time (mins)
                    <input
                      type="number"
                      name="prep_time"
                      min="0"
                      value={formData.prep_time}
                      onChange={handleInputChange}
                    />
                  </label>

                  <label>
                    Cook Time (mins)
                    <input
                      type="number"
                      name="cook_time"
                      min="0"
                      value={formData.cook_time}
                      onChange={handleInputChange}
                    />
                  </label>

                  <label>
                    Servings
                    <input
                      type="number"
                      name="servings"
                      min="1"
                      value={formData.servings}
                      onChange={handleInputChange}
                    />
                  </label>
                </div>

                {/* Ingredients Section */}
                <div className="form-full ingredients-section">
                  <div className="ingredients-header">
                    <label>Ingredients (từ kho)</label>
                    <button type="button" className="add-ingredient-btn" onClick={addIngredient}>
                      + Thêm nguyên liệu
                    </button>
                  </div>
                  
                  <div className="ingredients-list">
                    {selectedIngredients.map((ing, index) => (
                      <div key={index} className="ingredient-row">
                        <select
                          value={ing.ingredient_id}
                          onChange={(e) => updateIngredient(index, 'ingredient_id', e.target.value)}
                          className="ingredient-select"
                        >
                          <option value="">Chọn nguyên liệu...</option>
                          {availableIngredients.map(avail => (
                            <option key={avail.id} value={avail.id}>
                              {avail.name} ({avail.quantity} {avail.unit} trong kho)
                            </option>
                          ))}
                        </select>
                        
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="Số lượng"
                          value={ing.quantity}
                          onChange={(e) => updateIngredient(index, 'quantity', e.target.value)}
                          className="ingredient-quantity"
                        />
                        
                        <span className="ingredient-unit">{ing.unit}</span>
                        
                        <button
                          type="button"
                          className="remove-ingredient-btn"
                          onClick={() => removeIngredient(index)}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    
                    {selectedIngredients.length === 0 && (
                      <p className="no-ingredients-text">Chưa có nguyên liệu nào</p>
                    )}
                  </div>
                </div>

                <div className="form-actions">
                  <button type="submit" className="submit-btn">
                    {recipes[selectedProduct.id] ? 'Update' : 'Create'}
                  </button>
                  <button type="button" className="cancel-btn" onClick={resetForm}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Products Table */}
          <div className="recipes-table-wrapper">
            <h2>Products & Recipes</h2>
            <table className="recipes-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Has Recipe</th>
                  <th>Ingredients</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map(product => {
                  const hasRecipe = !!recipes[product.id]
                  const hasIngredients = product.ingredients && product.ingredients.length > 0
                  
                  return (
                    <tr key={product.id}>
                      <td className="product-name-cell">
                        <img src={product.image} alt={product.name} className="product-thumb" />
                        <span>{product.name}</span>
                      </td>
                      <td>{product.category}</td>
                      <td>
                        <span className={`status-badge ${hasRecipe ? 'has-recipe' : 'no-recipe'}`}>
                          {hasRecipe ? '✓ Yes' : '✗ No'}
                        </span>
                      </td>
                      <td>
                        {hasIngredients ? (
                          <span className="ingredients-count">
                            {product.ingredients.length} items
                          </span>
                        ) : (
                          <span className="no-ingredients">None</span>
                        )}
                      </td>
                      <td className="actions-cell">
                        <button
                          className="action-btn edit-btn"
                          onClick={() => handleCreateOrUpdate(product)}
                          title={hasRecipe ? 'Edit recipe' : 'Create recipe'}
                        >
                          {hasRecipe ? '✏️' : '➕'}
                        </button>
                        {hasRecipe && (
                          <button
                            className="action-btn delete-btn"
                            onClick={() => handleDelete(product.id)}
                            title="Delete recipe"
                          >
                            🗑️
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

        </div>
      </section>

      <Footer />
      
      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={closeConfirmModal}
      />
    </div>
  )
}