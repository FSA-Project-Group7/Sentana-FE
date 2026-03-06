import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/axiosConfig';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await api.post('/Auth/Login', {
        username: username,
        password: password
      });
      // THÊM DÒNG NÀY ĐỂ DEBUG:
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
      <div className="login-form-card">
        <h2 className="login-title">ĐĂNG NHẬP</h2>

        {error && <p className="login-error text-danger text-center">{error}</p>}

        <form onSubmit={handleLogin} className="login-form">
          <div className="login-input-group">
            <label>Tài khoản:</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder="Nhập UserName..."
              className="login-input form-control mb-3"
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
              className="login-input form-control mb-3"
            />
          </div>

          <button type="submit" disabled={isLoading} className="login-button btn btn-primary w-100 mt-2">
            {isLoading ? 'Đang xử lý...' : 'Đăng nhập'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;