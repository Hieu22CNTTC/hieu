import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../utils/api'
import toast from 'react-hot-toast'
import { useAuthStore } from '../stores/authStore'

export default function BookingManagement() {
  const user = useAuthStore((state) => state.user)
  const navigate = useNavigate()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  
  // Filters
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    page: 1,
    limit: 10
  })
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 0,
    page: 1,
    limit: 10
  })

  useEffect(() => {
    // Check if user has permission
    if (!user || (user.role !== 'SALES' && user.role !== 'MANAGER')) {
      toast.error('Bạn không có quyền truy cập trang này')
      navigate('/dashboard')
      return
    }
    fetchBookings()
  }, [filters.page, filters.status])

  const fetchBookings = async () => {
    try {
      setLoading(true)
      const params = {
        page: filters.page,
        limit: filters.limit,
        ...(filters.status && { status: filters.status }),
        ...(filters.search && { search: filters.search })
      }
      const { data } = await api.get('/sales/bookings', { params })
      setBookings(data.data.bookings || [])
      setPagination(data.data.pagination || {})
    } catch (error) {
      console.error('Error fetching bookings:', error)
      toast.error('Không thể tải danh sách đặt vé')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    setFilters({ ...filters, page: 1 })
    fetchBookings()
  }

  const handleStatusChange = async (bookingId, newStatus) => {
    try {
      await api.patch(`/sales/bookings/${bookingId}/status`, { status: newStatus })
      toast.success('Cập nhật trạng thái thành công')
      fetchBookings()
      setShowDetailModal(false)
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error(error.response?.data?.message || 'Không thể cập nhật trạng thái')
    }
  }

  const viewBookingDetail = async (bookingId) => {
    try {
      const { data } = await api.get(`/sales/bookings/${bookingId}`)
      setSelectedBooking(data.data)
      setShowDetailModal(true)
    } catch (error) {
      console.error('Error fetching booking detail:', error)
      toast.error('Không thể tải chi tiết đặt vé')
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
  }

  const getStatusBadge = (status) => {
    const badges = {
      PENDING: 'badge-warning',
      CONFIRMED: 'badge-success',
      CANCELLED: 'badge-error',
      REJECTED: 'badge-error',
      COMPLETED: 'badge-info'
    }
    return badges[status] || 'badge-ghost'
  }

  const getStatusText = (status) => {
    const texts = {
      PENDING: 'Chờ xử lý',
      CONFIRMED: 'Đã xác nhận',
      CANCELLED: 'Đã hủy',
      REJECTED: 'Bị từ chối',
      COMPLETED: 'Hoàn thành'
    }
    return texts[status] || status
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Quản lý đặt vé</h1>

      {/* Filter Section */}
      <div className="card bg-base-100 shadow-xl mb-6">
        <div className="card-body">
          <form onSubmit={handleSearch} className="flex flex-wrap gap-4">
            <div className="form-control flex-1 min-w-[200px]">
              <input
                type="text"
                placeholder="Tìm theo mã booking, email, tên khách..."
                className="input input-bordered w-full"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
            </div>
            <div className="form-control min-w-[150px]">
              <select
                className="select select-bordered"
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
              >
                <option value="">Tất cả trạng thái</option>
                <option value="PENDING">Chờ xử lý</option>
                <option value="CONFIRMED">Đã xác nhận</option>
                <option value="COMPLETED">Hoàn thành</option>
                <option value="CANCELLED">Đã hủy</option>
                <option value="REJECTED">Bị từ chối</option>
              </select>
            </div>
            <button type="submit" className="btn btn-primary">
              Tìm kiếm
            </button>
          </form>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          {loading ? (
            <div className="flex justify-center py-12">
              <span className="loading loading-spinner loading-lg"></span>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="table table-zebra">
                  <thead>
                    <tr>
                      <th>Mã booking</th>
                      <th>Khách hàng</th>
                      <th>Chuyến bay</th>
                      <th>Ngày bay</th>
                      <th>Tổng tiền</th>
                      <th>Trạng thái</th>
                      <th>Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="text-center py-8 text-gray-500">
                          Không tìm thấy đặt vé nào
                        </td>
                      </tr>
                    ) : (
                      bookings.map((booking) => (
                        <tr key={booking.id}>
                          <td className="font-mono text-sm">{booking.bookingCode}</td>
                          <td>
                            <div>
                              <div className="font-semibold">{booking.user?.fullName}</div>
                              <div className="text-sm text-gray-500">{booking.user?.email}</div>
                            </div>
                          </td>
                          <td>
                            <div className="text-sm">
                              {booking.flight?.route?.departure?.code} → {booking.flight?.route?.arrival?.code}
                            </div>
                            <div className="text-xs text-gray-500">
                              {booking.flight?.flightNumber}
                            </div>
                          </td>
                          <td className="text-sm">
                            {booking.flight?.departureTime ? formatDate(booking.flight.departureTime) : 'N/A'}
                          </td>
                          <td className="font-semibold">{formatCurrency(booking.totalAmount)}</td>
                          <td>
                            <span className={`badge ${getStatusBadge(booking.status)}`}>
                              {getStatusText(booking.status)}
                            </span>
                          </td>
                          <td>
                            <button
                              className="btn btn-sm btn-ghost"
                              onClick={() => viewBookingDetail(booking.id)}
                            >
                              Chi tiết
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex justify-center mt-6">
                  <div className="join">
                    <button
                      className="join-item btn btn-sm"
                      disabled={pagination.page === 1}
                      onClick={() => setFilters({ ...filters, page: pagination.page - 1 })}
                    >
                      «
                    </button>
                    <button className="join-item btn btn-sm">
                      Trang {pagination.page} / {pagination.totalPages}
                    </button>
                    <button
                      className="join-item btn btn-sm"
                      disabled={pagination.page === pagination.totalPages}
                      onClick={() => setFilters({ ...filters, page: pagination.page + 1 })}
                    >
                      »
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Booking Detail Modal */}
      {showDetailModal && selectedBooking && (
        <dialog open className="modal modal-open">
          <div className="modal-box max-w-4xl">
            <h3 className="font-bold text-xl mb-4">Chi tiết đặt vé</h3>
            
            <div className="grid md:grid-cols-2 gap-6">
              {/* Booking Info */}
              <div className="space-y-3">
                <h4 className="font-semibold text-lg">Thông tin booking</h4>
                <div className="space-y-2 text-sm">
                  <p><strong>Mã booking:</strong> {selectedBooking.bookingCode}</p>
                  <p><strong>Trạng thái:</strong> 
                    <span className={`badge ${getStatusBadge(selectedBooking.status)} ml-2`}>
                      {getStatusText(selectedBooking.status)}
                    </span>
                  </p>
                  <p><strong>Ngày đặt:</strong> {formatDate(selectedBooking.createdAt)}</p>
                  <p><strong>Tổng tiền:</strong> {formatCurrency(selectedBooking.totalAmount)}</p>
                </div>
              </div>

              {/* Customer Info */}
              <div className="space-y-3">
                <h4 className="font-semibold text-lg">Thông tin khách hàng</h4>
                <div className="space-y-2 text-sm">
                  <p><strong>Họ tên:</strong> {selectedBooking.user?.fullName}</p>
                  <p><strong>Email:</strong> {selectedBooking.user?.email}</p>
                  <p><strong>SĐT:</strong> {selectedBooking.user?.phoneNumber || 'N/A'}</p>
                </div>
              </div>

              {/* Flight Info */}
              <div className="space-y-3">
                <h4 className="font-semibold text-lg">Thông tin chuyến bay</h4>
                <div className="space-y-2 text-sm">
                  <p><strong>Số hiệu:</strong> {selectedBooking.flight?.flightNumber}</p>
                  <p><strong>Tuyến bay:</strong> {selectedBooking.flight?.route?.departure?.name} → {selectedBooking.flight?.route?.arrival?.name}</p>
                  <p><strong>Khởi hành:</strong> {formatDate(selectedBooking.flight?.departureTime)}</p>
                  <p><strong>Hạ cánh:</strong> {formatDate(selectedBooking.flight?.arrivalTime)}</p>
                </div>
              </div>

              {/* Seats */}
              <div className="space-y-3">
                <h4 className="font-semibold text-lg">Ghế đã đặt</h4>
                <div className="space-y-2 text-sm">
                  {selectedBooking.seats?.map((seat) => (
                    <div key={seat.id} className="flex justify-between items-center p-2 bg-base-200 rounded">
                      <span>Ghế {seat.seatNumber} - {seat.ticketClass}</span>
                      <span className="font-semibold">{formatCurrency(seat.price)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment */}
              {selectedBooking.payment && (
                <div className="space-y-3 md:col-span-2">
                  <h4 className="font-semibold text-lg">Thông tin thanh toán</h4>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <p><strong>Phương thức:</strong> {selectedBooking.payment.paymentMethod}</p>
                    <p><strong>Trạng thái:</strong> 
                      <span className={`badge ml-2 ${selectedBooking.payment.status === 'SUCCESS' ? 'badge-success' : selectedBooking.payment.status === 'PENDING' ? 'badge-warning' : 'badge-error'}`}>
                        {selectedBooking.payment.status}
                      </span>
                    </p>
                    <p><strong>Số tiền:</strong> {formatCurrency(selectedBooking.payment.amount)}</p>
                    {selectedBooking.payment.transactionId && (
                      <p><strong>Mã GD:</strong> {selectedBooking.payment.transactionId}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Baggage */}
              {selectedBooking.baggage && selectedBooking.baggage.length > 0 && (
                <div className="space-y-3 md:col-span-2">
                  <h4 className="font-semibold text-lg">Hành lý</h4>
                  <div className="space-y-2 text-sm">
                    {selectedBooking.baggage.map((bag) => (
                      <div key={bag.id} className="flex justify-between items-center p-2 bg-base-200 rounded">
                        <span>{bag.weight}kg - Ghế {bag.seatNumber}</span>
                        <span className="font-semibold">{formatCurrency(bag.price)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="modal-action">
              {selectedBooking.status === 'PENDING' && (
                <>
                  <button
                    className="btn btn-success"
                    onClick={() => handleStatusChange(selectedBooking.id, 'CONFIRMED')}
                  >
                    Xác nhận
                  </button>
                  <button
                    className="btn btn-error"
                    onClick={() => handleStatusChange(selectedBooking.id, 'REJECTED')}
                  >
                    Từ chối
                  </button>
                </>
              )}
              {selectedBooking.status === 'CONFIRMED' && (
                <button
                  className="btn btn-warning"
                  onClick={() => handleStatusChange(selectedBooking.id, 'CANCELLED')}
                >
                  Hủy booking
                </button>
              )}
              <button className="btn" onClick={() => setShowDetailModal(false)}>
                Đóng
              </button>
            </div>
          </div>
        </dialog>
      )}
    </div>
  )
}
