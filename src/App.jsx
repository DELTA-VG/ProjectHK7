import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import HomePage from './HomePage'
import AboutPage from './AboutPage'
import MenuPage from './MenuPage'
import FAQPage from './FAQPage'
import ContactPage from './ContactPage'
import ShopPage from './ShopPage'
import AuthPage from './AuthPage'
import RequireAuth from './RequireAuth'
import NotificationsPage from './NotificationsPage'
import AdminQuestionsPage from './AdminQuestionsPage'
import RequireAdmin from './RequireAdmin'
import CartPage from './CartPage'
import FavouritePage from './FavouritePage'
import Chatbot from './Chatbot'  // ← THÊM IMPORT
import AdminProductsPage from './AdminProductsPage'
import IngredientsPage from './IngredientsPage'
import RecipesPage from './RecipesPage'


import './App.css'

export default function App() {
  return (
    <>
      <Routes>
        <Route 
          path="/" 
          element={localStorage.getItem('token') ? <HomePage /> : <Navigate to="/auth" replace />} 
        />
        <Route path="/auth" element={<AuthPage />} />
        <Route element={<RequireAuth />}>
          <Route path="/home" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/menu" element={<MenuPage />} />
          <Route path="/faq" element={<FAQPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/favourites" element={<FavouritePage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/ingredients" element={<IngredientsPage />} />
          <Route path="/recipes" element={<RecipesPage />} />
          <Route element={<RequireAdmin />}>
            <Route path="/admin/questions" element={<AdminQuestionsPage />} />
            <Route path="/admin/products" element={<AdminProductsPage />} />
          </Route>
        </Route>
      </Routes>

      {/* Chatbot xuất hiện ở mọi trang trừ AuthPage */}
      {window.location.pathname !== '/auth' && <Chatbot />}
    </>
  )
}