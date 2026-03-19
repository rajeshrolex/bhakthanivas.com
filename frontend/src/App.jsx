import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/common/Navbar'
import Footer from './components/common/Footer'
import WhatsAppButton from './components/common/WhatsAppButton'
import ScrollToTop from './components/common/ScrollToTop'
import Home from './pages/Home'
import LodgeList from './pages/LodgeList'
import LodgeDetail from './pages/LodgeDetail'
import Booking from './pages/Booking'
import BookingConfirmation from './pages/BookingConfirmation'
import TempleDetails from './pages/TempleDetails'

import AdminLayout from './components/admin/AdminLayout'
import Login from './pages/admin/Login'
import Dashboard from './pages/admin/Dashboard'
import ManageLodges from './pages/admin/ManageLodges'
import BookingsList from './pages/admin/BookingsList'
import MyLodge from './pages/admin/MyLodge'
import UserManagement from './pages/admin/UserManagement'
import ManageTemples from './pages/admin/ManageTemples'
import PriceCalendar from './pages/admin/PriceCalendar'
import ProtectedRoute from './components/auth/ProtectedRoute'

function App() {
  return (
    <div className="App min-h-screen flex flex-col">
      <ScrollToTop />
      {/* Conditionally render Navbar/Footer based on path could be better, but for now we keep them for public pages */}
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<><Navbar /><main className="flex-1"><Home /></main><Footer /><WhatsAppButton /></>} />
        <Route path="/lodges" element={<><Navbar /><main className="flex-1"><LodgeList /></main><Footer /><WhatsAppButton /></>} />
        <Route path="/lodge/:slug" element={<><Navbar /><main className="flex-1"><LodgeDetail /></main><Footer /><WhatsAppButton /></>} />
        <Route path="/booking" element={<><Navbar /><main className="flex-1"><Booking /></main><Footer /><WhatsAppButton /></>} />
        <Route path="/booking/confirmation/:bookingId?" element={<><Navbar /><main className="flex-1"><BookingConfirmation /></main><Footer /><WhatsAppButton /></>} />
        <Route path="/temple-details" element={<><Navbar /><main className="flex-1"><TempleDetails /></main><Footer /><WhatsAppButton /></>} />

        {/* Admin Routes */}
        <Route path="/admin/login" element={<Login />} />

        <Route path="/admin" element={<ProtectedRoute />}>
          <Route element={<AdminLayout />}>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="bookings" element={<BookingsList />} />
            <Route path="lodges" element={<ManageLodges />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="my-lodge" element={<MyLodge />} />
            <Route path="temples" element={<ManageTemples />} />
            <Route path="price-calendar" element={<PriceCalendar />} />
            {/* Redirect root /admin to dashboard */}
            <Route index element={<Navigate to="dashboard" replace />} />
          </Route>
        </Route>
      </Routes>
    </div>
  )
}

export default App
