import { useState, useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';
import QuizTriggerButton from './quiz/QuizTriggerButton.jsx';

export default function NavBar() {
  const [scrolled, setScrolled] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  // Lắng nghe scroll
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Lắng nghe cartUpdated + storage để cập nhật số lượng
  useEffect(() => {
    const updateCart = () => {
      try {
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        const total = cart.reduce((s, it) => s + (it.qty || 0), 0);
        setCartCount(total);
      } catch {
        setCartCount(0);
      }
    };
    updateCart();
    window.addEventListener('cartUpdated', updateCart);
    window.addEventListener('storage', updateCart);
    return () => {
      window.removeEventListener('cartUpdated', updateCart);
      window.removeEventListener('storage', updateCart);
    };
  }, []);

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="nav-inner">
        <Link to="/" className="brand">
          X2TN<span className="brand-suffix">Perfume</span>
        </Link>
        <div className="nav-links">
          <NavLink to="/" end>Trang chủ</NavLink>
          <NavLink to="/products">Sản phẩm</NavLink>
          <QuizTriggerButton variant="nav" />
          <NavLink to="/about">Giới thiệu</NavLink>
          <NavLink to="/contact">Liên hệ</NavLink>
          <NavLink to="/cart" className="cart-link">
            <svg className="cart-icon" viewBox="0 0 24 24" width="24" height="24">
              <path d="M7 4h-2a1 1 0 0 0 0 2h1.28l2.4 9.59A2 2 0 0 0 10.62 17h6.76a2 2 0 0 0 1.94-1.41L21 8H7.62"
                fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="10.5" cy="20" r="1.5" fill="currentColor"/>
              <circle cx="17.5" cy="20" r="1.5" fill="currentColor"/>
            </svg>
            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </NavLink>
          <NavLink to="/admin/login">Admin</NavLink>
        </div>
      </div>

      <style jsx>{`
        .navbar { position: fixed; top: 0; left: 0; width: 100%; z-index: 1000; padding: 16px 0;
                  transition: background-color .4s, backdrop-filter .4s, box-shadow .4s, padding .4s;
                  background-color: transparent; }
        .navbar.scrolled { background-color: rgba(11,11,12,.8); backdrop-filter: blur(10px);
                           -webkit-backdrop-filter: blur(10px); box-shadow: 0 2px 10px rgba(0,0,0,.2);
                           padding: 12px 0; }
        .nav-inner { max-width: 1400px; margin:0 auto; padding:0 24px; display:flex; justify-content:space-between; align-items:center; }
        .brand { font-size:1.8rem; font-weight:700; color:#fff; text-decoration:none; }
        .brand-suffix { opacity:.7; font-weight:500; }
        .nav-links { display:flex; gap:32px; align-items:center; }
        .nav-links a { color:rgba(255,255,255,.8); text-decoration:none; font-size:1rem; font-weight:500;
                       padding:8px 0; position:relative; transition:color .3s; }
        .nav-links a::after { content:''; position:absolute; bottom:0; left:0; width:100%; height:2px;
                              background-color:#a8927a; transform:scaleX(0); transform-origin:bottom right;
                              transition:transform .3s ease-out; }
        .nav-links a:hover { color:#fff; }
        .nav-links a:hover::after { transform:scaleX(1); transform-origin:bottom left; }
        .nav-links a.active { color:#a8927a; font-weight:600; }

        .cart-link { position:relative; display:flex; align-items:center; }
        .cart-icon { color:rgba(255,255,255,.85); }
        .cart-badge { position:absolute; top:-6px; right:-12px; min-width:20px; height:20px;
                      border-radius:10px; background:#ffb000; color:#111; font-weight:800;
                      font-size:.75rem; display:flex; align-items:center; justify-content:center; }
      `}</style>
    </nav>
  );
}
