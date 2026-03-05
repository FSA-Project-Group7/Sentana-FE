import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/axiosConfig';
import './Login.css'; // Import file CSS vào đây

const Login = () => {
  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      const response = await api.post('/Auth/login', {
        userName: userName,
        password: password
      });

      const token = response.data.token;

      if (token) {
        localStorage.setItem('token', token);
        alert('Đăng nhập thành công!');
        navigate('/');
        window.location.reload();
      }
    } catch (error) {
      console.error("Lỗi đăng nhập:", error);
      if (error.response && error.response.data) {
        setErrorMsg(error.response.data.message || 'Sai tài khoản hoặc mật khẩu!');
      } else {
        setErrorMsg('Không thể kết nối đến máy chủ. Hãy kiểm tra lại Backend!');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-form-card">
        <h2 className="login-title">ĐĂNG NHẬP</h2>

        {errorMsg && <p className="login-error">{errorMsg}</p>}

        <form onSubmit={handleLogin} className="login-form">
          <div className="login-input-group">
            <label>Tài khoản:</label>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              required
              placeholder="Nhập UserName..."
              className="login-input"
            />
          </div>

          <div className="login-input-group">
            <label>Mật khẩu:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Nhập Password..."
              className="login-input"
            />
          </div>

          <button type="submit" disabled={isLoading} className="login-button">
            {isLoading ? 'Đang xử lý...' : 'Đăng nhập'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;