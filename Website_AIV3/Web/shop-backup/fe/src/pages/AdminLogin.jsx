import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// CHANGED: Import API thật
import { AuthAPI, readStorage, removeStorage, writeStorage } from '../lib/api';

export default function AdminLogin(){
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const navigate = useNavigate();

  // Các hàm logic và useEffect được giữ nguyên vì đã rất tốt
  useEffect(() => {
    const savedAttempts = Number.parseInt(readStorage('loginAttempts', ''), 10);
    if (Number.isFinite(savedAttempts) && savedAttempts >= 0) setAttempts(savedAttempts);
  }, []);

  const login = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Vui lòng nhập đầy đủ thông tin đăng nhập');
      return;
    }
    setError('');
    setLoading(true);
    try {
      // CHANGED: Sử dụng AuthAPI.login thay vì api giả
      const res = await AuthAPI.login(username, password);
      
      removeStorage('loginAttempts');
      writeStorage('token', res.access_token);
      writeStorage('user', JSON.stringify({ username: username }));
      setError('success: Đăng nhập thành công! Đang chuyển hướng...');
      setTimeout(() => navigate('/admin/dashboard', { replace: true }), 1500);
    } catch (e) {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      writeStorage('loginAttempts', newAttempts.toString());
      setError('Tên đăng nhập hoặc mật khẩu không chính xác');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = (type) => {
    setUsername(type);
    setPassword(type === 'admin' ? 'admin123' : 'mod123');
    setError('');
  };

  const handleInputChange = () => {
    if (error) setError('');
  };

  return (
    <div className="admin-login-container">
      <div className="login-wrapper">
        {/* Left Panel - Branding (UPGRADED) */}
        <div className="login-branding">
          <div className="brand-overlay"></div>
          <div className="brand-content">
            <div className="brand-logo">
              <h1>X2TN Perfume</h1>
            </div>
            <h2>Hệ Thống Quản Trị Cao Cấp</h2>
            <p>Nền tảng quản lý toàn diện dành cho thương hiệu nước hoa của bạn.</p>
          </div>
          <div className="login-footer">
            <p>© {new Date().getFullYear()} X2TN Perfume. All rights reserved.</p>
          </div>
        </div>

        {/* Right Panel - Login Form (UPGRADED) */}
        <div className="login-form-panel">
          <div className="form-container">
            <div className="form-header">
              <h2>Đăng Nhập Hệ Thống</h2>
              <p>Chào mừng trở lại. Vui lòng nhập thông tin của bạn.</p>
            </div>

            <form onSubmit={login} className="login-form">
              {error && (
                <div className={`alert ${error.startsWith('success:') ? 'alert-success' : 'alert-error'}`}>
                  {error.startsWith('success:') ? 
                    <svg className="alert-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> :
                    <svg className="alert-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                  }
                  <span>{error.replace('success:', '')}</span>
                </div>
              )}
              
              <div className="form-group">
                <label htmlFor="username">Tên đăng nhập</label>
                <div className="input-with-icon">
                   <svg className="input-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  <input id="username" type="text" placeholder="e.g. admin" value={username} onChange={(e) => { setUsername(e.target.value); handleInputChange(); }} required disabled={loading} />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="password">Mật khẩu</label>
                <div className="input-with-icon">
                  <svg className="input-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                  <input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••••" value={password} onChange={(e) => { setPassword(e.target.value); handleInputChange(); }} required disabled={loading} />
                  <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)} disabled={loading}>
                    {showPassword ? 
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10 0-1.05.163-2.066.464-3.015M16.5 16.5l-1.5-1.5m2.025-4.425a4.5 4.5 0 00-6.35-6.35m4.325 8.25l1.5 1.5M3 3l18 18" /></svg> :
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    }
                  </button>
                </div>
              </div>
              
              {attempts > 0 && (
                <div className="attempts-warning">
                  <span>Số lần đăng nhập sai: {attempts}</span>
                </div>
              )}

              <button type="submit" className="login-btn" disabled={loading}>
                {loading ? <span className="loading-spinner"></span> : 'Đăng Nhập'}
              </button>

            </form>
          </div>
        </div>
      </div>

      <style jsx>{`
        /* --- General & Layout --- */
        .admin-login-container { min-height: 100vh; background: #0b0b0c; display: flex; align-items: center; justify-content: center; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
        .login-wrapper { display: grid; grid-template-columns: 1fr 1.2fr; max-width: 1200px; width: 100%; min-height: 700px; background: #1a1b28; border-radius: 24px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.4); }
        
        /* --- Branding Panel (UPGRADED) --- */
        .login-branding { background: #13141a; color: #fff; padding: 48px; display: flex; flex-direction: column; justify-content: space-between; position: relative; }
        .brand-overlay { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background-image: radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0); background-size: 20px 20px; opacity: 0.5; }
        .brand-content, .login-footer { position: relative; z-index: 2; }
        .brand-logo h1 { margin: 0; font-size: 2.2rem; font-weight: 700; color: #fff; }
        .login-branding h2 { margin: 16px 0; font-size: 2.5rem; font-weight: 600; line-height: 1.2; background: linear-gradient(135deg, #f2f2f3 0%, #a8927a 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .login-branding p { margin: 0; opacity: 0.7; line-height: 1.6; font-size: 1rem; }
        .security-features { display: flex; flex-direction: column; gap: 16px; margin-top: 48px; }
        .security-item { display: flex; align-items: center; gap: 12px; padding: 12px; background: rgba(255,255,255,0.05); border-radius: 10px; font-weight: 500; }
        .security-icon { width: 24px; height: 24px; color: #a8927a; }
        .login-footer { margin-top: 40px; opacity: 0.5; font-size: 0.8rem; }
        
        /* --- Form Panel (UPGRADED) --- */
        .login-form-panel { padding: 48px; display: flex; align-items: center; justify-content: center; }
        .form-container { width: 100%; max-width: 400px; }
        .form-header { text-align: center; margin-bottom: 32px; }
        .form-header h2 { margin: 0 0 12px 0; color: #f2f2f3; font-size: 2rem; font-weight: 600; }
        .form-header p { margin: 0; color: #9CA3AF; font-size: 1rem; }
        .login-form { width: 100%; }
        
        .alert { padding: 12px 16px; border-radius: 8px; margin-bottom: 20px; font-size: 0.9rem; font-weight: 500; display: flex; align-items: center; gap: 10px; }
        .alert-error { background-color: rgba(239, 68, 68, 0.1); color: #EF4444; }
        .alert-success { background-color: rgba(16, 185, 129, 0.1); color: #10B981; }
        .alert-icon { width: 20px; height: 20px; flex-shrink: 0; }
        
        .form-group { margin-bottom: 20px; }
        .form-group label { display: block; margin-bottom: 8px; color: #E5E7EB; font-weight: 500; font-size: 0.9rem; }
        .input-with-icon { position: relative; }
        .input-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); z-index: 2; color: #9CA3AF; width: 20px; height: 20px; }
        .input-with-icon input { width: 100%; padding: 12px 16px 12px 48px; border-radius: 8px; background: #1F212E; border: 1px solid #374151; color: #f2f2f3; font-size: 1rem; transition: all 0.2s ease; }
        .input-with-icon input:focus { outline: none; border-color: #a8927a; box-shadow: 0 0 0 3px rgba(168, 146, 122, 0.2); }
        .input-with-icon input:disabled { opacity: 0.5; cursor: not-allowed; }
        
        .password-toggle { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: #9CA3AF; transition: color 0.2s ease; }
        .password-toggle svg { width: 20px; height: 20px; }
        .password-toggle:hover { color: #f2f2f3; }
        
        .attempts-warning { margin-top: 12px; text-align: center; color: #ff9800; font-size: 0.85rem; }
        .form-options { text-align: right; margin-bottom: 24px; }
        .forgot-link { color: #a8927a; text-decoration: none; font-size: 0.9rem; transition: color 0.2s ease; font-weight: 500; }
        .forgot-link:hover { color: #f2f2f3; text-decoration: underline; }
        
        .login-btn { width: 100%; padding: 14px; background: #a8927a; color: #0b0b0c; border: none; border-radius: 8px; font-size: 1rem; font-weight: 600; cursor: pointer; transition: all 0.2s ease; display: flex; align-items: center; justify-content: center; }
        .login-btn:hover:not(:disabled) { background: #bda58a; box-shadow: 0 4px 15px rgba(168, 146, 122, 0.3); transform: translateY(-2px); }
        .login-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        
        .loading-spinner { width: 20px; height: 20px; border: 2px solid #0b0b0c; border-top-color: transparent; border-radius: 50%; animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        
        .demo-accounts { margin-top: 24px; text-align: center; color: #9CA3AF; font-size: 0.9rem; }
        .demo-buttons { display: flex; justify-content: center; gap: 12px; margin-top: 12px; }
        .demo-btn { padding: 8px 16px; border: 1px solid #374151; border-radius: 8px; background: transparent; color: #E5E7EB; cursor: pointer; font-size: 0.85rem; transition: all 0.2s ease; }
        .demo-btn:hover:not(:disabled) { background: #374151; color: #fff; border-color: #a8927a; }
        .demo-btn:disabled { opacity: 0.5; cursor: not-allowed; }
              
        /* --- Responsive --- */
        @media (max-width: 968px) {
          .login-wrapper { grid-template-columns: 1fr; min-height: auto; }
          .login-branding { display: none; } /* Hide branding on smaller screens for focus */
        }
        @media (max-width: 480px) {
          .login-wrapper { border-radius: 0; }
          .admin-login-container { padding: 0; }
          .login-form-panel { padding: 24px; }
        }
      `}</style>
    </div>
  )
}