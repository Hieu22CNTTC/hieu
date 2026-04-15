import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import api from '../utils/api'
import toast from 'react-hot-toast'
import { X, Check, Clock, Plane, User, AlertCircle } from 'lucide-react'

export default function SeatSelection() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  
  const bookingCode = searchParams.get('booking')
  
  const [booking, setBooking] = useState(null)
  const [seatMap, setSeatMap] = useState(null)
  const [selectedSeats, setSelectedSeats] = useState([])
  const [loading, setLoading] = useState(true)
  const [holdExpiry, setHoldExpiry] = useState(null)

  useEffect(() => {
    if (!bookingCode) {
      toast.error('Vui lòng cung cấp mã đặt vé')
      navigate('/dashboard')
      return
    }
    fetchBookingAndSeats()
  }, [bookingCode])

  // Timer countdown
  useEffect(() => {
    if (!holdExpiry) return

    const interval = setInterval(() => {
      const now = new Date()
      const expiry = new Date(holdExpiry)
      const diff = expiry - now

      if (diff <= 0) {
        toast.error('Hết thời gian giữ ghế. Vui lòng chọn lại.')
        setHoldExpiry(null)
        setSelectedSeats([])
        fetchBookingAndSeats()
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [holdExpiry])

  const fetchBookingAndSeats = async () => {
    setLoading(true)
    try {
      // Get booking info
      const bookingRes = await api.get(`/public/bookings/${bookingCode}`)
      console.log('Booking response:', bookingRes.data)
      const bookingData = bookingRes.data.data
      
      if (!bookingData) {
        throw new Error('Booking data is null')
      }
      
      if (!bookingData.flight || !bookingData.flight.id) {
        throw new Error('Flight data missing')
      }
      
      setBooking(bookingData)

      // Check if already has seats
      const hasSeats = bookingData.passengers?.every(p => p.seatNumber)
      if (hasSeats) {
        // Load existing seat selections
        const existingSeats = bookingData.passengers.map(p => p.seatNumber).filter(Boolean)
        setSelectedSeats(existingSeats)
      }

      // Get seat map
      const seatRes = await api.get(`/seats/${bookingData.flight.id}`)
      console.log('Seat map response:', seatRes.data)
      setSeatMap(seatRes.data.data)
    } catch (error) {
      console.error('Error fetching data:', error)
      const errorMsg = error.response?.data?.message || error.message || 'Không thể tải thông tin đặt chỗ'
      toast.error(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const handleSeatClick = (seat) => {
    if (seat.status === 'occupied') {
      toast.error('Ghế đã được đặt')
      return
    }

    if (seat.status === 'held' && seat.heldBy !== user?.id && !seat.bookingId) {
      toast.error('Ghế đang được giữ bởi người khác')
      return
    }

    // Check ticket class
    const passengerClass = booking.passengers[selectedSeats.length]?.ticketClass
    if (passengerClass && seat.class !== passengerClass) {
      toast.error(`Vui lòng chọn ghế ${passengerClass === 'BUSINESS' ? 'Thương gia' : 'Phổ thông'}`)
      return
    }

    if (selectedSeats.includes(seat.seatNumber)) {
      setSelectedSeats(selectedSeats.filter(s => s !== seat.seatNumber))
    } else {
      if (selectedSeats.length >= booking.passengers.length) {
        toast.error(`Chỉ được chọn ${booking.passengers.length} ghế`)
        return
      }
      setSelectedSeats([...selectedSeats, seat.seatNumber])
    }
  }

  const handleHoldSeats = async () => {
    if (selectedSeats.length !== booking.passengers.length) {
      toast.error(`Vui lòng chọn ${booking.passengers.length} ghế`)
      return
    }

    try {
      const res = await api.post('/seats/hold', {
        flightId: booking.flight.id,
        seatNumbers: selectedSeats,
        bookingCode
      })

      setHoldExpiry(res.data.data.expiresAt)
      toast.success('Đã giữ ghế thành công. Vui lòng xác nhận trong 5 phút.')
      fetchBookingAndSeats()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể giữ ghế')
    }
  }

  const handleConfirmSeats = async () => {
    try {
      await api.post('/seats/confirm', { bookingCode })
      toast.success('Đã xác nhận chỗ ngồi thành công!')
      setHoldExpiry(null)
      
      // Reload booking to get updated seat assignments
      await fetchBookingAndSeats()
      
      // Show seat list
      const seatList = selectedSeats.join(', ')
      toast.success(`Ghế đã cập nhật: ${seatList}`)
      
      // Redirect to ticket page to see updated seats
      setTimeout(() => {
        navigate(`/track?code=${bookingCode}`)
      }, 1500)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể xác nhận ghế')
    }
  }

  const handleCancelSelection = async () => {
    try {
      await api.delete(`/seats/cancel/${bookingCode}`)
      setSelectedSeats([])
      setHoldExpiry(null)
      toast.success('Đã hủy chọn ghế')
      fetchBookingAndSeats()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể hủy')
    }
  }

  const getSeatClass = (seat) => {
    if (seat.status === 'occupied') return 'bg-gray-400 cursor-not-allowed'
    if (seat.status === 'held') {
      if (seat.bookingId === booking?.id) return 'bg-yellow-400 hover:bg-yellow-500'
      return 'bg-orange-400 cursor-not-allowed'
    }
    if (selectedSeats.includes(seat.seatNumber)) return 'bg-green-500 hover:bg-green-600'
    if (seat.class === 'BUSINESS') return 'bg-amber-100 hover:bg-amber-200 cursor-pointer'
    return 'bg-blue-100 hover:bg-blue-200 cursor-pointer'
  }

  const getTimeRemaining = () => {
    if (!holdExpiry) return null
    const now = new Date()
    const expiry = new Date(holdExpiry)
    const diff = Math.max(0, expiry - now)
    const minutes = Math.floor(diff / 60000)
    const seconds = Math.floor((diff % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    )
  }

  if (!booking || !seatMap) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle size={64} className="mx-auto mb-4 text-error" />
          <p className="text-xl">Không tìm thấy thông tin đặt vé</p>
        </div>
      </div>
    )
  }

  const businessSeats = seatMap.seats.filter(s => s.class === 'BUSINESS')
  const economySeats = seatMap.seats.filter(s => s.class === 'ECONOMY')
  
  // Group seats by row
  const businessRows = {}
  businessSeats.forEach(seat => {
    if (!businessRows[seat.row]) businessRows[seat.row] = []
    businessRows[seat.row].push(seat)
  })

  const economyRows = {}
  economySeats.forEach(seat => {
    if (!economyRows[seat.row]) economyRows[seat.row] = []
    economyRows[seat.row].push(seat)
  })

  // Determine seat layout by aircraft
  const getSeatLayout = () => {
    const model = seatMap.aircraftModel
    if (model.includes('747') || model.includes('777')) {
      return { business: [2, 4, 2], economy: [3, 4, 3] } // 2-4-2 business, 3-4-3 economy
    } else if (model.includes('A321')) {
      return { business: [2, 2], economy: [3, 3] } // 2-2 business, 3-3 economy
    } else if (model.includes('A350') || model.includes('787')) {
      return { business: [2, 2], economy: [3, 3, 3] } // 2-2 business, 3-3-3 economy
    }
    return { business: [2, 2], economy: [3, 3] } // default
  }

  const layout = getSeatLayout()

  const renderSeatRow = (row, seats, isBusinessClass) => {
    const config = isBusinessClass ? layout.business : layout.economy
    const sortedSeats = [...seats].sort((a, b) => a.column.localeCompare(b.column))
    
    let seatIndex = 0
    const groups = []
    
    config.forEach((groupSize, groupIndex) => {
      const group = []
      for (let i = 0; i < groupSize; i++) {
        if (sortedSeats[seatIndex]) {
          group.push(sortedSeats[seatIndex])
          seatIndex++
        }
      }
      groups.push(group)
    })

    return (
      <div className="flex items-center gap-2 mb-1.5">
        <span className="w-12 text-xs font-bold text-center text-base-content/70">{row}</span>
        
        <div className="flex gap-3 flex-1 justify-center">
          {groups.map((group, groupIndex) => (
            <div key={groupIndex} className="flex gap-1 items-center">
              {group.map((seat) => (
                <button
                  key={seat.seatNumber}
                  onClick={() => handleSeatClick(seat)}
                  className={`w-10 h-10 rounded text-xs font-bold transition-all ${getSeatClass(seat)}`}
                  disabled={seat.status === 'occupied' || (seat.status === 'held' && seat.bookingId !== booking?.id)}
                  title={seat.seatNumber}
                >
                  {seat.column}
                  {selectedSeats.includes(seat.seatNumber) && (
                    <Check size={10} className="absolute top-0.5 right-0.5" />
                  )}
                </button>
              ))}
            </div>
          ))}
        </div>
        
        <span className="w-12 text-xs font-bold text-center text-base-content/70">{row}</span>
      </div>
    )
  }

  // Determine emergency exit rows based on aircraft
  const getEmergencyExits = () => {
    const model = seatMap.aircraftModel
    if (model.includes('A321')) {
      return { business: [], economy: [14, 24] } // Mid and rear exits
    } else if (model.includes('747') || model.includes('777')) {
      return { business: [10], economy: [27, 40] }
    } else if (model.includes('A350') || model.includes('787')) {
      return { business: [], economy: [15, 30] }
    }
    return { business: [], economy: [] }
  }

  const emergencyExits = getEmergencyExits()

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-200 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="card bg-white shadow-xl mb-6 border-t-4 border-primary">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-3 text-slate-800">
                  <Plane className="text-primary" size={32} />
                  Chọn chỗ ngồi trên máy bay
                </h1>
                <p className="text-slate-600 mt-1">
                  Mã đặt vé: <span className="font-mono font-bold text-primary">{bookingCode}</span>
                </p>
              </div>
              {holdExpiry && (
                <div className="badge badge-warning badge-lg gap-2 p-4 animate-pulse">
                  <Clock size={20} />
                  <span className="text-lg font-mono">{getTimeRemaining()}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Flight Info */}
        <div className="card bg-white shadow-xl mb-6">
          <div className="card-body p-6">
            <div className="grid md:grid-cols-4 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <Plane size={24} className="text-primary" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Chuyến bay</p>
                  <p className="font-bold text-lg">{booking.flight.flightNumber}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center text-2xl">
                  ✈️
                </div>
                <div>
                  <p className="text-xs text-slate-500">Hành trình</p>
                  <p className="font-bold text-lg">
                    {booking.flight.route.departure.city} → {booking.flight.route.arrival.city}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center text-2xl">
                  🛫
                </div>
                <div>
                  <p className="text-xs text-slate-500">Máy bay</p>
                  <p className="font-bold text-base">{seatMap.aircraftModel}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center text-2xl">
                  🪑
                </div>
                <div>
                  <p className="text-xs text-slate-500">Tổng ghế</p>
                  <p className="font-bold text-lg">{seatMap.config.totalSeats}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Seat Map - Takes 3 columns */}
          <div className="lg:col-span-3">
            <div className="bg-white shadow-2xl rounded-3xl overflow-visible p-8">
              <div className="relative mx-auto" style={{ maxWidth: '700px' }}>
                {/* Nose */}
                <div className="flex justify-center mb-3">
                  <div className="w-24 h-16 bg-gradient-to-b from-blue-500 to-blue-600 rounded-t-full flex items-end justify-center pb-2">
                    <Plane size={24} className="text-white" />
                  </div>
                </div>

                {/* Toilet Icon Top */}
                <div className="flex justify-center mb-3">
                  <div className="text-xl">🚻</div>
                </div>

                {/* Business Class */}
                {Object.keys(businessRows).length > 0 && (
                  <div className="relative mb-6">
                    <div className="flex items-start gap-2 mb-2">
                      <div className="bg-amber-500 text-white px-3 py-1 rounded-lg text-xs font-bold shadow whitespace-nowrap">
                        Hạng Thương Gia
                      </div>
                    </div>
                    
                    <div className="relative border-4 border-amber-400 rounded-xl p-4 bg-gradient-to-r from-amber-50 to-yellow-50">
                      {/* Wings */}
                      <div className="absolute -left-16 top-1/2 -translate-y-1/2 w-16 h-20 bg-slate-400 rounded-l-full shadow-xl" style={{ clipPath: 'polygon(30% 0%, 100% 20%, 100% 80%, 30% 100%, 0% 50%)' }}></div>
                      <div className="absolute -right-16 top-1/2 -translate-y-1/2 w-16 h-20 bg-slate-400 rounded-r-full shadow-xl" style={{ clipPath: 'polygon(70% 0%, 100% 50%, 70% 100%, 0% 80%, 0% 20%)' }}></div>
                      
                      <div className="space-y-1">
                        {Object.entries(businessRows).map(([row, seats]) => (
                          <div key={row}>
                            {renderSeatRow(row, seats, true)}
                            {emergencyExits.business.includes(parseInt(row)) && (
                              <div className="flex justify-center my-2">
                                <div className="badge badge-error gap-1 text-white font-bold text-xs">
                                  <AlertCircle size={10} />
                                  Cửa thoát hiểm
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Divider between classes */}
                {Object.keys(businessRows).length > 0 && Object.keys(economyRows).length > 0 && (
                  <div className="flex items-center gap-3 my-4">
                    <div className="flex-1 border-t-2 border-dashed border-slate-300"></div>
                    <div className="badge bg-sky-500 text-white border-0 gap-1 text-xs">
                      <AlertCircle size={12} />
                      Khu vực Phổ Thông
                    </div>
                    <div className="flex-1 border-t-2 border-dashed border-slate-300"></div>
                  </div>
                )}

                {/* Economy Class */}
                {Object.keys(economyRows).length > 0 && (
                  <div className="relative">
                    <div className="flex items-start gap-2 mb-2">
                      <div className="bg-sky-500 text-white px-3 py-1 rounded-lg text-xs font-bold shadow whitespace-nowrap">
                        Hạng Phổ Thông
                      </div>
                    </div>
                    
                    <div className="border-4 border-sky-400 rounded-xl p-4 bg-gradient-to-r from-sky-50 to-blue-50">
                      <div className="space-y-1 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
                        {Object.entries(economyRows).map(([row, seats]) => (
                          <div key={row}>
                            {renderSeatRow(row, seats, false)}
                            {emergencyExits.economy.includes(parseInt(row)) && (
                              <div className="flex justify-center my-2">
                                <div className="badge badge-error gap-1 text-white font-bold text-xs">
                                  <AlertCircle size={10} />
                                  Cửa thoát hiểm
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Toilet Icon Bottom */}
                <div className="flex justify-center mt-3">
                  <div className="text-xl">🚻</div>
                </div>

                {/* Tail */}
                <div className="flex justify-center mt-3">
                  <div className="w-24 h-14 bg-gradient-to-t from-blue-500 to-blue-600 rounded-b-full"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar - Takes 1 column */}
          <div className="space-y-6">
            {/* Legend */}
            <div className="card bg-white shadow-xl border-t-4 border-info">
              <div className="card-body p-4">
                <h3 className="font-bold mb-3 flex items-center gap-2 text-slate-800">
                  <AlertCircle size={18} />
                  Chú thích
                </h3>
                <div className="space-y-2.5 text-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-400 rounded"></div>
                    <span className="font-medium">Thương gia trống</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-gradient-to-r from-sky-50 to-blue-50 border-2 border-sky-400 rounded"></div>
                    <span className="font-medium">Phổ thông trống</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-green-500 rounded flex items-center justify-center shadow">
                      <Check size={18} className="text-white" />
                    </div>
                    <span className="font-medium">Đã chọn</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-yellow-400 rounded shadow"></div>
                    <span className="font-medium">Đang giữ</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-gray-400 rounded shadow"></div>
                    <span className="font-medium">Đã đặt</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Passengers */}
            <div className="card bg-white shadow-xl border-t-4 border-success">
              <div className="card-body p-4">
                <h3 className="font-bold mb-3 flex items-center gap-2 text-slate-800">
                  <User size={18} />
                  Hành khách ({booking.passengers.length})
                </h3>
                <div className="space-y-2">
                  {booking.passengers.map((passenger, index) => (
                    <div key={passenger.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <div className="flex-1">
                        <p className="font-semibold text-sm text-slate-800">{passenger.fullName}</p>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                          {passenger.ticketClass === 'BUSINESS' ? '✈️ Thương gia' : '🪑 Phổ thông'}
                        </p>
                      </div>
                      <div className={`badge ${selectedSeats[index] ? 'badge-success text-white' : 'badge-ghost'} font-mono font-bold`}>
                        {selectedSeats[index] || passenger.seatNumber || '---'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="card bg-white shadow-xl border-t-4 border-primary">
              <div className="card-body p-4">
                <div className="space-y-3">
                  {!holdExpiry ? (
                    <button
                      onClick={handleHoldSeats}
                      className="btn btn-primary w-full gap-2 shadow-lg"
                      disabled={selectedSeats.length !== booking.passengers.length}
                    >
                      <Check size={18} />
                      Giữ ghế ({selectedSeats.length}/{booking.passengers.length})
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={handleConfirmSeats}
                        className="btn btn-success w-full gap-2 shadow-lg text-white"
                      >
                        <Check size={18} />
                        Xác nhận chọn ghế
                      </button>
                      <button
                        onClick={handleCancelSelection}
                        className="btn btn-error btn-outline w-full gap-2"
                      >
                        <X size={18} />
                        Hủy
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="btn btn-ghost w-full border border-slate-300"
                  >
                    Quay lại
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #3b82f6;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #2563eb;
        }
      `}</style>
    </div>
  )
}
