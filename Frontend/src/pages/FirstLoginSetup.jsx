import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../utils/axiosConfig';
import bgImage from '../assets/banner.jpg';

// ─── helpers ─────────────────────────────────────────────────────────────────
const toDateInput = (raw) => {
  if (!raw) return '';
  return String(raw).substring(0, 10); // "YYYY-MM-DD"
};

const ROLE_ROUTES = {
  Manager: '/admin',
  Resident: '/resident',
  Technician: '/technician',
};

// ─── styles ──────────────────────────────────────────────────────────────────
const pageStyle = {
  minHeight: '100vh',
  backgroundImage: `url(${bgImage})`,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  backgroundRepeat: 'no-repeat',
  backgroundAttachment: 'fixed',
};

const cardStyle = {
  background: 'rgba(255, 255, 255, 0.88)',
  backdropFilter: 'blur(8px)',
  WebkitBackdropFilter: 'blur(8px)',
  borderRadius: '16px',
  border: 'none',
  boxShadow: '0 12px 40px rgba(0,0,0,0.25)',
};

const submitBtnStyle = {
  background: 'linear-gradient(135deg, #667eea, #764ba2)',
  border: 'none',
  borderRadius: '8px',
  fontWeight: '600',
  fontSize: '1rem',
  letterSpacing: '0.3px',
};

// ─── inline SVG icons (no extra dependency needed) ───────────────────────────
const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
    <path d="M10.5 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z" />
    <path d="M0 8s3-5.5 8-5.5S16 8 16 8s-3 5.5-8 5.5S0 8 0 8zm8 3.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z" />
  </svg>
);

const EyeOffIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
    <path d="m10.79 12.912-1.614-1.615a3.5 3.5 0 0 1-4.474-4.474l-2.06-2.06C.938 6.278 0 8 0 8s3 5.5 8 5.5a7.03 7.03 0 0 0 2.79-.588zM5.21 3.088A7.03 7.03 0 0 1 8 2.5c5 0 8 5.5 8 5.5s-.939 1.721-2.641 3.238l-2.062-2.062a3.5 3.5 0 0 0-4.474-4.474L5.21 3.089z" />
    <path d="M5.525 7.646a2.5 2.5 0 0 0 2.829 2.829l-2.83-2.829zm4.95.708-2.829-2.83a2.5 2.5 0 0 1 2.829 2.829zm3.171 6-12-12 .708-.708 12 12-.708.708z" />
  </svg>
);

