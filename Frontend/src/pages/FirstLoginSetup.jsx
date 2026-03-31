import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../utils/axiosConfig';
import bgImage from '../assets/banner.jpg';

// ─── Constants ────────────────────────────────────────────────────────────────
const toDateInput = (raw) => (raw ? String(raw).substring(0, 10) : '');

// ─── Inline SVG Icons ─────────────────────────────────────────────────────────
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

// ─── PasswordField Sub-component ──────────────────────────────────────────────
const PasswordField = ({ id, label, value, onChange, placeholder, required }) => {
    const [show, setShow] = useState(false);
    return (
        <div className="mb-3">
            <label htmlFor={id} className="form-label fw-semibold">{label}</label>
            <div className="input-group">
                <input
                    id={id}
                    type={show ? 'text' : 'password'}
                    className="form-control"
                    placeholder={placeholder}
                    value={value}
                    onChange={onChange}
                    required={required}
                    autoComplete="off"
                />
                <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setShow((v) => !v)}
                    tabIndex={-1}
                    title={show ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                    {show ? <EyeOffIcon /> : <EyeIcon />}
                </button>
            </div>
        </div>
    );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = {
    page: {
        minHeight: '100vh',
        backgroundImage: `url(${bgImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
    },
    card: {
        background: 'rgba(255, 255, 255, 0.90)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        borderRadius: '16px',
        border: 'none',
        boxShadow: '0 12px 40px rgba(0,0,0,0.25)',
    },
    headerIcon: {
        width: 56,
        height: 56,
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #667eea, #764ba2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 12px',
    },
    sectionLabel: {
        fontSize: '0.72rem',
        fontWeight: 700,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: '#8b8b9e',
        borderBottom: '1px solid #ebebf5',
        paddingBottom: '6px',
        marginBottom: '16px',
    },
    submitBtn: {
        background: 'linear-gradient(135deg, #667eea, #764ba2)',
        border: 'none',
        borderRadius: '8px',
        fontWeight: 600,
        fontSize: '1rem',
        letterSpacing: '0.3px',
        transition: 'opacity 0.2s',
    },
    errorBox: {
        background: '#fff5f5',
        border: '1px solid #fed7d7',
        borderRadius: '8px',
        color: '#c53030',
        fontSize: '0.875rem',
    },
};

// ─── Main Component ───────────────────────────────────────────────────────────
const FirstLoginSetup = () => {
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [apiError, setApiError] = useState('');

    // Form state
    const [form, setForm] = useState({
        oldPassword: '',
        newPassword: '',
        confirmNewPassword: '',
        email: '',
        fullName: '',
        phoneNumber: '',
        birthDay: '',
    });

    // Client-side field errors
    const [fieldErrors, setFieldErrors] = useState({});

    // ── Pre-fill profile from server ────────────────────────────────────────────
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await api.get('/Auth/Profile');
                const d = res.data?.data ?? res.data;
                setForm((prev) => ({
                    ...prev,
                    fullName: d.fullName ?? '',
                    email: d.email ?? '',
                    phoneNumber: d.phoneNumber ?? '',
                    birthDay: toDateInput(d.birthDay),
                }));
            } catch {
                // Non-critical; user can fill in manually
            }
        };
        fetchProfile();
    }, []);

    // ── Generic field change handler ────────────────────────────────────────────
    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        // Clear field error on change
        if (fieldErrors[name]) {
            setFieldErrors((prev) => ({ ...prev, [name]: '' }));
        }
        setApiError('');
    };

    // ── Client-side validation ──────────────────────────────────────────────────
    const validate = () => {
        const errors = {};
        const { oldPassword, newPassword, confirmNewPassword, fullName, phoneNumber, birthDay } = form;

        if (!oldPassword.trim()) errors.oldPassword = 'Vui lòng nhập mật khẩu hiện tại.';
        if (!newPassword.trim()) errors.newPassword = 'Vui lòng nhập mật khẩu mới.';
        if (!confirmNewPassword.trim()) errors.confirmNewPassword = 'Vui lòng xác nhận mật khẩu mới.';

        if (newPassword && confirmNewPassword && newPassword !== confirmNewPassword) {
            errors.confirmNewPassword = 'Mật khẩu xác nhận không khớp với mật khẩu mới.';
        }

        if (!fullName.trim()) errors.fullName = 'Vui lòng nhập họ và tên.';
        if (!phoneNumber.trim()) errors.phoneNumber = 'Vui lòng nhập số điện thoại.';
        if (!birthDay) errors.birthDay = 'Vui lòng chọn ngày sinh.';

        return errors;
    };

    // ── Submit — single unified API call ────────────────────────────────────────
    const handleSubmit = async (e) => {
        e.preventDefault();
        setApiError('');

        const errors = validate();
        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            return;
        }

        setIsSubmitting(true);
        try {
            await api.put('/Auth/setup-password', {
                oldPassword: form.oldPassword,
                newPassword: form.newPassword,
                confirmNewPassword: form.confirmNewPassword,
                email: form.email,
                fullName: form.fullName,
                phoneNumber: form.phoneNumber,
                birthDay: form.birthDay || null,
            });

            toast.success('Thiết lập tài khoản thành công! Vui lòng đăng nhập lại.', {
                autoClose: 3000,
            });

            // Clear all stored tokens → force fresh login with new password
            localStorage.clear();

            setTimeout(() => navigate('/login'), 2500);
        } catch (err) {
            // Prefer the Vietnamese message from the backend (400 / 500)
            const serverMsg =
                err.response?.data?.message ||
                err.response?.data?.title ||
                (typeof err.response?.data === 'string' ? err.response.data : null) ||
                'Có lỗi xảy ra. Vui lòng kiểm tra lại thông tin và thử lại.';
            setApiError(serverMsg);
        } finally {
            setIsSubmitting(false);
        }
    };

    // ── Render ───────────────────────────────────────────────────────────────────
    return (
        <div className="d-flex align-items-center justify-content-center py-5" style={styles.page}>
            <div className="container">
                <div className="row justify-content-center">
                    <div className="col-12 col-md-8 col-lg-6 col-xl-5">

                        <div className="card p-4 p-md-5" style={styles.card}>

                            {/* ── Header ── */}
                            <div className="text-center mb-4">
                                <div style={styles.headerIcon}>
                                    {/* Shield-check icon */}
                                    <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" fill="white" viewBox="0 0 16 16">
                                        <path d="M5.338 1.59a61.44 61.44 0 0 0-2.837.856.481.481 0 0 0-.328.39c-.554 4.157.726 7.19 2.253 9.188a10.725 10.725 0 0 0 2.287 2.233c.346.244.652.42.893.533.12.057.218.095.293.118a.55.55 0 0 0 .101.025.615.615 0 0 0 .1-.025c.076-.023.174-.061.294-.118.24-.113.547-.29.893-.533a10.726 10.726 0 0 0 2.287-2.233c1.527-1.997 2.807-5.031 2.253-9.188a.48.48 0 0 0-.328-.39c-.651-.213-1.75-.56-2.837-.855C9.552 1.29 8.531 1.067 8 1.067c-.53 0-1.552.223-2.662.524zM5.072.56C6.157.265 7.31 0 8 0s1.843.265 2.928.56c1.11.3 2.229.655 2.887.87a1.54 1.54 0 0 1 1.044 1.262c.596 4.477-.787 7.795-2.465 9.99a11.775 11.775 0 0 1-2.517 2.453 7.159 7.159 0 0 1-1.048.625c-.28.132-.581.24-.829.24s-.548-.108-.829-.24a7.158 7.158 0 0 1-1.048-.625 11.777 11.777 0 0 1-2.517-2.453C1.928 10.487.545 7.169 1.141 2.692A1.54 1.54 0 0 1 2.185 1.43 62.456 62.456 0 0 1 5.072.56z" />
                                        <path d="M10.854 5.146a.5.5 0 0 1 0 .708l-3 3a.5.5 0 0 1-.708 0l-1.5-1.5a.5.5 0 1 1 .708-.708L7.5 7.793l2.646-2.647a.5.5 0 0 1 .708 0z" />
                                    </svg>
                                </div>
                                <h4 className="fw-bold mb-1" style={{ color: '#4a4a8a' }}>
                                    Thiết lập tài khoản lần đầu
                                </h4>
                                <p className="text-muted small mb-0">
                                    Vui lòng đổi mật khẩu và cập nhật thông tin cá nhân để tiếp tục.
                                </p>
                            </div>

                            {/* ── API Error Banner ── */}
                            {apiError && (
                                <div className="d-flex align-items-start gap-2 p-3 mb-3" style={styles.errorBox}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="flex-shrink-0 mt-1" viewBox="0 0 16 16">
                                        <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z" />
                                    </svg>
                                    <div>{apiError}</div>
                                </div>
                            )}

                            <form onSubmit={handleSubmit} noValidate>

                                {/* ══ SECTION 1: ĐỔI MẬT KHẨU ══ */}
                                <p style={styles.sectionLabel}>🔒 Đổi mật khẩu (bắt buộc)</p>

                                {/* Mật khẩu hiện tại */}
                                <div className="mb-3">
                                    <label htmlFor="oldPassword" className="form-label fw-semibold">Mật khẩu hiện tại</label>
                                    <div className="input-group">
                                        <input
                                            id="oldPassword"
                                            name="oldPassword"
                                            type="password"
                                            className={`form-control ${fieldErrors.oldPassword ? 'is-invalid' : ''}`}
                                            placeholder="Nhập mật khẩu hiện tại"
                                            value={form.oldPassword}
                                            onChange={handleChange}
                                            autoComplete="current-password"
                                        />
                                        {fieldErrors.oldPassword && (
                                            <div className="invalid-feedback">{fieldErrors.oldPassword}</div>
                                        )}
                                    </div>
                                </div>

                                {/* Mật khẩu mới */}
                                <div className="mb-3">
                                    <label htmlFor="newPassword" className="form-label fw-semibold">Mật khẩu mới</label>
                                    <PasswordFieldInline
                                        id="newPassword"
                                        name="newPassword"
                                        value={form.newPassword}
                                        onChange={handleChange}
                                        placeholder="Tối thiểu 8 ký tự, có chữ hoa, số và ký tự đặc biệt"
                                        isInvalid={!!fieldErrors.newPassword}
                                        error={fieldErrors.newPassword}
                                    />
                                </div>

                                {/* Xác nhận mật khẩu mới */}
                                <div className="mb-3">
                                    <label htmlFor="confirmNewPassword" className="form-label fw-semibold">Xác nhận mật khẩu mới</label>
                                    <PasswordFieldInline
                                        id="confirmNewPassword"
                                        name="confirmNewPassword"
                                        value={form.confirmNewPassword}
                                        onChange={handleChange}
                                        placeholder="Nhập lại mật khẩu mới"
                                        isInvalid={!!fieldErrors.confirmNewPassword}
                                        error={fieldErrors.confirmNewPassword}
                                    />
                                </div>

                                <hr className="my-4" />

                                {/* ══ SECTION 2: THÔNG TIN CÁ NHÂN ══ */}
                                <p style={styles.sectionLabel}>👤 Thông tin cá nhân</p>

                                {/* Họ và tên */}
                                <div className="mb-3">
                                    <label htmlFor="fullName" className="form-label fw-semibold">Họ và tên</label>
                                    <input
                                        id="fullName"
                                        name="fullName"
                                        type="text"
                                        className={`form-control ${fieldErrors.fullName ? 'is-invalid' : ''}`}
                                        placeholder="Nhập họ và tên đầy đủ"
                                        value={form.fullName}
                                        onChange={handleChange}
                                    />
                                    {fieldErrors.fullName && (
                                        <div className="invalid-feedback">{fieldErrors.fullName}</div>
                                    )}
                                </div>

                                {/* Email */}
                                <div className="mb-3">
                                    <label htmlFor="email" className="form-label fw-semibold">
                                        Email
                                        <span className="text-muted fw-normal ms-1" style={{ fontSize: '0.8rem' }}>(tùy chọn)</span>
                                    </label>
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        className={`form-control ${fieldErrors.email ? 'is-invalid' : ''}`}
                                        placeholder="example@email.com"
                                        value={form.email}
                                        onChange={handleChange}
                                    />
                                    {fieldErrors.email && (
                                        <div className="invalid-feedback">{fieldErrors.email}</div>
                                    )}
                                </div>

                                {/* Số điện thoại */}
                                <div className="mb-3">
                                    <label htmlFor="phoneNumber" className="form-label fw-semibold">Số điện thoại</label>
                                    <input
                                        id="phoneNumber"
                                        name="phoneNumber"
                                        type="tel"
                                        className={`form-control ${fieldErrors.phoneNumber ? 'is-invalid' : ''}`}
                                        placeholder="0xxxxxxxxx"
                                        value={form.phoneNumber}
                                        onChange={handleChange}
                                    />
                                    {fieldErrors.phoneNumber && (
                                        <div className="invalid-feedback">{fieldErrors.phoneNumber}</div>
                                    )}
                                </div>

                                {/* Ngày sinh */}
                                <div className="mb-4">
                                    <label htmlFor="birthDay" className="form-label fw-semibold">Ngày sinh</label>
                                    <input
                                        id="birthDay"
                                        name="birthDay"
                                        type="date"
                                        className={`form-control ${fieldErrors.birthDay ? 'is-invalid' : ''}`}
                                        value={form.birthDay}
                                        onChange={handleChange}
                                        max={new Date().toISOString().split('T')[0]}
                                    />
                                    {fieldErrors.birthDay && (
                                        <div className="invalid-feedback">{fieldErrors.birthDay}</div>
                                    )}
                                </div>

                                {/* Submit */}
                                <button
                                    type="submit"
                                    className="btn btn-primary w-100 py-2 text-white"
                                    style={styles.submitBtn}
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
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

// ─── Inline password input with show/hide toggle ───────────────────────────────
// (Kept inside the file to avoid creating a separate file for such a small utility)
const PasswordFieldInline = ({ id, name, value, onChange, placeholder, isInvalid, error }) => {
    const [show, setShow] = useState(false);
    return (
        <>
            <div className="input-group">
                <input
                    id={id}
                    name={name}
                    type={show ? 'text' : 'password'}
                    className={`form-control ${isInvalid ? 'is-invalid' : ''}`}
                    placeholder={placeholder}
                    value={value}
                    onChange={onChange}
                    autoComplete="new-password"
                />
                <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setShow((v) => !v)}
                    tabIndex={-1}
                    title={show ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                    {show ? <EyeOffIcon /> : <EyeIcon />}
                </button>
                {isInvalid && <div className="invalid-feedback">{error}</div>}
            </div>
        </>
    );
};

export default FirstLoginSetup;