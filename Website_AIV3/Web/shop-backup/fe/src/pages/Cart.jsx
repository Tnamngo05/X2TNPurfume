import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CouponAPI, readJsonStorage, writeStorage } from '../lib/api'

export default function Cart(){
  const [cart, setCart] = useState([])
  const [coupon, setCoupon] = useState('')
  const [discount, setDiscount] = useState({ code: '', amount: 0, type: '', value: 0 })
  const [couponMessage, setCouponMessage] = useState({ text: '', type: '' })
  const nav = useNavigate()

  useEffect(() => {
    const loadedCart = readJsonStorage('cart', [])
    const savedCoupon = readJsonStorage('coupon', null)
    const savedCouponCode = typeof savedCoupon === 'string' ? savedCoupon : savedCoupon?.code || ''
    setCart(Array.isArray(loadedCart) ? loadedCart : [])
    setCoupon(savedCouponCode)
    const savedSubtotal = (Array.isArray(loadedCart) ? loadedCart : [])
      .reduce((total, item) => total + Number(item.price) * Number(item.qty), 0)
    if (savedCouponCode && savedSubtotal > 0) {
      CouponAPI.validate(savedCouponCode, savedSubtotal)
        .then(result => {
          if (result.valid) {
            setDiscount({
              code: result.code,
              amount: Number(result.discount_amount) || 0,
              type: result.discount_type || '',
              value: Number(result.discount_value) || 0,
            })
          }
        })
        .catch(() => {})
    }
    const handleCartUpdate = () => {
      const updatedCart = readJsonStorage('cart', [])
      setCart(Array.isArray(updatedCart) ? updatedCart : [])
    }
    window.addEventListener('cartUpdated', handleCartUpdate)
    return () => window.removeEventListener('cartUpdated', handleCartUpdate)
  }, [])

  const updateCartStorage = (newCart) => {
    setCart(newCart)
    writeStorage('cart', JSON.stringify(newCart))
    window.dispatchEvent(new CustomEvent('cartUpdated'))
  }

  const inc = (id, amount) => {
    const next = cart.map(i => i.id === id ? {...i, qty: Math.max(1, i.qty + amount)} : i)
    updateCartStorage(next)
  }

  const rm = (id) => {
    const next = cart.filter(i => i.id !== id)
    updateCartStorage(next)
  }

  const applyCoupon = async () => {
    const normalizedCoupon = coupon.trim().toUpperCase()
    try {
      const result = await CouponAPI.validate(normalizedCoupon, subtotal)
      if (result.valid) {
      const nextDiscount = {
        code: result.code,
        amount: Number(result.discount_amount) || 0,
        type: result.discount_type || '',
        value: Number(result.discount_value) || 0,
      }
      setDiscount(nextDiscount)
      writeStorage('coupon', JSON.stringify({
        code: nextDiscount.code,
        discountAmount: nextDiscount.amount,
        discountType: nextDiscount.type,
        discountValue: nextDiscount.value,
      }))
      setCoupon(nextDiscount.code)
      setCouponMessage({ text: `Áp dụng thành công mã ${nextDiscount.code}.`, type: 'success' })
      } else {
        setDiscount({ code: '', amount: 0, type: '', value: 0 })
        writeStorage('coupon', '')
        setCouponMessage({ text: result.message || 'Mã giảm giá không hợp lệ.', type: 'error' })
      }
    } catch (error) {
      setCouponMessage({ text: 'Không thể kiểm tra mã giảm giá lúc này.', type: 'error' })
    }
  }
  
  const formatPrice = (price) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  const subtotal = cart.reduce((t,i) => t + Number(i.price) * Number(i.qty), 0)
  const discountAmount = Math.min(subtotal, Math.max(0, discount.amount))
  const shippingFee = subtotal > 2000000 || subtotal === 0 ? 0 : 30000
  const total = Math.max(0, subtotal + shippingFee - discountAmount)
  const savings = Math.max(0, subtotal - (total - shippingFee))

  useEffect(() => {
    if (!discount.code || subtotal <= 0) return
    CouponAPI.validate(discount.code, subtotal)
      .then(result => {
        if (result.valid) {
          setDiscount(prev => ({ ...prev, amount: Number(result.discount_amount) || 0 }))
        } else {
          setDiscount({ code: '', amount: 0, type: '', value: 0 })
          writeStorage('coupon', '')
        }
      })
      .catch(() => {})
  }, [cart])

  return (
    <div className="container">
      <div className="page-header">
        <h1>Giỏ Hàng Của Bạn</h1>
        <p className="muted">Kiểm tra và chỉnh sửa sản phẩm trước khi đến trang thanh toán.</p>
      </div>

      {cart.length === 0 ? (
        <div className="empty-cart">
          <div className="empty-icon"><svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg></div>
          <h3>Giỏ hàng đang trống</h3>
          <p>Dường như bạn chưa thêm sản phẩm nào. Hãy bắt đầu mua sắm ngay!</p>
          <button className="btn btn-primary" onClick={() => nav('/products')}>Khám Phá Nước Hoa</button>
        </div>
      ) : (
        <div className="cart-container">
          <div className="cart-items-panel">
            <div className="cart-items-header">
              <div className="header-product">Sản phẩm</div>
              <div className="header-price">Giá</div>
              <div className="header-quantity">Số lượng</div>
              <div className="header-total">Tạm tính</div>
              <div className="header-remove"></div>
            </div>
            
            {cart.map(item => (
              <div key={item.id} className="cart-item">
                <div className="item-product">
                  <div className="item-image"><img src={item.image} alt={item.name} /></div>
                  <div className="item-details">
                    <h3 className="item-name">{item.name}</h3>
                    <p className="item-brand">{item.brand}</p>
                  </div>
                </div>
                <div className="item-price">{formatPrice(item.price)}</div>
                <div className="item-quantity">
                  <div className="quantity-controls">
                    <button className="qty-btn" onClick={() => inc(item.id, -1)} disabled={item.qty <= 1}>−</button>
                    <span className="qty-display">{item.qty}</span>
                    <button className="qty-btn" onClick={() => inc(item.id, 1)}>+</button>
                  </div>
                </div>
                <div className="item-total">{formatPrice(item.price * item.qty)}</div>
                <div className="item-remove">
                  <button className="remove-btn" onClick={() => rm(item.id)} aria-label="Xóa sản phẩm">
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="cart-summary-panel">
            <div className="summary-card">
              <h3>Tóm Tắt Đơn Hàng</h3>
              <div className="summary-row"><span>Tạm tính</span><span>{formatPrice(subtotal)}</span></div>
              <div className="summary-row">
                <span>Phí vận chuyển</span>
                <span>{shippingFee === 0 ? 'Miễn phí' : formatPrice(shippingFee)}</span>
              </div>
              {discount.amount > 0 && (
                <div className="summary-row discount">
                  <span>Giảm giá mã giảm giá ({discount.code})</span>
                  <span>-{formatPrice(discountAmount)}</span>
                </div>
              )}
              <div className="summary-divider"></div>
              {savings > 0 && (
                <div className="summary-row savings">
                  <span>Tiết kiệm</span>
                  <span>{formatPrice(savings)}</span>
                </div>
              )}
              <div className="summary-row total"><span>Tổng cộng</span><span>{formatPrice(total)}</span></div>

              <div className="coupon-section">
                <div className="coupon-input">
                  <input type="text" placeholder="Nhập mã giảm giá" value={coupon} onChange={(e) => setCoupon(e.target.value)} />
                  <button className="btn btn-sm btn-outline" onClick={applyCoupon}>Áp dụng</button>
                </div>
                {couponMessage.text && <p className={`coupon-message ${couponMessage.type}`}>{couponMessage.text}</p>}
                
                <div className="coupon-hint">
                  <p>Nhập mã giảm giá do cửa hàng cung cấp.</p>
                </div>
              </div>

              <button className="btn btn-primary checkout-btn" onClick={() => nav('/checkout')}>Tiến Hành Thanh Toán</button>
              <div className="continue-shopping"><Link to="/products" className="continue-link">← Tiếp tục mua sắm</Link></div>
            </div>

            <div className="security-badges">
              <div className="badge"><div className="badge-icon"><svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg></div><div className="badge-text"><h4>Thanh Toán An Toàn</h4><p>Bảo mật thông tin khách hàng tuyệt đối</p></div></div>
              <div className="badge"><div className="badge-icon"><svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10l2 2h8a1 1 0 001-1zM3 11h10" /></svg></div><div className="badge-text"><h4>Miễn Phí Giao Hàng</h4><p>Áp dụng cho đơn hàng từ 2.000.000₫.</p></div></div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .container { max-width: 1400px; margin: 0 auto; padding: 0 24px; }
        .page-header { text-align: center; margin-bottom: 48px; padding-top: 40px; }
        
        /* --- MÀU CHỮ H1 ĐÃ ĐƯỢC KHÔI PHỤC --- */
        .page-header h1 {
          font-size: 2.8rem;
          background: linear-gradient(135deg, #f2f2f3 0%, #a8927a 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .page-header .muted { color: #9CA3AF; font-size: 1.1rem; }
        .btn { padding: 12px 24px; font-size: 0.95rem; font-weight: 600; border-radius: 8px; cursor: pointer; transition: all 0.2s ease; border: 1px solid transparent; text-decoration: none; display: inline-block; }
        .btn-primary { background: #a8927a; color: #0b0b0c; }
        .btn-primary:hover { background: #bda58a; transform: translateY(-2px); }
        .btn-outline { background: transparent; color: #a8927a; border-color: #a8927a; }
        .btn-sm { padding: 8px 16px; font-size: 0.9rem; }
        
        .empty-cart { text-align: center; padding: 80px 20px; background: #1a1b28; border-radius: 16px; }
        .empty-icon { color: #a8927a; margin-bottom: 24px; }
        .empty-icon svg { width: 64px; height: 64px; margin: 0 auto; }
        .empty-cart h3 { font-size: 1.5rem; color: #f2f2f3; }
        .empty-cart p { color: #9CA3AF; margin-bottom: 32px; }

        .cart-container { display: grid; grid-template-columns: 1fr 400px; gap: 32px; align-items: flex-start; }
        
        .cart-items-panel { background: #1a1b28; border-radius: 16px; padding: 24px; }
        .cart-items-header { display: grid; grid-template-columns: 3fr 1fr 1.5fr 1fr 0.5fr; gap: 16px; padding-bottom: 16px; border-bottom: 1px solid rgba(255,255,255,.1); color: #9CA3AF; font-size: 0.9rem; font-weight: 500; }
        .header-product { grid-column: 1 / 2; }
        .header-price, .header-quantity, .header-total { text-align: center; }

        .cart-item { display: grid; grid-template-columns: 3fr 1fr 1.5fr 1fr 0.5fr; gap: 16px; align-items: center; padding: 24px 0; border-bottom: 1px solid rgba(255,255,255,.08); }
        .item-product { display: flex; align-items: center; gap: 16px; }
        .item-image { width: 80px; height: 80px; border-radius: 8px; overflow: hidden; flex-shrink: 0; }
        .item-image img { width: 100%; height: 100%; object-fit: cover; }
        .item-name { font-size: 1.05rem; color: #f2f2f3; margin-bottom: 4px; }
        .item-brand { font-size: 0.9rem; color: #9CA3AF; }
        .item-price, .item-total { text-align: center; font-weight: 500; color: #E5E7EB; }
        .item-total { font-weight: 600; }
        
        .quantity-controls { display: flex; align-items: center; justify-content: center; gap: 8px; background: #0f111a; border: 1px solid #374151; border-radius: 8px; padding: 4px; }
        .qty-btn { background: transparent; border: none; color: #f2f2f3; font-size: 1.2rem; cursor: pointer; width: 32px; height: 32px; border-radius: 6px; transition: background-color 0.2s; }
        .qty-btn:hover:not(:disabled) { background-color: #374151; }
        .qty-btn:disabled { opacity: 0.3; cursor: not-allowed; }
        .qty-display { min-width: 20px; text-align: center; font-weight: 600; }
        
        .item-remove { text-align: center; }
        .remove-btn { background: none; border: none; cursor: pointer; color: #9CA3AF; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
        .remove-btn svg { width: 20px; height: 20px; }
        .remove-btn:hover { background-color: rgba(239, 68, 68, 0.1); color: #EF4444; }

        .cart-summary-panel { position: sticky; top: 100px; }
        .summary-card { background: #1a1b28; border-radius: 16px; padding: 24px; margin-bottom: 24px; }
        .summary-card h3 { font-size: 1.3rem; margin-bottom: 24px; }
        .summary-row { display: flex; justify-content: space-between; margin-bottom: 16px; color: #D1D5DB; }
        .summary-row.discount { color: #10B981; }
        .summary-row.savings { color: #10B981; font-weight: 600; }
        .summary-row.total { font-weight: 700; color: #fff; font-size: 1.2rem; }
        .summary-divider { height: 1px; background: rgba(255,255,255,.1); margin: 20px 0; }
        
        .coupon-section { margin: 24px 0; }
        .coupon-input { display: flex; gap: 8px; }
        .coupon-input input { flex: 1; padding: 10px 14px; border-radius: 8px; background: #0f111a; border: 1px solid #374151; color: #f2f2f3; }
        .coupon-message { margin-top: 12px; font-size: 0.9rem; }
        .coupon-message.success { color: #10B981; }
        .coupon-message.error { color: #EF4444; }

        /* --- STYLE CHO NOTE VOUCHER --- */
        .coupon-hint {
          margin-top: 16px;
          padding: 12px;
          background: rgba(168, 146, 122, 0.08);
          border-radius: 8px;
          border-left: 3px solid #a8927a;
        }
        .coupon-hint p {
          margin: 0;
          font-size: 0.85rem;
          color: #9CA3AF;
        }

        .checkout-btn { width: 100%; padding: 16px; font-size: 1.1rem; margin-top: 16px; }
        .continue-shopping { text-align: center; margin-top: 16px; }
        .continue-link { color: #a8927a; text-decoration: none; font-weight: 500; }

        .security-badges { display: flex; flex-direction: column; gap: 16px; }
        .badge { display: flex; align-items: center; gap: 16px; padding: 16px; background: #1a1b28; border-radius: 12px; }
        .badge-icon { color: #a8927a; flex-shrink: 0; }
        .badge-icon svg { width: 28px; height: 28px; }
        .badge-text h4 { font-size: 0.95rem; color: #E5E7EB; margin-bottom: 4px; }
        .badge-text p { color: #9CA3AF; font-size: 0.85rem; line-height: 1.5; }

        @media (max-width: 1024px) {
          .cart-container { grid-template-columns: 1fr; }
          .cart-items-header { display: none; }
          .cart-item { grid-template-columns: 80px 1fr 80px; grid-template-areas: "image details remove" "image quantity total"; gap: 12px 24px; }
          .item-product { grid-area: details; flex-direction: column; align-items: flex-start; gap: 8px; }
          .item-image { grid-area: image; }
          .item-price { display: none; }
          .item-quantity { grid-area: quantity; justify-content: flex-start; }
          .item-total { grid-area: total; text-align: right; }
          .item-remove { grid-area: remove; justify-self: flex-end; }
        }
      `}</style>
    </div>
  )
}