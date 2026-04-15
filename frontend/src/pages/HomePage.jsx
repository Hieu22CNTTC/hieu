import { Link } from 'react-router-dom'
import { Plane, Search, Shield, CreditCard, MapPin, TrendingUp, Clock, Star, Users, Award } from 'lucide-react'
import { useState } from 'react'

export default function HomePage() {
  const [searchForm, setSearchForm] = useState({
    from: '',
    to: '',
    departDate: '',
    passengers: 1
  })

  const popularDestinations = [
    { city: 'Hà Nội', code: 'HAN', image: '🏛️', price: '1.200.000đ' },
    { city: 'Đà Nẵng', code: 'DAD', image: '🏖️', price: '1.500.000đ' },
    { city: 'Phú Quốc', code: 'PQC', image: '🏝️', price: '2.000.000đ' },
    { city: 'Nha Trang', code: 'CXR', image: '🌊', price: '1.800.000đ' }
  ]

  const testimonials = [
    {
      name: 'Nguyễn Văn A',
      comment: 'Dịch vụ tuyệt vời! Đặt vé nhanh chóng và giá cả hợp lý.',
      rating: 5,
      avatar: '👨'
    },
    {
      name: 'Trần Thị B',
      comment: 'Giao diện dễ sử dụng, thanh toán an toàn. Rất hài lòng!',
      rating: 5,
      avatar: '👩'
    },
    {
      name: 'Lê Văn C',
      comment: 'Hỗ trợ khách hàng nhiệt tình, giải quyết vấn đề nhanh chóng.',
      rating: 5,
      avatar: '👨‍💼'
    }
  ]

  const stats = [
    { icon: Users, value: '100K+', label: 'Khách hàng' },
    { icon: Plane, value: '500+', label: 'Chuyến bay' },
    { icon: MapPin, value: '50+', label: 'Điểm đến' },
    { icon: Award, value: '4.8/5', label: 'Đánh giá' }
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section with Search */}
      <section className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white py-24 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-12">
            <h1 className="text-5xl md:text-6xl font-bold mb-4 animate-fade-in">
              ✈️ SẢI CÁNH VƯƠN CAO 
            </h1>
            <p className="text-xl md:text-2xl mb-2 opacity-90">
              Đặt vé máy bay dễ dàng với giá tốt nhất
            </p>
            <p className="text-lg opacity-75 flex items-center justify-center gap-2">
              <TrendingUp size={20} />
              Tiết kiệm đến 30% khi đặt sớm
            </p>
          </div>

          {/* Quick Search Form */}
          <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl p-6 md:p-8">
            <div className="grid md:grid-cols-4 gap-4 mb-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-bold text-black text-base">Từ</span>
                </label>
                <select 
                  className="select select-bordered w-full text-black bg-white"
                  value={searchForm.from}
                  onChange={(e) => setSearchForm({...searchForm, from: e.target.value})}
                >
                  <option value="" className="text-black bg-white">Chọn điểm đi</option>
                  <option value="SGN" className="text-black bg-white">TP. Hồ Chí Minh (SGN)</option>
                  <option value="HAN" className="text-black bg-white">Hà Nội (HAN)</option>
                  <option value="DAD" className="text-black bg-white">Đà Nẵng (DAD)</option>
                  <option value="CXR" className="text-black bg-white">Nha Trang (CXR)</option>
                  <option value="PQC" className="text-black bg-white">Phú Quốc (PQC)</option>
                </select>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-bold text-black text-base">Đến</span>
                </label>
                <select 
                  className="select select-bordered w-full text-black bg-white"
                  value={searchForm.to}
                  onChange={(e) => setSearchForm({...searchForm, to: e.target.value})}
                >
                  <option value="" className="text-black bg-white">Chọn điểm đến</option>
                  <option value="HAN" className="text-black bg-white">Hà Nội (HAN)</option>
                  <option value="SGN" className="text-black bg-white">TP. Hồ Chí Minh (SGN)</option>
                  <option value="DAD" className="text-black bg-white">Đà Nẵng (DAD)</option>
                  <option value="CXR" className="text-black bg-white">Nha Trang (CXR)</option>
                  <option value="PQC" className="text-black bg-white">Phú Quốc (PQC)</option>
                </select>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-bold text-black text-base">Ngày bay</span>
                </label>
                <input 
                  type="date" 
                  className="input input-bordered w-full text-black"
                  value={searchForm.departDate}
                  onChange={(e) => setSearchForm({...searchForm, departDate: e.target.value})}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-bold text-black text-base">Hành khách</span>
                </label>
                <input 
                  type="number" 
                  className="input input-bordered w-full text-black"
                  value={searchForm.passengers}
                  onChange={(e) => setSearchForm({...searchForm, passengers: e.target.value})}
                  min="1"
                  max="9"
                />
              </div>
            </div>

            <Link 
              to={`/search?from=${searchForm.from}&to=${searchForm.to}&date=${searchForm.departDate}&passengers=${searchForm.passengers}`}
              className="btn btn-primary btn-lg w-full text-lg"
              onClick={() => {
                console.log('Homepage search form:', searchForm)
                console.log('Generated URL:', `/search?from=${searchForm.from}&to=${searchForm.to}&date=${searchForm.departDate}&passengers=${searchForm.passengers}`)
              }}
            >
              <Search className="mr-2" size={24} />
              Tìm chuyến bay
            </Link>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-16 bg-gradient-to-r from-gray-50 to-gray-100">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon
              return (
                <div key={index} className="text-center transform hover:scale-110 transition-transform">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-primary text-white rounded-full mb-4">
                    <Icon size={32} />
                  </div>
                  <div className="text-3xl font-bold text-gray-800 mb-2">{stat.value}</div>
                  <div className="text-gray-600">{stat.label}</div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Popular Destinations */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">🌟 Điểm đến phổ biến</h2>
            <p className="text-xl text-gray-600">Khám phá những địa điểm du lịch được yêu thích nhất</p>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            {popularDestinations.map((dest, index) => (
              <Link 
                key={index}
                to={`/search?to=${dest.code}`}
                className="card bg-base-100 shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-2"
              >
                <figure className="px-10 pt-10">
                  <div className="text-6xl">{dest.image}</div>
                </figure>
                <div className="card-body items-center text-center">
                  <h3 className="card-title text-2xl">{dest.city}</h3>
                  <p className="text-gray-500 font-mono">{dest.code}</p>
                  <div className="badge badge-primary badge-lg mt-2">
                    Từ {dest.price}
                  </div>
                  <div className="card-actions mt-4">
                    <button className="btn btn-sm btn-outline btn-primary">
                      Xem chuyến bay
                    </button>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12">🎯 Tại sao chọn chúng tôi?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="card bg-white shadow-xl hover:shadow-2xl transition-all">
              <div className="card-body items-center text-center">
                <div className="bg-blue-100 p-4 rounded-full mb-4">
                  <Plane size={48} className="text-primary" />
                </div>
                <h3 className="card-title text-2xl mb-2">Nhiều lựa chọn</h3>
                <p className="text-gray-600">Hàng trăm chuyến bay từ các hãng hàng không uy tín hàng đầu Việt Nam</p>
              </div>
            </div>
            <div className="card bg-white shadow-xl hover:shadow-2xl transition-all">
              <div className="card-body items-center text-center">
                <div className="bg-green-100 p-4 rounded-full mb-4">
                  <Shield size={48} className="text-success" />
                </div>
                <h3 className="card-title text-2xl mb-2">An toàn & Bảo mật</h3>
                <p className="text-gray-600">Thông tin cá nhân và thanh toán của bạn được bảo vệ tuyệt đối với công nghệ mã hóa hiện đại</p>
              </div>
            </div>
            <div className="card bg-white shadow-xl hover:shadow-2xl transition-all">
              <div className="card-body items-center text-center">
                <div className="bg-purple-100 p-4 rounded-full mb-4">
                  <CreditCard size={48} className="text-secondary" />
                </div>
                <h3 className="card-title text-2xl mb-2">Thanh toán dễ dàng</h3>
                <p className="text-gray-600">Hỗ trợ đa dạng phương thức thanh toán: Thẻ, ví điện tử, chuyển khoản</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">💬 Khách hàng nói gì về chúng tôi</h2>
            <p className="text-xl text-gray-600">Hơn 100,000 khách hàng hài lòng</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="card bg-base-100 shadow-xl">
                <div className="card-body">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="text-4xl">{testimonial.avatar}</div>
                    <div>
                      <h3 className="font-bold text-lg">{testimonial.name}</h3>
                      <div className="flex gap-1">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <Star key={i} size={16} className="fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-600 italic">"{testimonial.comment}"</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-primary to-secondary text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <Clock size={64} className="mx-auto mb-6 opacity-90" />
          <h2 className="text-4xl font-bold mb-4">Đã có mã đặt chỗ?</h2>
          <p className="text-xl mb-8 opacity-90">Tra cứu thông tin vé của bạn ngay lập tức</p>
          <Link to="/track" className="btn btn-outline btn-lg text-white border-white hover:bg-white hover:text-primary">
            <Search className="mr-2" />
            Tra cứu booking
          </Link>
        </div>
      </section>
    </div>
  )
}
