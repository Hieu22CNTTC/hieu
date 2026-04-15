import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import api from '../utils/api'
import toast from 'react-hot-toast'

export default function SearchFlights() {
  const navigate = useNavigate()
  const [urlSearchParams] = useSearchParams()
  const [airports, setAirports] = useState([])
  const [loading, setLoading] = useState(false)
  const [flights, setFlights] = useState([])
  const [autoSearchDone, setAutoSearchDone] = useState(false)
  
  const [searchParams, setSearchParams] = useState({
    originAirportId: '',
    destinationAirportId: '',
    departureDate: '',
    sortBy: 'departureTime',
    sortOrder: 'asc'
  })

  // Load airports
  useEffect(() => {
    const fetchAirports = async () => {
      try {
        const { data } = await api.get('/public/airports')
        const airportsList = data.data || []
        console.log('🛫 LOADED AIRPORTS FROM API:', airportsList.length)
        airportsList.forEach((a, i) => {
          console.log(`  ${i + 1}. Code="${a.code}" Name="${a.name}"`)
        })
        setAirports(airportsList)
      } catch (error) {
        console.error('Error loading airports:', error)
        toast.error('Không thể tải danh sách sân bay')
      }
    }
    fetchAirports()
  }, [])

  // Parse URL params and auto-fill form
  useEffect(() => {
    console.log('=== AUTO-SEARCH EFFECT ===')
    console.log('Airports loaded:', airports.length)
    console.log('Auto search done:', autoSearchDone)
    
    if (airports.length > 0 && !autoSearchDone) {
      const fromCode = urlSearchParams.get('from')
      const toCode = urlSearchParams.get('to')
      const date = urlSearchParams.get('date')

      console.log('URL Params from URL:', { fromCode, toCode, date })
      
      // Log each airport individually
      console.log('=== ALL AIRPORTS ===')
      airports.forEach((a, index) => {
        console.log(`Airport ${index + 1}: Code="${a.code}" Name="${a.name}" ID="${a.id}"`)
      })

      if (fromCode || toCode || date) {
        // Find airport IDs from codes (handle both "HAN" and "VN-HAN" formats)
        console.log(`\n=== SEARCHING FOR AIRPORTS ===`)
        console.log(`Looking for FROM airport with code: "${fromCode}"`)
        const fromAirport = airports.find(a => 
          a.code === fromCode || 
          a.code === `VN-${fromCode}` || 
          a.code.endsWith(`-${fromCode}`)
        )
        console.log('Found FROM airport:', fromAirport ? `${fromAirport.name} (${fromAirport.code})` : 'NOT FOUND!')
        
        console.log(`Looking for TO airport with code: "${toCode}"`)
        const toAirport = airports.find(a => 
          a.code === toCode || 
          a.code === `VN-${toCode}` || 
          a.code.endsWith(`-${toCode}`)
        )
        console.log('Found TO airport:', toAirport ? `${toAirport.name} (${toAirport.code})` : 'NOT FOUND!')

        const newParams = {
          originAirportId: fromAirport?.id || '',
          destinationAirportId: toAirport?.id || '',
          departureDate: date || '',
          sortBy: 'departureTime',
          sortOrder: 'asc'
        }

        console.log('Setting search params:', newParams)
        setSearchParams(newParams)

        // Auto search if we have both airports and date
        if (fromAirport && toAirport && date) {
          console.log('✅ All conditions met - Auto-searching!')
          setTimeout(() => {
            performSearch(newParams)
            setAutoSearchDone(true)
          }, 500)
        } else {
          console.log('❌ Missing data:', {
            hasFromAirport: !!fromAirport,
            hasToAirport: !!toAirport,
            hasDate: !!date
          })
        }
      } else {
        console.log('No URL params found')
      }
    }
  }, [airports, urlSearchParams, autoSearchDone])

  const performSearch = async (params) => {
    if (!params.originAirportId || !params.destinationAirportId) {
      return
    }

    if (params.originAirportId === params.destinationAirportId) {
      toast.error('Sân bay đi và đến không thể trùng nhau')
      return
    }

    setLoading(true)
    try {
      const { data } = await api.get('/public/flights', { params })
      setFlights(data.data || [])
      
      if (data.data.length === 0) {
        toast.info('Không tìm thấy chuyến bay phù hợp')
      } else {
        toast.success(`Tìm thấy ${data.data.length} chuyến bay`)
      }
    } catch (error) {
      console.error('Search error:', error)
      toast.error(error.response?.data?.message || 'Lỗi tìm kiếm chuyến bay')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async (e) => {
    e.preventDefault()
    
    if (!searchParams.originAirportId || !searchParams.destinationAirportId) {
      toast.error('Vui lòng chọn sân bay đi và đến')
      return
    }

    performSearch(searchParams)
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price)
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

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Tìm kiếm chuyến bay</h1>

      {/* Search Form */}
      <div className="card bg-base-100 shadow-xl mb-8">
        <div className="card-body">
          <form onSubmit={handleSearch}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Origin Airport */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Từ</span>
                </label>
                <select
                  className="select select-bordered w-full"
                  value={searchParams.originAirportId}
                  onChange={(e) => setSearchParams({ ...searchParams, originAirportId: e.target.value })}
                  required
                >
                  <option value="">Chọn sân bay đi</option>
                  {airports.map((airport) => (
                    <option key={airport.id} value={airport.id}>
                      {airport.city} ({airport.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Destination Airport */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Đến</span>
                </label>
                <select
                  className="select select-bordered w-full"
                  value={searchParams.destinationAirportId}
                  onChange={(e) => setSearchParams({ ...searchParams, destinationAirportId: e.target.value })}
                  required
                >
                  <option value="">Chọn sân bay đến</option>
                  {airports.map((airport) => (
                    <option key={airport.id} value={airport.id}>
                      {airport.city} ({airport.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Departure Date */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Ngày bay</span>
                </label>
                <input
                  type="date"
                  className="input input-bordered w-full"
                  value={searchParams.departureDate}
                  onChange={(e) => setSearchParams({ ...searchParams, departureDate: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              {/* Sort By */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Sắp xếp theo</span>
                </label>
                <select
                  className="select select-bordered w-full"
                  value={searchParams.sortBy}
                  onChange={(e) => setSearchParams({ ...searchParams, sortBy: e.target.value })}
                >
                  <option value="departureTime">Giờ bay</option>
                  <option value="basePrice">Giá vé</option>
                </select>
              </div>
            </div>

            <div className="card-actions justify-end mt-4">
              <button
                type="submit"
                className={`btn btn-primary ${loading ? 'loading' : ''}`}
                disabled={loading}
              >
                {loading ? 'Đang tìm...' : 'Tìm kiếm'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Results */}
      {flights.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Kết quả tìm kiếm ({flights.length} chuyến bay)</h2>
          
          {flights.map((flight) => (
            <div key={flight.id} className="card bg-base-100 shadow-lg hover:shadow-xl transition-shadow">
              <div className="card-body">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  {/* Flight Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                      <div className="badge badge-primary">{flight.flightNumber}</div>
                      <div className="text-sm text-gray-500">{flight.aircraft?.model}</div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                      {/* Departure */}
                      <div>
                        <div className="text-xs text-gray-500">Khởi hành</div>
                        <div className="font-bold text-lg">{flight.origin?.city}</div>
                        <div className="text-sm">{formatDateTime(flight.departureTime)}</div>
                      </div>

                      {/* Duration */}
                      <div className="text-center">
                        <div className="text-xs text-gray-500">Thời gian bay</div>
                        <div className="font-bold">{formatDuration(flight.duration)}</div>
                        <div className="text-xs text-gray-500 mt-1">Bay thẳng</div>
                      </div>

                      {/* Arrival */}
                      <div className="text-right">
                        <div className="text-xs text-gray-500">Hạ cánh</div>
                        <div className="font-bold text-lg">{flight.destination?.city}</div>
                        <div className="text-sm">{formatDateTime(flight.arrivalTime)}</div>
                      </div>
                    </div>

                    {/* Seats Available */}
                    <div className="flex gap-4 mt-3 text-sm">
                      <div>
                        <span className="text-gray-500">Phổ thông:</span>{' '}
                        <span className={flight.economyAvailable > 0 ? 'text-success' : 'text-error'}>
                          {flight.economyAvailable} ghế
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Thương gia:</span>{' '}
                        <span className={flight.businessAvailable > 0 ? 'text-success' : 'text-error'}>
                          {flight.businessAvailable} ghế
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Price & Action */}
                  <div className="text-right">
                    <div className="text-xs text-gray-500">Giá từ</div>
                    <div className="text-2xl font-bold text-primary">{formatPrice(flight.basePrice)}</div>
                    <button
                      className="btn btn-primary btn-sm mt-3"
                      onClick={() => navigate(`/flights/${flight.id}`)}
                      disabled={flight.economyAvailable === 0 && flight.businessAvailable === 0}
                    >
                      Chọn chuyến bay
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No results */}
      {!loading && flights.length === 0 && searchParams.originAirportId && (
        <div className="card bg-base-200 shadow-xl">
          <div className="card-body text-center">
            <p className="text-lg">Không tìm thấy chuyến bay phù hợp</p>
            <p className="text-sm text-gray-500">Vui lòng thử lại với tiêu chí khác</p>
          </div>
        </div>
      )}
    </div>
  )
}
