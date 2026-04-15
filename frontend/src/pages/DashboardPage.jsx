import { useState, useEffect } from 'react'
import { useAuthStore } from '../stores/authStore'
import { Navigate, useNavigate } from 'react-router-dom'
import api from '../utils/api'
import toast from 'react-hot-toast'
import { User, Lock, Mail, Phone, CheckCircle } from 'lucide-react'

export default function DashboardPage() {
  const { user, updateUser } = useAuthStore()
  const navigate = useNavigate()
  
  // Form states
  const [profileForm, setProfileForm] = useState({
    fullName: '',
    phoneNumber: ''
  })
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    if (user) {
      setProfileForm({
        fullName: user.fullName || '',
        phoneNumber: user.phoneNumber || ''
      })
    }
  }, [user])

  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    setUpdating(true)
    try {
      const { data } = await api.put('/users/profile', profileForm)
      updateUser(data.data)
      toast.success('Cập nhật thông tin thành công')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể cập nhật thông tin')
    } finally {
      setUpdating(false)
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Mật khẩu mới không khớp')
      return
    }
    
    if (passwordForm.newPassword.length < 6) {
      toast.error('Mật khẩu mới phải có ít nhất 6 ký tự')
      return
    }

    setUpdating(true)
    try {
      await api.put('/users/password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      })
      toast.success('Đổi mật khẩu thành công')
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể đổi mật khẩu')
    } finally {
      setUpdating(false)
    }
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="min-h-screen bg-base-200">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Profile Header Card */}
        <div className="card bg-gradient-to-r from-primary to-secondary text-primary-content shadow-2xl mb-6">
          <div className="card-body p-6">
            <div className="flex items-center gap-6">
              <div className="avatar placeholder">
                <div className="bg-neutral text-neutral-content rounded-full w-20 h-20">
                  <span className="text-3xl font-bold">{user.fullName?.charAt(0) || 'U'}</span>
                </div>
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-1">{user.fullName}</h1>
                <div className="flex flex-wrap gap-4 text-sm opacity-90">
                  <div className="flex items-center gap-2">
                    <Mail size={16} />
                    {user.email}
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone size={16} />
                    {user.phoneNumber}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="badge badge-lg badge-accent gap-2">
                  <User size={14} />
                  {user.role === 'ADMIN' ? 'Quản trị viên' : user.role === 'SALES' ? 'Nhân viên' : 'Khách hàng'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Profile and Password Forms in 2 columns */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Profile Update Form */}
          <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow">
            <div className="card-body">
              <h2 className="card-title border-b pb-3 mb-4">
                <User size={24} className="text-primary" />
                Thông tin cá nhân
              </h2>
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold flex items-center gap-2">
                      <Mail size={16} />
                      Email
                    </span>
                  </label>
                  <input
                    type="email"
                    value={user.email}
                    disabled
                    className="input input-bordered input-sm bg-base-200"
                  />
                  <label className="label">
                    <span className="label-text-alt text-info">Không thể thay đổi</span>
                  </label>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold flex items-center gap-2">
                      <User size={16} />
                      Họ và tên
                    </span>
                  </label>
                  <input
                    type="text"
                    value={profileForm.fullName}
                    onChange={(e) => setProfileForm({...profileForm, fullName: e.target.value})}
                    className="input input-bordered input-sm focus:input-primary"
                    required
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold flex items-center gap-2">
                      <Phone size={16} />
                      Số điện thoại
                    </span>
                  </label>
                  <input
                    type="tel"
                    value={profileForm.phoneNumber}
                    onChange={(e) => setProfileForm({...profileForm, phoneNumber: e.target.value})}
                    className="input input-bordered input-sm focus:input-primary"
                    required
                  />
                </div>

                <button 
                  type="submit" 
                  className="btn btn-primary w-full btn-sm gap-2"
                  disabled={updating}
                >
                  {updating ? (
                    <span className="loading loading-spinner loading-xs"></span>
                  ) : (
                    <>
                      <CheckCircle size={16} />
                      Cập nhật thông tin
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Change Password Form */}
          <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow">
            <div className="card-body">
              <h2 className="card-title border-b pb-3 mb-4">
                <Lock size={24} className="text-secondary" />
                Đổi mật khẩu
              </h2>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">Mật khẩu hiện tại</span>
                  </label>
                  <input
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                    className="input input-bordered input-sm focus:input-secondary"
                    required
                    placeholder="••••••••"
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">Mật khẩu mới</span>
                  </label>
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                    className="input input-bordered input-sm focus:input-secondary"
                    required
                    placeholder="••••••••"
                    minLength={6}
                  />
                  <label className="label">
                    <span className="label-text-alt text-info">Tối thiểu 6 ký tự</span>
                  </label>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">Xác nhận mật khẩu mới</span>
                  </label>
                  <input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                    className="input input-bordered input-sm focus:input-secondary"
                    required
                    placeholder="••••••••"
                  />
                </div>

                <button 
                  type="submit" 
                  className="btn btn-secondary w-full btn-sm gap-2"
                  disabled={updating}
                >
                  {updating ? (
                    <span className="loading loading-spinner loading-xs"></span>
                  ) : (
                    <>
                      <Lock size={16} />
                      Đổi mật khẩu
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

