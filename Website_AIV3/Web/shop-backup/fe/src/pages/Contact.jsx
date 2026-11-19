import { useState } from 'react';
import { ContactAPI } from '../lib/api.js';

export default function Contact(){
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [ok, setOk] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await ContactAPI.send({ name, email, phone, subject, message });
      setOk(true);
      setName('');
      setEmail('');
      setPhone('');
      setSubject('');
      setMessage('');
    } catch (error) {
      console.error('Lỗi khi gửi liên hệ:', error);
      alert('Có lỗi xảy ra khi gửi thông tin. Vui lòng thử lại sau hoặc liên hệ Hotline.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="page-header">
        <h1>Liên Hệ Với X2TN Perfume</h1>
        <p className="muted">Chúng tôi luôn sẵn sàng lắng nghe và tư vấn mùi hương phù hợp nhất cho bạn</p>
      </div>

      <div className="contact-container">
        {/* Contact Information */}
        <div className="contact-info">
          <h2>Thông Tin Liên Hệ</h2>
          <p>Ghé thăm showroom của chúng tôi hoặc để lại lời nhắn để được hỗ trợ nhanh nhất.</p>
          
          <div className="contact-details">
            <div className="contact-item">
              <div className="contact-icon">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>
              </div>
              <div className="contact-text">
                <h4>Địa Chỉ</h4>
                <p>256 Đ. Nguyễn Văn Cừ, An Hoà, Cái Khế<br />TP. Cần Thơ, Việt Nam</p>
              </div>
            </div>
            
            <div className="contact-item">
              <div className="contact-icon">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 6.75z" /></svg>
              </div>
              <div className="contact-text">
                <h4>Điện Thoại</h4>
                <p>+84 969 868 969<br />+84 123 456 999 (Hotline)</p>
              </div>
            </div>
            
            <div className="contact-item">
              <div className="contact-icon">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>
              </div>
              <div className="contact-text">
                <h4>Email</h4>
                <p>x2tn@gmail.com<br />support@x2tnperfume.com</p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="contact-form">
          <h2>Gửi Tin Nhắn</h2>
          {!ok ? (
            <form onSubmit={submit}>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="name">Họ và Tên *</label>
                  <input id="name" type="text" required placeholder="Nhập tên của bạn" value={name} onChange={e => setName(e.target.value)} />
                </div>
                <div className="form-group">
                  <label htmlFor="email">Email *</label>
                  <input id="email" type="email" required placeholder="Địa chỉ email liên hệ" value={email} onChange={e => setEmail(e.target.value)} />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="phone">Số Điện Thoại</label>
                  <input id="phone" type="tel" placeholder="Nhập số điện thoại" value={phone} onChange={e => setPhone(e.target.value)} />
                </div>
                <div className="form-group">
                  <label htmlFor="subject">Chủ Đề *</label>
                  <select id="subject" required value={subject} onChange={e => setSubject(e.target.value)}>
                    <option value="">Chọn nhu cầu tư vấn</option>
                    <option value="Tư vấn mùi hương">Tư vấn mùi hương</option>
                    <option value="Kiểm tra đơn hàng">Kiểm tra đơn hàng</option>
                    <option value="Giá sỉ số lượng lớn">Giá sỉ số lượng lớn</option>
                    <option value="Vấn đề khác">Vấn đề khác</option>
                  </select>
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="message">Lời Nhắn *</label>
                <textarea id="message" rows="6" required placeholder="Nội dung cần hỗ trợ..." value={message} onChange={e => setMessage(e.target.value)}></textarea>
              </div>
              
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Đang gửi tin nhắn...' : 'Gửi Yêu Cầu'}
              </button>
            </form>
          ) : (
            <div className="success-message">
              <h3>Cảm Ơn Bạn!</h3>
              <p>X2TN Perfume đã nhận được thông tin. Chúng tôi sẽ phản hồi bạn sớm nhất có thể.</p>
              <button className="btn btn-outline" onClick={() => setOk(false)}>Gửi Thêm Tin Nhắn</button>
            </div>
          )}
        </div>
      </div>

      {/* Map Section - Real Google Map */}
      <div className="map-section">
        <h2>Vị Trí Cửa Hàng Tại Cần Thơ</h2>
        <div className="map-container">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d5412.1067417272825!2d105.76546501182325!3d10.04678069001956!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31a0880f08006ffb%3A0x9a745510330faf4e!2zVHLGsOG7nW5nIMSQ4bqhaSBo4buNYyBL4bu5IHRodeG6rXQgLSBDw7RuZyBuZ2jhu4cgQ-G6p24gVGjGoQ!5e1!3m2!1sen!2sus!4v1772210473711!5m2!1sen!2sus"
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen=""
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          ></iframe>
        </div>
      </div>
      
      <style jsx>{`
        .page-header { text-align: center; margin-bottom: 60px; padding: 40px 0 20px; }
        .page-header h1 { font-size: 2.8rem; margin-bottom: 16px; background: linear-gradient(135deg, #f2f2f3 0%, #a8927a 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .page-header .muted { font-size: 1.2rem; max-width: 600px; margin: 0 auto; color: #9CA3AF; }
        .contact-container { display: grid; grid-template-columns: 1fr; gap: 60px; margin-bottom: 80px; }
        .contact-info h2, .contact-form h2 { font-size: 2rem; margin-bottom: 24px; color: #f2f2f3; }
        .contact-item { display: flex; align-items: flex-start; gap: 16px; margin-bottom: 32px; }
        .contact-icon { width: 50px; height: 50px; background: linear-gradient(145deg, #1a1b28, #10121d); border: 1px solid rgba(255,255,255,.08); border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .contact-icon svg { width: 24px; height: 24px; color: #a8927a; }
        .contact-text h4 { margin: 0 0 8px 0; color: #f2f2f3; font-size: 1.1rem; }
        .contact-text p { margin: 0; color: #9CA3AF; line-height: 1.5; }
        .form-row { display: grid; grid-template-columns: 1fr; gap: 20px; margin-bottom: 20px; }
        .form-group { margin-bottom: 20px; }
        .form-group label { display: block; margin-bottom: 8px; color: #E5E7EB; }
        .form-group input, .form-group select, .form-group textarea { width: 100%; padding: 14px 16px; border-radius: 10px; background: #0f111a; border: 1px solid #374151; color: #f2f2f3; }
        .btn { padding: 14px 28px; font-weight: 600; border-radius: 8px; cursor: pointer; transition: 0.3s; border: none; }
        .btn-primary { background: #a8927a; color: #0b0b0c; }
        .btn-primary:hover:not(:disabled) { background: #bda58a; transform: translateY(-2px); }
        .success-message { text-align: center; padding: 40px; background: #1a1b28; border-radius: 16px; border: 1px solid #4ade80; }
        .map-section h2 { text-align: center; font-size: 2.2rem; margin-bottom: 40px; color: #f2f2f3; }
        .map-container { border-radius: 16px; overflow: hidden; height: 450px; border: 1px solid #374151; }
        @media (min-width: 968px) {
          .contact-container { grid-template-columns: 1fr 1.2fr; }
          .form-row { grid-template-columns: 1fr 1fr; }
        }
      `}</style>
    </div>
  )
}