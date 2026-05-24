# 🍔 FoodHub - Production Ready Food Delivery Platform

FoodHub is a modern, high-performance food ordering and management system. It features a stunning customer-facing menu and a robust admin dashboard for order and menu management.

---

## ⚡ Key Highlights
- **Instant Admin Navigation**: Custom SPA router for lightning-fast switching between dashboard, orders, and menu.
- **Real-time Analytics**: Dashboard with date-based filtering and automatic revenue tracking.
- **Dynamic Menu**: Full CRUD (Create, Read, Update, Delete) with instant public synchronization.
- **Premium UI**: Modern, mobile-first design with glassmorphism, smooth animations, and zero technical debt.
- **Lightweight & Fast**: No heavy frameworks—built with Vanilla JS and Supabase for maximum speed.

---

## 🛠️ Feature Overview

### **Customer App**
- ✅ **Dynamic Menu**: Fetches real-time data from Supabase.
- ✅ **Smart Cart**: Real-time total calculation and item management.
- ✅ **Zone-based Delivery**: Automated delivery fee calculation based on admin-defined zones.
- ✅ **Checkout Flow**: Streamlined, 1-minute order process.

### **Admin Dashboard**
- ✅ **Instant Stats**: Monitor Orders, Revenue, and Status counts with daily filtering.
- ✅ **Order Manager**: Real-time status updates (Pending → Preparing → Ready → Completed).
- ✅ **Menu Management**: Full control over items, categories, pricing, and availability.
- ✅ **Category Control**: Organize your menu with custom sort orders.
- ✅ **Settings**: Manage delivery zones and custom service fees.

---

## 🚀 Getting Started

### **Admin Credentials**
- **URL**: `/ADMIN/index.html`
- **Username**: `admin`
- **Password**: `password129`

### **Payment Integration**
- 🕒 **STATUS: PENDING**
- All ordering logic, delivery calculations, and database structures are complete. The project is currently configured for COD (Cash on Delivery) or manual verification. Stripe/Paystack integration is the final step for automated payments.

---

## 📂 Project Structure

- `/PUBLIC` - Everything customers see (Menu, Checkout, Confirmation).
- `/ADMIN` - The restaurant management system.
- `/ADMIN/js/spa-router.js` - The engine behind the instant admin experience.
- `supabase_schema.sql` - The complete database structure ready for production.

---

## 💻 Tech Stack
- **Frontend**: Vanilla HTML5, CSS3 (Modern Flex/Grid), JavaScript (ES6+).
- **Backend**: Supabase (PostgreSQL with Real-time & RLS).
- **Icons**: Lucide for crisp, modern iconography.
- **Architecture**: Single Page Application (SPA) Router for Admin.

---

*Last Refined: February 4, 2026*  
**Status: 95% Complete (Only Payments Remaining)** ✅
