import { Link, useNavigate } from 'react-router-dom'
import { Plane, User, LogOut, History, Search, MapPin } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'

export default function Header() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <header className="bg-gradient-to-r from-blue-600 via-blue-500 to-sky-500 text-white shadow-xl">
      <div className="container mx-auto px-4">
        <div className="navbar">
          <div className="flex-1">
            <Link to="/" className="btn btn-ghost normal-case text-xl hover:bg-white/10 transition-all duration-300 group">
              <Plane className="mr-2 group-hover:rotate-12 transition-transform duration-300" size={28} />
              <span className="font-bold tracking-wide">Flight Booking</span>
            </Link>
          </div>
          <div className="flex-none">
            <ul className="menu menu-horizontal px-1 gap-1">
              <li>
                <Link to="/search" className="hover:bg-white/20 transition-all duration-200 rounded-lg flex items-center gap-2">
                  <Search size={18} />
                  Tìm chuyến bay
                </Link>
              </li>
              <li>
                <Link to="/track" className="hover:bg-white/20 transition-all duration-200 rounded-lg flex items-center gap-2">
                  <MapPin size={18} />
                  Tra cứu vé
                </Link>
              </li>
              {user ? (
                <>
                  <li>
                    <Link to="/dashboard" className="hover:bg-white/20 transition-all duration-200 rounded-lg flex items-center gap-2">
                      <User size={18} />
                      Thông tin cá nhân
                      <span className="badge badge-sm bg-amber-400 border-none text-blue-900 font-semibold shadow-md animate-pulse">
                        {user.fullName || user.email}
                      </span>
                    </Link>
                  </li>
                  <li>
                    <Link to="/my-bookings" className="hover:bg-white/20 transition-all duration-200 rounded-lg flex items-center gap-2">
                      <History size={18} />
                      Quản lý đặt chỗ
                    </Link>
                  </li>
                  <li>
                    <button onClick={handleLogout} className="hover:bg-red-500/30 transition-all duration-200 rounded-lg flex items-center gap-2">
                      <LogOut size={18} />
                      Đăng xuất
                    </button>
                  </li>
                </>
              ) : (
                <li>
                  <Link to="/login" className="hover:bg-white/20 transition-all duration-200 rounded-lg flex items-center gap-2">
                    <User size={18} />
                    Đăng nhập/Đăng ký
                  </Link>
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </header>
  )
}
