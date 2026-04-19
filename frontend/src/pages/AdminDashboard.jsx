import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Users, Plane, MapPin, Ticket, 
  DollarSign, TrendingUp, Calendar, 
  Settings, LogOut, BarChart3, Download,
  Receipt
} from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../utils/api'
import { useAuthStore } from '../stores/authStore'
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [flights, setFlights] = useState([])
  const [airports, setAirports] = useState([])
  const [bookings, setBookings] = useState([])
  const [aircrafts, setAircrafts] = useState([])
  const [coupons, setCoupons] = useState([])
  const [chartData, setChartData] = useState({
    revenue: [],
    bookings: [],
    routes: []
  })
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  })
  
  // Modal states
  const [showUserModal, setShowUserModal] = useState(false)
  const [showAirportModal, setShowAirportModal] = useState(false)
  const [showAircraftModal, setShowAircraftModal] = useState(false)
  const [showFlightModal, setShowFlightModal] = useState(false)
  const [showCouponModal, setShowCouponModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [selectedAirport, setSelectedAirport] = useState(null)
  const [selectedAircraft, setSelectedAircraft] = useState(null)
  const [selectedFlight, setSelectedFlight] = useState(null)
  const [selectedCoupon, setSelectedCoupon] = useState(null)
  const [routes, setRoutes] = useState([])
  const [userForm, setUserForm] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    password: '',
    role: 'USER'
  })
  const [airportForm, setAirportForm] = useState({
    code: '',
    name: '',
    city: '',
    country: '',
    timezone: ''
  })
  const [aircraftForm, setAircraftForm] = useState({
    model: '',
    totalSeats: '',
    businessSeats: '',
    economySeats: ''
  })
  const [flightForm, setFlightForm] = useState({
    flightNumber: '',
    routeId: '',
    aircraftId: '',
    departureTime: '',
    arrivalTime: '',
    basePrice: '',
    businessPrice: '',
    status: 'SCHEDULED'
  })
  const [couponForm, setCouponForm] = useState({
    code: '',
    discountPercent: '',
    maxDiscount: '',
    validFrom: '',
    validTo: '',
    usageLimit: '',
    isActive: true
  })

  useEffect(() => {
    if (!user || user.role !== 'ADMIN') {
      toast.error('Bạn không có quyền truy cập trang này')
      navigate('/')
      return
    }
    loadDashboardData()
  }, [user, navigate, activeTab])

  useEffect(() => {
    if (activeTab === 'dashboard') {
      loadChartData()
    }
  }, [dateRange, activeTab])

  const loadChartData = async () => {
    try {
      const { data } = await api.get('/admin/statistics', {
        params: {
          startDate: dateRange.startDate,
          endDate: dateRange.endDate
        }
      })
      setChartData({
        revenue: data.data?.revenueByDate || [],
        bookings: data.data?.bookingsByDate || [],
        routes: data.data?.topRoutes || []
      })
    } catch (error) {
      console.error('Error loading chart data:', error)
    }
  }

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      const [statsRes, usersRes, airportsRes, aircraftsRes, couponsRes, flightsRes, routesRes, bookingsRes] = await Promise.all([
        api.get('/admin/dashboard'),
        api.get('/admin/users'),
        api.get('/admin/airports'),
        api.get('/admin/aircraft'),
        api.get('/admin/coupons'),
        api.get('/manager/flights'),
        api.get('/manager/routes'),
        api.get('/sales/bookings')
      ])
      
      // Extract overview from stats response
      const statsData = statsRes.data.data
      setStats({
        totalUsers: statsData?.overview?.totalUsers || 0,
        totalBookings: statsData?.overview?.totalBookings || 0,
        totalFlights: statsData?.overview?.totalFlights || 0,
        totalRevenue: statsData?.overview?.totalRevenue || 0,
        recentActivities: statsData?.recentBookings || []
      })
      
      const usersArray = usersRes.data.data?.users || []
      const airportsArray = airportsRes.data.data?.airports || []
      const aircraftsArray = aircraftsRes.data.data?.aircrafts || []
      const couponsArray = couponsRes.data.data?.coupons || []
      const flightsArray = flightsRes.data.data?.flights || []
      const routesArray = routesRes.data.data?.routes || []
      const bookingsArray = bookingsRes.data.data || []
      
      // Sort users: ADMIN first, then MANAGER, then SALES, then USER
      const sortedUsers = usersArray.sort((a, b) => {
        const roleOrder = { 'ADMIN': 1, 'MANAGER': 2, 'SALES': 3, 'USER': 4 }
        return (roleOrder[a.role] || 5) - (roleOrder[b.role] || 5)
      })
      
      setUsers(sortedUsers)
      setFlights(flightsArray)
      setAirports(airportsArray)
      setAircrafts(aircraftsArray)
      setRoutes(routesArray)
      setCoupons(couponsArray)
      setBookings(bookingsArray)
    } catch (error) {
      toast.error('Không thể tải dữ liệu')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
    toast.success('Đã đăng xuất')
  }

  // User Management Functions
  const toggleUserStatus = async (userId, currentStatus) => {
    try {
      await api.patch(`/admin/users/${userId}/toggle`)
      toast.success('Cập nhật trạng thái thành công')
      loadDashboardData()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể cập nhật trạng thái')
    }
  }

  const openUserModal = (user = null) => {
    if (user) {
      setSelectedUser(user)
      setUserForm({
        fullName: user.fullName,
        email: user.email,
        phoneNumber: user.phoneNumber || '',
        password: '',
        role: user.role
      })
    } else {
      setSelectedUser(null)
      setUserForm({
        fullName: '',
        email: '',
        phoneNumber: '',
        password: '',
        role: 'USER'
      })
    }
    setShowUserModal(true)
  }

  const handleUserSubmit = async (e) => {
    e.preventDefault()
    try {
      if (selectedUser) {
        // Update user
        await api.put(`/admin/users/${selectedUser.id}`, userForm)
        toast.success('Cập nhật người dùng thành công')
      } else {
        // Create user - password is required for new users
        if (!userForm.password) {
          toast.error('Mật khẩu là bắt buộc cho người dùng mới')
          return
        }
        await api.post('/admin/users', userForm)
        toast.success('Thêm người dùng thành công')
      }
      setShowUserModal(false)
      loadDashboardData()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể lưu người dùng')
    }
  }

  const deleteUser = async (userId) => {
    if (!confirm('Bạn có chắc muốn xóa người dùng này?')) return
    try {
      await api.delete(`/admin/users/${userId}`)
      toast.success('Xóa người dùng thành công')
      loadDashboardData()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể xóa người dùng')
    }
  }

  // Airport Management Functions
  const openAirportModal = (airport = null) => {
    if (airport) {
      setSelectedAirport(airport)
      setAirportForm({
        code: airport.code,
        name: airport.name,
        city: airport.city,
        country: airport.country,
        timezone: airport.timezone
      })
    } else {
      setSelectedAirport(null)
      setAirportForm({
        code: '',
        name: '',
        city: '',
        country: '',
        timezone: ''
      })
    }
    setShowAirportModal(true)
  }

  const handleAirportSubmit = async (e) => {
    e.preventDefault()
    try {
      if (selectedAirport) {
        await api.put(`/admin/airports/${selectedAirport.id}`, airportForm)
        toast.success('Cập nhật sân bay thành công')
      } else {
        await api.post('/admin/airports', airportForm)
        toast.success('Thêm sân bay thành công')
      }
      setShowAirportModal(false)
      loadDashboardData()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể lưu sân bay')
    }
  }

  const deleteAirport = async (airportId) => {
    if (!confirm('Bạn có chắc muốn xóa sân bay này?')) return
    try {
      await api.delete(`/admin/airports/${airportId}`)
      toast.success('Xóa sân bay thành công')
      loadDashboardData()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể xóa sân bay')
    }
  }

  // Flight Management Functions
  const openFlightModal = (flight = null) => {
    if (flight) {
      setSelectedFlight(flight)
      setFlightForm({
        flightNumber: flight.flightNumber,
        routeId: flight.routeId,
        aircraftId: flight.aircraftId,
        departureTime: flight.departureTime ? new Date(flight.departureTime).toISOString().slice(0, 16) : '',
        arrivalTime: flight.arrivalTime ? new Date(flight.arrivalTime).toISOString().slice(0, 16) : '',
        basePrice: flight.basePrice,
        businessPrice: flight.businessPrice || flight.basePrice * 1.5,
        status: flight.status
      })
    } else {
      setSelectedFlight(null)
      setFlightForm({
        flightNumber: '',
        routeId: '',
        aircraftId: '',
        departureTime: '',
        arrivalTime: '',
        basePrice: 0,
        businessPrice: 0,
        status: 'SCHEDULED'
      })
    }
    setShowFlightModal(true)
  }

  const handleFlightSubmit = async (e) => {
    e.preventDefault()
    
    // Validate times
    if (flightForm.arrivalTime && flightForm.departureTime) {
      if (new Date(flightForm.arrivalTime) <= new Date(flightForm.departureTime)) {
        toast.error('Thời gian hạ cánh phải sau thời gian khởi hành')
        return
      }
    }
    
    // Auto-calculate businessPrice if not set
    const submitData = {
      ...flightForm,
      basePrice: parseInt(flightForm.basePrice) || 0,
      businessPrice: parseInt(flightForm.businessPrice) || (parseInt(flightForm.basePrice) * 1.5)
    }
    
    try {
      if (selectedFlight) {
        await api.put(`/manager/flights/${selectedFlight.id}`, submitData)
        toast.success('Cập nhật chuyến bay thành công')
      } else {
        await api.post('/manager/flights', submitData)
        toast.success('Thêm chuyến bay thành công')
      }
      setShowFlightModal(false)
      loadDashboardData()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể lưu chuyến bay')
    }
  }

  const deleteFlight = async (flightId) => {
    if (!confirm('Bạn có chắc muốn xóa chuyến bay này?')) return
    try {
      await api.delete(`/manager/flights/${flightId}`)
      toast.success('Xóa chuyến bay thành công')
      loadDashboardData()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể xóa chuyến bay')
    }
  }

  // Aircraft Management Functions
  const openAircraftModal = (aircraft = null) => {
    if (aircraft) {
      setSelectedAircraft(aircraft)
      setAircraftForm({
        model: aircraft.model,
        totalSeats: aircraft.totalSeats.toString(),
        businessSeats: aircraft.businessSeats.toString(),
        economySeats: aircraft.economySeats.toString()
      })
    } else {
      setSelectedAircraft(null)
      setAircraftForm({
        model: '',
        totalSeats: '',
        businessSeats: '',
        economySeats: ''
      })
    }
    setShowAircraftModal(true)
  }

  const handleAircraftSubmit = async (e) => {
    e.preventDefault()
    
    const submitData = {
      model: aircraftForm.model,
      totalSeats: parseInt(aircraftForm.totalSeats) || 0,
      businessSeats: parseInt(aircraftForm.businessSeats) || 0,
      economySeats: parseInt(aircraftForm.economySeats) || 0
    }
    
    try {
      if (selectedAircraft) {
        await api.put(`/admin/aircrafts/${selectedAircraft.id}`, submitData)
        toast.success('Cập nhật máy bay thành công')
      } else {
        await api.post('/admin/aircrafts', submitData)
        toast.success('Thêm máy bay thành công')
      }
      setShowAircraftModal(false)
      loadDashboardData()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể lưu máy bay')
    }
  }

  const deleteAircraft = async (aircraftId) => {
    if (!confirm('Bạn có chắc muốn xóa máy bay này?')) return
    try {
      await api.delete(`/admin/aircrafts/${aircraftId}`)
      toast.success('Xóa máy bay thành công')
      loadDashboardData()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể xóa máy bay')
    }
  }

  // Coupon Management Functions
  const openCouponModal = (coupon = null) => {
    if (coupon) {
      setSelectedCoupon(coupon)
      setCouponForm({
        code: coupon.code,
        discountPercent: coupon.discountPercent.toString(),
        maxDiscount: coupon.maxDiscount?.toString() || '',
        validFrom: coupon.validFrom.split('T')[0],
        validTo: coupon.validTo.split('T')[0],
        usageLimit: coupon.usageLimit?.toString() || '',
        isActive: coupon.isActive
      })
    } else {
      setSelectedCoupon(null)
      setCouponForm({
        code: '',
        discountPercent: '',
        maxDiscount: '',
        validFrom: '',
        validTo: '',
        usageLimit: '',
        isActive: true
      })
    }
    setShowCouponModal(true)
  }

  const handleCouponSubmit = async (e) => {
    e.preventDefault()
    
    const submitData = {
      code: couponForm.code.toUpperCase(),
      discountPercent: parseFloat(couponForm.discountPercent),
      maxDiscount: couponForm.maxDiscount ? parseFloat(couponForm.maxDiscount) : null,
      validFrom: new Date(couponForm.validFrom).toISOString(),
      validTo: new Date(couponForm.validTo).toISOString(),
      usageLimit: couponForm.usageLimit ? parseInt(couponForm.usageLimit) : null,
      isActive: couponForm.isActive
    }
    
    try {
      if (selectedCoupon) {
        await api.put(`/admin/coupons/${selectedCoupon.id}`, submitData)
        toast.success('Cập nhật mã giảm giá thành công')
      } else {
        await api.post('/admin/coupons', submitData)
        toast.success('Thêm mã giảm giá thành công')
      }
      setShowCouponModal(false)
      loadDashboardData()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể lưu mã giảm giá')
    }
  }

  const deleteCoupon = async (couponId) => {
    if (!confirm('Bạn có chắc muốn xóa mã giảm giá này?')) return
    try {
      await api.delete(`/admin/coupons/${couponId}`)
      toast.success('Xóa mã giảm giá thành công')
      loadDashboardData()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể xóa mã giảm giá')
    }
  }

  const toggleCouponStatus = async (couponId) => {
    try {
      await api.patch(`/admin/coupons/${couponId}/toggle`)
      toast.success('Cập nhật trạng thái thành công')
      loadDashboardData()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể cập nhật trạng thái')
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-base-200">
      {/* Header */}
      <div className="navbar bg-primary text-primary-content shadow-lg">
        <div className="flex-1">
          <a className="btn btn-ghost normal-case text-xl">
            <Settings className="mr-2" />
            Admin Dashboard
          </a>
        </div>
        <div className="flex-none gap-2">
          <div className="dropdown dropdown-end">
            <label tabIndex={0} className="btn btn-ghost">
              <div className="avatar placeholder">
                <div className="bg-neutral-focus text-neutral-content rounded-full w-10">
                  <span className="text-xl">{user?.fullName?.charAt(0)}</span>
                </div>
              </div>
            </label>
            <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52">
              <li className="menu-title">{user?.fullName}</li>
              <li><a onClick={() => navigate('/')}>Về trang chủ</a></li>
              <li><a onClick={handleLogout}><LogOut />Đăng xuất</a></li>
            </ul>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-base-100 min-h-screen shadow-lg">
          <ul className="menu p-4 gap-2">
            <li>
              <a 
                className={activeTab === 'dashboard' ? 'active' : ''}
                onClick={() => setActiveTab('dashboard')}
              >
                <BarChart3 />
                Tổng quan
              </a>
            </li>
            <li>
              <a 
                className={activeTab === 'flights' ? 'active' : ''}
                onClick={() => setActiveTab('flights')}
              >
                <Plane />
                Chuyến bay
              </a>
            </li>
            <li>
              <a 
                className={activeTab === 'airports' ? 'active' : ''}
                onClick={() => setActiveTab('airports')}
              >
                <MapPin />
                Sân bay
              </a>
            </li>
            <li>
              <a 
                className={activeTab === 'aircrafts' ? 'active' : ''}
                onClick={() => setActiveTab('aircrafts')}
              >
                <Plane />
                Máy bay
              </a>
            </li>
            <li>
              <a 
                className={activeTab === 'users' ? 'active' : ''}
                onClick={() => setActiveTab('users')}
              >
                <Users />
                Người dùng
              </a>
            </li>
            <li>
              <a 
                className={activeTab === 'coupons' ? 'active' : ''}
                onClick={() => setActiveTab('coupons')}
              >
                <Ticket />
                Mã giảm giá
              </a>
            </li>
            <li>
              <a 
                className={activeTab === 'bookings' ? 'active' : ''}
                onClick={() => setActiveTab('bookings')}
              >
                <Receipt />
                Đặt vé
              </a>
            </li>
          </ul>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8">
          {/* Dashboard Overview */}
          {activeTab === 'dashboard' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold">Tổng quan hệ thống</h2>
                <div className="flex gap-2">
                  <input
                    type="date"
                    className="input input-bordered input-sm"
                    value={dateRange.startDate}
                    onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                  />
                  <span className="self-center">-</span>
                  <input
                    type="date"
                    className="input input-bordered input-sm"
                    value={dateRange.endDate}
                    onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                  />
                  <button className="btn btn-sm btn-primary">
                    <Download size={16} className="mr-1" />
                    Export
                  </button>
                </div>
              </div>
              
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-xl hover:shadow-2xl transition-shadow">
                  <div className="card-body p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-xs font-medium opacity-90 mb-1">Tổng người dùng</p>
                        <h3 className="text-3xl font-bold leading-tight">{stats?.totalUsers || 0}</h3>
                      </div>
                      <Users size={40} className="opacity-40 flex-shrink-0" />
                    </div>
                  </div>
                </div>

                <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white shadow-xl hover:shadow-2xl transition-shadow">
                  <div className="card-body p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-xs font-medium opacity-90 mb-1">Tổng đặt vé</p>
                        <h3 className="text-3xl font-bold leading-tight">{stats?.totalBookings || 0}</h3>
                      </div>
                      <Ticket size={40} className="opacity-40 flex-shrink-0" />
                    </div>
                  </div>
                </div>

                <div className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-xl hover:shadow-2xl transition-shadow">
                  <div className="card-body p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-xs font-medium opacity-90 mb-1">Chuyến bay</p>
                        <h3 className="text-3xl font-bold leading-tight">{stats?.totalFlights || 0}</h3>
                      </div>
                      <Plane size={40} className="opacity-40 flex-shrink-0" />
                    </div>
                  </div>
                </div>

                <div className="card bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-xl hover:shadow-2xl transition-shadow">
                  <div className="card-body p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium opacity-90 mb-1">Doanh thu</p>
                        <h3 className="text-xl font-bold leading-tight break-words">
                          {new Intl.NumberFormat('vi-VN', {
                            style: 'currency',
                            currency: 'VND'
                          }).format(stats?.totalRevenue || 0)}
                        </h3>
                      </div>
                      <DollarSign size={40} className="opacity-40 flex-shrink-0" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Revenue Chart */}
                <div className="card bg-base-100 shadow-xl">
                  <div className="card-body">
                    <h3 className="card-title text-purple-600">
                      <TrendingUp size={20} />
                      Biểu đồ doanh thu
                    </h3>
                    {chartData.revenue.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={chartData.revenue}>
                          <defs>
                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis 
                            dataKey="date" 
                            tick={{ fontSize: 12 }}
                            tickFormatter={(value) => new Date(value).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                          />
                          <YAxis 
                            tick={{ fontSize: 12 }}
                            tickFormatter={(value) => (value / 1000000).toFixed(1) + 'M'}
                          />
                          <Tooltip 
                            formatter={(value) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)}
                            labelFormatter={(label) => new Date(label).toLocaleDateString('vi-VN')}
                          />
                          <Legend />
                          <Line 
                            type="monotone" 
                            dataKey="revenue" 
                            stroke="#8b5cf6" 
                            strokeWidth={3}
                            fill="url(#colorRevenue)"
                            name="Doanh thu" 
                            dot={{ fill: '#8b5cf6', r: 4 }}
                            activeDot={{ r: 6 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-[300px] text-gray-400">
                        <div className="text-center">
                          <TrendingUp size={48} className="mx-auto mb-2 opacity-30" />
                          <p>Chưa có dữ liệu doanh thu</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bookings Chart */}
                <div className="card bg-base-100 shadow-xl">
                  <div className="card-body">
                    <h3 className="card-title text-green-600">
                      <Calendar size={20} />
                      Số lượng đặt vé
                    </h3>
                    {chartData.bookings.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={chartData.bookings}>
                          <defs>
                            <linearGradient id="colorBookings" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0.4}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis 
                            dataKey="date" 
                            tick={{ fontSize: 12 }}
                            tickFormatter={(value) => new Date(value).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                          />
                          <YAxis 
                            tick={{ fontSize: 12 }}
                            allowDecimals={false}
                          />
                          <Tooltip 
                            formatter={(value) => [`${value} booking`, 'Số lượng']}
                            labelFormatter={(label) => new Date(label).toLocaleDateString('vi-VN')}
                          />
                          <Legend />
                          <Bar 
                            dataKey="count" 
                            fill="url(#colorBookings)" 
                            name="Số booking"
                            radius={[8, 8, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-[300px] text-gray-400">
                        <div className="text-center">
                          <Calendar size={48} className="mx-auto mb-2 opacity-30" />
                          <p>Chưa có dữ liệu đặt vé</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Top Routes Chart */}
                <div className="card bg-base-100 shadow-xl lg:col-span-2">
                  <div className="card-body">
                    <h3 className="card-title text-blue-600">
                      <Plane size={20} />
                      Top tuyến bay phổ biến
                    </h3>
                    {chartData.routes.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={chartData.routes} layout="vertical">
                          <defs>
                            <linearGradient id="colorRoutes" x1="0" y1="0" x2="1" y2="0">
                              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.4}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis 
                            type="number" 
                            tick={{ fontSize: 12 }}
                            allowDecimals={false}
                          />
                          <YAxis 
                            dataKey="route" 
                            type="category" 
                            width={150} 
                            tick={{ fontSize: 12 }}
                          />
                          <Tooltip 
                            formatter={(value) => [`${value} booking`, 'Số lượng']}
                          />
                          <Legend />
                          <Bar 
                            dataKey="bookings" 
                            fill="url(#colorRoutes)" 
                            name="Số lượng đặt vé"
                            radius={[0, 8, 8, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-[300px] text-gray-400">
                        <div className="text-center">
                          <Plane size={48} className="mx-auto mb-2 opacity-30" />
                          <p>Chưa có dữ liệu tuyến bay</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="card bg-base-100 shadow-xl">
                <div className="card-body">
                  <h3 className="card-title">Hoạt động gần đây</h3>
                  <div className="overflow-x-auto">
                    <table className="table table-zebra">
                      <thead>
                        <tr>
                          <th>Người dùng</th>
                          <th>Hoạt động</th>
                          <th>Thời gian</th>
                          <th>Trạng thái</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats?.recentActivities?.map((activity) => (
                          <tr key={activity.id}>
                            <td>{activity.user?.fullName || 'Guest'}</td>
                            <td>Đặt vé {activity.flight?.flightNumber}</td>
                            <td>{new Date(activity.createdAt).toLocaleString('vi-VN')}</td>
                            <td>
                              <span className={`badge ${
                                activity.status === 'CONFIRMED' ? 'badge-success' :
                                activity.status === 'PENDING' ? 'badge-warning' :
                                'badge-error'
                              }`}>
                                {activity.status}
                              </span>
                            </td>
                          </tr>
                        )) || (
                          <tr>
                            <td colSpan="4" className="text-center">Chưa có hoạt động</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Flights Management */}
          {activeTab === 'flights' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold">Quản lý chuyến bay</h2>
                <button 
                  className="btn btn-primary"
                  onClick={() => openFlightModal()}
                >
                  <Plane className="mr-2" />
                  Thêm chuyến bay
                </button>
              </div>

              <div className="card bg-base-100 shadow-xl">
                <div className="card-body">
                  {flights.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">Không có dữ liệu chuyến bay</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                    <table className="table table-zebra">
                      <thead>
                        <tr>
                          <th>Mã chuyến bay</th>
                          <th>Tuyến đường</th>
                          <th>Máy bay</th>
                          <th>Thời gian khởi hành</th>
                          <th>Trạng thái</th>
                          <th>Giá</th>
                          <th>Hành động</th>
                        </tr>
                      </thead>
                      <tbody>
                        {flights.map((flight) => (
                          <tr key={flight.id}>
                            <td className="font-bold">{flight.flightNumber}</td>
                            <td>
                              {flight.route?.departure?.city} → {flight.route?.arrival?.city}
                            </td>
                            <td>{flight.aircraft?.model || 'N/A'}</td>
                            <td>
                              {new Date(flight.departureTime).toLocaleString('vi-VN')}
                            </td>
                            <td>
                              <span className={`badge ${
                                flight.status === 'SCHEDULED' ? 'badge-success' :
                                flight.status === 'DELAYED' ? 'badge-warning' :
                                flight.status === 'CANCELLED' ? 'badge-error' :
                                'badge-ghost'
                              }`}>
                                {flight.status}
                              </span>
                            </td>
                            <td>
                              {new Intl.NumberFormat('vi-VN', {
                                style: 'currency',
                                currency: 'VND'
                              }).format(flight.basePrice || 0)}
                            </td>
                            <td>
                              <div className="flex gap-2">
                                <button 
                                  className="btn btn-sm btn-ghost"
                                  onClick={() => openFlightModal(flight)}
                                >
                                  Sửa
                                </button>
                                <button 
                                  className="btn btn-sm btn-error btn-ghost"
                                  onClick={() => deleteFlight(flight.id)}
                                >
                                  Xóa
                                </button>
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
          )}

          {/* Airports Management */}
          {activeTab === 'airports' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold">Quản lý sân bay</h2>
                <button 
                  className="btn btn-primary"
                  onClick={() => openAirportModal()}
                >
                  <MapPin className="mr-2" />
                  Thêm sân bay
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {airports.length === 0 ? (
                  <div className="col-span-full text-center py-8">
                    <p className="text-gray-500">Không có dữ liệu sân bay</p>
                  </div>
                ) : (
                  airports.map((airport) => (
                  <div key={airport.id} className="card bg-base-100 shadow-xl">
                    <div className="card-body">
                      <h3 className="card-title">{airport.name}</h3>
                      <p className="text-sm opacity-70">
                        <strong>Mã:</strong> {airport.code}
                      </p>
                      <p className="text-sm opacity-70">
                        <strong>Thành phố:</strong> {airport.city}
                      </p>
                      <p className="text-sm opacity-70">
                        <strong>Quốc gia:</strong> {airport.country}
                      </p>
                      <p className="text-sm opacity-70">
                        <strong>Múi giờ:</strong> {airport.timezone}
                      </p>
                      <div className="card-actions justify-end mt-4">
                        <button 
                          className="btn btn-sm btn-ghost"
                          onClick={() => openAirportModal(airport)}
                        >
                          Sửa
                        </button>
                        <button 
                          className="btn btn-sm btn-error btn-ghost"
                          onClick={() => deleteAirport(airport.id)}
                        >
                          Xóa
                        </button>
                      </div>
                    </div>
                  </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Aircrafts Management */}
          {activeTab === 'aircrafts' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold">Quản lý máy bay</h2>
                <button 
                  className="btn btn-primary"
                  onClick={() => openAircraftModal()}
                >
                  <Plane className="mr-2" />
                  Thêm máy bay
                </button>
              </div>

              <div className="card bg-base-100 shadow-xl">
                <div className="card-body p-4">
                  {aircrafts.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">Không có dữ liệu máy bay</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                    <table className="table table-sm table-zebra">
                      <thead>
                        <tr className="text-xs">
                          <th className="w-12 text-center">STT</th>
                          <th>Model</th>
                          <th className="w-20 text-center">Tổng ghế</th>
                          <th className="w-28 text-center">Ghế thương gia</th>
                          <th className="w-28 text-center">Ghế phổ thông</th>
                          <th className="w-28 text-center">Hành động</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm">
                        {aircrafts.map((aircraft, index) => (
                          <tr key={aircraft.id}>
                            <td className="font-semibold text-center">
                              {index + 1}
                            </td>
                            <td className="font-semibold text-blue-600">{aircraft.model}</td>
                            <td className="text-center">{aircraft.totalSeats}</td>
                            <td className="text-center">{aircraft.businessSeats}</td>
                            <td className="text-center">{aircraft.economySeats}</td>
                            <td>
                              <div className="flex gap-1 justify-center">
                                <button 
                                  className="btn btn-xs btn-ghost text-blue-600 hover:text-blue-800"
                                  onClick={() => openAircraftModal(aircraft)}
                                  title="Sửa"
                                >
                                  Sửa
                                </button>
                                <button 
                                  className="btn btn-xs btn-ghost text-red-600 hover:text-red-800"
                                  onClick={() => deleteAircraft(aircraft.id)}
                                  title="Xóa"
                                >
                                  Xóa
                                </button>
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
          )}

          {/* Users Management */}
          {activeTab === 'users' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold">Quản lý người dùng</h2>
                <button 
                  className="btn btn-primary"
                  onClick={() => openUserModal()}
                >
                  + Thêm người dùng
                </button>
              </div>

              <div className="card bg-base-100 shadow-xl">
                <div className="card-body p-4">
                  {users.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">Không có dữ liệu người dùng</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                    <table className="table table-sm table-zebra">
                      <thead>
                        <tr className="text-xs">
                          <th className="w-12 text-center">STT</th>
                          <th>Họ tên</th>
                          <th>Email</th>
                          <th className="w-28">Số điện thoại</th>
                          <th className="w-20 text-center">Vai trò</th>
                          <th className="w-24 text-center">Trạng thái</th>
                          <th className="w-32 text-center">Hành động</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm">
                        {users.map((user, index) => (
                          <tr key={user.id}>
                            <td className="font-semibold text-center">
                              {index + 1}
                            </td>
                            <td className="font-medium">{user.fullName}</td>
                            <td className="text-gray-600">{user.email}</td>
                            <td>{user.phoneNumber || 'N/A'}</td>
                            <td className="text-center">
                              <span className={`badge badge-sm ${
                                user.role === 'ADMIN' ? 'badge-error' :
                                user.role === 'MANAGER' ? 'badge-warning' :
                                user.role === 'SALES' ? 'badge-info' :
                                'badge-ghost'
                              }`}>
                                {user.role}
                              </span>
                            </td>
                            <td className="text-center">
                              <span className={`badge badge-sm ${user.isActive ? 'badge-success' : 'badge-error'}`}>
                                {user.isActive ? 'Hoạt động' : 'Vô hiệu hóa'}
                              </span>
                            </td>
                            <td>
                              <div className="flex gap-1 justify-center">
                                <button 
                                  className="btn btn-xs btn-ghost text-blue-600 hover:text-blue-800"
                                  onClick={() => openUserModal(user)}
                                  title="Sửa"
                                >
                                  Sửa
                                </button>
                                <button 
                                  className="btn btn-xs btn-ghost text-orange-600 hover:text-orange-800"
                                  onClick={() => toggleUserStatus(user.id, user.isActive)}
                                  title={user.isActive ? 'Vô hiệu hóa' : 'Kích hoạt'}
                                >
                                  {user.isActive ? 'Vô hiệu hóa' : 'Kích hoạt'}
                                </button>
                                <button 
                                  className="btn btn-xs btn-ghost text-red-600 hover:text-red-800"
                                  onClick={() => deleteUser(user.id)}
                                  title="Xóa"
                                >
                                  Xóa
                                </button>
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
          )}

          {/* Coupons Management */}
          {activeTab === 'coupons' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold">Quản lý mã giảm giá</h2>
                <button 
                  className="btn btn-primary"
                  onClick={() => openCouponModal()}
                >
                  Thêm mã giảm giá
                </button>
              </div>

              <div className="card bg-base-100 shadow-xl">
                <div className="card-body">
                  {coupons.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">Không có dữ liệu mã giảm giá</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                    <table className="table table-zebra">
                      <thead>
                        <tr>
                          <th>Mã</th>
                          <th>Giảm giá</th>
                          <th>Giảm tối đa</th>
                          <th>Thời gian hiệu lực</th>
                          <th>Giới hạn</th>
                          <th>Đã dùng</th>
                          <th>Trạng thái</th>
                          <th>Hành động</th>
                        </tr>
                      </thead>
                      <tbody>
                        {coupons.map((coupon) => (
                          <tr key={coupon.id}>
                            <td>
                              <span className="font-bold text-primary">{coupon.code}</span>
                            </td>
                            <td>{coupon.discountPercent}%</td>
                            <td>
                              {coupon.maxDiscount 
                                ? new Intl.NumberFormat('vi-VN', {
                                    style: 'currency',
                                    currency: 'VND'
                                  }).format(coupon.maxDiscount)
                                : 'Không giới hạn'
                              }
                            </td>
                            <td>
                              <div className="text-sm">
                                <div>{new Date(coupon.validFrom).toLocaleDateString('vi-VN')}</div>
                                <div className="text-gray-500">→ {new Date(coupon.validTo).toLocaleDateString('vi-VN')}</div>
                              </div>
                            </td>
                            <td>{coupon.usageLimit || 'Không giới hạn'}</td>
                            <td>{coupon.usedCount}</td>
                            <td>
                              <span className={`badge ${coupon.isActive ? 'badge-success' : 'badge-error'}`}>
                                {coupon.isActive ? 'Hoạt động' : 'Vô hiệu hóa'}
                              </span>
                            </td>
                            <td>
                              <div className="flex gap-2">
                                <button 
                                  className="btn btn-sm btn-ghost"
                                  onClick={() => openCouponModal(coupon)}
                                >
                                  Sửa
                                </button>
                                <button 
                                  className="btn btn-sm btn-ghost"
                                  onClick={() => toggleCouponStatus(coupon.id)}
                                >
                                  {coupon.isActive ? 'Vô hiệu hóa' : 'Kích hoạt'}
                                </button>
                                <button 
                                  className="btn btn-sm btn-error btn-ghost"
                                  onClick={() => deleteCoupon(coupon.id)}
                                >
                                  Xóa
                                </button>
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
          )}

          {/* Bookings Management */}
          {activeTab === 'bookings' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold">Quản lý đặt vé</h2>
                <div className="text-sm text-gray-600">
                  Tổng: {bookings.length} đặt vé
                </div>
              </div>

              <div className="card bg-base-100 shadow-xl">
                <div className="card-body p-4">
                  <div className="overflow-x-auto">
                    <table className="table table-sm table-zebra">
                      <thead>
                        <tr className="text-xs">
                          <th className="w-12 text-center">STT</th>
                          <th className="w-28">Mã đặt vé</th>
                          <th>Người đặt</th>
                          <th>Email/SĐT</th>
                          <th>Chuyến bay</th>
                          <th className="w-28 text-right">Tổng tiền</th>
                          <th className="w-24 text-center">Trạng thái</th>
                          <th className="w-32 text-center">Ngày đặt</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm">
                        {bookings.length === 0 ? (
                          <tr>
                            <td colSpan="8" className="text-center py-8 text-gray-500">
                              Chưa có đặt vé nào
                            </td>
                          </tr>
                        ) : (
                          bookings.map((booking, index) => (
                            <tr key={booking.id}>
                              <td className="font-semibold text-center">
                                {index + 1}
                              </td>
                              <td>
                                <span className="font-mono text-xs badge badge-outline">
                                  {booking.bookingCode}
                                </span>
                              </td>
                              <td className="font-medium">
                                {booking.user?.fullName || 'Khách vãng lai'}
                              </td>
                              <td className="text-xs">
                                <div>{booking.contactEmail}</div>
                                <div className="text-gray-500">{booking.contactPhone}</div>
                              </td>
                              <td className="text-xs">
                                {booking.flight?.flightNumber || 'N/A'}
                              </td>
                              <td className="text-right font-semibold">
                                {new Intl.NumberFormat('vi-VN', {
                                  style: 'currency',
                                  currency: 'VND'
                                }).format(booking.totalAmount)}
                              </td>
                              <td className="text-center">
                                <span className={`badge badge-sm ${
                                  booking.status === 'CONFIRMED' ? 'badge-success' :
                                  booking.status === 'PENDING' ? 'badge-warning' :
                                  booking.status === 'CANCELLED' ? 'badge-error' :
                                  booking.status === 'REJECTED' ? 'badge-error' :
                                  'badge-info'
                                }`}>
                                  {booking.status === 'CONFIRMED' ? 'Đã xác nhận' :
                                   booking.status === 'PENDING' ? 'Chờ xử lý' :
                                   booking.status === 'CANCELLED' ? 'Đã hủy' :
                                   booking.status === 'REJECTED' ? 'Bị từ chối' :
                                   booking.status}
                                </span>
                              </td>
                              <td className="text-xs text-center text-gray-600">
                                {new Date(booking.createdAt).toLocaleString('vi-VN')}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* User Modal */}
      {showUserModal && (
        <dialog open className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">
              {selectedUser ? 'Sửa người dùng' : 'Thêm người dùng'}
            </h3>
            <form onSubmit={handleUserSubmit}>
              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text">Họ tên *</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered"
                  value={userForm.fullName}
                  onChange={(e) => setUserForm({ ...userForm, fullName: e.target.value })}
                  required
                />
              </div>
              
              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text">Email *</span>
                </label>
                <input
                  type="email"
                  className="input input-bordered"
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  required
                  disabled={!!selectedUser}
                />
              </div>
              
              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text">Số điện thoại</span>
                </label>
                <input
                  type="tel"
                  className="input input-bordered"
                  value={userForm.phoneNumber}
                  onChange={(e) => setUserForm({ ...userForm, phoneNumber: e.target.value })}
                />
              </div>
              
              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text">Mật khẩu {selectedUser ? '' : '*'}</span>
                </label>
                <input
                  type="password"
                  className="input input-bordered"
                  value={userForm.password}
                  onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                  required={!selectedUser}
                  placeholder={selectedUser ? 'Để trống nếu không đổi' : ''}
                />
              </div>
              
              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text">Vai trò *</span>
                </label>
                <select
                  className="select select-bordered"
                  value={userForm.role}
                  onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                  required
                >
                  <option value="USER">USER</option>
                  <option value="SALES">SALES</option>
                  <option value="MANAGER">MANAGER</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>
              
              <div className="modal-action">
                <button type="submit" className="btn btn-primary">
                  {selectedUser ? 'Cập nhật' : 'Thêm'}
                </button>
                <button 
                  type="button" 
                  className="btn"
                  onClick={() => setShowUserModal(false)}
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </dialog>
      )}

      {/* Airport Modal */}
      {showAirportModal && (
        <dialog open className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">
              {selectedAirport ? 'Sửa sân bay' : 'Thêm sân bay'}
            </h3>
            <form onSubmit={handleAirportSubmit}>
              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text">Mã sân bay (IATA) *</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered"
                  value={airportForm.code}
                  onChange={(e) => setAirportForm({ ...airportForm, code: e.target.value.toUpperCase() })}
                  maxLength={3}
                  required
                  disabled={!!selectedAirport}
                  placeholder="VD: SGN, HAN"
                />
              </div>
              
              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text">Tên sân bay *</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered"
                  value={airportForm.name}
                  onChange={(e) => setAirportForm({ ...airportForm, name: e.target.value })}
                  required
                  placeholder="VD: Sân bay Tân Sơn Nhất"
                />
              </div>
              
              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text">Thành phố *</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered"
                  value={airportForm.city}
                  onChange={(e) => setAirportForm({ ...airportForm, city: e.target.value })}
                  required
                  placeholder="VD: Hồ Chí Minh"
                />
              </div>
              
              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text">Quốc gia *</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered"
                  value={airportForm.country}
                  onChange={(e) => setAirportForm({ ...airportForm, country: e.target.value })}
                  required
                  placeholder="VD: Việt Nam"
                />
              </div>
              
              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text">Múi giờ (timezone) *</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered"
                  value={airportForm.timezone}
                  onChange={(e) => setAirportForm({ ...airportForm, timezone: e.target.value })}
                  required
                  placeholder="VD: Asia/Ho_Chi_Minh"
                />
              </div>
              
              <div className="modal-action">
                <button type="submit" className="btn btn-primary">
                  {selectedAirport ? 'Cập nhật' : 'Thêm'}
                </button>
                <button 
                  type="button" 
                  className="btn"
                  onClick={() => setShowAirportModal(false)}
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </dialog>
      )}

      {/* Aircraft Modal */}
      {showAircraftModal && (
        <dialog open className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">
              {selectedAircraft ? 'Sửa máy bay' : 'Thêm máy bay'}
            </h3>
            <form onSubmit={handleAircraftSubmit}>
              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text">Model *</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered"
                  value={aircraftForm.model}
                  onChange={(e) => setAircraftForm({ ...aircraftForm, model: e.target.value })}
                  required
                  placeholder="VD: Boeing 787, Airbus A350"
                />
              </div>
              
              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text">Tổng số ghế *</span>
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  className="input input-bordered"
                  value={aircraftForm.totalSeats}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '')
                    setAircraftForm({ ...aircraftForm, totalSeats: value })
                  }}
                  required
                />
              </div>
              
              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text">Ghế thương gia *</span>
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  className="input input-bordered"
                  value={aircraftForm.businessSeats}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '')
                    setAircraftForm({ ...aircraftForm, businessSeats: value })
                  }}
                  required
                />
              </div>
              
              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text">Ghế phổ thông *</span>
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  className="input input-bordered"
                  value={aircraftForm.economySeats}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '')
                    setAircraftForm({ ...aircraftForm, economySeats: value })
                  }}
                  required
                />
              </div>
              
              <div className="modal-action">
                <button type="submit" className="btn btn-primary">
                  {selectedAircraft ? 'Cập nhật' : 'Thêm'}
                </button>
                <button 
                  type="button" 
                  className="btn"
                  onClick={() => setShowAircraftModal(false)}
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </dialog>
      )}

      {/* Flight Modal */}
      {showFlightModal && (
        <dialog open className="modal modal-open">
          <div className="modal-box max-w-2xl">
            <h3 className="font-bold text-lg mb-4">
              {selectedFlight ? 'Sửa chuyến bay' : 'Thêm chuyến bay'}
            </h3>
            <form onSubmit={handleFlightSubmit}>
              <div className="grid grid-cols-2 gap-4">
                <div className="form-control mb-4">
                  <label className="label">
                    <span className="label-text">Số hiệu chuyến bay *</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered"
                    value={flightForm.flightNumber}
                    onChange={(e) => setFlightForm({ ...flightForm, flightNumber: e.target.value })}
                    required
                    placeholder="VD: VN123"
                  />
                </div>
                
                <div className="form-control mb-4">
                  <label className="label">
                    <span className="label-text">Tuyến bay *</span>
                  </label>
                  <select
                    className="select select-bordered"
                    value={flightForm.routeId}
                    onChange={(e) => setFlightForm({ ...flightForm, routeId: e.target.value })}
                    required
                  >
                    <option value="">Chọn tuyến bay</option>
                    {routes.map((route) => (
                      <option key={route.id} value={route.id}>
                        {route.departure?.code} → {route.arrival?.code} ({route.departure?.city} - {route.arrival?.city})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="form-control mb-4">
                  <label className="label">
                    <span className="label-text">Máy bay *</span>
                  </label>
                  <select
                    className="select select-bordered"
                    value={flightForm.aircraftId}
                    onChange={(e) => setFlightForm({ ...flightForm, aircraftId: e.target.value })}
                    required
                  >
                    <option value="">Chọn máy bay</option>
                    {aircrafts.map((aircraft) => (
                      <option key={aircraft.id} value={aircraft.id}>
                        {aircraft.model} ({aircraft.totalSeats} ghế)
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="form-control mb-4">
                  <label className="label">
                    <span className="label-text">Giá cơ bản (Phổ thông) *</span>
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    className="input input-bordered"
                    value={flightForm.basePrice}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, '')
                      setFlightForm({ ...flightForm, basePrice: value })
                    }}
                    required
                    placeholder="VND (VD: 1650000)"
                  />
                </div>
                
                <div className="form-control mb-4">
                  <label className="label">
                    <span className="label-text">Giá thương gia *</span>
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    className="input input-bordered"
                    value={flightForm.businessPrice}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, '')
                      setFlightForm({ ...flightForm, businessPrice: value })
                    }}
                    required
                    placeholder="VND (VD: 2475000)"
                  />
                  <label className="label">
                    <span className="label-text-alt text-gray-500">Thường = Giá cơ bản × 1.5</span>
                  </label>
                </div>
                
                <div className="form-control mb-4">
                  <label className="label">
                    <span className="label-text">Thời gian khởi hành *</span>
                  </label>
                  <input
                    type="datetime-local"
                    className="input input-bordered"
                    value={flightForm.departureTime}
                    onChange={(e) => setFlightForm({ ...flightForm, departureTime: e.target.value })}
                    required
                  />
                </div>
                
                <div className="form-control mb-4">
                  <label className="label">
                    <span className="label-text">Thời gian hạ cánh *</span>
                  </label>
                  <input
                    type="datetime-local"
                    className="input input-bordered"
                    value={flightForm.arrivalTime}
                    onChange={(e) => setFlightForm({ ...flightForm, arrivalTime: e.target.value })}
                    required
                  />
                </div>
                
                <div className="form-control mb-4 col-span-2">
                  <label className="label">
                    <span className="label-text">Trạng thái *</span>
                  </label>
                  <select
                    className="select select-bordered"
                    value={flightForm.status}
                    onChange={(e) => setFlightForm({ ...flightForm, status: e.target.value })}
                    required
                  >
                    <option value="SCHEDULED">SCHEDULED - Đã lên lịch</option>
                    <option value="DELAYED">DELAYED - Bị hoãn</option>
                    <option value="CANCELLED">CANCELLED - Đã hủy</option>
                    <option value="COMPLETED">COMPLETED - Hoàn thành</option>
                  </select>
                </div>
              </div>
              
              <div className="modal-action">
                <button type="submit" className="btn btn-primary">
                  {selectedFlight ? 'Cập nhật' : 'Thêm'}
                </button>
                <button 
                  type="button" 
                  className="btn"
                  onClick={() => setShowFlightModal(false)}
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </dialog>
      )}

      {/* Coupon Modal */}
      {showCouponModal && (
        <dialog open className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">
              {selectedCoupon ? 'Sửa mã giảm giá' : 'Thêm mã giảm giá'}
            </h3>
            <form onSubmit={handleCouponSubmit}>
              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text">Mã giảm giá *</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered uppercase"
                  value={couponForm.code}
                  onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
                  placeholder="VD: SUMMER2026"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="form-control mb-4">
                  <label className="label">
                    <span className="label-text">Phần trăm giảm giá * (%)</span>
                  </label>
                  <input
                    type="number"
                    className="input input-bordered"
                    value={couponForm.discountPercent}
                    onChange={(e) => setCouponForm({ ...couponForm, discountPercent: e.target.value })}
                    min="0"
                    max="100"
                    step="0.01"
                    placeholder="VD: 10"
                    required
                  />
                </div>

                <div className="form-control mb-4">
                  <label className="label">
                    <span className="label-text">Giảm tối đa (VNĐ)</span>
                  </label>
                  <input
                    type="number"
                    className="input input-bordered"
                    value={couponForm.maxDiscount}
                    onChange={(e) => setCouponForm({ ...couponForm, maxDiscount: e.target.value })}
                    min="0"
                    placeholder="Không giới hạn"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="form-control mb-4">
                  <label className="label">
                    <span className="label-text">Hiệu lực từ *</span>
                  </label>
                  <input
                    type="date"
                    className="input input-bordered"
                    value={couponForm.validFrom}
                    onChange={(e) => setCouponForm({ ...couponForm, validFrom: e.target.value })}
                    required
                  />
                </div>

                <div className="form-control mb-4">
                  <label className="label">
                    <span className="label-text">Hiệu lực đến *</span>
                  </label>
                  <input
                    type="date"
                    className="input input-bordered"
                    value={couponForm.validTo}
                    onChange={(e) => setCouponForm({ ...couponForm, validTo: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text">Giới hạn số lần sử dụng</span>
                </label>
                <input
                  type="number"
                  className="input input-bordered"
                  value={couponForm.usageLimit}
                  onChange={(e) => setCouponForm({ ...couponForm, usageLimit: e.target.value })}
                  min="0"
                  placeholder="Không giới hạn"
                />
              </div>

              <div className="form-control mb-4">
                <label className="label cursor-pointer">
                  <span className="label-text">Kích hoạt ngay</span>
                  <input
                    type="checkbox"
                    className="toggle toggle-primary"
                    checked={couponForm.isActive}
                    onChange={(e) => setCouponForm({ ...couponForm, isActive: e.target.checked })}
                  />
                </label>
              </div>

              <div className="modal-action">
                <button type="submit" className="btn btn-primary">
                  {selectedCoupon ? 'Cập nhật' : 'Thêm'}
                </button>
                <button 
                  type="button" 
                  className="btn"
                  onClick={() => setShowCouponModal(false)}
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </dialog>
      )}
    </div>
  )
}
