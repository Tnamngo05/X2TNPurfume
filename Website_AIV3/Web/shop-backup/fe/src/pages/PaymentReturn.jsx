import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { OrdersAPI, VNPayAPI } from '../lib/api';

const POLL_INTERVAL_MS = 2000;
const MAX_POLL_ATTEMPTS = 5;

export default function PaymentReturn() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const orderId = searchParams.get('order_id');
  const gatewayStatus = searchParams.get('status'); // success | failed | invalid (chỉ là gợi ý, KHÔNG dùng để kết luận)

  const [order, setOrder] = useState(null);
  const [phase, setPhase] = useState('checking'); // checking | success | failed | error
  const [retrying, setRetrying] = useState(false);
  const attemptsRef = useRef(0);

  useEffect(() => {
    if (!orderId) {
      setPhase('error');
      return;
    }

    let cancelled = false;

    const poll = async () => {
      try {
        const data = await OrdersAPI.get(orderId);
        if (cancelled) return;
        setOrder(data);

        if (data.payment_status === 'PAID') {
          setPhase('success');
          return;
        }
        if (data.payment_status === 'FAILED' || data.payment_status === 'CANCELLED') {
          setPhase('failed');
          return;
        }

        // Vẫn PENDING: IPN từ VNPay có thể đến chậm hơn lúc khách được redirect về.
        attemptsRef.current += 1;
        if (attemptsRef.current < MAX_POLL_ATTEMPTS) {
          setTimeout(poll, POLL_INTERVAL_MS);
        } else {
          setPhase('failed');
        }
      } catch (err) {
        if (!cancelled) setPhase('error');
      }
    };

    poll();
    return () => { cancelled = true; };
  }, [orderId]);

  const handleRetryPayment = async () => {
    if (!orderId) return;
    setRetrying(true);
    try {
      const { payment_url } = await VNPayAPI.createPayment(orderId);
      if (payment_url) {
        window.location.href = payment_url;
        return;
      }
      alert('Không tạo được link thanh toán, vui lòng thử lại.');
    } catch (err) {
      alert(err.response?.data?.detail || 'Không thể tạo lại thanh toán.');
    } finally {
      setRetrying(false);
    }
  };

  return (
    <div className="container">
      <div className="payment-return-wrapper">
        <div className="payment-return-card">
          {phase === 'checking' && (
            <>
              <div className="spinner"></div>
              <h1>Đang xác nhận giao dịch...</h1>
              <p className="subtitle">Vui lòng không tắt trang trong khi hệ thống xác nhận thanh toán với VNPay.</p>
            </>
          )}

          {phase === 'success' && (
            <>
              <div className="status-icon success-icon">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <h1>Thanh Toán Thành Công!</h1>
              <p className="subtitle">Đơn hàng #{orderId} đã được thanh toán qua VNPay.</p>
              <div className="cta-buttons">
                <button className="btn btn-primary" onClick={() => navigate(`/thankyou?order_id=${orderId}`)}>Xem Chi Tiết Đơn Hàng</button>
              </div>
            </>
          )}

          {phase === 'failed' && (
            <>
              <div className="status-icon failed-icon">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </div>
              <h1>Thanh Toán Thất Bại</h1>
              <p className="subtitle">
                Giao dịch không thành công{gatewayStatus === 'invalid' ? ' (dữ liệu không hợp lệ)' : ''}. Đơn hàng #{orderId} của bạn vẫn được lưu lại, bạn có thể thanh toán lại.
              </p>
              <div className="cta-buttons">
                <button className="btn btn-primary" onClick={handleRetryPayment} disabled={retrying}>
                  {retrying ? 'Đang tạo lại...' : 'Thanh Toán Lại'}
                </button>
                <Link to="/cart" className="btn btn-outline">Về Giỏ Hàng</Link>
              </div>
            </>
          )}

          {phase === 'error' && (
            <>
              <div className="status-icon failed-icon">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <h1>Không Thể Xác Nhận Đơn Hàng</h1>
              <p className="subtitle">Liên kết thanh toán không hợp lệ hoặc đơn hàng không tồn tại.</p>
              <div className="cta-buttons">
                <Link to="/products" className="btn btn-primary">Về Cửa Hàng</Link>
              </div>
            </>
          )}
        </div>
      </div>

      <style jsx>{`
        .container { min-height: 80vh; display: flex; align-items: center; justify-content: center; padding: 40px 24px; }
        .payment-return-wrapper { max-width: 600px; width: 100%; }
        .payment-return-card { background: #1a1b28; border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 48px; text-align: center; animation: fadeIn 0.5s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .spinner { width: 56px; height: 56px; border: 4px solid rgba(168,146,122,0.2); border-top-color: #a8927a; border-radius: 50%; margin: 0 auto 24px; animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .status-icon { margin-bottom: 24px; }
        .status-icon svg { width: 80px; height: 80px; margin: 0 auto; }
        .success-icon { color: #10B981; }
        .failed-icon { color: #EF4444; }
        h1 { font-size: 2rem; color: #f2f2f3; margin-bottom: 16px; }
        .subtitle { font-size: 1.05rem; color: #9CA3AF; margin-bottom: 32px; line-height: 1.6; }
        .cta-buttons { display: flex; justify-content: center; gap: 16px; flex-wrap: wrap; }
        .btn { padding: 12px 28px; font-size: 1rem; font-weight: 600; border-radius: 8px; cursor: pointer; text-decoration: none; display: inline-block; border: 1px solid transparent; transition: all 0.3s ease; }
        .btn-primary { background: #a8927a; color: #0b0b0c; border-color: #a8927a; }
        .btn-primary:hover { background: #bda58a; border-color: #bda58a; }
        .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
        .btn-outline { background: transparent; color: #a8927a; border-color: #a8927a; }
        .btn-outline:hover { background: rgba(168, 146, 122, 0.1); }
      `}</style>
    </div>
  );
}
