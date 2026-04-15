import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

export default function PaymentResult() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  
  const status = searchParams.get('status')
  const message = searchParams.get('message')
  const bookingCode = searchParams.get('bookingCode')

  useEffect(() => {
    // Auto redirect after 5 seconds
    const timer = setTimeout(() => {
      if (bookingCode) {
        navigate(`/confirmation/${bookingCode}`)
      } else {
        navigate('/')
      }
    }, 5000)

    return () => clearTimeout(timer)
  }, [bookingCode, navigate])

  const isSuccess = status === 'success'
  const isFailed = status === 'failed'
  const isError = status === 'error'

  return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center p-4">
      <div className="card w-full max-w-md bg-base-100 shadow-xl">
        <div className="card-body items-center text-center">
          {/* Icon */}
          {isSuccess && (
            <div className="text-success mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          )}
          
          {isFailed && (
            <div className="text-warning mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          )}
          
          {isError && (
            <div className="text-error mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          )}

          {/* Title */}
          <h2 className="card-title text-2xl mb-2">
            {isSuccess && 'Thanh toán thành công!'}
            {isFailed && 'Thanh toán thất bại'}
            {isError && 'Có lỗi xảy ra'}
          </h2>

          {/* Message */}
          <p className="text-base-content/70 mb-6">
            {message ? decodeURIComponent(message) : ''}
          </p>

          {/* Booking Code */}
          {bookingCode && (
            <div className="bg-base-200 p-4 rounded-lg w-full mb-6">
              <div className="text-sm text-base-content/70">Mã đặt vé</div>
              <div className="font-bold text-lg">{bookingCode}</div>
            </div>
          )}

          {/* Actions */}
          <div className="card-actions flex-col w-full gap-2">
            {bookingCode && (
              <button 
                onClick={() => navigate(`/confirmation/${bookingCode}`)}
                className="btn btn-primary w-full"
              >
                Xem chi tiết đặt vé
              </button>
            )}
            
            {isFailed && bookingCode && (
              <button 
                onClick={() => navigate(`/confirmation/${bookingCode}`)}
                className="btn btn-success w-full"
              >
                Thử thanh toán lại
              </button>
            )}
            
            <button 
              onClick={() => navigate('/')}
              className="btn btn-outline w-full"
            >
              Về trang chủ
            </button>
          </div>

          {/* Auto redirect notice */}
          <div className="text-sm text-base-content/50 mt-4">
            Tự động chuyển trang sau 5 giây...
          </div>
        </div>
      </div>
    </div>
  )
}
