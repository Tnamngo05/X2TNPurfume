import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { OrdersAPI } from '../lib/api';

const STATUS_LABEL = {
  PENDING: { text: 'Chờ thanh toán', color: '#F59E0B' },
  PROCESSING: { text: 'Đang xử lý', color: '#3B82F6' },
  PAID: { text: 'Đã thanh toán', color: '#10B981' },
  FAILED: { text: 'Thanh toán thất bại', color: '#EF4444' },
  CANCELLED: { text: 'Đã hủy', color: '#9CA3AF' },
  REFUNDED: { text: 'Đã hoàn tiền', color: '#8B5CF6' },
};

const formatPrice = (price) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price || 0);
const formatDate = (isoString) => {
  if (!isoString) return '';
  const d = new Date(isoString);
  return d.toLocaleString('vi-VN');
};

export default function ThankYou() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('order_id');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    // Xóa giỏ hàng để đảm bảo giỏ hàng trống sau khi hoàn tất đặt hàng
    localStorage.removeItem('cart');

    if (!orderId) {
      setLoading(false);
      setError(true);
      return;
    }

    OrdersAPI.get(orderId)
      .then((data) => setOrder(data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [orderId]);

  if (loading) {
    return (
      <div className="container">
        <div className="thank-you-wrapper">
          <div className="thank-you-card">
            <p className="subtitle">Đang tải thông tin đơn hàng...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container">
        <div className="thank-you-wrapper">
          <div className="thank-you-card">
            <h1>Không tìm thấy đơn hàng</h1>
            <p className="subtitle">Đơn hàng không tồn tại hoặc liên kết không hợp lệ.</p>
            <div className="cta-buttons">
              <Link to="/products" className="btn btn-primary">Tiếp Tục Mua Sắm</Link>
            </div>
          </div>
        </div>
        <style jsx>{`
          .container { min-height: 60vh; display: flex; align-items: center; justify-content: center; padding: 40px 24px; }
          .thank-you-wrapper { max-width: 600px; width: 100%; }
          .thank-you-card { background: #1a1b28; border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 48px; text-align: center; }
          h1 { color: #f2f2f3; margin-bottom: 16px; }
          .subtitle { color: #9CA3AF; margin-bottom: 24px; }
          .btn { padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; }
          .btn-primary { background: #a8927a; color: #0b0b0c; }
        `}</style>
      </div>
    );
  }

  const statusInfo = STATUS_LABEL[order.payment_status] || { text: order.payment_status, color: '#9CA3AF' };
  const isCod = order.payment_method === 'COD';
  const isPaidOnline = order.payment_method === 'VNPAY' && order.payment_status === 'PAID';

  return (
    <div className="container">
      <div className="thank-you-wrapper">
        <div className="thank-you-card">
          <div className="success-icon">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1>Đặt Hàng Thành Công!</h1>
          <p className="subtitle">Cảm ơn bạn đã tin tưởng và mua sắm tại X2TN Perfume.</p>

          <div className="order-info">
            <div className="order-info-row"><span>Mã đơn hàng</span><strong>#{order.id}</strong></div>
            <div className="order-info-row"><span>Ngày đặt</span><strong>{formatDate(order.created_at)}</strong></div>
            <div className="order-info-row"><span>Khách hàng</span><strong>{order.full_name}</strong></div>
            <div className="order-info-row"><span>Địa chỉ</span><strong>{order.address}, {order.ward}, {order.district}, {order.city}</strong></div>
            <div className="order-info-row"><span>Phương thức</span><strong>{order.payment_method === 'VNPAY' ? 'VNPay' : order.payment_method === 'MOMO' ? 'MoMo' : 'COD'}</strong></div>
            <div className="order-info-row">
              <span>Trạng thái</span>
              <strong className="status-badge" style={{ color: statusInfo.color, borderColor: statusInfo.color }}>{statusInfo.text}</strong>
            </div>
          </div>

          {order.items?.length > 0 && (
            <div className="order-items">
              {order.items.map((item, idx) => (
                <div key={idx} className="order-item-row">
                  <span className="item-name">{item.name} <span className="item-qty">x{item.qty}</span></span>
                  <span className="item-price">{formatPrice((item.price || 0) * (item.qty || 0))}</span>
                </div>
              ))}
            </div>
          )}

          <div className="order-total">
            <span>Tổng cộng</span>
            <strong>{formatPrice(order.total_price)}</strong>
          </div>

          <p className="next-steps">
            {isCod && 'Đơn hàng của bạn đã được tiếp nhận. Chúng tôi sẽ liên hệ để xác nhận giao hàng trong thời gian sớm nhất.'}
            {isPaidOnline && 'Đơn hàng đã được thanh toán thành công qua VNPay. Chúng tôi sẽ giao hàng trong thời gian sớm nhất.'}
            {!isCod && !isPaidOnline && 'Chúng tôi sẽ cập nhật trạng thái đơn hàng ngay khi có thông tin mới.'}
          </p>

          <div className="cta-buttons">
            <Link to="/products" className="btn btn-primary">Tiếp Tục Mua Sắm</Link>
            <Link to="/" className="btn btn-outline">Về Trang Chủ</Link>
          </div>
        </div>
      </div>

      <style jsx>{`
        .container { min-height: 80vh; display: flex; align-items: center; justify-content: center; padding: 40px 24px; }
        .thank-you-wrapper { max-width: 600px; width: 100%; }
        .thank-you-card { background: #1a1b28; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 16px; padding: 48px; text-align: center; animation: fadeIn 0.5s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .success-icon { color: #10B981; margin-bottom: 24px; }
        .success-icon svg { width: 80px; height: 80px; margin: 0 auto; }
        h1 { font-size: 2.2rem; color: #f2f2f3; margin-bottom: 16px; }
        .subtitle { font-size: 1.05rem; color: #9CA3AF; margin-bottom: 32px; }
        .order-info { background: rgba(168, 146, 122, 0.08); border: 1px solid rgba(168, 146, 122, 0.2); padding: 20px; border-radius: 8px; margin-bottom: 24px; text-align: left; }
        .order-info-row { display: flex; justify-content: space-between; gap: 16px; padding: 6px 0; font-size: 0.92rem; color: #D1D5DB; }
        .order-info-row span { color: #9CA3AF; }
        .order-info-row strong { color: #f2f2f3; text-align: right; }
        .status-badge { border: 1px solid; padding: 2px 10px; border-radius: 999px; font-size: 0.8rem; }
        .order-items { text-align: left; margin-bottom: 16px; border-top: 1px solid rgba(255,255,255,.08); padding-top: 12px; }
        .order-item-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 0.9rem; color: #D1D5DB; }
        .item-qty { color: #9CA3AF; font-size: 0.85rem; }
        .order-total { display: flex; justify-content: space-between; border-top: 1px solid rgba(255,255,255,.08); padding-top: 16px; margin-bottom: 24px; font-size: 1.15rem; color: #f2f2f3; font-weight: 700; }
        .next-steps { font-size: 1rem; color: #9CA3AF; line-height: 1.6; margin-bottom: 40px; }
        .cta-buttons { display: flex; justify-content: center; gap: 16px; flex-wrap: wrap; }
        .btn { padding: 12px 28px; font-size: 1rem; font-weight: 600; border-radius: 8px; cursor: pointer; text-decoration: none; display: inline-block; border: 1px solid transparent; transition: all 0.3s ease; }
        .btn-primary { background: #a8927a; color: #0b0b0c; border-color: #a8927a; }
        .btn-primary:hover { background: #bda58a; border-color: #bda58a; transform: translateY(-3px); box-shadow: 0 4px 15px rgba(168, 146, 122, 0.3); }
        .btn-outline { background: transparent; color: #a8927a; border-color: #a8927a; }
        .btn-outline:hover { background: rgba(168, 146, 122, 0.1); color: #bda58a; }
      `}</style>
    </div>
  );
}
