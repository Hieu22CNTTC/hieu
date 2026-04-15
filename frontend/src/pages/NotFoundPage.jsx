import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <h1 className="text-6xl font-bold mb-4">404</h1>
      <p className="text-2xl mb-8">Trang không tồn tại</p>
      <Link to="/" className="btn btn-primary">
        Về trang chủ
      </Link>
    </div>
  )
}
