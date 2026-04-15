import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LogIn } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../utils/api'
import { useAuthStore } from '../stores/authStore'

export default function LoginPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((state) => state.setAuth)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await api.post('/auth/login', formData)
      const { user, accessToken, refreshToken } = response.data.data
      
      // setAuth will save to both store and localStorage
      setAuth(user, accessToken, refreshToken)
      
      toast.success(`Chào mừng ${user.fullName}!`)
      
      // Redirect based on user role
      if (user.role === 'ADMIN') {
        navigate('/admin')
      } else if (user.role === 'MANAGER' || user.role === 'SALES') {
        navigate('/bookings')
      } else {
        navigate('/')
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Đăng nhập thất bại')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-md mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center">Đăng nhập</h1>
        <div className="card bg-base-200 shadow-xl">
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text">Email</span>
                </label>
                <input
                  type="email"
                  name="email"
                  placeholder="email@example.com"
                  className="input input-bordered"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text">Mật khẩu</span>
                  <Link to="/forgot-password" className="label-text-alt link link-hover">
                    Quên mật khẩu?
                  </Link>
                </label>
                <input
                  type="password"
                  name="password"
                  placeholder="********"
                  className="input input-bordered"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>
              <button 
                type="submit" 
                className="btn btn-primary w-full"
                disabled={loading}
              >
                {loading ? (
                  <span className="loading loading-spinner"></span>
                ) : (
                  <>
                    <LogIn className="mr-2" />
                    Đăng nhập
                  </>
                )}
              </button>
            </form>
            <div className="divider">HOẶC</div>
            <p className="text-center">
              Chưa có tài khoản?{' '}
              <Link to="/register" className="link link-primary">
                Đăng ký ngay
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
