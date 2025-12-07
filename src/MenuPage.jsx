import React from 'react'
import Header from './Header'
import SocialSidebar from './SocialSidebar'
import ChatButton from './ChatButton'
import Footer from './Footer'
import './MenuPage.css'

const rawProducts = [
  { name: 'Chocolate Chip Cookies', category: 'cookies-minicakes', price: 12, description: 'Classic cookies with chocolate chips (6 pcs)', badge: 'BESTSELLER' },
  { name: 'Oatmeal Raisin Cookies', category: 'cookies-minicakes', price: 11, description: 'Healthy oatmeal cookies with raisins (6 pcs)', badge: 'HEALTHY' },
  { name: 'Red Velvet Cupcake', category: 'cookies-minicakes', price: 8, description: 'Mini red velvet with cream cheese frosting', badge: 'NEW' },
  { name: 'Chocolate Brownie', category: 'cookies-minicakes', price: 9.5, description: 'Fudgy chocolate brownie square', badge: null },
  { name: 'Macarons Assorted', category: 'cookies-minicakes', price: 15, description: 'French macarons in various flavors (5 pcs)', badge: 'SPECIAL' },
  { name: 'Blueberry Muffin', category: 'cookies-minicakes', price: 6.5, description: 'Fresh blueberries baked into soft muffin', badge: null },

  { name: 'Chocolate Birthday Cake', category: 'birthday-cakes', price: 45, description: 'Rich chocolate layers with vanilla cream filling', badge: 'SPECIAL' },
  { name: 'Strawberry Delight Cake', category: 'birthday-cakes', price: 42, description: 'Fresh strawberries with whipped cream frosting', badge: null },
  { name: 'Red Velvet Cake', category: 'birthday-cakes', price: 48, description: 'Classic red velvet with cream cheese frosting', badge: 'POPULAR' },
  { name: 'Rainbow Birthday Cake', category: 'birthday-cakes', price: 50, description: 'Colorful layers perfect for kids parties', badge: 'NEW' },
  { name: 'Vanilla Dream Cake', category: 'birthday-cakes', price: 40, description: 'Light vanilla sponge with buttercream', badge: null },
  { name: 'Tiramisu Cake', category: 'birthday-cakes', price: 52, description: 'Italian coffee-flavored dessert cake', badge: 'BESTSELLER' },

  { name: 'Croissant', category: 'bread-savory', price: 4.5, description: 'Buttery French pastry, perfectly flaky', badge: null },
  { name: 'Sourdough Bread', category: 'bread-savory', price: 8, description: 'Artisan sourdough with crispy crust', badge: 'HEALTHY' },
  { name: 'Cheese Danish', category: 'bread-savory', price: 5.5, description: 'Sweet pastry filled with cream cheese', badge: null },
  { name: 'Baguette', category: 'bread-savory', price: 6, description: 'Traditional French bread loaf', badge: null }
]

const categoryConfig = {
  'cookies-minicakes': { title: 'Cookies & Minicakes', icon: '🍪', theme: 'dark' },
  'birthday-cakes': { title: 'Signature Cakes', icon: '🎂', theme: 'light' },
  'bread-savory': { title: 'Savory Breads & Pastries', icon: '🥐', theme: 'dark' }
}

const groupedProducts = Object.values(
  rawProducts.reduce((acc, product) => {
    if (!acc[product.category]) {
      acc[product.category] = {
        ...categoryConfig[product.category],
        items: []
      }
    }
    acc[product.category].items.push(product)
    return acc
  }, {})
)

export default function MenuPage() {
  const renderCategory = (category) => (
    <div className="menu-category" key={category.title}>
      <div className="category-header">
        <span className="category-icon">{category.icon}</span>
        <h2 className="category-title">
          {category.title.split(' ').slice(0, -1).join(' ')}{' '}
          <span className="highlight">{category.title.split(' ').slice(-1)}</span>
        </h2>
      </div>
      <div className="menu-items">
        {category.items.map((item, idx) => (
          <div key={`${category.title}-${idx}`} className="menu-item">
            <div className="item-header">
              <div className="item-name-wrapper">
                <span className="item-name">{item.name}</span>
                {item.badge && (
                  <span className={`item-badge badge-${item.badge.toLowerCase()}`}>
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="item-dots"></span>
              <span className="item-price">${item.price.toFixed(2)}</span>
            </div>
            <p className="item-description">{item.description}</p>
          </div>
        ))}
      </div>
    </div>
  )

  const darkCategories = groupedProducts.filter(cat => cat.theme === 'dark')
  const lightCategories = groupedProducts.filter(cat => cat.theme === 'light')

  return (
    <div className="menu-page">
      <Header />
      
      <section className="page-banner">
        <div className="page-banner-container">
          <h1 className="page-title">Đức An Việt Menu</h1>
          <div className="breadcrumb">
            <a href="/">🏠</a>
            <span className="separator">»</span>
            <span>Menu</span>
          </div>
        </div>
      </section>

      {darkCategories.length > 0 && (
        <section className="menu-section menu-section-dark">
          <div className="menu-container">
            {darkCategories.map(renderCategory)}
          </div>
        </section>
      )}

      {lightCategories.length > 0 && (
        <section className="menu-section menu-section-light">
          <div className="menu-container">
            {lightCategories.map(renderCategory)}
          </div>
        </section>
      )}

      <SocialSidebar />
      <ChatButton />
      <Footer />
    </div>
  )
}