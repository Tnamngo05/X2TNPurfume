import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, useLocation } from 'react-router-dom';
import App from './App.jsx';
import './styles.css';

/**
 * Component tự động cuộn lên đầu trang mỗi khi chuyển route.
 * Giúp trải nghiệm người dùng mượt mà hơn khi điều hướng.
 */
function ScrollToTop() {
  const { pathname } = useLocation();
  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [pathname]);
  return null;
}

/**
 * Component "vỏ" bao bọc toàn bộ ứng dụng.
 * Cung cấp một background trang trí chung và đảm bảo nội dung App luôn nổi lên trên.
 */
function AppShell() {
  return (
    <div style={{ minHeight: '100vh', position: 'relative', overflowX: 'hidden' }}>
      {/* Các đốm màu gradient làm nền trang trí */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 0,
          background:
            'radial-gradient(60% 50% at 80% 0%, rgba(103,86,255,0.16) 0%, rgba(16,18,29,0) 60%),' +
            'radial-gradient(60% 50% at 10% 20%, rgba(255,106,106,0.14) 0%, rgba(16,18,29,0) 60%),' +
            'radial-gradient(40% 40% at 50% 100%, rgba(94,255,198,0.10) 0%, rgba(16,18,29,0) 60%)',
          filter: 'saturate(120%)',
        }}
      />

      {/* Nội dung chính của ứng dụng */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <App />
      </div>
    </div>
  );
}

/**
 * Component gốc, nơi thiết lập Router và các thành phần toàn cục.
 */
function Root() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <AppShell />
    </BrowserRouter>
  );
}

// Render ứng dụng vào DOM sử dụng React 18
createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);