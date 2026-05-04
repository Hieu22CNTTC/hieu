import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../utils/api'
import toast from 'react-hot-toast'
import { useAuthStore } from '../stores/authStore'

export default function FlightDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [flight, setFlight] = useState(null)
  const [ticketClass, setTicketClass] = useState('ECONOMY')
  const [passengers, setPassengers] = useState([{
    fullName: user?.fullName || '',
    dateOfBirth: '',
    gender: 'Male',
    nationality: 'VN',
    idNumber: '',
    ticketTypeId: 'tt_adult_001' // ADULT ticket type ID from seed data
  }])
  const [contactInfo, setContactInfo] = useState({
    email: user?.email || '',
    phone: user?.phoneNumber || ''
  })
  const [couponCode, setCouponCode] = useState('')
  const [discount, setDiscount] = useState(0)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchFlightDetails()
  }, [id])

  const fetchFlightDetails = async () => {
    try {
      const { data } = await api.get(`/public/flights/${id}`)
      setFlight(data.data)
    } catch (error) {
      console.error('Error:', error)
      if (error.response?.status === 404) {
        toast.error('Không tìm thấy chuyến bay')
        navigate('/search')
      } else {
        toast.error('Không thể tải thông tin chuyến bay')
      }
    } finally {
      setLoading(false)
    }
  }

  const addPassenger = () => {
    setPassengers([...passengers, {
      fullName: '',
      dateOfBirth: '',
      gender: 'Male',
      nationality: 'VN',
      idNumber: '',
      ticketTypeId: 'tt_adult_001' // ADULT ticket type ID from seed data
    }])
  }

  const removePassenger = (index) => {
    if (passengers.length > 1) {
      setPassengers(passengers.filter((_, i) => i !== index))
    }
  }

  const updatePassenger = (index, field, value) => {
    const updated = [...passengers]
    updated[index][field] = value
    setPassengers(updated)
  }

  const validateCoupon = async () => {
    if (!couponCode.trim()) return
    
    try {
      const { data } = await api.post('/public/coupons/validate', { couponCode })
      if (data.success) {
        setDiscount(data.data.discountPercent)
        toast.success(`Áp dụng mã giảm ${data.data.discountPercent}% thành công!`)
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Mã giảm giá không hợp lệ')
      setDiscount(0)
    }
  }

  const calculateTotal = () => {
    if (!flight) return 0
    const pricePerTicket = ticketClass === 'BUSINESS' ? flight.businessPrice : flight.basePrice
    const subtotal = pricePerTicket * passengers.length
    const discountAmount = (subtotal * discount) / 100
    return subtotal - discountAmount
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validation
    const invalidPassengerIndex = passengers.findIndex((p) => {
      const fullName = (p.fullName || '').trim()
      const dateOfBirth = (p.dateOfBirth || '').trim()
      const idNumber = (p.idNumber || '').trim()
      return fullName.length < 2 || !dateOfBirth || !idNumber
    })

    if (invalidPassengerIndex !== -1) {
      toast.error(`Hành khách ${invalidPassengerIndex + 1}: Họ tên phải từ 2 ký tự và điền đủ thông tin bắt buộc`)
      return
    }

    if (!contactInfo.email || !contactInfo.phone) {
      toast.error('Vui lòng điền thông tin liên hệ')
      return
    }

    setSubmitting(true)
    try {
      const { data } = await api.post('/public/bookings', {
        flightId: flight.id,
        seatClass: ticketClass,
        contactEmail: contactInfo.email.trim(),
        contactPhone: contactInfo.phone.replace(/\D/g, ''),
        passengers: passengers.map((p) => ({
          ...p,
          fullName: p.fullName.trim(),
          idNumber: p.idNumber.trim()
        })),
        couponCode: couponCode || undefined
      })

      toast.success('Đặt vé thành công!')
      navigate(`/confirmation/${data.data.bookingCode}`)
    } catch (error) {
      console.error('Booking error:', error)
      toast.error(error.response?.data?.message || 'Đặt vé thất bại')
    } finally {
      setSubmitting(false)
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

  if (!flight) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="alert alert-error">
          <span>Không tìm thấy chuyến bay</span>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Chi tiết chuyến bay & Đặt vé</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Flight Info & Booking Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Flight Information */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title">Thông tin chuyến bay</h2>
              <div className="divider"></div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-sm text-gray-500">Khởi hành</div>
                  <div className="font-bold text-lg">{flight.origin?.city}</div>
                  <div className="text-sm">{formatDateTime(flight.departureTime)}</div>
                </div>
                
                <div className="text-center">
                  <div className="text-sm text-gray-500">Thời gian bay</div>
                  <div className="font-bold">{Math.floor(flight.duration / 60)}h {flight.duration % 60}m</div>
                  <div className="badge badge-primary mt-1">{flight.flightNumber}</div>
                </div>
                
                <div className="text-right">
                  <div className="text-sm text-gray-500">Hạ cánh</div>
                  <div className="font-bold text-lg">{flight.destination?.city}</div>
                  <div className="text-sm">{formatDateTime(flight.arrivalTime)}</div>
                </div>
              </div>

              <div className="mt-4 p-3 bg-base-200 rounded-lg">
                <div className="text-sm">
                  <span className="font-semibold">Máy bay:</span> {flight.aircraft?.model} • 
                  <span className="ml-2 font-semibold">Còn trống:</span> Economy: {flight.economyAvailable}, Business: {flight.businessAvailable}
                </div>
              </div>
            </div>
          </div>

          {/* Booking Form */}
          <form onSubmit={handleSubmit}>
            {/* Ticket Class Selection */}
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h2 className="card-title">Chọn hạng vé</h2>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <label className={`card cursor-pointer ${ticketClass === 'ECONOMY' ? 'border-2 border-primary' : 'border'}`}>
                    <div className="card-body">
                      <input
                        type="radio"
                        name="ticketClass"
                        value="ECONOMY"
                        checked={ticketClass === 'ECONOMY'}
                        onChange={(e) => setTicketClass(e.target.value)}
                        className="radio radio-primary"
                      />
                      <div className="font-bold">Phổ thông</div>
                      <div className="text-2xl font-bold text-primary">{formatPrice(flight.basePrice)}</div>
                      <div className="text-sm text-gray-500">{flight.economyAvailable} ghế</div>
                    </div>
                  </label>

                  <label className={`card cursor-pointer ${ticketClass === 'BUSINESS' ? 'border-2 border-primary' : 'border'}`}>
                    <div className="card-body">
                      <input
                        type="radio"
                        name="ticketClass"
                        value="BUSINESS"
                        checked={ticketClass === 'BUSINESS'}
                        onChange={(e) => setTicketClass(e.target.value)}
                        className="radio radio-primary"
                      />
                      <div className="font-bold">Thương gia</div>
                      <div className="text-2xl font-bold text-primary">{formatPrice(flight.businessPrice)}</div>
                      <div className="text-sm text-gray-500">{flight.businessAvailable} ghế</div>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Passenger Information */}
            <div className="card bg-base-100 shadow-xl mt-6">
              <div className="card-body">
                <div className="flex justify-between items-center">
                  <h2 className="card-title">Thông tin hành khách</h2>
                  <button type="button" onClick={addPassenger} className="btn btn-sm btn-outline">
                    + Thêm hành khách
                  </button>
                </div>

                {passengers.map((passenger, index) => (
                  <div key={index} className="mt-4 p-4 border rounded-lg">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-semibold">Hành khách {index + 1}</h3>
                      {passengers.length > 1 && (
                        <button type="button" onClick={() => removePassenger(index)} className="btn btn-sm btn-ghost btn-circle">✕</button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="form-control">
                        <label className="label"><span className="label-text">Họ tên *</span></label>
                        <input
                          type="text"
                          className="input input-bordered"
                          value={passenger.fullName}
                          onChange={(e) => updatePassenger(index, 'fullName', e.target.value)}
                          required
                        />
                      </div>

                      <div className="form-control">
                        <label className="label"><span className="label-text">Ngày sinh *</span></label>
                        <input
                          type="date"
                          className="input input-bordered"
                          value={passenger.dateOfBirth}
                          onChange={(e) => updatePassenger(index, 'dateOfBirth', e.target.value)}
                          required
                        />
                      </div>

                      <div className="form-control">
                        <label className="label"><span className="label-text">Giới tính</span></label>
                        <select
                          className="select select-bordered"
                          value={passenger.gender}
                          onChange={(e) => updatePassenger(index, 'gender', e.target.value)}
                        >
                          <option value="Male">Nam</option>
                          <option value="Female">Nữ</option>
                          <option value="Other">Khác</option>
                        </select>
                      </div>

                      <div className="form-control">
                        <label className="label"><span className="label-text">CMND/CCCD *</span></label>
                        <input
                          type="text"
                          className="input input-bordered"
                          value={passenger.idNumber}
                          onChange={(e) => updatePassenger(index, 'idNumber', e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Contact Information */}
            <div className="card bg-base-100 shadow-xl mt-6">
              <div className="card-body">
                <h2 className="card-title">Thông tin liên hệ</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="form-control">
                    <label className="label"><span className="label-text">Email *</span></label>
                    <input
                      type="email"
                      className="input input-bordered"
                      value={contactInfo.email}
                      onChange={(e) => setContactInfo({ ...contactInfo, email: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-control">
                    <label className="label"><span className="label-text">Số điện thoại *</span></label>
                    <input
                      type="tel"
                      className="input input-bordered"
                      value={contactInfo.phone}
                      onChange={(e) => setContactInfo({ ...contactInfo, phone: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Coupon */}
            <div className="card bg-base-100 shadow-xl mt-6">
              <div className="card-body">
                <h2 className="card-title">Mã giảm giá</h2>
                <div className="flex gap-2 mt-4">
                  <input
                    type="text"
                    className="input input-bordered flex-1"
                    placeholder="Nhập mã giảm giá"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  />
                  <button type="button" onClick={validateCoupon} className="btn btn-outline">
                    Áp dụng
                  </button>
                </div>
                {discount > 0 && (
                  <div className="alert alert-success mt-2">
                    <span>✓ Giảm {discount}% trên tổng giá vé</span>
                  </div>
                )}
              </div>
            </div>
          </form>
        </div>

        {/* Right: Price Summary */}
        <div className="lg:col-span-1">
          <div className="card bg-base-100 shadow-xl sticky top-4">
            <div className="card-body">
              <h2 className="card-title">Chi tiết giá</h2>
              <div className="divider"></div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Giá vé ({passengers.length} người)</span>
                  <span>{formatPrice((ticketClass === 'BUSINESS' ? flight.businessPrice : flight.basePrice) * passengers.length)}</span>
                </div>

                {discount > 0 && (
                  <div className="flex justify-between text-success">
                    <span>Giảm giá ({discount}%)</span>
                    <span>-{formatPrice(((ticketClass === 'BUSINESS' ? flight.businessPrice : flight.basePrice) * passengers.length * discount) / 100)}</span>
                  </div>
                )}

                <div className="divider"></div>

                <div className="flex justify-between text-xl font-bold">
                  <span>Tổng cộng</span>
                  <span className="text-primary">{formatPrice(calculateTotal())}</span>
                </div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={submitting || (ticketClass === 'ECONOMY' && flight.economyAvailable === 0) || (ticketClass === 'BUSINESS' && flight.businessAvailable === 0)}
                className={`btn btn-primary btn-block mt-6 ${submitting ? 'loading' : ''}`}
              >
                {submitting ? 'Đang xử lý...' : 'Đặt vé ngay'}
              </button>

              <div className="text-xs text-center text-gray-500 mt-2">
                Bạn sẽ nhận email xác nhận sau khi đặt vé
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