// ─── component ────────────────────────────────────────────────────────────────
const FirstLoginSetup = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Password values
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Password visibility toggles
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Profile — only the 4 fields the backend accepts
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [birthDay, setBirthDay] = useState('');

  // ── Pre-fill profile on mount ─────────────────────────────────────────────
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/Auth/Profile');
        const d = res.data?.data ?? res.data;
        setFullName(d.fullName ?? '');
        setEmail(d.email ?? '');
        setPhoneNumber(d.phoneNumber ?? '');
        setBirthDay(toDateInput(d.birthDay));
      } catch (err) {
        toast.error(err.response?.data?.message || 'Không thể tải thông tin hồ sơ.');
      }
    };
    fetchProfile();
  }, []);

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp!');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Change password
      await api.put('/Auth/setup-password', {
        oldPassword: oldPassword, 
        newPassword: newPassword,
        confirmNewPassword: confirmPassword
      });

      await api.put('/Auth/profile', {
        fullName,
        phoneNumber,
        birthDay: birthDay || null,
        email,
      });

      localStorage.setItem('requiresPasswordChange', 'false');
      toast.success('Cập nhật thành công! Chào mừng bạn.');
      const role = localStorage.getItem('role');
      navigate(ROLE_ROUTES[role] ?? '/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      className="d-flex align-items-center justify-content-center py-5"
      style={pageStyle}
    >
      <div className="container">
        <div className="row justify-content-center align-items-center">
          <div className="col-12 col-md-8 col-lg-6 col-xl-5">

            <div className="card p-4 p-md-5" style={cardStyle}>

              {/* ── Header ─────────────────────────────────── */}
              <div className="text-center mb-4">
                <h4 className="fw-bold mb-1" style={{ color: '#4a4a8a' }}>
                   Thiết lập tài khoản lần đầu
                </h4>
                <p className="text-muted small mb-0">
                  Vui lòng đổi mật khẩu và cập nhật thông tin cá nhân để tiếp tục.
                </p>
              </div>

              <form onSubmit={handleSubmit} noValidate>

                {/* ══════════════════════════════════════════════
                    PHẦN 1 — ĐỔI MẬT KHẨU
                ══════════════════════════════════════════════ */}
                <p className="fw-semibold text-secondary text-uppercase small mb-3">
                   Đổi mật khẩu (bắt buộc)
                </p>

                {/* Mật khẩu hiện tại */}
                <div className="mb-3">
                  <label className="form-label fw-semibold">Mật khẩu hiện tại</label>
                  <div className="input-group">
                    <input
                      id="oldPassword"
                      type={showOld ? 'text' : 'password'}
                      className="form-control"
                      placeholder="Mật khẩu hiện tại"
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => setShowOld((v) => !v)}
                      tabIndex={-1}
                      title={showOld ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    >
                      {showOld ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  </div>
                </div>

                {/* Mật khẩu mới */}
                <div className="mb-3">
                  <label className="form-label fw-semibold">Mật khẩu mới</label>
                  <div className="input-group">
                    <input
                      id="newPassword"
                      type={showNew ? 'text' : 'password'}
                      className="form-control"
                      placeholder="Tối thiểu 8 ký tự, có chữ, số và ký tự đặc biệt"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => setShowNew((v) => !v)}
                      tabIndex={-1}
                      title={showNew ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    >
                      {showNew ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  </div>
                </div>

                {/* Xác nhận mật khẩu mới */}
                <div className="mb-3">
                  <label className="form-label fw-semibold">Xác nhận mật khẩu mới</label>
                  <div className="input-group">
                    <input
                      id="confirmPassword"
                      type={showConfirm ? 'text' : 'password'}
                      className="form-control"
                      placeholder="Nhập lại mật khẩu mới"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => setShowConfirm((v) => !v)}
                      tabIndex={-1}
                      title={showConfirm ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    >
                      {showConfirm ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  </div>
                </div>

                <hr className="my-4" />

                {/* ══════════════════════════════════════════════
                    PHẦN 2 — THÔNG TIN CÁ NHÂN
                ══════════════════════════════════════════════ */}
                <p className="fw-semibold text-secondary text-uppercase small mb-3">
                   Thông tin cá nhân
                </p>

                {/* Email — read-only */}
                <div className="mb-3">
                  <label className="form-label fw-semibold">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    className="form-control"
                    placeholder="Nhập địa chỉ email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                {/* Họ và tên */}
                <div className="mb-3">
                  <label className="form-label fw-semibold">Họ và tên</label>
                  <input
                    id="fullName"
                    type="text"
                    className="form-control"
                    placeholder="Nhập họ và tên đầy đủ"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>

                {/* Số điện thoại */}
                <div className="mb-3">
                  <label className="form-label fw-semibold">Số điện thoại</label>
                  <input
                    id="phoneNumber"
                    type="text"
                    className="form-control"
                    placeholder="Số điện thoại"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    required
                  />
                </div>

                {/* Ngày sinh */}
                <div className="mb-4">
                  <label className="form-label fw-semibold">Ngày sinh</label>
                  <input
                    id="birthDay"
                    type="date"
                    className="form-control"
                    value={birthDay}
                    onChange={(e) => setBirthDay(e.target.value)}
                    required
                  />
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  className="btn btn-primary w-100 py-2 text-white"
                  style={submitBtnStyle}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm me-2"
                        role="status"
                        aria-hidden="true"
                      />
                      Đang xử lý...
                    </>
                  ) : (
                    'Xác nhận & Tiếp tục'
                  )}
                </button>

              </form>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default FirstLoginSetup;
