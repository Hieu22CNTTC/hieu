import { useState } from 'react'
import { Link } from 'react-router-dom'
import { KeyRound } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../utils/api'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [resetUrl, setResetUrl] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data } = await api.post('/auth/forgot-password', { email })
      setSent(true)
      
      // Development only - show reset link
      if (data.data?.resetUrl) {
        setResetUrl(data.data.resetUrl)
        toast.success('Link đặt lại mật khẩu đã được tạo!')
      } else {
        toast.success(data.message)
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-md mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center">Quên mật khẩu</h1>
        
        {!sent ? (
          <div className="card bg-base-200 shadow-xl">
            <div className="card-body">
              <p className="text-sm text-gray-600 mb-4">
                Nhập email của bạn và chúng tôi sẽ gửi link đặt lại mật khẩu
              </p>
              
              <form onSubmit={handleSubmit}>
                <div className="form-control mb-4">
                  <label className="label">
                    <span className="label-text">Email</span>
                  </label>
                  <input
                    type="email"
                    placeholder="email@example.com"
                    className="input input-bordered"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
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
                      <KeyRound className="mr-2" size={20} />
                      Gửi link đặt lại mật khẩu
                    </>
                  )}
                </button>
              </form>
              
              <div className="divider"></div>
              
              <div className="text-center space-y-2">
                <Link to="/login" className="link link-primary block">
                  Quay lại đăng nhập
                </Link>
                <Link to="/register" className="link link-secondary block">
                  Chưa có tài khoản? Đăng ký
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="card bg-base-200 shadow-xl">
            <div className="card-body">
              <div className="alert alert-success">
                <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h3 className="font-bold">Email đã được gửi!</h3>
                  <div className="text-xs">Kiểm tra hộp thư của bạn để đặt lại mật khẩu</div>
                </div>
              </div>

              {/* Development only - show direct link */}
              {resetUrl ? (
                <div className="mt-4 p-4 bg-yellow-100 border-2 border-yellow-300 rounded-lg">
                  <p className="text-sm font-semibold text-yellow-800 mb-3">
                    🔧 Chế độ phát triển - Link đặt lại mật khẩu:
                  </p>
                  <a 
                    href={resetUrl} 
                    className="btn btn-primary btn-sm w-full mb-2"
                  >
                    🔗 Click để đặt lại mật khẩu
                  </a>
                  <p className="text-xs text-yellow-700 mt-2 break-all">
                    Hoặc copy link: {resetUrl}
                  </p>
                  <p className="text-xs text-yellow-700 mt-1">
                    ⏱️ Link có hiệu lực trong 15 phút
                  </p>
                </div>
              ) : (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    💡 <strong>Lưu ý:</strong> Nếu email tồn tại trong hệ thống, link reset sẽ hiển thị ở đây (chế độ phát triển).
                  </p>
                  <p className="text-xs text-blue-600 mt-2">
                    Hệ thống không hiển thị liệu email có tồn tại hay không để bảo mật.
                  </p>
                </div>
              )}

              <div className="divider"></div>
              
              <div className="text-center">
                <button 
                  onClick={() => setSent(false)} 
                  className="btn btn-ghost btn-sm"
                >
                  Gửi lại
                </button>
                <Link to="/login" className="btn btn-primary btn-sm ml-2">
                  Đăng nhập
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
