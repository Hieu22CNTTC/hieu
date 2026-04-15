import { Plane, Phone, Mail, MapPin, Facebook, Twitter, Instagram, Youtube } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 text-white">
      <div className="container mx-auto px-4 py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Company Info */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Plane className="w-8 h-8 text-sky-400" />
              <div>
                <h3 className="font-bold text-xl">TrungHieuFlight</h3>
                <p className="text-xs text-sky-300">Hệ thống đặt vé máy bay</p>
              </div>
            </div>
            <p className="text-sm text-gray-300 leading-relaxed">
              Mang đến trải nghiệm bay an toàn, tiện lợi và chuyên nghiệp. 
              Kết nối mọi hành trình của bạn.
            </p>
            <div className="flex gap-3 mt-4">
              <a href="https://www.facebook.com/duong.trung.hieu.3004/" className="w-9 h-9 bg-blue-700 hover:bg-sky-500 rounded-full flex items-center justify-center transition-colors">
                <Facebook className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 bg-blue-700 hover:bg-sky-500 rounded-full flex items-center justify-center transition-colors">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="https://www.instagram.com/dng_hiupou/" className="w-9 h-9 bg-blue-700 hover:bg-sky-500 rounded-full flex items-center justify-center transition-colors">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 bg-blue-700 hover:bg-sky-500 rounded-full flex items-center justify-center transition-colors">
                <Youtube className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-bold text-lg mb-4 text-sky-300">Dịch vụ</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-sky-300 transition-colors">Đặt vé máy bay</a></li>
              <li><a href="#" className="hover:text-sky-300 transition-colors">Tra cứu vé</a></li>
              <li><a href="#" className="hover:text-sky-300 transition-colors">Quản lý đặt chỗ</a></li>
              <li><a href="#" className="hover:text-sky-300 transition-colors">Chọn chỗ ngồi</a></li>
              <li><a href="#" className="hover:text-sky-300 transition-colors">Hành lý ký gửi</a></li>
              <li><a href="#" className="hover:text-sky-300 transition-colors">Bảo hiểm du lịch</a></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-bold text-lg mb-4 text-sky-300">Hỗ trợ khách hàng</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-sky-300 transition-colors">Câu hỏi thường gặp</a></li>
              <li><a href="#" className="hover:text-sky-300 transition-colors">Điều khoản sử dụng</a></li>
              <li><a href="#" className="hover:text-sky-300 transition-colors">Chính sách bảo mật</a></li>
              <li><a href="#" className="hover:text-sky-300 transition-colors">Chính sách hoàn hủy</a></li>
              <li><a href="#" className="hover:text-sky-300 transition-colors">Quy định vận chuyển</a></li>
              <li><a href="#" className="hover:text-sky-300 transition-colors">Hướng dẫn thanh toán</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-bold text-lg mb-4 text-sky-300">Liên hệ</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-1 text-sky-400 flex-shrink-0" />
                <span>459 Tôn Đức Thắng, Liên Chiểu, Đà Nẵng</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-sky-400 flex-shrink-0" />
                <div>
                  <div className="font-semibold text-sky-300">Hotline 24/7</div>
                  <a href="tel:1900xxxx" className="hover:text-sky-300">1900 1234</a>
                </div>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-sky-400 flex-shrink-0" />
                <a href="mailto:support@trunghieuflight.vn" className="hover:text-sky-300">support@trunghieuflight.vn</a>
              </li>
            </ul>
            
            {/* App Download */}
            <div className="mt-4 pt-4 border-t border-blue-700">
              <p className="text-xs text-gray-400 mb-2">Tải ứng dụng</p>
              <div className="flex gap-2">
                <button className="px-3 py-1.5 bg-blue-700 hover:bg-blue-600 rounded text-xs transition-colors">
                  App Store
                </button>
                <button className="px-3 py-1.5 bg-blue-700 hover:bg-blue-600 rounded text-xs transition-colors">
                  Google Play
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-blue-700">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-300">
            <div className="text-center md:text-left">
              <p>&copy; {new Date().getFullYear()} TrungHieuFlight Airlines. All rights reserved.</p>
              <p className="text-xs mt-1">Công ty cổ phần Hàng không TrungHieuFlight - MSDN: 0123456789</p>
            </div>
            <div className="flex gap-6 text-xs">
              <a href="#" className="hover:text-sky-300">Sitemap</a>
              <a href="#" className="hover:text-sky-300">RSS</a>
              <a href="#" className="hover:text-sky-300">Liên hệ</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
