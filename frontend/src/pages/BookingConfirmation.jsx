import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import api from '../utils/api'
import toast from 'react-hot-toast'

export default function BookingConfirmation() {
  const { bookingCode } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [booking, setBooking] = useState(null)
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState(null)

  useEffect(() => {
    if (bookingCode) {
      fetchBooking()
    }
  }, [bookingCode])

  // Check if payment was successful and refetch booking
  useEffect(() => {
    const paymentParam = searchParams.get('payment')
    if (paymentParam === 'success') {
      setPaymentStatus('success')
      toast.success('Thanh toán thành công!')
      
      // Refetch booking to get updated status (should be CONFIRMED)
      setTimeout(() => {
        if (bookingCode) {
          fetchBooking()
        }
      }, 1000)
    }
  }, [searchParams, bookingCode])

  const fetchBooking = async () => {
    try {
      const { data } = await api.get(`/public/bookings/${bookingCode}`)
      setBooking(data.data)
    } catch (error) {
      console.error('Error:', error)
      toast.error('Không thể tải thông tin đặt vé')
    } finally {
      setLoading(false)
    }
  }

  const handleMoMoPayment = async () => {
    try {
      setPaymentLoading(true)
      
      // Show progress toast
      const loadingToastId = toast.loading('Đang kết nối với MoMo...', {
        duration: Infinity
      })
      
      const { data } = await api.post('/payments/momo', {
        bookingId: booking.id
      })

      // Dismiss loading toast
      toast.dismiss(loadingToastId)

      if (data.success) {
        // Show success message before redirect
        toast.success('Đang chuyển tới MoMo...', { duration: 2 })
        
        // Redirect to MoMo payment page after brief delay
        setTimeout(() => {
          window.location.href = data.data.paymentUrl
        }, 1000)
      } else {
        toast.error(data.message || 'Không thể tạo thanh toán MoMo')
      }
    } catch (error) {
      console.error('Payment error:', error)
      toast.error(error.response?.data?.message || 'Lỗi khi tạo thanh toán')
    } finally {
      setPaymentLoading(false)
    }
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price)
  }

  const formatDateTime = (dateTime) => {
    return new Date(dateTime).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      </div>
    )
  }

  if (!booking) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="alert alert-error">
          <span>Không tìm thấy thông tin đặt vé</span>
        </div>
        <button onClick={() => navigate('/')} className="btn btn-primary mt-4">
          Về trang chủ
        </button>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Success Message */}
      <div className="alert alert-success shadow-lg mb-6">
        <div>
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current flex-shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h3 className="font-bold">Đặt vé thành công!</h3>
            <div className="text-sm">Mã đặt vé của bạn: <span className="font-bold">{booking.bookingCode}</span></div>
          </div>
        </div>
      </div>

      {/* Booking Information */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title text-2xl mb-4">Thông tin đặt vé</h2>

          {/* Booking Details */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <div className="text-sm text-gray-500">Mã đặt vé</div>
              <div className="font-bold text-lg">{booking.bookingCode}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Trạng thái</div>
              <div className="badge badge-success badge-lg">{booking.status}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Ngày đặt</div>
              <div>{formatDateTime(booking.createdAt)}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Tổng tiền</div>
              <div className="font-bold text-primary text-lg">{formatPrice(booking.totalAmount)}</div>
            </div>
          </div>

          <div className="divider"></div>

          {/* Flight Information */}
          <h3 className="font-bold text-lg mb-3">Thông tin chuyến bay</h3>
          <div className="bg-base-200 p-4 rounded-lg mb-6">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-gray-500">Khởi hành</div>
                <div className="font-bold">{booking.flight?.route?.departure?.city || 'N/A'}</div>
                <div className="text-sm">{booking.flight?.departureTime ? formatDateTime(booking.flight.departureTime) : 'N/A'}</div>
              </div>
              <div className="text-center">
                <div className="badge badge-primary">{booking.flight?.flightNumber || 'N/A'}</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">Hạ cánh</div>
                <div className="font-bold">{booking.flight?.route?.arrival?.city || 'N/A'}</div>
                <div className="text-sm">{booking.flight?.arrivalTime ? formatDateTime(booking.flight.arrivalTime) : 'N/A'}</div>
              </div>
            </div>
          </div>

          {/* Passengers */}
          <h3 className="font-bold text-lg mb-3">Danh sách hành khách</h3>
          <div className="overflow-x-auto">
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Họ tên</th>
                  <th>Ngày sinh</th>
                  <th>Loại vé</th>
                  <th>Hạng ghế</th>
                </tr>
              </thead>
              <tbody>
                {booking.passengers?.map((passenger, index) => (
                  <tr key={index}>
                    <td>{index + 1}</td>
                    <td>{passenger.fullName}</td>
                    <td>{new Date(passenger.dateOfBirth).toLocaleDateString('vi-VN')}</td>
                    <td><span className="badge">{passenger.ticketType?.name || 'N/A'}</span></td>
                    <td><span className="badge badge-outline">{passenger.ticketClass || 'N/A'}</span></td>
                  </tr>
                )) || (
                  <tr>
                    <td colSpan="5" className="text-center">Không có thông tin hành khách</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="divider"></div>

          {/* Contact Info */}
          <h3 className="font-bold text-lg mb-3">Thông tin liên hệ</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-500">Email</div>
              <div>{booking.contactEmail}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Số điện thoại</div>
              <div>{booking.contactPhone}</div>
            </div>
          </div>

          {/* Actions */}
          <div className="card-actions justify-end mt-6 gap-2">
            {booking.status === 'PENDING' && (
              <button 
                onClick={handleMoMoPayment} 
                className="btn btn-success"
                disabled={paymentLoading}
              >
                {paymentLoading ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    Thanh toán MoMo
                  </>
                )}
              </button>
            )}
            {booking.status === 'CONFIRMED' && (
              <div className="alert alert-success">
                <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current flex-shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>
                  <strong>Thanh toán thành công!</strong> Vé điện tử đang được gửi tới email của bạn.
                </span>
              </div>
            )}
            <button onClick={() => navigate(`/track?code=${booking.bookingCode}`)} className="btn btn-outline">
              Tra cứu đặt vé
            </button>
            <button onClick={() => navigate('/')} className="btn btn-primary">
              Về trang chủ
            </button>
          </div>

          {/* Notice */}
          <div className="alert alert-info mt-4">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <span className="text-sm">
              Vé điện tử đã được gửi đến email <strong>{booking.contactEmail}</strong>. 
              Vui lòng kiểm tra hộp thư đến hoặc spam.
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
