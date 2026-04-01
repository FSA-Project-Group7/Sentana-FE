import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/axiosConfig';
import './Login.css';

const ForgotPassword = () => {
  const navigate = useNavigate();
  
  // BƯỚC 1: Nhập Email | BƯỚC 2: Nhập OTP & Pass | BƯỚC 3: Thành công
  const [step, setStep] = useState(1); 
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // LUỒNG 1: GỬI OTP
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsLoading(true);

    try {
      await api.post('/Auth/send-otp', { email: email.trim() });
      setStep(2);
      setMessage(`Mã OTP đã được gửi đến email ${email}. Vui lòng kiểm tra hộp thư!`);
    } catch (err) {
      console.error("Lỗi gửi OTP:", err);
      setError(err.response?.data?.message || 'Không thể gửi OTP. Vui lòng kiểm tra lại Email.');
    } finally {
      setIsLoading(false);
    }
  };

  // LUỒNG 2: RESET PASSWORD
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsLoading(true);

    try {
      await api.post('/Auth/reset-password', { 
        email: email.trim(), 
        otpCode: otp.trim(), 
        newPassword: newPassword 
      });
      
      // THÀNH CÔNG -> Chuyển sang màn hình chúc mừng 
      setStep(3);

    } catch (err) {
      console.error("Lỗi đổi mật khẩu:", err);
      
      // BỘ BẮT LỖI TỐI THƯỢNG (Bóc tách mọi ngóc ngách JSON từ C#)
      let errorMsg = 'Có lỗi xảy ra. Vui lòng thử lại sau.';
      
      if (err.response?.data?.errors) {
        // Móc lỗi Validation của .NET (Ví dụ: Lỗi Regex mật khẩu yếu)
        const firstErrorKey = Object.keys(err.response.data.errors)[0];
        errorMsg = err.response.data.errors[firstErrorKey][0];
      } else if (err.response?.data?.message) {
        // Lỗi logic từ Service trả ra
        errorMsg = err.response.data.message;
      } else if (err.response?.data?.title) {
        errorMsg = err.response.data.title;
      } else if (typeof err.response?.data === 'string') {
        errorMsg = err.response.data;
      }
      
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-form-card position-relative">
        
        {step !== 3 && (
          <button 
            type="button" 
            onClick={() => { step === 2 ? setStep(1) : navigate('/login'); }} 
            className="back-home-btn"
            title="Quay lại"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 16 16">
              <path fillRule="evenodd" d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8z"/>
            </svg>
            <span className="text-dark ms-2">Quay lại</span>
          </button>
        )}

        {/* TIÊU ĐỀ THEO TỪNG BƯỚC */}
        <h2 className="login-title text-center mt-3 fw-bold text-dark">
          {step === 3 ? "THÀNH CÔNG" : "QUÊN MẬT KHẨU"}
        </h2>
        
        {/* THÔNG BÁO LỖI */}
        {error && step !== 3 && <p className="login-error text-danger text-center mt-2 fs-6">{error}</p>}

        {/* --- UI BƯỚC 1: NHẬP EMAIL --- */}
        {step === 1 && (
          <form onSubmit={handleSendOtp} className="login-form mt-4">
            <p className="text-center mb-4 text-dark" style={{ fontSize: '1rem' }}>
              Vui lòng nhập Email để nhận mã xác thực (OTP).
            </p>
            <div className="login-input-group mb-4">
              <label className="fw-bold mb-1 text-dark">Email của bạn:</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="Ví dụ: abc@gmail.com" className="login-input form-control" />
            </div>
            <button type="submit" disabled={isLoading} className="login-button btn btn-primary w-100 py-2 fw-bold">
              {isLoading ? 'Đang gửi...' : 'NHẬN MÃ OTP'}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleResetPassword} className="login-form mt-3">
            {/* THÔNG BÁO THÀNH CÔNG GỬI OTP */}
            {message && (
              <div className="alert alert-success bg-success-subtle border-0 small p-3 text-center mt-3 mb-3">
                <i className="bi bi-check-circle-fill me-2 fs-5 text-success"></i>
                {message}
              </div>
            )}
            
            <div className="login-input-group mb-3">
              <label className="fw-bold mb-1 text-dark">Mã xác nhận (OTP):</label>
              <input type="text" value={otp} onChange={(e) => setOtp(e.target.value)} required placeholder="Nhập mã 6 số từ Email..." className="login-input form-control" />
            </div>
            <div className="login-input-group mb-4">
              <label className="fw-bold mb-1 text-dark">Mật khẩu mới:</label>
              <div className="position-relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  placeholder="Nhập mật khẩu mới..."
                  className="login-input form-control pe-5" 
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="btn position-absolute top-50 end-0 translate-middle-y border-0 text-secondary"
                  style={{ background: 'transparent' }}
                  tabIndex="-1"
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16"><path d="m10.79 12.912-1.614-1.615a3.5 3.5 0 0 1-4.474-4.474l-2.06-2.06C.938 6.278 0 8 0 8s3 5.5 8 5.5a7.029 7.029 0 0 0 2.79-.588zM5.21 3.088A7.028 7.028 0 0 1 8 2.5c5 0 8 5.5 8 5.5s-.939 1.721-2.641 3.238l-2.062-2.062a3.5 3.5 0 0 0-4.474-4.474L5.21 3.089z"/><path d="M5.525 7.646a2.5 2.5 0 0 0 2.829 2.829l-2.83-2.829zm4.95.708-2.83a2.5 2.5 0 0 1 2.829 2.829zm3.171 6-12-12 .708-.708 12 12-.708.708z"/></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16"><path d="M10.5 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z"/><path d="M0 8s3-5.5 8-5.5S16 8 16 8s-3 5.5-8 5.5S0 8 0 8zm8 3.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z"/></svg>
                  )}
                </button>
              </div>
            </div>
            <button type="submit" disabled={isLoading} className="login-button btn btn-primary w-100 py-2 fw-bold">
              {isLoading ? 'Đang xử lý...' : 'ĐỔI MẬT KHẨU'}
            </button>
          </form>
        )}

        {step === 3 && (
          <div className="text-center mt-4 fade-in">
            {/* ICON TICK XANH (Custom màu xanh Primary chuẩn web) */}
            <svg xmlns="http://www.w3.org/2000/svg" width="65" height="65" fill="#0d6efd" className="mb-3" viewBox="0 0 16 16">
              <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/>
            </svg>
            
            <p className="text-dark mb-4 fw-bold" style={{ fontSize: '1rem' }}>
              Mật khẩu của tài khoản <strong>{email}</strong> đã được thay đổi thành công!
            </p>
            
            <button 
              onClick={() => navigate('/login')} 
              className="login-button btn btn-primary w-100 py-2 fw-bold mt-2"
            >
              VỀ TRANG ĐĂNG NHẬP
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default ForgotPassword;