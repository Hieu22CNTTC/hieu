import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import api from '../utils/api'
import toast from 'react-hot-toast'
import { History, Plane, Armchair, CheckCircle, Clock, XCircle } from 'lucide-react'

export default function MyBookings() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user) {
      fetchBookings()
    }
  }, [user])

  // Refetch bookings when component receives focus
  useEffect(() => {
    const handleFocus = () => {
      if (user) {
        fetchBookings()
      }
    }
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [user])

  const fetchBookings = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/users/bookings')
      setBookings(data.data || [])
    } catch (error) {
      console.error('Error fetching bookings:', error)
      toast.error('Không thể tải thông tin đặt vé')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('vi-VN', { 
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'CONFIRMED': return 'badge-success'
      case 'PENDING': return 'badge-warning'
      case 'CANCELLED': return 'badge-error'
      case 'COMPLETED': return 'badge-info'
      default: return 'badge-ghost'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'CONFIRMED': return 'Đã xác nhận'
      case 'PENDING': return 'Chờ xử lý'
      case 'CANCELLED': return 'Đã hủy'
      case 'COMPLETED': return 'Hoàn thành'
      default: return status
    }
  }

  if (!user) {
    navigate('/login')
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-base-200 to-base-300 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="card bg-gradient-to-r from-primary to-secondary text-primary-content shadow-2xl mb-6">
          <div className="card-body">
            <h1 className="text-4xl font-bold flex items-center gap-3">
              <History size={40} />
              Lịch sử đặt vé
            </h1>
            <p className="text-lg opacity-90">Quản lý tất cả các chuyến bay của bạn</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="card bg-base-100 shadow-lg">
            <div className="card-body">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-base-content/60">Tổng đặt vé</p>
                  <p className="text-2xl font-bold">{bookings.length}</p>
                </div>
                <Plane size={32} className="text-primary opacity-50" />
              </div>
            </div>
          </div>
          
          <div className="card bg-base-100 shadow-lg">
            <div className="card-body">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-base-content/60">Tổng chi tiêu</p>
                  <p className="text-2xl font-bold text-primary">
                    {bookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0).toLocaleString('vi-VN')} ₫
                  </p>
                </div>
                <div className="text-3xl">💰</div>
              </div>
            </div>
          </div>
          
          <div className="card bg-base-100 shadow-lg">
            <div className="card-body">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-base-content/60">Đã xác nhận</p>
                  <p className="text-2xl font-bold text-success">
                    {bookings.filter(b => b.status === 'CONFIRMED').length}
                  </p>
                </div>
                <CheckCircle size={32} className="text-success opacity-50" />
              </div>
            </div>
          </div>
          
          <div className="card bg-base-100 shadow-lg">
            <div className="card-body">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-base-content/60">Chờ xử lý</p>
                  <p className="text-2xl font-bold text-warning">
                    {bookings.filter(b => b.status === 'PENDING').length}
                  </p>
                </div>
                <Clock size={32} className="text-warning opacity-50" />
              </div>
            </div>
          </div>
        </div>

        {/* Bookings Table */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <div className="flex items-center justify-between mb-4 border-b pb-3">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <History size={24} className="text-accent" />
                Danh sách đặt vé
              </h2>
              <button 
                onClick={() => navigate('/search')} 
                className="btn btn-primary gap-2"
              >
                <Plane size={18} />
                Đặt vé mới
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <span className="loading loading-spinner loading-lg text-primary"></span>
              </div>
            ) : bookings.length === 0 ? (
              <div className="text-center py-12">
                <Plane size={64} className="mx-auto mb-4 opacity-30" />
                <p className="text-xl font-semibold mb-2">Chưa có chuyến bay nào</p>
                <p className="text-base-content/60 mb-6">Bắt đầu hành trình của bạn ngay hôm nay</p>
                <button onClick={() => navigate('/search')} className="btn btn-primary gap-2">
                  <Plane size={18} />
                  Tìm chuyến bay
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="table table-zebra">
                  <thead>
                    <tr className="bg-base-200">
                      <th className="font-bold">Mã đặt vé</th>
                      <th className="font-bold">Chuyến bay</th>
                      <th className="font-bold">Hành trình</th>
                      <th className="font-bold">Thời gian</th>
                      <th className="font-bold">Trạng thái</th>
                      <th className="font-bold">Số tiền</th>
                      <th className="font-bold">Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map((booking) => (
                      <tr key={booking.id} className="hover:bg-base-200/50">
                        <td className="font-mono font-bold">{booking.bookingCode}</td>
                        <td className="font-semibold">{booking.flight?.flightNumber || 'N/A'}</td>
                        <td>
                          <div className="flex items-center gap-2">
                            <span>{booking.flight?.route?.departure?.city}</span>
                            <span className="text-primary">→</span>
                            <span>{booking.flight?.route?.arrival?.city}</span>
                          </div>
                        </td>
                        <td className="text-sm">
                          {formatDate(booking.flight?.departureTime)}
                        </td>
                        <td>
                          <span className={`badge ${getStatusBadge(booking.status)} gap-2`}>
                            {booking.status === 'CONFIRMED' && <CheckCircle size={14} />}
                            {booking.status === 'PENDING' && <Clock size={14} />}
                            {booking.status === 'CANCELLED' && <XCircle size={14} />}
                            {getStatusText(booking.status)}
                          </span>
                        </td>
                        <td className="font-bold text-primary">
                          {booking.totalAmount?.toLocaleString('vi-VN')} ₫
                        </td>
                        <td>
                          <div className="flex gap-1">
                            <button 
                              onClick={() => navigate(`/track?code=${booking.bookingCode}`)}
                              className="btn btn-xs btn-primary gap-1"
                            >
                              <History size={12} />
                              Chi tiết
                            </button>
                            {(booking.status === 'PENDING' || booking.status === 'CONFIRMED') && (
                              <button 
                                onClick={() => navigate(`/seat-selection?booking=${booking.bookingCode}`)}
                                className="btn btn-xs btn-secondary gap-1"
                                title={booking.passengers?.some(p => p.seatNumber) ? 'Xem và thay đổi ghế đã chọn' : 'Chọn ghế ngồi'}
                              >
                                <Armchair size={12} />
                                {booking.passengers?.some(p => p.seatNumber) ? 'Xem lại ghế đã chọn' : 'Chọn ghế'}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
