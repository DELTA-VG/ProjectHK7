import React from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import HomePage from './HomePage'
import AboutPage from './AboutPage'
import MenuPage from './MenuPage'
import FAQPage from './FAQPage'
import ContactPage from './ContactPage'
import ShopPage from './ShopPage'
import AuthPage from './AuthPage'
import './App.css'

export default function App() {
  const location = useLocation()
  const isAuth = Boolean(localStorage.getItem('token'))

  return (
    <Routes location={location}>
      <Route
        path="/"
        element={isAuth ? <HomePage /> : <Navigate to="/auth" replace />}
      />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/menu" element={<MenuPage />} />
      <Route path="/faq" element={<FAQPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/shop" element={<ShopPage />} />
    </Routes>
  )
}