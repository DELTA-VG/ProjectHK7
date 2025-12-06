const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

class ApiService {
  /**
   * Get products with pagination and filters
   * @param {Object} params - { skip, limit, category, search }
   */
  async getProducts(params = {}) {
    const queryParams = new URLSearchParams()
    
    // Backend dùng skip/limit thay vì page
    if (params.page && params.limit) {
      const skip = (params.page - 1) * params.limit
      queryParams.append('skip', skip)
      queryParams.append('limit', params.limit)
    } else {
      if (params.skip !== undefined) queryParams.append('skip', params.skip)
      if (params.limit) queryParams.append('limit', params.limit)
    }
    
    // Category filter (không gửi 'all')
    if (params.category && params.category !== 'all') {
      queryParams.append('category', params.category)
    }
    
    // Search
    if (params.search) {
      queryParams.append('search', params.search)
    }
    
    const url = `${API_URL}/products?${queryParams.toString()}`
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const products = await response.json()
      
      // Backend trả về array, phải tự tính pagination
      return products
      
    } catch (error) {
      console.error('Error fetching products:', error)
      throw error
    }
  }

  /**
   * Get product count
   * @param {string} category - Category ID or null for all
   */
  async getProductCount(category = null) {
    const url = category && category !== 'all'
      ? `${API_URL}/products/count?category=${category}`
      : `${API_URL}/products/count`
    
    try {
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      return data.count
      
    } catch (error) {
      console.error('Error fetching product count:', error)
      throw error
    }
  }

  /**
   * Get categories with product count
   */
  async getCategories() {
    try {
      const response = await fetch(`${API_URL}/products/categories`, {
        headers: {
          'Content-Type': 'application/json',
        }
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      return await response.json()
      
    } catch (error) {
      console.error('Error fetching categories:', error)
      throw error
    }
  }

  /**
   * Get single product by ID
   * @param {string} id - Product ID
   */
  async getProduct(id) {
    try {
      const response = await fetch(`${API_URL}/products/${id}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      return await response.json()
      
    } catch (error) {
      console.error('Error fetching product:', error)
      throw error
    }
  }

  // ============ FAVOURITES API ============

  /**
   * Get user's favourites with pagination
   * @param {Object} params - { skip, limit }
   */
  async getFavourites(params = {}) {
    const queryParams = new URLSearchParams()
    
    if (params.skip !== undefined) queryParams.append('skip', params.skip)
    if (params.limit) queryParams.append('limit', params.limit)
    
    const url = `${API_URL}/favourites?${queryParams.toString()}`
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      return await response.json()
      
    } catch (error) {
      console.error('Error fetching favourites:', error)
      throw error
    }
  }

  /**
   * Get count of user's favourites
   */
  async getFavouritesCount() {
    try {
      const response = await fetch(`${API_URL}/favourites/count`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      return data.count
      
    } catch (error) {
      console.error('Error fetching favourites count:', error)
      throw error
    }
  }

  /**
   * Check if product is in favourites
   * @param {string} productId - Product ID
   */
  async checkIsFavourite(productId) {
    try {
      const response = await fetch(`${API_URL}/favourites/check/${productId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      return data.is_favourite
      
    } catch (error) {
      console.error('Error checking favourite status:', error)
      throw error
    }
  }

  /**
   * Add product to favourites
   * @param {string} productId - Product ID
   */
  async addToFavourites(productId) {
    try {
      const response = await fetch(`${API_URL}/favourites/${productId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || 'Failed to add to favourites')
      }
      
      return await response.json()
      
    } catch (error) {
      console.error('Error adding to favourites:', error)
      throw error
    }
  }

  /**
   * Remove product from favourites
   * @param {string} productId - Product ID
   */
  async removeFromFavourites(productId) {
    try {
      const response = await fetch(`${API_URL}/favourites/${productId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || 'Failed to remove from favourites')
      }
      
      return await response.json()
      
    } catch (error) {
      console.error('Error removing from favourites:', error)
      throw error
    }
  }

  /**
   * Clear all favourites
   */
  async clearFavourites() {
    try {
      const response = await fetch(`${API_URL}/favourites`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      return await response.json()
      
    } catch (error) {
      console.error('Error clearing favourites:', error)
      throw error
    }
  }

  // ============ CART API ============

  /**
   * Get user's cart
   */
  async getCart() {
    try {
      const response = await fetch(`${API_URL}/cart`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      return await response.json()
      
    } catch (error) {
      console.error('Error fetching cart:', error)
      throw error
    }
  }

  /**
   * Get cart total (subtotal, shipping, total)
   */
  async getCartTotal() {
    try {
      const response = await fetch(`${API_URL}/cart/total`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      return await response.json()
      
    } catch (error) {
      console.error('Error fetching cart total:', error)
      throw error
    }
  }

  /**
   * Add product to cart
   * @param {string} productId - Product ID
   * @param {number} quantity - Quantity to add (default: 1)
   */
  async addToCart(productId, quantity = 1) {
    try {
      const response = await fetch(`${API_URL}/cart/${productId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ quantity })
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || 'Failed to add to cart')
      }
      
      return await response.json()
      
    } catch (error) {
      console.error('Error adding to cart:', error)
      throw error
    }
  }

  /**
   * Update cart item quantity
   * @param {string} productId - Product ID
   * @param {number} quantity - New quantity (0 to remove)
   */
  async updateCartQuantity(productId, quantity) {
    try {
      const response = await fetch(`${API_URL}/cart/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ quantity })
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || 'Failed to update cart')
      }
      
      return await response.json()
      
    } catch (error) {
      console.error('Error updating cart:', error)
      throw error
    }
  }

  /**
   * Remove item from cart
   * @param {string} productId - Product ID
   */
  async removeFromCart(productId) {
    try {
      const response = await fetch(`${API_URL}/cart/${productId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || 'Failed to remove from cart')
      }
      
      return await response.json()
      
    } catch (error) {
      console.error('Error removing from cart:', error)
      throw error
    }
  }

  /**
   * Clear all items from cart
   */
  async clearCart() {
    try {
      const response = await fetch(`${API_URL}/cart`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      return await response.json()
      
    } catch (error) {
      console.error('Error clearing cart:', error)
      throw error
    }
  }
}

export default new ApiService()