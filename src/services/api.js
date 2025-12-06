const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

class ApiService {
  /**
   * Get products with pagination and filters
   * @param {Object} params - { skip, limit, category, search, page }
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

  // =======================
  //       ADMIN CRUD
  // =======================

  /**
   * Create new product (ADMIN)
   * @param {Object} productData
   * @param {string} token - JWT token của admin
   */
  async createProduct(productData, token) {
    try {
      const response = await fetch(`${API_URL}/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(productData),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Create product failed:', errorText)
        throw new Error(`Create product failed: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error creating product:', error)
      throw error
    }
  }

  /**
   * Update product (ADMIN)
   * @param {string} id - product.id
   * @param {Object} productData
   * @param {string} token - JWT token
   */
  async updateProduct(id, productData, token) {
    try {
      const response = await fetch(`${API_URL}/products/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(productData),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Update product failed:', errorText)
        throw new Error(`Update product failed: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error updating product:', error)
      throw error
    }
  }

  /**
   * Delete product (ADMIN) – backend sẽ set is_available = false
   * @param {string} id
   * @param {string} token
   */
  async deleteProduct(id, token) {
     try {
      const response = await fetch(`${API_URL}/products/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Delete product failed:', errorText)
        throw new Error(`Delete product failed: ${response.status}`)
      }

      // ❗ Backend trả 204 No Content hoặc body rỗng
      // => Không parse JSON nữa, chỉ trả true
      return true
    } catch (error) {
      console.error('Error deleting product:', error)
      throw error
    }
  }
}

export default new ApiService()
