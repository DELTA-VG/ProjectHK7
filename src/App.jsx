import { Routes, Route } from 'react-router-dom'
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
import Chatbot from './Chatbot'
import AdminProductsPage from './AdminProductsPage'
import IngredientsPage from './IngredientsPage'
import RecipesPage from './RecipesPage'
import AdminReviewsPage from './AdminReviewsPage'
import ReportsPage from './ReportsPage'
import CheckoutPage from './CheckoutPage'
import OrderSuccessPage from './OrderSuccessPage'
import MyOrdersPage from './MyOrdersPage'
import './App.css'

export default function App() {
  return (
    <>
      <Routes>
        {/* Public routes - ai cũng xem được */}
        <Route path="/" element={<HomePage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/menu" element={<MenuPage />} />
        <Route path="/faq" element={<FAQPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/shop" element={<ShopPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/ingredients" element={<IngredientsPage />} />
        <Route path="/recipes" element={<RecipesPage />} />
        <Route path="/auth" element={<AuthPage />} />

        {/* Protected routes - cần đăng nhập */}
        <Route element={<RequireAuth />}>
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/order-success/:orderId" element={<OrderSuccessPage />} />
          <Route path="/my-orders" element={<MyOrdersPage />} />
          <Route path="/favourites" element={<FavouritePage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          
          {/* Admin routes */}
          <Route element={<RequireAdmin />}>
            <Route path="/admin/reviews" element={<AdminReviewsPage />} />
            <Route path="/admin/questions" element={<AdminQuestionsPage />} />
            <Route path="/admin/products" element={<AdminProductsPage />} />
            <Route path="/admin/reports" element={<ReportsPage />} />
          </Route>
        </Route>
      </Routes>

      {/* Chatbot xuất hiện ở mọi trang trừ AuthPage */}
      {window.location.pathname !== '/auth' && <Chatbot />}
    </>
  )
}
