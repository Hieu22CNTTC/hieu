import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { Lock } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../utils/api'

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  })
  const [loading, setLoading] = useState(false)
  const [token, setToken] = useState('')

  useEffect(() => {
    const tokenParam = searchParams.get('token')
    if (!tokenParam) {
      toast.error('Link đặt lại mật khẩu không hợp lệ')
      navigate('/forgot-password')
    } else {
      setToken(tokenParam)
    }
  }, [searchParams, navigate])

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validate passwords match
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp')
      return
    }

    // Validate password length
    if (formData.newPassword.length < 6) {
      toast.error('Mật khẩu phải có ít nhất 6 ký tự')
      return
    }

    setLoading(true)

    try {
      const { data } = await api.post('/auth/reset-password', {
        token,
        newPassword: formData.newPassword
      })
      
      toast.success(data.message || 'Đặt lại mật khẩu thành công!')
      setTimeout(() => {
        navigate('/login')
      }, 1500)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể đặt lại mật khẩu')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-md mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center">Đặt lại mật khẩu</h1>
        
        <div className="card bg-base-200 shadow-xl">
          <div className="card-body">
            <p className="text-sm text-gray-600 mb-4">
              Nhập mật khẩu mới của bạn
            </p>
            
            <form onSubmit={handleSubmit}>
              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text">Mật khẩu mới</span>
                </label>
                <input
                  type="password"
                  name="newPassword"
                  placeholder="Ít nhất 6 ký tự"
                  className="input input-bordered"
                  value={formData.newPassword}
                  onChange={handleChange}
                  required
                  autoFocus
                  minLength={6}
                />
              </div>

              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text">Xác nhận mật khẩu</span>
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="Nhập lại mật khẩu"
                  className="input input-bordered"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  minLength={6}
                />
              </div>

              {formData.newPassword && formData.confirmPassword && 
               formData.newPassword !== formData.confirmPassword && (
                <div className="alert alert-warning mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span>Mật khẩu xác nhận không khớp</span>
                </div>
              )}
              
              <button 
                type="submit" 
                className="btn btn-primary w-full"
                disabled={loading || (formData.newPassword !== formData.confirmPassword && formData.confirmPassword !== '')}
              >
                {loading ? (
                  <span className="loading loading-spinner"></span>
                ) : (
                  <>
                    <Lock className="mr-2" size={20} />
                    Đặt lại mật khẩu
                  </>
                )}
              </button>
            </form>
            
            <div className="divider"></div>
            
            <div className="text-center">
              <Link to="/login" className="link link-primary">
                Quay lại đăng nhập
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
