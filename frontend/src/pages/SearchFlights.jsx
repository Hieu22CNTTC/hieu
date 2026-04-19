import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeftRight, Search, Plane, Clock, TrendingUp, SlidersHorizontal } from 'lucide-react'
import api from '../utils/api'
import toast from 'react-hot-toast'

const AIRLINE_MAP = {
  VN: 'Vietnam Airlines',
  VJ: 'VietJet Air',
  QH: 'Bamboo Airways',
  BL: 'Pacific Airlines',
  VU: 'Vietravel Airlines',
}

const getAirlineName = (flightNumber = '') => {
  const prefix = String(flightNumber).match(/^([A-Z]{2})/i)?.[1]?.toUpperCase()
  return AIRLINE_MAP[prefix] || 'Hãng bay khác'
}

export default function SearchFlights() {
  const navigate = useNavigate()
  const [urlSearchParams] = useSearchParams()
  const [airports, setAirports] = useState([])
  const [loading, setLoading] = useState(false)
  const [flights, setFlights] = useState([])
  const [searched, setSearched] = useState(false)
  const [autoSearchDone, setAutoSearchDone] = useState(false)
  const [sortBy, setSortBy] = useState('departureTime')
  const [sortOrder, setSortOrder] = useState('asc')

  const [searchForm, setSearchForm] = useState({
    originAirportId: '',
    destinationAirportId: '',
    departureDate: '',
  })

  // Load airports
  useEffect(() => {
    const fetchAirports = async () => {
      try {
        const { data } = await api.get('/public/airports')
        setAirports(data.data || [])
      } catch {
        toast.error('Không thể tải danh sách sân bay')
      }
    }
    fetchAirports()
  }, [])

  // Auto-fill and search from URL params
  useEffect(() => {
    if (airports.length === 0 || autoSearchDone) return

    const fromCode = urlSearchParams.get('from')
    const toCode = urlSearchParams.get('to')
    const date = urlSearchParams.get('date')

    if (!fromCode && !toCode && !date) return

    const findAirport = (code) =>
      airports.find(a =>
        a.code === code ||
        a.code === `VN-${code}` ||
        a.code.endsWith(`-${code}`)
      )

    const fromAirport = fromCode ? findAirport(fromCode) : null
    const toAirport = toCode ? findAirport(toCode) : null

    const newForm = {
      originAirportId: fromAirport?.id || '',
      destinationAirportId: toAirport?.id || '',
      departureDate: date || '',
    }

    setSearchForm(newForm)

    if (fromAirport && toAirport && date) {
      setTimeout(() => {
        performSearch(newForm, sortBy, sortOrder)
        setAutoSearchDone(true)
      }, 400)
    }
  }, [airports, urlSearchParams, autoSearchDone])

  const performSearch = async (form, sb = sortBy, so = sortOrder) => {
    if (!form.originAirportId || !form.destinationAirportId) return

    if (form.originAirportId === form.destinationAirportId) {
      toast.error('Sân bay đi và đến không thể trùng nhau')
      return
    }

    setLoading(true)
    try {
      const params = { ...form, sortBy: sb, sortOrder: so }
      const { data } = await api.get('/public/flights', { params })
      const result = data.data || []
      setFlights(result)
      setSearched(true)
      if (result.length === 0) {
        toast.info('Không tìm thấy chuyến bay phù hợp')
      } else {
        toast.success(`Tìm thấy ${result.length} chuyến bay`)
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lỗi tìm kiếm chuyến bay')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    if (!searchForm.originAirportId || !searchForm.destinationAirportId) {
      toast.error('Vui lòng chọn sân bay đi và đến')
      return
    }
    performSearch(searchForm)
  }

  const handleSwap = () => {
    setSearchForm(prev => ({
      ...prev,
      originAirportId: prev.destinationAirportId,
      destinationAirportId: prev.originAirportId,
    }))
  }

  const handleSortChange = (newSortBy) => {
    const newOrder = newSortBy === sortBy && sortOrder === 'asc' ? 'desc' : 'asc'
    setSortBy(newSortBy)
    setSortOrder(newOrder)
    if (searched) performSearch(searchForm, newSortBy, newOrder)
  }

  const formatPrice = (price) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price)

  const formatDuration = (minutes) => {
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    return `${h}h ${m}m`
  }

  const originAirport = airports.find(a => a.id === searchForm.originAirportId)
  const destAirport = airports.find(a => a.id === searchForm.destinationAirportId)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Search Bar Section */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 py-8 px-4">
        <div className="container mx-auto max-w-5xl">
          <h1 className="text-white text-2xl font-bold mb-6 flex items-center gap-2">
            <Plane size={24} /> Tìm chuyến bay
          </h1>

          <form onSubmit={handleSearch}>
            <div className="bg-white rounded-2xl shadow-xl p-4 md:p-6">
              <div className="flex flex-col md:flex-row gap-3 items-end">
                {/* From */}
                <div className="flex-1 min-w-0">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                    Điểm đi
                  </label>
                  <select
                    className="select select-bordered w-full bg-gray-50 focus:bg-white text-sm"
                    value={searchForm.originAirportId}
                    onChange={(e) => setSearchForm({ ...searchForm, originAirportId: e.target.value })}
                    required
                  >
                    <option value="">Chọn sân bay đi</option>
                    {airports.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.city} ({a.code})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Swap button */}
                <button
                  type="button"
                  className="btn btn-circle btn-outline border-blue-300 text-blue-500 hover:bg-blue-50 hover:border-blue-500 self-end mb-1 shrink-0"
                  onClick={handleSwap}
                  title="Đổi chiều"
                >
                  <ArrowLeftRight size={16} />
                </button>

                {/* To */}
                <div className="flex-1 min-w-0">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                    Điểm đến
                  </label>
                  <select
                    className="select select-bordered w-full bg-gray-50 focus:bg-white text-sm"
                    value={searchForm.destinationAirportId}
                    onChange={(e) => setSearchForm({ ...searchForm, destinationAirportId: e.target.value })}
                    required
                  >
                    <option value="">Chọn sân bay đến</option>
                    {airports.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.city} ({a.code})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date */}
                <div className="w-full md:w-44 shrink-0">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                    Ngày bay
                  </label>
                  <input
                    type="date"
                    className="input input-bordered w-full bg-gray-50 focus:bg-white text-sm"
                    value={searchForm.departureDate}
                    onChange={(e) => setSearchForm({ ...searchForm, departureDate: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>

                {/* Search button */}
                <button
                  type="submit"
                  className="btn btn-primary px-8 self-end mb-0.5 shrink-0"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="loading loading-spinner loading-sm" />
                  ) : (
                    <Search size={18} />
                  )}
                  <span className="ml-1">{loading ? 'Đang tìm...' : 'Tìm kiếm'}</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Results Section */}
      <div className="container mx-auto max-w-5xl px-4 py-6">
        {/* Sort bar — only show after search */}
        {searched && flights.length > 0 && (
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <span className="flex items-center gap-1 text-sm text-gray-500 font-medium">
              <SlidersHorizontal size={15} /> Sắp xếp:
            </span>
            <button
              className={`btn btn-sm gap-1 ${sortBy === 'departureTime' ? 'btn-primary' : 'btn-ghost border border-gray-200'}`}
              onClick={() => handleSortChange('departureTime')}
            >
              <Clock size={13} />
              Giờ bay
              {sortBy === 'departureTime' && (
                <span className="text-xs opacity-70">{sortOrder === 'asc' ? '↑' : '↓'}</span>
              )}
            </button>
            <button
              className={`btn btn-sm gap-1 ${sortBy === 'basePrice' ? 'btn-primary' : 'btn-ghost border border-gray-200'}`}
              onClick={() => handleSortChange('basePrice')}
            >
              <TrendingUp size={13} />
              Giá vé
              {sortBy === 'basePrice' && (
                <span className="text-xs opacity-70">{sortOrder === 'asc' ? '↑' : '↓'}</span>
              )}
            </button>
            <span className="ml-auto text-sm text-gray-500">
              {flights.length} chuyến bay
              {originAirport && destAirport && (
                <span className="font-medium text-gray-700">
                  {' '}· {originAirport.city} → {destAirport.city}
                </span>
              )}
            </span>
          </div>
        )}

        {/* Flight cards */}
        {flights.length > 0 && (
          <div className="space-y-3">
            {flights.map((flight) => (
              <div
                key={flight.id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-100 transition-all"
              >
                <div className="p-4 md:p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  {/* Left: flight info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="bg-blue-50 text-blue-700 text-xs font-bold px-2 py-0.5 rounded">
                        {flight.flightNumber}
                      </span>
                      <span className="text-xs text-gray-400">{getAirlineName(flight.flightNumber)}</span>
                    </div>

                    <div className="flex items-center gap-4">
                      {/* Departure */}
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-800">
                          {new Date(flight.departureTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div className="text-sm font-medium text-gray-600">{flight.origin?.city}</div>
                        <div className="text-xs text-gray-400">
                          {new Date(flight.departureTime).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                        </div>
                      </div>

                      {/* Duration */}
                      <div className="flex-1 flex flex-col items-center">
                        <div className="text-xs text-gray-400 mb-1">{formatDuration(flight.duration)}</div>
                        <div className="flex items-center w-full gap-1">
                          <div className="h-px bg-gray-200 flex-1" />
                          <Plane size={14} className="text-blue-400 shrink-0" />
                          <div className="h-px bg-gray-200 flex-1" />
                        </div>
                        <div className="text-xs text-gray-400 mt-1">Bay thẳng</div>
                      </div>

                      {/* Arrival */}
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-800">
                          {new Date(flight.arrivalTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div className="text-sm font-medium text-gray-600">{flight.destination?.city}</div>
                        <div className="text-xs text-gray-400">
                          {new Date(flight.arrivalTime).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                        </div>
                      </div>
                    </div>

                    {/* Seat availability */}
                    <div className="flex gap-4 mt-3 text-xs">
                      <span className={flight.economyAvailable > 0 ? 'text-green-600' : 'text-red-400'}>
                        Phổ thông: <strong>{flight.economyAvailable} ghế</strong>
                      </span>
                      <span className={flight.businessAvailable > 0 ? 'text-green-600' : 'text-red-400'}>
                        Thương gia: <strong>{flight.businessAvailable} ghế</strong>
                      </span>
                    </div>
                  </div>

                  {/* Right: price & CTA */}
                  <div className="flex md:flex-col items-center md:items-end gap-4 md:gap-2 w-full md:w-auto">
                    <div className="text-right">
                      <div className="text-xs text-gray-400">Giá từ</div>
                      <div className="text-xl font-bold text-blue-600">{formatPrice(flight.basePrice)}</div>
                    </div>
                    <button
                      className="btn btn-primary btn-sm w-32"
                      onClick={() => navigate(`/flights/${flight.id}`)}
                      disabled={flight.economyAvailable === 0 && flight.businessAvailable === 0}
                    >
                      {flight.economyAvailable === 0 && flight.businessAvailable === 0
                        ? 'Hết chỗ'
                        : 'Chọn chuyến'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && searched && flights.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">✈️</div>
            <p className="text-lg font-medium text-gray-600">Không tìm thấy chuyến bay phù hợp</p>
            <p className="text-sm text-gray-400 mt-1">Thử chọn ngày khác hoặc điểm đến khác</p>
          </div>
        )}

        {/* Initial state */}
        {!searched && !loading && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🔍</div>
            <p className="text-lg font-medium text-gray-500">Chọn điểm đi, điểm đến và nhấn tìm kiếm</p>
          </div>
        )}
      </div>
    </div>
  )
}
