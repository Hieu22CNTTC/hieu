import { Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import SearchFlights from './pages/SearchFlights'
import FlightDetails from './pages/FlightDetails'
import BookingPage from './pages/BookingPage'
import BookingConfirmation from './pages/BookingConfirmation'
import TrackBooking from './pages/TrackBooking'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import DashboardPage from './pages/DashboardPage'
import MyBookings from './pages/MyBookings'
import AdminDashboard from './pages/AdminDashboard'
import BookingManagement from './pages/BookingManagement'
import SeatSelection from './pages/SeatSelection'
import PaymentResult from './pages/PaymentResult'
import NotFoundPage from './pages/NotFoundPage'

function App() {
  return (
    <>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="search" element={<SearchFlights />} />
          <Route path="flights/:id" element={<FlightDetails />} />
          <Route path="booking/:flightId" element={<BookingPage />} />
          <Route path="confirmation/:bookingCode" element={<BookingConfirmation />} />
          <Route path="payment-result" element={<PaymentResult />} />
          <Route path="payment/return" element={<PaymentResult />} />
          <Route path="payment/callback" element={<PaymentResult />} />
          <Route path="track" element={<TrackBooking />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="forgot-password" element={<ForgotPasswordPage />} />
          <Route path="reset-password" element={<ResetPasswordPage />} />
          <Route path="dashboard/*" element={<DashboardPage />} />          <Route path="my-bookings" element={<MyBookings />} />          <Route path="bookings" element={<BookingManagement />} />
          <Route path="seat-selection" element={<SeatSelection />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </>
  )
}

export default App
