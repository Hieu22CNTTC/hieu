import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { UserPlus } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../utils/api'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    phoneNumber: '',
  })
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      await api.post('/auth/register', formData)
      toast.success('Đăng ký thành công! Vui lòng đăng nhập.')
      navigate('/login')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Đăng ký thất bại')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-md mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center">Đăng ký</h1>
        <div className="card bg-base-200 shadow-xl">
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text">Họ tên</span>
                </label>
                <input
                  type="text"
                  name="fullName"
                  placeholder="Nguyễn Văn A"
                  className="input input-bordered"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                />
              </div>
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
                  <span className="label-text">Số điện thoại</span>
                </label>
                <input
                  type="tel"
                  name="phoneNumber"
                  placeholder="0912345678"
                  className="input input-bordered"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  required
                  pattern="[0-9]{10,11}"
                  title="Số điện thoại phải có 10-11 chữ số"
                />
                <label className="label">
                  <span className="label-text-alt text-gray-500">10-11 chữ số</span>
                </label>
              </div>
              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text">Mật khẩu</span>
                </label>
                <input
                  type="password"
                  name="password"
                  placeholder="Tối thiểu 6 ký tự"
                  className="input input-bordered"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength={6}
                />
                <label className="label">
                  <span className="label-text-alt text-gray-500">Tối thiểu 6 ký tự</span>
                </label>
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
                    <UserPlus className="mr-2" />
                    Đăng ký
                  </>
                )}
              </button>
            </form>
            <div className="divider">HOẶC</div>
            <p className="text-center">
              Đã có tài khoản?{' '}
              <Link to="/login" className="link link-primary">
                Đăng nhập ngay
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
