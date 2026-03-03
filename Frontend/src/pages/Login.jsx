import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };


  const handleSubmit = (e) => {
    e.preventDefault();


    alert('Đăng nhập thành công!');
    navigate('/resident');
  };

  return (
    <div className="d-flex align-items-center justify-content-center vh-100" style={{ backgroundColor: '#f0f2f5' }}>
      <div className="card shadow-lg" style={{ width: '400px', borderRadius: '15px', border: 'none' }}>
        <div className="card-body p-5">
          <div className="text-center mb-4">
            <h3 className="fw-bold" style={{ color: '#122240' }}>SENTANA</h3>
            <p className="text-muted">Đăng nhập hệ thống quản lý</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label fw-bold text-secondary">Tên đăng nhập</label>
              <input
                type="text"
                className="form-control form-control-lg bg-light"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                placeholder="Nhập tài khoản"
              />
            </div>

            <div className="mb-4">
              <label className="form-label fw-bold text-secondary">Mật khẩu</label>
              <input
                type="password"
                className="form-control form-control-lg bg-light"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="Nhập mật khẩu"
              />
            </div>

            <button type="submit" className="btn w-100 py-2 mb-3 text-white fw-bold" style={{ backgroundColor: '#122240', borderRadius: '8px' }}>
              ĐĂNG NHẬP
            </button>
          </form>

          <div className="text-center mt-3">
            <span className="text-muted">Chưa có tài khoản? </span>
            <a href="/register" className="text-decoration-none fw-bold" style={{ color: '#0d6efd' }}>Đăng ký ngay</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;