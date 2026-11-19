import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
// CHANGED: Import API client thật
import {
  AddressAPI,
  CouponAPI,
  OrdersAPI,
  VNPayAPI,
  readJsonStorage,
  removeStorage,
} from '../lib/api';

// REMOVED: Xóa bỏ đối tượng api giả lập
// const api = { ... };

export default function Checkout(){
  const [cart, setCart] = useState([]);
  const [formData, setFormData] = useState({
    fullName: '', email: '', phone: '', address: '', city: '',
    ward: '', paymentMethod: 'cod', note: ''
  });
  const [loading, setLoading] = useState(false);
  // Dữ liệu địa chỉ giả lập được giữ lại để component hoạt động
  const [cities, setCities] = useState([]);
  const [wards, setWards] = useState([]);
  const [addressLoading, setAddressLoading] = useState(false);
  const [coupon, setCoupon] = useState({ code: '', amount: 0, type: '', value: 0 });
  const wardRequestRef = useRef(0);
  const navigate = useNavigate();

  useEffect(() => {
    const cartData = readJsonStorage('cart', []);
    const savedCoupon = readJsonStorage('coupon', { code: '', discount: 0 });
    const safeCart = Array.isArray(cartData) ? cartData : [];
    if (safeCart.length === 0) {
      navigate('/products'); 
    }
    setCart(safeCart);
    const savedCouponCode = typeof savedCoupon === 'string'
      ? savedCoupon
      : typeof savedCoupon?.code === 'string'
        ? savedCoupon.code
        : '';
    const savedSubtotal = safeCart.reduce((total, item) => total + Number(item.price) * Number(item.qty), 0);
    if (savedCouponCode && savedSubtotal > 0) {
      CouponAPI.validate(savedCouponCode, savedSubtotal)
        .then(result => {
          if (result.valid) {
            setCoupon({
              code: result.code,
              amount: Number(result.discount_amount) || 0,
              type: result.discount_type || '',
              value: Number(result.discount_value) || 0,
            });
          }
        })
        .catch(() => {});
    }
    AddressAPI.listProvinces()
      .then(setCities)
      .catch(() => alert('Không thể tải danh sách tỉnh/thành phố.'));
  }, [navigate]);

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleCityChange = (e) => {
    const provinceCode = e.target.value;
    const province = cities.find(city => city.id === provinceCode);
    const requestId = ++wardRequestRef.current;
    setFormData(prev => ({ ...prev, city: province?.name || '', ward: '' }));
    setWards([]);
    if (!provinceCode) return;

    setAddressLoading(true);
    AddressAPI.listWardsByProvince(provinceCode)
      .then(nextWards => {
        if (requestId === wardRequestRef.current) setWards(nextWards);
      })
      .catch(() => {
        if (requestId === wardRequestRef.current) alert('Không thể tải danh sách phường/xã.');
      })
      .finally(() => {
        if (requestId === wardRequestRef.current) setAddressLoading(false);
      });
  };

  const subtotal = cart.reduce((t, i) => t + Number(i.price) * Number(i.qty), 0);
  const discountAmount = Math.min(subtotal, Math.max(0, coupon.amount));
  const discountedSubtotal = subtotal - discountAmount;
  const shippingFee = subtotal > 2000000 || subtotal === 0 ? 0 : 30000;
  const total = Math.max(0, discountedSubtotal + shippingFee);
  const savings = Math.max(0, subtotal - (total - shippingFee));
  const formatPrice = (price) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  

const submit = async (e) => {
  e.preventDefault();
  if (!cart.length) return;

  const invalidCart = cart.some(item =>
    !Number.isInteger(Number(item.id)) ||
    !Number.isInteger(Number(item.qty)) ||
    Number(item.qty) <= 0 ||
    !Number.isFinite(Number(item.price)) ||
    Number(item.price) < 0
  );
  const phonePattern = /^(0|\+84)\d{9,10}$/;
  if (
    invalidCart ||
    !formData.fullName.trim() ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim()) ||
    !phonePattern.test(formData.phone.trim()) ||
    !formData.address.trim() ||
    !formData.city ||
    !formData.ward
  ) {
    alert('Vui lòng kiểm tra lại thông tin giao hàng và sản phẩm trong giỏ.');
    return;
  }

  setLoading(true);

  try {
    const orderData = {
      fullName: formData.fullName,
      email: formData.email,
      phone: formData.phone,
      address: formData.address,
      city: formData.city,
      district: formData.ward,
      ward: formData.ward,
      paymentMethod: formData.paymentMethod, // 'cod' | 'vnpay'
      note: formData.note,
      cart: cart,
      total: total,
      couponCode: coupon.code || null,
    };

    // 1) Luôn tạo Order thật trong Database trước (kể cả khi thanh toán online)
    const created = await OrdersAPI.create(orderData);
    const orderId = created.order_id;

    // 2) Nếu thanh toán VNPay: sinh payment URL gắn với order vừa tạo rồi redirect sang cổng VNPay
    if (formData.paymentMethod === 'vnpay') {
      try {
        const { payment_url } = await VNPayAPI.createPayment(orderId);
        if (!payment_url) {
          alert('Không tạo được link thanh toán VNPay!');
          return;
        }
        removeStorage('cart');
        removeStorage('coupon');
        window.dispatchEvent(new Event('cartUpdated'));
        window.location.href = payment_url;
        return;
      } catch (vnpayErr) {
        console.error('❌ Lỗi tạo thanh toán VNPay:', vnpayErr);
        alert('Không kết nối được cổng thanh toán VNPay. Đơn hàng của bạn vẫn được lưu, vui lòng thử thanh toán lại.');
        navigate(`/thankyou?order_id=${orderId}`);
        return;
      }
    }

    // 3) COD: đơn hàng đã ở trạng thái PROCESSING, chuyển sang Thank You
    removeStorage('cart');
    removeStorage('coupon');
    window.dispatchEvent(new Event('cartUpdated'));

    navigate(`/thankyou?order_id=${orderId}`);

  } catch (err) {
    console.error(err);
    const detail = err.response?.data?.detail;
    const message = Array.isArray(detail)
      ? detail.map(error => {
          const location = Array.isArray(error.loc) ? error.loc.join('.') : '';
          return `${location ? `${location}: ` : ''}${error.msg || JSON.stringify(error)}`;
        }).join('\n')
      : typeof detail === 'object' && detail !== null
        ? JSON.stringify(detail, null, 2)
        : detail || 'Có lỗi xảy ra khi đặt hàng.';
    alert(message);
  } finally {
    setLoading(false);
  }
};


  // Logic render khi giỏ hàng trống được giữ nguyên
  if (cart.length === 0 && !loading) {
    return (
      <div className="container">
        <div className="empty-cart-notice">
          <div className="empty-icon"><svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg></div>
          <h2>Giỏ hàng của bạn đang trống</h2>
          <p>Hãy thêm sản phẩm vào giỏ hàng để tiếp tục thanh toán.</p>
          <button className="btn btn-primary" onClick={() => navigate('/products')}>Quay lại cửa hàng</button>
        </div>
      </div>
    );
  }

  // JSX giữ nguyên, không cần thay đổi
  return (
    <div className="container">
      <div className="page-header">
        <h1>Thanh Toán</h1>
        <p className="muted">Chỉ còn vài bước nữa để hoàn tất đơn hàng của bạn.</p>
      </div>

      <form onSubmit={submit} className="checkout-container">
        <div className="checkout-form">
          <div className="form-section">
            <h3><span className="step-number">1</span>Thông Tin Khách Hàng</h3>
            <div className="form-row">
              <div className="form-group"><label htmlFor="fullName">Họ và Tên *</label><input id="fullName" type="text" required placeholder="Nguyễn Văn A" value={formData.fullName} onChange={handleInputChange}/></div>
              <div className="form-group"><label htmlFor="phone">Số Điện Thoại *</label><input id="phone" type="tel" required placeholder="09xxxxxxxx" value={formData.phone} onChange={handleInputChange}/></div>
            </div>
            <div className="form-group"><label htmlFor="email">Email *</label><input id="email" type="email" required placeholder="nva@email.com" value={formData.email} onChange={handleInputChange}/></div>
          </div>

          <div className="form-section">
            <h3><span className="step-number">2</span>Địa Chỉ Giao Hàng</h3>
            <div className="form-row">
              <div className="form-group"><label htmlFor="city">Tỉnh/Thành Phố *</label><select id="city" required value={cities.find(c => c.name === formData.city)?.id || ''} onChange={handleCityChange}><option value="">Chọn Tỉnh/Thành Phố</option>{cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
              <div className="form-group"><label htmlFor="ward">Phường/Xã *</label><select id="ward" required value={formData.ward} onChange={handleInputChange} disabled={!formData.city || addressLoading}><option value="">{addressLoading ? 'Đang tải...' : 'Chọn Phường/Xã'}</option>{wards.map(w => <option key={w.id} value={w.name}>{w.name}</option>)}</select></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label htmlFor="address">Số nhà, tên đường *</label><input id="address" type="text" required placeholder="Ví dụ: 123 Đường ABC" value={formData.address} onChange={handleInputChange}/></div>
            </div>
          </div>

          <div className="form-section">
            <h3><span className="step-number">3</span>Phương Thức Thanh Toán</h3>
            <div className="payment-methods">
              <label className="payment-method">
                <input type="radio" name="paymentMethod" value="cod" checked={formData.paymentMethod === 'cod'} onChange={handleInputChange} id="paymentMethod" />
                <div className="payment-content">
                  <div className="payment-icon"><svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10l2 2h8a1 1 0 001-1zM3 11h10" /></svg></div>
                  <div className="payment-info"><h4>Thanh toán khi nhận hàng (COD)</h4><p>Thanh toán bằng tiền mặt sau khi nhận hàng.</p></div>
                </div>
                <span className="radio-custom"></span>
              </label>

              <label className="payment-method">
                <input type="radio" name="paymentMethod" value="vnpay" checked={formData.paymentMethod === 'vnpay'} onChange={handleInputChange} id="paymentMethod" />
                <div className="payment-content">
                  <div className="payment-icon payment-icon-vnpay">VNPAY</div>
                  <div className="payment-info">
                    <h4>Thanh toán qua VNPay</h4>
                    <p>ATM nội địa, Internet Banking, Visa, MasterCard, JCB, QR Code.</p>
                  </div>
                </div>
                <span className="radio-custom"></span>
              </label>

              <label className="payment-method payment-method-disabled">
                <input type="radio" name="paymentMethod" value="momo" disabled />
                <div className="payment-content">
                  <div className="payment-icon payment-icon-momo">MoMo</div>
                  <div className="payment-info">
                    <h4>Thanh toán qua MoMo</h4>
                    <p>Sắp ra mắt — hiện chưa hỗ trợ.</p>
                  </div>
                </div>
                <span className="radio-custom"></span>
              </label>
            </div>
          </div>
          
          <div className="form-section">
            <h3>Ghi Chú Đơn Hàng (Tùy chọn)</h3>
            <textarea rows="4" placeholder="Ghi chú về đơn hàng, ví dụ: thời gian giao hàng mong muốn..." value={formData.note} onChange={handleInputChange} id="note"></textarea>
          </div>
        </div>

        <div className="order-summary">
          <div className="summary-card">
            <h3>Tóm Tắt Đơn Hàng</h3>
            <div className="order-items">{cart.map(item => (<div key={item.id} className="order-item"><div className="item-image-summary"><img src={item.image} alt={item.name} /><span className="item-qty-badge">{item.qty}</span></div><div className="item-info-summary"><h4>{item.name}</h4><p>{item.brand}</p></div><div className="item-price-summary">{formatPrice(item.price * item.qty)}</div></div>))}</div>
            <div className="summary-divider"></div>
            <div className="summary-totals">
              <div className="summary-row"><span>Tạm tính</span><span>{formatPrice(subtotal)}</span></div>
              <div className="summary-row"><span>Phí vận chuyển</span><span>{shippingFee === 0 ? 'Miễn phí' : formatPrice(shippingFee)}</span></div>
              {coupon.amount > 0 && (
                <div className="summary-row discount">
                  <span>Giảm giá mã giảm giá ({coupon.code})</span>
                  <span>-{formatPrice(discountAmount)}</span>
                </div>
              )}
              {subtotal > 0 && subtotal < 2000000 && <div className="shipping-note"><p>Mua thêm <b>{formatPrice(2000000 - subtotal)}</b> để được miễn phí vận chuyển.</p></div>}
              <div className="summary-divider"></div>
              {savings > 0 && (
                <div className="summary-row savings">
                  <span>Tiết kiệm</span>
                  <span>{formatPrice(savings)}</span>
                </div>
              )}
              <div className="summary-row total"><span>Tổng cộng</span><span>{formatPrice(total)}</span></div>
            </div>
            <button type="submit" className="btn btn-primary checkout-btn" disabled={loading}>{loading ? <span className="loading-spinner"></span> : 'Hoàn Tất Đặt Hàng'}</button>
            <div className="security-badge"><div className="badge-icon"><svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg></div><div className="badge-text"><h4>Giao dịch an toàn</h4><p>Mọi thông tin của bạn đều được mã hóa và bảo mật tuyệt đối.</p></div></div>
          </div>
        </div>
      </form>

      <style jsx>{`
        .container { max-width: 1200px; margin: 0 auto; padding: 0 24px; }
        .page-header { text-align: center; margin-bottom: 48px; padding-top: 40px; }
        .page-header h1 { font-size: 2.8rem; background: linear-gradient(135deg, #f2f2f3 0%, #a8927a 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .page-header .muted { color: #9CA3AF; font-size: 1.1rem; }
        .btn { padding: 12px 24px; font-size: 0.95rem; font-weight: 600; border-radius: 8px; cursor: pointer; transition: all 0.2s ease; border: 1px solid transparent; text-decoration: none; }
        .btn-primary { background: #a8927a; color: #0b0b0c; }
        
        .empty-cart-notice { text-align: center; padding: 60px 20px; background: #1a1b28; border-radius: 16px; }
        .empty-icon svg { width: 64px; height: 64px; margin: 0 auto 24px; color: #a8927a; }
        
        .checkout-container { display: grid; grid-template-columns: 1.5fr 1fr; gap: 32px; align-items: flex-start; }
        .form-section { background: #1a1b28; border-radius: 16px; padding: 28px; margin-bottom: 24px; border: 1px solid rgba(255,255,255,.08); }
        .form-section h3 { display: flex; align-items: center; gap: 12px; font-size: 1.3rem; margin-bottom: 24px; color: #f2f2f3; }
        .step-number { background: #a8927a; color: #0b0b0c; width: 28px; height: 28px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 1rem; }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .form-group { margin-bottom: 20px; }
        .form-group:last-child { margin-bottom: 0; }
        .form-group label { display: block; margin-bottom: 8px; color: #E5E7EB; font-weight: 500; }
        .form-group input, .form-group select, .form-group textarea { width: 100%; padding: 12px 16px; border-radius: 8px; background: #0f111a; border: 1px solid #374151; color: #f2f2f3; font-size: 1rem; transition: all 0.2s ease; }
        .form-group input:focus, .form-group select:focus, .form-group textarea:focus { outline: none; border-color: #a8927a; box-shadow: 0 0 0 3px rgba(168, 146, 122, 0.2); }
        
        .payment-methods { display: flex; flex-direction: column; gap: 12px; }
        .payment-method { display: block; position: relative; }
        .payment-method input[type="radio"] { opacity: 0; position: absolute; }
        .payment-content { display: flex; align-items: center; gap: 16px; padding: 16px; border: 2px solid #374151; border-radius: 12px; cursor: pointer; transition: all 0.2s ease; }
        .payment-method:hover .payment-content { border-color: #a8927a; }
        .payment-method input:checked ~ .payment-content { border-color: #a8927a; background: rgba(168, 146, 122, 0.1); }
        .radio-custom { height: 20px; width: 20px; border: 2px solid #374151; border-radius: 50%; position: absolute; right: 16px; top: 50%; transform: translateY(-50%); }
        .radio-custom::after { content: ''; width: 10px; height: 10px; background: #a8927a; border-radius: 50%; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) scale(0); transition: transform 0.2s ease; }
        .payment-method input:checked ~ .radio-custom { border-color: #a8927a; }
        .payment-method input:checked ~ .radio-custom::after { transform: translate(-50%, -50%) scale(1); }
        .payment-icon svg { width: 28px; height: 28px; color: #a8927a; }
        .payment-icon-vnpay { background: linear-gradient(135deg, #0066b3, #d1263b); color: #fff; font-weight: 800; font-size: 0.75rem; letter-spacing: 0.5px; width: 56px; height: 32px; border-radius: 6px; display: flex; align-items: center; justify-content: center; }
        .payment-icon-momo { background: #a50064; color: #fff; font-weight: 800; font-size: 0.8rem; width: 56px; height: 32px; border-radius: 6px; display: flex; align-items: center; justify-content: center; }
        .payment-method-disabled { opacity: 0.5; cursor: not-allowed; }
        .payment-method-disabled .payment-content { cursor: not-allowed; }
        .payment-method-disabled:hover .payment-content { border-color: #374151; }
        .payment-info h4 { font-size: 1rem; color: #f2f2f3; margin-bottom: 4px; }
        .payment-info p { font-size: 0.9rem; color: #9CA3AF; }

        .order-summary { position: sticky; top: 100px; }
        .summary-card { background: #1a1b28; border-radius: 16px; padding: 24px; border: 1px solid rgba(255,255,255,.08); }
        .order-items { max-height: 300px; overflow-y: auto; padding-right: 10px; }
        .order-item { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
        .item-image-summary { width: 64px; height: 64px; border-radius: 8px; overflow: hidden; flex-shrink: 0; position: relative; }
        .item-image-summary img { width: 100%; height: 100%; object-fit: cover; }
        .item-qty-badge { position: absolute; top: -8px; right: -8px; background: #a8927a; color: #0b0b0c; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; font-weight: 700; }
        .item-info-summary { flex: 1; }
        .item-info-summary h4 { font-size: 0.95rem; color: #f2f2f3; }
        .item-info-summary p { font-size: 0.85rem; color: #9CA3AF; }
        .item-price-summary { font-weight: 600; color: #E5E7EB; }
        .summary-divider { height: 1px; background: rgba(255,255,255,.1); margin: 20px 0; }
        .summary-totals { margin-bottom: 24px; }
        .summary-row { display: flex; justify-content: space-between; margin-bottom: 12px; color: #D1D5DB; }
        .summary-row.discount, .summary-row.savings { color: #10B981; }
        .summary-row.savings { font-weight: 600; }
        .summary-row.total { font-weight: 700; color: #fff; font-size: 1.2rem; }
        .shipping-note { text-align: center; padding: 8px; background: rgba(16, 185, 129, 0.1); border-radius: 6px; margin-top: -4px; margin-bottom: 16px; }
        .shipping-note p { color: #10B981; font-size: 0.85rem; }
        .checkout-btn { width: 100%; padding: 16px; font-size: 1.1rem; }
        .loading-spinner { width: 20px; height: 20px; border: 2px solid #0b0b0c; border-top-color: transparent; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .security-badge { display: flex; align-items: center; gap: 12px; padding-top: 24px; }
        .badge-icon svg { width: 28px; height: 28px; color: #a8927a; }
        .badge-text h4 { font-size: 0.95rem; color: #E5E7EB; }
        .badge-text p { font-size: 0.85rem; color: #9CA3AF; }

        @media (max-width: 1024px) { .checkout-container { grid-template-columns: 1fr; } .order-summary { position: static; } }
        @media (max-width: 768px) { .form-row { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  )
}