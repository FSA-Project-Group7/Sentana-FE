import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../utils/axiosConfig';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await api.post('/Auth/Login', {
        username: username,
        password: password
      });
      console.log("Dữ liệu BE trả về:", response.data);

      const { token, role } = response.data.data;

      localStorage.setItem('token', token);
      localStorage.setItem('role', role);

      if (role === 'Manager') {
        navigate('/admin');
      } else if (role === 'Resident') {
        navigate('/resident');
      } else {
        navigate('/');
      }

    } catch (err) {
      console.error("Lỗi đăng nhập:", err);
      setError('Sai tài khoản hoặc mật khẩu!');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-form-card position-relative">

        <button
          type="button"
          onClick={() => navigate('/')}
          className="back-home-btn"
          title="Về trang chủ"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 16 16">
            <path fillRule="evenodd" d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8z" />
          </svg>
          <span className="text-dark ms-2">Trang chủ</span>
        </button>

        <h2 className="login-title text-center mt-3">ĐĂNG NHẬP</h2>

        {error && <p className="login-error text-danger text-center">{error}</p>}

        <form onSubmit={handleLogin} className="login-form mt-4">
          <div className="login-input-group mb-3">
            <label className="fw-bold mb-1">Tài khoản:</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder="Nhập UserName / Email"
              className="login-input form-control"
            />
          </div>

          <div className="login-input-group mb-4">
            <div className="d-flex justify-content-between align-items-center mb-1">
              <label className="fw-bold mb-0">Mật khẩu:</label>
              <Link to="/forgot-password" className="forgot-password-link">
                Quên mật khẩu?
              </Link>
            </div>

            <div className="position-relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Nhập Password..."
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
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16"><path d="m10.79 12.912-1.614-1.615a3.5 3.5 0 0 1-4.474-4.474l-2.06-2.06C.938 6.278 0 8 0 8s3 5.5 8 5.5a7.029 7.029 0 0 0 2.79-.588zM5.21 3.088A7.028 7.028 0 0 1 8 2.5c5 0 8 5.5 8 5.5s-.939 1.721-2.641 3.238l-2.062-2.062a3.5 3.5 0 0 0-4.474-4.474L5.21 3.089z" /><path d="M5.525 7.646a2.5 2.5 0 0 0 2.829 2.829l-2.83-2.829zm4.95.708-2.829-2.83a2.5 2.5 0 0 1 2.829 2.829zm3.171 6-12-12 .708-.708 12 12-.708.708z" /></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16"><path d="M10.5 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z" /><path d="M0 8s3-5.5 8-5.5S16 8 16 8s-3 5.5-8 5.5S0 8 0 8zm8 3.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z" /></svg>
                )}
              </button>
            </div>
          </div>

          <button type="submit" disabled={isLoading} className="login-button btn btn-primary w-100 py-2 fw-bold">
            {isLoading ? 'Đang xử lý...' : 'ĐĂNG NHẬP'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;