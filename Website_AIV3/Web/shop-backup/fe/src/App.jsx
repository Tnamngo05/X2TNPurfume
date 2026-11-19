import { Routes, Route } from 'react-router-dom';

// Component chung
import NavBar from './components/NavBar.jsx';
import Footer from './components/Footer.jsx';
import Chatbox from './components/Chatbox.jsx'; // 👈 THÊM DÒNG NÀY ĐỂ IMPORT CHATBOX
import PerfumeQuizModal from './components/quiz/PerfumeQuizModal.jsx'; // 👈 KHẢO SÁT SỞ THÍCH KHÁCH HÀNG

// Các trang (Pages)
import Home from './pages/Home.jsx';
import About from './pages/About.jsx';
import Products from './pages/Products.jsx';
import Cart from './pages/Cart.jsx';
import Checkout from './pages/Checkout.jsx';
import PaymentReturn from './pages/PaymentReturn.jsx';
import Thankyou from './pages/Thankyou.jsx';
import Contact from './pages/Contact.jsx';
import AdminLogin from './pages/AdminLogin.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';

export default function App() {
  return (
    <div className="app">
      <NavBar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/:productId" element={<Products />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/payment/return" element={<PaymentReturn />} />
          <Route path="/thankyou" element={<Thankyou />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
        </Routes>
      </main>
      <Footer />
      
      {/* 👇 THÊM DÒNG NÀY VÀO ĐÂY ĐỂ CHATBOX NỔI LÊN TRÊN MỌI TRANG 👇 */}
      <Chatbox />

      {/* 👇 MODAL KHẢO SÁT SỞ THÍCH KHÁCH HÀNG (Tự động hiển thị lần đầu, hỗ trợ mở lại) 👇 */}
      <PerfumeQuizModal />
      
    </div>
  );
}