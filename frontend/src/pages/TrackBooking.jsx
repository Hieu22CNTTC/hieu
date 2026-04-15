import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Search, Plane, User, Mail, Phone, Calendar, CreditCard, Printer } from 'lucide-react'
import api from '../utils/api'
import toast from 'react-hot-toast'

export default function TrackBooking() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [bookingCode, setBookingCode] = useState('')
  const [searching, setSearching] = useState(false)
  const [booking, setBooking] = useState(null)
  const [hasSearched, setHasSearched] = useState(false)

  // Auto search if code is in URL params
  useEffect(() => {
    const codeFromUrl = searchParams.get('code')
    if (codeFromUrl) {
      setBookingCode(codeFromUrl)
      // Auto submit search
      searchBooking(codeFromUrl)
    }
  }, [searchParams])

  const searchBooking = async (code) => {
    if (!code.trim()) {
      toast.error('Vui lòng nhập mã đặt vé')
      return
    }

    setSearching(true)
    setHasSearched(true)
    try {
      const { data } = await api.get(`/public/bookings/${code.trim()}`)
      setBooking(data.data)
      toast.success('Tìm thấy thông tin đặt vé!')
    } catch (error) {
      console.error('Error:', error)
      toast.error(error.response?.data?.message || 'Không tìm thấy thông tin đặt vé')
      setBooking(null)
    } finally {
      setSearching(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    searchBooking(bookingCode)
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

  const getStatusBadge = (status) => {
    const badges = {
      'CONFIRMED': 'badge-success',
      'PENDING': 'badge-warning',
      'CANCELLED': 'badge-error',
      'REJECTED': 'badge-error',
      'COMPLETED': 'badge-info'
    }
    return badges[status] || 'badge-ghost'
  }

  const getStatusText = (status) => {
    const texts = {
      'CONFIRMED': 'Đã xác nhận',
      'PENDING': 'Chờ xử lý',
      'CANCELLED': 'Đã hủy',
      'REJECTED': 'Bị từ chối',
      'COMPLETED': 'Hoàn tất'
    }
    return texts[status] || status
  }

  return (
    <>
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 10mm;
          }
          body * {
            visibility: hidden;
          }
          .print-area, .print-area * {
            visibility: visible;
          }
          .print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white;
          }
          .no-print {
            display: none !important;
          }
          .card {
            box-shadow: none !important;
            border: 2px solid #e5e7eb;
          }
          .boarding-pass {
            page-break-inside: avoid;
            border: 3px dashed #3b82f6;
            border-radius: 12px;
            padding: 12px;
            margin: 0;
            background: linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%);
          }
          .boarding-pass h1 {
            font-size: 24px !important;
            margin-bottom: 4px !important;
          }
          .boarding-pass h3 {
            font-size: 11px !important;
            margin-bottom: 8px !important;
          }
          .boarding-pass p, .boarding-pass div {
            font-size: 10px !important;
            margin-bottom: 4px !important;
          }
          .boarding-pass table {
            font-size: 10px !important;
          }
          .boarding-pass table th,
          .boarding-pass table td {
            padding: 4px !important;
          }
          .flight-route {
            font-size: 32px !important;
          }
          .booking-code-large {
            font-size: 20px !important;
          }
          .barcode {
            border: 2px solid #000;
            padding: 8px;
            margin: 16px auto;
          }
        }
        .boarding-pass {
          background: linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%);
          border: 3px dashed #3b82f6;
          border-radius: 16px;
          position: relative;
          overflow: hidden;
        }
        .boarding-pass::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 8px;
          background: linear-gradient(90deg, #3b82f6 0%, #8b5cf6 100%);
        }
        .barcode-line {
          display: inline-block;
          width: 2px;
          height: 60px;
          background: black;
          margin: 0 1px;
        }
      `}</style>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 no-print">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="text-center mb-6">
              <h1 className="text-4xl font-bold text-gray-800 mb-2">Tra cứu đặt vé</h1>
              <p className="text-gray-600">Nhập mã đặt vé để xem thông tin chi tiết</p>
            </div>

            {/* Search Form */}
            <div className="card bg-white shadow-2xl mb-6">
              <div className="card-body">
                <form onSubmit={handleSubmit}>
                  <div className="flex gap-3">
                    <div className="form-control flex-1">
                      <div className="relative">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <input
                          type="text"
                          placeholder="Nhập mã đặt vé (VD: BK123456)"
                          className="input input-bordered input-lg w-full pl-12 font-mono"
                          value={bookingCode}
                          onChange={(e) => setBookingCode(e.target.value.toUpperCase())}
                          required
                        />
                      </div>
                    </div>
                    <button 
                      type="submit" 
                      className={`btn btn-primary btn-lg px-8 ${searching ? 'loading' : ''}`}
                      disabled={searching}
                    >
                      {searching ? 'Đang tìm...' : 'Tra cứu'}
                    </button>
                  </div>
                  <div className="text-sm text-gray-500 mt-3 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Mã đặt vé đã được gửi đến email của bạn
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Not Found Message */}
      {hasSearched && !booking && !searching && (
        <div className="container mx-auto px-4 pb-8">
          <div className="max-w-4xl mx-auto">
            <div className="card bg-white shadow-xl">
              <div className="card-body text-center py-12">
                <Search size={64} className="mx-auto mb-4 text-gray-300" />
                <h3 className="text-2xl font-bold text-gray-700 mb-2">Không tìm thấy vé</h3>
                <p className="text-gray-500 mb-4">
                  Mã đặt vé "<span className="font-mono font-semibold text-gray-700">{bookingCode}</span>" không tồn tại trong hệ thống
                </p>
                <p className="text-sm text-gray-400">
                  Vui lòng kiểm tra lại mã đặt vé hoặc liên hệ hotline để được hỗ trợ
                </p>
                <button 
                  onClick={() => {
                    setBookingCode('')
                    setHasSearched(false)
                  }} 
                  className="btn btn-primary mt-6"
                >
                  Tìm kiếm lại
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Booking Result - Print Area */}
      {booking && (
        <div className="print-area">
          <div className="container mx-auto px-4 pb-8">
            <div className="max-w-4xl mx-auto">
              
              {/* Boarding Pass Style Ticket */}
              <div className="boarding-pass p-8 mb-6 bg-white shadow-2xl">
                {/* Airline Header */}
                <div className="text-center mb-6 pt-4">
                  <h1 className="text-4xl font-bold text-blue-600 mb-1">Flight Booking</h1>
                  <p className="text-gray-600 text-sm">Vé Điện Tử / Electronic Ticket</p>
                </div>

                {/* Booking Code & Status */}
                <div className="flex justify-between items-center mb-6 pb-4 border-b-2 border-dashed border-gray-300">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">MÃ ĐẶT VÉ / BOOKING CODE</p>
                    <p className="text-3xl font-bold font-mono text-gray-800">{booking.bookingCode}</p>
                  </div>
                  <div className={`badge badge-lg ${getStatusBadge(booking.status)} text-white px-6 py-4`}>
                    {getStatusText(booking.status)}
                  </div>
                </div>

                {/* Flight Route - Big Display */}
                <div className="grid grid-cols-3 gap-4 mb-6 pb-6 border-b-2 border-dashed border-gray-300">
                  <div className="text-center">
                    <p className="text-xs text-gray-500 mb-2">KHỞI HÀNH / FROM</p>
                    <p className="text-5xl font-bold text-blue-600 mb-1">
                      {booking.flight?.route?.departure?.code || 'N/A'}
                    </p>
                    <p className="text-sm font-medium text-gray-700">
                      {booking.flight?.route?.departure?.city || 'N/A'}
                    </p>
                    <p className="text-sm font-bold text-gray-800 mt-1">
                      {booking.flight?.departureTime ? new Date(booking.flight.departureTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                    </p>
                    <p className="text-xs text-gray-600">
                      {booking.flight?.departureTime ? new Date(booking.flight.departureTime).toLocaleDateString('vi-VN') : ''}
                    </p>
                  </div>
                  
                  <div className="flex flex-col items-center justify-center">
                    <Plane size={24} className="text-blue-600 mb-1" />
                    <div className="text-center">
                      <p className="font-bold text-xl text-gray-800">{booking.flight?.flightNumber || 'N/A'}</p>
                      <p className="text-xs text-gray-600">{booking.flight?.aircraft?.model || 'N/A'}</p>
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-xs text-gray-500 mb-1">HẠ CÁNH / TO</p>
                    <p className="text-4xl font-bold text-blue-600 mb-1 flight-route">
                      {booking.flight?.route?.arrival?.code || 'N/A'}
                    </p>
                    <p className="text-xs font-medium text-gray-700">
                      {booking.flight?.route?.arrival?.city || 'N/A'}
                    </p>
                    <p className="text-sm font-bold text-gray-800 mt-1">
                      {booking.flight?.arrivalTime ? new Date(booking.flight.arrivalTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                    </p>
                    <p className="text-xs text-gray-600">
                      {booking.flight?.arrivalTime ? new Date(booking.flight.arrivalTime).toLocaleDateString('vi-VN') : ''}
                    </p>
                  </div>
                </div>

                {/* Passenger Info */}
                <div className="mb-3">
                  <h3 className="font-bold text-xs text-gray-600 mb-2 uppercase">Hành khách / Passengers</h3>
                  <div className="bg-white border border-gray-200 rounded overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="text-left px-2 py-1 text-xs font-semibold text-gray-700">STT</th>
                          <th className="text-left px-2 py-1 text-xs font-semibold text-gray-700">HỌ TÊN / FULL NAME</th>
                          <th className="text-center px-2 py-1 text-xs font-semibold text-gray-700">LOẠI VÉ / TYPE</th>
                          <th className="text-center px-2 py-1 text-xs font-semibold text-gray-700">HẠNG / CLASS</th>
                          <th className="text-center px-2 py-1 text-xs font-semibold text-gray-700">GHẾ / SEAT</th>
                          <th className="text-right px-2 py-1 text-xs font-semibold text-gray-700">GIÁ VÉ / PRICE</th>
                        </tr>
                      </thead>
                      <tbody>
                        {booking.passengers?.map((passenger, index) => (
                          <tr key={index} className="border-t border-gray-200">
                            <td className="px-2 py-2 font-semibold text-xs">{index + 1}</td>
                            <td className="px-2 py-2 font-medium text-gray-800 text-xs">{passenger.fullName}</td>
                            <td className="px-2 py-2 text-center">
                              <span className="text-xs bg-blue-100 text-blue-700 px-1 py-0.5 rounded">
                                {passenger.ticketType?.name || 'N/A'}
                              </span>
                            </td>
                            <td className="px-2 py-2 text-center">
                              <span className="text-xs bg-purple-100 text-purple-700 px-1 py-0.5 rounded font-bold">
                                {passenger.ticketClass || 'N/A'}
                              </span>
                            </td>
                            <td className="px-2 py-2 text-center">
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded font-mono font-bold">
                                {passenger.seatNumber || '---'}
                              </span>
                            </td>
                            <td className="px-2 py-2 text-right font-semibold text-xs">{formatPrice(passenger.priceAmount)}</td>
                          </tr>
                        )) || (
                          <tr>
                            <td colSpan="6" className="text-center py-3 text-gray-500 text-xs">Không có thông tin</td>
                          </tr>
                        )}
                        <tr className="border-t-2 border-gray-300 bg-blue-50">
                          <td colSpan="5" className="px-2 py-2 font-bold text-gray-800 uppercase text-xs">Tổng cộng / Total</td>
                          <td className="px-2 py-2 text-right font-bold text-sm text-blue-600">{formatPrice(booking.totalAmount)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Barcode */}
                <div className="text-center mb-3">
                  <div className="barcode inline-flex items-center justify-center bg-white p-2 rounded">
                    {booking.bookingCode.split('').map((char, i) => (
                      <span key={i} className="barcode-line" style={{ height: i % 2 === 0 ? '40px' : '35px' }}></span>
                    ))}
                  </div>
                  <p className="font-mono font-bold text-xs mt-1">{booking.bookingCode}</p>
                </div>

                {/* Contact Info */}
                <div className="grid grid-cols-2 gap-4 pt-3 border-t-2 border-dashed border-gray-300 mb-3">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">LIÊN HỆ / CONTACT</p>
                    <div className="flex items-center gap-1 mb-1">
                      <Mail size={12} className="text-blue-600" />
                      <span className="text-xs font-medium">{booking.contactEmail}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Phone size={12} className="text-green-600" />
                      <span className="text-xs font-medium">{booking.contactPhone}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">NGÀY ĐẶT / BOOKING DATE</p>
                    <div className="flex items-center gap-1">
                      <Calendar size={12} className="text-orange-600" />
                      <span className="text-xs font-medium">{formatDateTime(booking.createdAt)}</span>
                    </div>
                  </div>
                </div>

                {/* Footer Note */}
                <div className="text-center pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-600">
                    Vui lòng có mặt tại sân bay trước giờ khởi hành 90 phút (chuyến bay quốc tế) / 60 phút (chuyến bay nội địa)
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    Please arrive at the airport 90 minutes (international) / 60 minutes (domestic) before departure
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    © {new Date().getFullYear()} Flight Booking System - Hotline: 1900-xxxx
                  </p>
                </div>
              </div>

              {/* Actions - Hide on print */}
              <div className="flex gap-3 justify-center no-print">
                <button onClick={() => navigate('/')} className="btn btn-outline btn-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  Trang chủ
                </button>
                <button onClick={() => window.print()} className="btn btn-primary btn-lg">
                  <Printer className="mr-2" size={20} />
                  In vé máy bay
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </>
  )
}
