import { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './AuthContext'

const CartContext = createContext(null)

const API_URL = '/api'

// Load cached cart from sessionStorage
const getCachedCart = () => {
  try {
    const cached = sessionStorage.getItem('cart')
    return cached ? JSON.parse(cached) : []
  } catch {
    return []
  }
}

const getCachedTotal = () => {
  try {
    const cached = sessionStorage.getItem('cartTotal')
    return cached ? JSON.parse(cached) : { subtotal: 0, shipping: 0, total: 0, total_items: 0 }
  } catch {
    return { subtotal: 0, shipping: 0, total: 0, total_items: 0 }
  }
}

export function CartProvider({ children }) {
  const { token, user, loading: authLoading } = useAuth()
  // Initialize with cached data for instant display
  const [cart, setCart] = useState(token ? getCachedCart() : [])
  const [cartTotal, setCartTotal] = useState(token ? getCachedTotal() : { subtotal: 0, shipping: 0, total: 0, total_items: 0 })
  // If we have cached cart, don't show loading
  const [loading, setLoading] = useState(token && getCachedCart().length === 0)

  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) return
    
    if (token && user) {
      fetchCart()
    } else {
      setCart([])
      setCartTotal({ subtotal: 0, shipping: 0, total: 0, total_items: 0 })
      sessionStorage.removeItem('cart')
      sessionStorage.removeItem('cartTotal')
      setLoading(false)
    }
  }, [token, user, authLoading])

  // Fetch cart with loading state (initial load)
  const fetchCart = async () => {
    if (!token) return
    // Only show loading if no cached data
    if (getCachedCart().length === 0) {
      setLoading(true)
    }
    try {
      const [cartRes, totalRes] = await Promise.all([
        fetch(`${API_URL}/cart`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_URL}/cart/total`, { headers: { 'Authorization': `Bearer ${token}` } })
      ])
      if (cartRes.ok) {
        const cartData = await cartRes.json()
        setCart(cartData)
        sessionStorage.setItem('cart', JSON.stringify(cartData))
      }
      if (totalRes.ok) {
        const totalData = await totalRes.json()
        setCartTotal(totalData)
        sessionStorage.setItem('cartTotal', JSON.stringify(totalData))
      }
    } catch (err) {
      console.error('Cart error:', err)
    } finally {
      setLoading(false)
    }
  }

  // Refresh cart silently (no loading state - for updates)
  const refreshCart = async () => {
    if (!token) return
    try {
      const [cartRes, totalRes] = await Promise.all([
        fetch(`${API_URL}/cart`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_URL}/cart/total`, { headers: { 'Authorization': `Bearer ${token}` } })
      ])
      if (cartRes.ok) {
        const cartData = await cartRes.json()
        setCart(cartData)
        sessionStorage.setItem('cart', JSON.stringify(cartData))
      }
      if (totalRes.ok) {
        const totalData = await totalRes.json()
        setCartTotal(totalData)
        sessionStorage.setItem('cartTotal', JSON.stringify(totalData))
      }
    } catch (err) {
      console.error('Cart refresh error:', err)
    }
  }

  const addToCart = async (productId, quantity = 1) => {
    if (!token) throw new Error('Please login first')
    const res = await fetch(`${API_URL}/cart/${productId}`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ quantity })
    })
    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.detail || 'Failed to add to cart')
    }
    await refreshCart()
    return await res.json()
  }

  const updateQuantity = async (productId, quantity) => {
    if (!token) return
    // Optimistic update - update UI immediately
    setCart(prev => prev.map(item => 
      item.product.id === productId 
        ? { ...item, quantity: Math.max(0, quantity) }
        : item
    ))
    
    const res = await fetch(`${API_URL}/cart/${productId}`, {
      method: 'PUT',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ quantity })
    })
    // Refresh to get accurate data from server
    await refreshCart()
  }

  const removeFromCart = async (productId) => {
    if (!token) return
    // Optimistic update
    setCart(prev => prev.filter(item => item.product.id !== productId))
    
    const res = await fetch(`${API_URL}/cart/${productId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    })
    await refreshCart()
  }

  const clearCart = async () => {
    if (!token) return
    const res = await fetch(`${API_URL}/cart`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    })
    if (res.ok) {
      setCart([])
      setCartTotal({ subtotal: 0, shipping: 0, total: 0, total_items: 0 })
      sessionStorage.removeItem('cart')
      sessionStorage.removeItem('cartTotal')
    }
  }

  return (
    <CartContext.Provider value={{ 
      cart, cartTotal, loading, 
      fetchCart, addToCart, updateQuantity, removeFromCart, clearCart 
    }}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => useContext(CartContext)
