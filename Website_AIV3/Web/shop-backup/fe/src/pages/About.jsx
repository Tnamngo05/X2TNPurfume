export default function About(){
  return (
    <div className="container" aria-labelledby="about-title">
      <header className="page-header">
        <h1 id="about-title">Về X2TNPerfume</h1>
        <p className="muted">Thương hiệu nước hoa cao cấp – minh bạch, chính hãng, dịch vụ chuẩn doanh nhân</p>
      </header>

      <main className="about-content">
        {/* HERO */}
        <section className="about-hero" aria-label="Giới thiệu tổng quan">
          <div className="hero-text">
            <h2>X2TNPerfume – Đơn vị phân phối nước hoa cao cấp</h2>
            <p>
              Thành lập với định hướng <strong>chính hãng 100%</strong> và dịch vụ <strong>cá nhân hóa</strong>,
              X2TNPerfume đồng hành cùng doanh nhân và khách hàng cao cấp xây dựng dấu ấn riêng qua từng nốt hương.
              Chúng tôi đặt <em>sự minh bạch</em> và <em>trải nghiệm khách hàng</em> ở vị trí trung tâm.
            </p>
            <ul className="hero-points" role="list">
              <li>
                <svg className="hero-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                Hoá đơn VAT & chứng từ xuất xứ đầy đủ
              </li>
              <li>
                <svg className="hero-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
                Quét QR kiểm tra tem/serial – đối chiếu với hệ thống
              </li>
              <li>
                <svg className="hero-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004 12c0 2.972 1.15 5.727 3.039 7.732M7 12l2.165 2.165A1 1 0 0011 14h4a1 1 0 00.707-.293l2.585-2.585M16 17h.01M16 20h.01" /></svg>
                Đổi trả trong 7 ngày nếu không đúng mô tả
              </li>
            </ul>
          </div>
          <div className="hero-image" aria-hidden="true">
            <img 
              src="src/images/banner.png"
              alt="Không gian trưng bày nước hoa cao cấp" 
              loading="lazy"
            />                   
          </div>
        </section>

        {/* TRUST BADGES - UPGRADED WITH NEW SVGS */}
        <section className="trust-badges" aria-label="Bảo chứng tin cậy">
          <div className="badge">
            <div className="badge-icon">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
            </div>
            <h3>Chính hãng 100%</h3>
            <p>Cam kết hoàn tiền <strong>200%</strong> nếu phát hiện hàng giả. Mọi sản phẩm đều niêm phong & có mã xác thực.</p>
          </div>
          <div className="badge">
            <div className="badge-icon">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
            </div>
            <h3>Minh bạch chứng từ</h3>
            <p>Hoá đơn VAT, CO/ CQ, lịch sử nhập hàng và điều kiện bảo quản được lưu trữ & xuất trình khi cần.</p>
          </div>
          <div className="badge">
            <div className="badge-icon">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 10a6 6 0 11-12 0 6 6 0 0112 0zm-6 9v2m-6-2h12a2 2 0 002-2v-3a2 2 0 00-2-2H6a2 2 0 00-2 2v3a2 2 0 002 2z" /></svg>
            </div>
            <h3>Dịch vụ 1:1</h3>
            <p>Chuyên gia tư vấn mùi hương cá nhân hoá theo bối cảnh sử dụng, trang phục và cá tính của bạn.</p>
          </div>
          <div className="badge">
            <div className="badge-icon">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <h3>Giao nhanh – bảo quản chuẩn</h3>
            <p>Đóng gói chống sốc, chèn mát theo tiêu chuẩn; giao nội thành trong 2–4 giờ.</p>
          </div>
        </section>

        {/* METRICS - UPGRADED */}
        <section className="metrics" aria-label="Các con số minh chứng">
          <article className="metric"><div className="metric-number" aria-label="Tỷ lệ khách quay lại">92%</div><div className="metric-label">Khách hàng quay lại</div></article>
          <article className="metric"><div className="metric-number" aria-label="Đánh giá 5 sao">4.9/5</div><div className="metric-label">Điểm hài lòng</div></article>
          <article className="metric"><div className="metric-number" aria-label="Sản phẩm chính hãng">1.200+</div><div className="metric-label">SKU chính hãng</div></article>
          <article className="metric"><div className="metric-number" aria-label="Khách doanh nghiệp">150+</div><div className="metric-label">Khách hàng doanh nghiệp</div></article>
        </section>
        
        {/* WHY US */}
        <section className="why-us" aria-label="Vì sao chọn chúng tôi">
          <h2>Vì Sao Chọn X2TNPerfume?</h2>
          <div className="why-grid">
            <div className="why-card">
              <div className="why-icon">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c1.657 0 3 .895 3 2s-1.343 2-3 2-3 .895-3 2s1.343 2 3 2m0-8V7m0 10v1m-7-9h14" /></svg>
              </div>
              <h3>Trải Nghiệm Độc Quyền</h3>
              <p>Mỗi nốt hương là một câu chuyện, chúng tôi giúp bạn kể câu chuyện của mình một cách tinh tế và độc đáo.</p>
            </div>
            <div className="why-card">
              <div className="why-icon">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 6l3 1m0 0l-3 1.09M6 7l-3 1m0 0l3 1.09M6 7v10l-3 1m0 0l3 1.09M6 17H3a2 2 0 00-2 2v2h19v-2a2 2 0 00-2-2h-3M6 17v-4m-6 4a2 2 0 002 2h19v-2a2 2 0 00-2-2h-3" /></svg>
              </div>
              <h3>Chất Lượng Vượt Trội</h3>
              <p>Cam kết chỉ cung cấp những chai nước hoa được bảo quản tốt nhất, giữ trọn vẹn tinh tuý của mùi hương.</p>
            </div>
            <div className="why-card">
              <div className="why-icon">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5 5.754 5 4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18s-3.332.477-4.5 1.253" /></svg>
              </div>
              <h3>Tư Vấn Chuyên Sâu</h3>
              <p>Đội ngũ chuyên gia sẵn sàng lắng nghe và đưa ra lời khuyên chân thành, giúp bạn tìm được mùi hương lý tưởng.</p>
            </div>
          </div>
        </section>
        
        {/* POLICIES - UPGRADED WITH NEW SVGS */}
        <section className="policies" aria-label="Chính sách minh bạch">
          <h2>Chính Sách Vàng & Bảo Hành</h2>
          <ul className="policy-list" role="list">
            <li>
              <span className="policy-icon">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
              </span>
              <span><strong>Đổi trả 7 ngày</strong> – sản phẩm giữ nguyên tem niêm phong, kèm hoá đơn.</span>
            </li>
            <li>
              <span className="policy-icon">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
              </span>
              <span><strong>Bảo hành mùi hương</strong> 30 ngày – tư vấn đổi dòng phù hợp nếu chưa ưng ý.</span>
            </li>
            <li>
              <span className="policy-icon">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
              </span>
              <span><strong>Hoàn tiền 200%</strong> nếu phát hiện hàng không chính hãng.</span>
            </li>
            <li>
              <span className="policy-icon">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
              </span>
              <span><strong>Giao hàng an toàn</strong> – chụp ảnh đóng gói & số kiện gửi trước khi giao.</span>
            </li>
          </ul>
        </section>
        
        {/* TESTIMONIALS - UPGRADED WITH STYLED QUOTES */}
        <section className="testimonials" aria-label="Khách hàng nói gì">
          <h2>Khách Hàng Nói Gì Về Chúng Tôi</h2>
          <div className="testi-grid">
            <div className="testi-card">
              <blockquote>"Dịch vụ tư vấn rất chuyên nghiệp, giúp tôi chọn được mùi hương phù hợp với phong cách công sở. Giao hàng nhanh và đóng gói rất cẩn thận."</blockquote>
              <figcaption>— Trần Minh Quân, CEO Công ty ABC</figcaption>
            </div>
            <div className="testi-card">
              <blockquote>"Tôi rất hài lòng với chất lượng sản phẩm và sự minh bạch về nguồn gốc. Sẽ luôn ủng hộ X2TNPerfume."</blockquote>
              <figcaption>— Lê Thị Thảo, Chuyên viên Marketing</figcaption>
            </div>
            <div className="testi-card">
              <blockquote>"Đây là nơi duy nhất tôi tin tưởng mua nước hoa online. Mùi hương giữ rất lâu và luôn nhận được lời khen."</blockquote>
              <figcaption>— Phạm Văn Hùng, Quản lý dự án</figcaption>
            </div>
          </div>
        </section>
        
        {/* FAQ - UPGRADED WITH ROTATING SVG ICON */}
        <section className="faq" aria-label="Câu hỏi thường gặp">
          <h2>Câu Hỏi Thường Gặp</h2>
          <details className="faq-item">
            <summary>
              Sản phẩm có chính hãng không?
              <svg className="faq-arrow" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
            </summary>
            <div className="faq-content">
              <p>Mọi sản phẩm đều chính ngạch; có tem/serial, hoá đơn, và hướng dẫn kiểm tra QR. Không chính hãng – hoàn 200%.</p>
            </div>
          </details>
          <details className="faq-item">
            <summary>
              Chính sách đổi trả thế nào?
              <svg className="faq-arrow" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
            </summary>
            <div className="faq-content">
              <p>Trong 7 ngày kể từ khi nhận hàng; sản phẩm còn nguyên tem niêm phong và kèm hoá đơn.</p>
            </div>
          </details>
          <details className="faq-item">
            <summary>
              Thời gian giao hàng?
              <svg className="faq-arrow" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
            </summary>
            <div className="faq-content">
              <p>Nội thành 2–4h (tuỳ khu vực); tỉnh thành 1–3 ngày làm việc. Đơn đều được chụp chứng từ đóng gói.</p>
            </div>
          </details>
        </section>
        {/* Structured Data for SEO */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: `
          {
            "@context": "https://schema.org",
            "@type": "AboutPage",
            "name": "Về X2TNPerfume",
            "description": "X2TNPerfume là thương hiệu nước hoa cao cấp cam kết chính hãng 100%, dịch vụ cá nhân hóa và minh bạch chứng từ.",
            "mainEntityOfPage": {
              "@type": "WebPage",
              "@id": "http://yourdomain.com/about"
            },
            "publisher": {
              "@type": "Organization",
              "name": "X2TNPerfume",
              "logo": {
                "@type": "ImageObject",
                "url": "http://yourdomain.com/logo.png"
              }
            },
            "mentions": [
              {
                "@type": "Thing",
                "name": "nước hoa chính hãng"
              },
              {
                "@type": "Thing",
                "name": "tư vấn mùi hương"
              },
              {
                "@type": "Thing",
                "name": "chính sách đổi trả"
              }
            ]
          }
        `}} />
      </main>

      <style jsx>{`
        /* --- GENERAL & LAYOUT --- */
        .page-header { text-align:center; margin-bottom: 64px; padding: 40px 0 20px; }
        .page-header h1 { font-size: 3.2rem; margin-bottom: 16px; background: linear-gradient(135deg, #f2f2f3 0%, #a8927a 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .page-header .muted { font-size: 1.2rem; max-width: 720px; margin: 0 auto; color: #9CA3AF; }
        .about-content { max-width: 1200px; margin: 0 auto; }
        h2 { text-align:center; font-size: 2.5rem; margin-bottom: 48px; color:#f2f2f3; }
        section { margin-bottom: 80px; }

        /* --- HERO --- */
        .about-hero { display:grid; grid-template-columns: 1fr; gap: 48px; align-items:center; }
        .hero-text h2 { font-size: 2.4rem; line-height: 1.3; margin-bottom: 20px; color:#f2f2f3; }
        .hero-text p { font-size:1.1rem; line-height:1.8; color: #D1D5DB; }
        .hero-points { margin: 24px 0 0; padding: 0; list-style-type: none; } /* Remove default list style */
        .hero-points li { margin-bottom: 10px; display: flex; align-items: center; gap: 12px; color: #D1D5DB; }
        .hero-icon { width: 24px; height: 24px; color: #a8927a; flex-shrink: 0; }
        .hero-image { order: 2; }
        .hero-image img { width:100%; border-radius: 16px; box-shadow: 0 20px 50px rgba(0,0,0,.4); }

        /* --- TRUST BADGES (Upgraded) --- */
        .trust-badges { display:grid; grid-template-columns: repeat(4, 1fr); gap: 24px; }
        .badge { background: #1a1b28; border:1px solid rgba(255,255,255,.08); border-radius:16px; padding: 28px; text-align: center; }
        .badge-icon { display: inline-flex; align-items: center; justify-content: center; width: 52px; height: 52px; margin-bottom: 16px; border-radius: 50%; background: rgba(168,146,122,.1); color: #a8927a; }
        .badge-icon svg { width: 28px; height: 28px; }
        .badge h3 { margin: 0 0 8px 0; color:#f2f2f3; font-size: 1.2rem; }
        .badge p { margin:0; color: #9CA3AF; line-height:1.6; font-size: 0.95rem; }

        /* --- METRICS (Upgraded) --- */
        .metrics { display:grid; grid-template-columns: repeat(4, 1fr); gap: 1px; margin-bottom: 80px; background: rgba(255,255,255,.08); border-radius: 16px; overflow: hidden; }
        .metric { background-color: #13141a; padding: 32px 24px; text-align:center; }
        .metric-number { font-size: 3rem; font-weight: 700; color:#a8927a; line-height: 1.1; }
        .metric-label { color: #9CA3AF; margin-top: 8px; font-size: 0.9rem; }

        /* --- WHY US --- */
        .why-us h2 { margin-bottom: 32px; }
        .why-grid { display:grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
        .why-card { background: #1a1b28; border:1px solid rgba(255,255,255,.08); border-radius:16px; padding: 28px; text-align: center; }
        .why-icon { display: inline-flex; align-items: center; justify-content: center; width: 52px; height: 52px; margin-bottom: 16px; border-radius: 50%; background: rgba(16, 185, 129, 0.1); color: #10B981; }
        .why-icon svg { width: 28px; height: 28px; }
        .why-card h3 { margin: 0 0 8px 0; color:#f2f2f3; font-size: 1.2rem; }
        .why-card p { margin:0; color: #9CA3AF; line-height:1.6; font-size: 0.95rem; }

        /* --- POLICIES (Upgraded)--- */
        .policies h2 { margin-bottom: 32px; }
        .policy-list { max-width: 900px; margin: 0 auto; display:grid; grid-template-columns: 1fr 1fr; gap: 20px; padding:0; list-style: none; }
        .policy-list li { display: flex; align-items: flex-start; gap: 12px; font-size: 1.05rem; color: #D1D5DB; }
        .policy-icon { color: #10B981; /* Green checkmark */ width: 24px; height: 24px; flex-shrink: 0; margin-top: 3px; }
        .policy-icon svg { width: 100%; height: 100%; }


        /* --- TESTIMONIALS (Upgraded) --- */
        .testi-grid { display:grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
        .testi-card { background: #1a1b28; border:1px solid rgba(255,255,255,.08); border-radius:16px; padding: 28px; position: relative; }
        .testi-card::before { content: '“'; position: absolute; top: 10px; left: 20px; font-size: 5rem; color: rgba(168,146,122,.1); z-index: 0; }
        .testi-card blockquote { margin: 0 0 12px 0; font-style: italic; position: relative; z-index: 1; color: #E5E7EB; }
        .testi-card figcaption { color: #9CA3AF; position: relative; z-index: 1; }

        /* --- FAQ (Upgraded) --- */
        .faq h2 { margin-bottom: 32px; }
        .faq-item { background: #1a1b28; border:1px solid rgba(255,255,255,.08); border-radius:12px; margin-bottom: 12px; transition: background-color 0.2s; }
        .faq-item summary { list-style: none; display: flex; justify-content: space-between; align-items: center; cursor:pointer; font-weight:600; color:#E5E7EB; padding: 20px; }
        .faq-item summary::-webkit-details-marker { display: none; }
        .faq-arrow { width: 24px; height: 24px; transition: transform 0.3s ease; color: #a8927a; }
        .faq-item[open] .faq-arrow { transform: rotate(180deg); }
        .faq-item[open] { background-color: #1F212E; }
        .faq-content { padding: 0 20px 20px; color: #9CA3AF; line-height: 1.7; }

        /* --- CTA (Upgraded) --- */
        .cta { text-align:center; margin: 80px auto; background: #1a1b28; border:1px solid #a8927a; border-radius:16px; padding: 48px; box-shadow: 0 0 40px rgba(168,146,122,0.2); }
        .cta h2 { margin: 0 0 12px 0; color:#f2f2f3; font-size: 2rem; }
        .cta p { color: #9CA3AF; margin: 0 auto 24px auto; max-width: 600px; }
        .cta-actions { display:flex; gap: 16px; justify-content:center; flex-wrap: wrap; }
        .btn { display:inline-flex; align-items:center; justify-content:center; height:48px; padding: 0 24px; border-radius: 12px; border: 2px solid; text-decoration:none; font-weight: 600; transition: all 0.2s ease; }
        .btn-primary { background: #a8927a; border-color: #a8927a; color: #0b0b0c; }
        .btn-primary:hover { background: #bda58a; border-color: #bda58a; transform: translateY(-3px); }
        .btn-ghost { background: transparent; border-color: #374151; color: #f2f2f3; }
        .btn-ghost:hover { border-color: #a8927a; color: #a8927a; }
        .btn-icon { width: 20px; height: 20px; margin-left: 8px; }

        /* --- Responsive --- */
        @media (max-width: 1024px) {
          .trust-badges, .metrics, .why-grid, .testi-grid { grid-template-columns: repeat(2, 1fr); }
          .policy-list { grid-template-columns: 1fr; }
          .hero-text h2 { font-size: 2rem; }
          .page-header h1 { font-size: 2.5rem; }
          h2 { font-size: 2rem; }
        }
        @media (max-width: 768px) {
          .about-hero { grid-template-columns: 1fr; }
          .hero-text { order: 2; } .hero-image { order: 1; }
          .trust-badges, .metrics, .why-grid, .testi-grid { grid-template-columns: 1fr; }
          .page-header h1 { font-size: 2rem; }
          .page-header .muted { font-size: 1rem; }
          h2 { font-size: 1.8rem; }
          .trust-badges .badge, .why-card, .testi-card { padding: 20px; }
          .cta { padding: 32px; }
          .cta h2 { font-size: 1.5rem; }
          .cta-actions { flex-direction: column; }
        }
      `}</style>
    </div>
  )
}