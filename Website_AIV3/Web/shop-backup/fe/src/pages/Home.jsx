import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import QuizTriggerButton from '../components/quiz/QuizTriggerButton.jsx'

const DEFAULT_PRODUCT_IMAGE = 'https://images.unsplash.com/photo-1595425970377-2f8ded7c7b19?q=80&w=500&auto=format&fit=crop'

export default function Home() {
  const [currentFeature, setCurrentFeature] = useState(0)
  
  // 👉 THÊM: function thanh toán VNPAY
  const handlePayment = async () => {
    try {
      const res = await fetch("http://localhost:8000/payment/create", {
        method: "POST"
      })

      const data = await res.json()

      // 👉 redirect sang VNPAY
      window.location.href = data.payment_url

    } catch (error) {
      console.error("Lỗi thanh toán:", error)
      alert("Không thể tạo thanh toán!")
    }
  }

  const features = [
    {
      title: "Hương thơm độc đáo",
      description: "Mỗi mùi hương là một câu chuyện đặc biệt, tạo nên dấu ấn riêng cho doanh nghiệp của bạn"
    },
    {
      title: "Thiết kế tinh xảo",
      description: "Bộ sưu tập chai đựng được thiết kế tỉ mỉ, thể hiện đẳng cấp thượng lưu"
    },
    {
      title: "Nguyên liệu tự nhiên",
      description: "Chiết xuất từ những thành phần thiên nhiên quý hiếm, an toàn cho sức khỏe"
    }
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [features.length])

  return (
    <div className="home-container">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1>Hương thơm định nghĩa đẳng cấp</h1>
          <p className="muted">Bộ sưu tập nước hoa cao cấp dành cho giới thượng lưu.</p>

          <div style={{marginTop: 24, display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap'}}>
            <Link to="/products" className="btn btn-primary">Khám phá ngay</Link>
            <QuizTriggerButton variant="banner" />
          </div>

        </div>
        <div className="hero-image">
          <img src="src/images/logo.png" 
               alt="Bộ sưu tập nước hoa cao cấp" />
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <h2>Điểm đặc biệt của chúng tôi</h2>
        <div className="features-container">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className={`feature-card ${index === currentFeature ? 'active' : ''}`}
            >
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </div>
          ))}
        </div>
        <div className="feature-indicators">
          {features.map((_, index) => (
            <button
              key={index}
              className={`indicator ${index === currentFeature ? 'active' : ''}`}
              onClick={() => setCurrentFeature(index)}
            />
          ))}
        </div>
      </section>

      {/* Best Sellers Section */}
      <section className="bestsellers-section">
        <h2>Sản phẩm bán chạy</h2>
        <div className="products-preview">
          <div className="product-card">
            <div className="product-image">
              <img src="https://img.vuahanghieu.com/unsafe/0x0/left/top/smart/filters:quality(90)/https://admin.vuahanghieu.com/upload/news/content/2025/08/nuoc-hoa-minh-beo-7-jpg-1754642399-08082025153959.jpg" 
                   alt="Nước hoa Signature" />
            </div>
            <h3>Signature</h3>
            <p>Hương thơm quý phái quyến rũ mùi dâu</p>
          </div>
          <div className="product-card">  
            <div className="product-image">
              <img src="https://product.hstatic.net/200000455999/product/elegant_8432fac324094827a4700f258c922486.png" 
                   alt="Nước hoa Elegance" />
            </div>
            <h3>Elegance</h3>
            <p>Thanh lịch và tinh tế</p>
          </div>
          <div className="product-card">
            <div className="product-image">
              <img
                src="https://clmensstore.com/wp-content/uploads/2021/06/Cuba-Prestige-Classic-by-Fragluxe.png"
                alt="Nước hoa Prestige"
                  onError={(event) => {
                  event.currentTarget.onerror = null;
                  event.currentTarget.src = DEFAULT_PRODUCT_IMAGE;
                  }}
              />
            </div>
                <h3>Prestige</h3>
              <p>Đẳng cấp và quyền lực</p>
            </div>
        </div>
        <div style={{textAlign: 'center', marginTop: 32}}>
          <Link to="/products" className="btn btn-outline">Xem tất cả sản phẩm</Link>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="testimonials-section">
        <h2>Khách hàng nói gì về chúng tôi</h2>
        <div className="testimonial">
          <p className="testimonial-text">
            "Hương thơm độc đáo này đã trở thành một phần không thể thiếu trong hình ảnh thương hiệu của chúng tôi. 
            Khách hàng luôn nhận ra và đánh giá cao mùi hương tinh tế này."
          </p>
          <p className="testimonial-author">- Ông Nam, CEO Tập đoàn DVFB</p>
        </div>
      </section>
    </div>
  )
}
