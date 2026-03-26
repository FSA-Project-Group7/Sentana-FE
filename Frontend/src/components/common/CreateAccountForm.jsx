import React, { useState, useRef, useCallback, useEffect } from 'react';
import api from '../../utils/axiosConfig';
import './CreateAccountForm.css';

// ─────────────────────────────────────────────
// Regex Validation Rules
// ─────────────────────────────────────────────
const REGEX = {
  email: /^[a-zA-Z0-9._%+-]+@gmail\.com$/,
  phone: /^(0|84|\+84)[35789][0-9]{8}$/,
  cccd: /^[0-9]{12}$/,
  fullName: /^[a-zA-ZÀ-ỹà-ỹ\s]+$/,
};

const ERROR_MESSAGES = {
  email: 'Email phải có đuôi @gmail.com',
  phone: 'Số điện thoại không hợp lệ (VD: 0912345678)',
  cccd: 'CCCD phải gồm đúng 12 số',
  fullName: 'Họ tên chỉ được chứa chữ cái và khoảng trắng',
  required: 'Trường này là bắt buộc',
};

// Gender enum: 0 = Nam, 1 = Nữ, 2 = Khác
const GENDER_OPTIONS = [
  { value: '0', label: 'Nam' },
  { value: '1', label: 'Nữ' },
  { value: '2', label: 'Khác' },
];

// ─────────────────────────────────────────────
// Toast Hook
// ─────────────────────────────────────────────
const useToast = () => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return { toasts, addToast, removeToast };
};

// ─────────────────────────────────────────────
// Toast Container Component
// ─────────────────────────────────────────────
const ToastContainer = ({ toasts, onRemove }) => {
  const icons = {
    success: '✓',
    error: '✗',
    info: 'ℹ',
    warning: '⚠',
  };

  return (
    <div className="caf-toast-container" aria-live="polite">
      {toasts.map(toast => (
        <div key={toast.id} className={`caf-toast caf-toast--${toast.type}`}>
          <span className="caf-toast__icon">{icons[toast.type] || icons.info}</span>
          <span className="caf-toast__message">{toast.message}</span>
          <button className="caf-toast__close" onClick={() => onRemove(toast.id)} aria-label="Đóng">×</button>
        </div>
      ))}
    </div>
  );
};

// ─────────────────────────────────────────────
// Field Error Message Component
// ─────────────────────────────────────────────
const FieldError = ({ error }) =>
  error ? <div className="caf-field-error">{error}</div> : null;

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────

/**
 * CreateAccountForm
 * Props:
 * - type: 'resident' | 'technician'
 * - onSuccess: () => void   – called after successful creation
 * - onCancel: () => void    – called when user clicks "Hủy"
 */
const CreateAccountForm = ({ type = 'resident', onSuccess, onCancel }) => {
  const isResident = type === 'resident';
  const title = isResident ? 'Thêm Cư Dân Mới' : 'Thêm Kỹ Thuật Viên Mới';
  const apiEndpoint = isResident
    ? '/Residents/CreateResident'
    : '/Technicians/CreateTechnician';

  // ── State ──────────────────────────────────
  const initialForm = {
    // Account fields (always editable)
    email: '',
    userName: '',
    // Password đã được BE lo liệu (Tự động sinh và gửi qua mail)

    // Info fields (locked when CCCD found in system)
    fullName: '',
    phoneNumber: '',
    identityCard: '',
    country: '',
    city: '',
    address: '',
    birthDay: '',
    sex: '',
  };

  const [formData, setFormData] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [isExistingInfo, setIsExistingInfo] = useState(false);
  const [isCccdChecking, setIsCccdChecking] = useState(false);
  const [cccdStatus, setCccdStatus] = useState(null); // 'found' | 'not_found' | null
  const [isSubmitting, setIsSubmitting] = useState(false);

  const cccdDebounceRef = useRef(null);
  const { toasts, addToast, removeToast } = useToast();

  // ── Single field validation ──────────────────
  const validateField = (name, value) => {
    if (!value || value.trim() === '') {
      // optional fields
      if (['country', 'city', 'address', 'birthDay', 'sex'].includes(name)) return '';
      return ERROR_MESSAGES.required;
    }
    switch (name) {
      case 'email': return REGEX.email.test(value) ? '' : ERROR_MESSAGES.email;
      case 'phoneNumber': return REGEX.phone.test(value) ? '' : ERROR_MESSAGES.phone;
      case 'identityCard': return REGEX.cccd.test(value) ? '' : ERROR_MESSAGES.cccd;
      case 'fullName': return REGEX.fullName.test(value) ? '' : ERROR_MESSAGES.fullName;
      case 'birthDay': {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const chosen = new Date(value);
        return chosen < today ? '' : 'Ngày sinh phải là ngày trong quá khứ';
      }
      default: return '';
    }
  };

  // ── Full form validation ──────────────────────
  const validateAll = () => {
    // ĐÃ XÓA PASSWORD khỏi mảng bắt buộc
    const requiredFields = ['email', 'userName', 'fullName', 'phoneNumber', 'identityCard'];
    const newErrors = {};
    requiredFields.forEach(field => {
      const err = validateField(field, formData[field]);
      if (err) newErrors[field] = err;
    });
    return newErrors;
  };

  // ── CCCD Check API ────────────────────────────
  const checkCccd = useCallback(async (cccd) => {
    setIsCccdChecking(true);
    setCccdStatus(null);
    try {
      const res = await api.get(`/InFos/check-cccd/${cccd}`);
      const apiMessage = res.data?.message;
      const data = res.data?.data;
      if (data) {
        setFormData(prev => ({
          ...prev,
          fullName: data.fullName || '',
          phoneNumber: data.phoneNumber || '',
          country: data.country || '',
          city: data.city || '',
          address: data.address || '',
          birthDay: data.birthday ? data.birthday.split('T')[0] : '',
          sex: (data.sex !== null && data.sex !== undefined) ? data.sex.toString() : ''
        }));
        setIsExistingInfo(true);
        setCccdStatus('found');
        addToast(apiMessage || `Tìm thấy hồ sơ: ${data.fullName}. Thông tin đã được điền tự động.`, 'success');
      } else {
        setIsExistingInfo(false);
        setCccdStatus('not_found');
        addToast(apiMessage || 'Không tìm thấy hồ sơ với CCCD này. Vui lòng nhập tay thông tin cá nhân.', 'info');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message;
      if (err.response?.status === 404) {
        setIsExistingInfo(false);
        setCccdStatus('not_found');
        addToast(errorMessage || 'Không tìm thấy hồ sơ với CCCD này. Vui lòng nhập tay thông tin cá nhân.', 'info');
      } else {
        addToast(errorMessage || 'Lỗi kết nối khi kiểm tra CCCD. Vui lòng thử lại.', 'error');
        setCccdStatus(null);
      }
    } finally {
      setIsCccdChecking(false);
    }
  }, [addToast]);

  // ── Input Change Handler (General) ────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (errors[name] !== undefined) {
      setErrors(prev => ({ ...prev, [name]: validateField(name, value) }));
    }
  };

  // ── CCCD Change Handler (Auto-fill) ────────────
  const handleCccdChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (errors[name] !== undefined) {
      setErrors(prev => ({ ...prev, [name]: validateField(name, value) }));
    }

    if (isExistingInfo) {
      setIsExistingInfo(false);
      setCccdStatus(null);
      setFormData(prev => ({
        ...prev,
        identityCard: value,
        fullName: '',
        phoneNumber: '',
        country: '',
        city: '',
        address: '',
        birthDay: '',
        sex: ''
      }));
    }

    if (cccdDebounceRef.current) clearTimeout(cccdDebounceRef.current);

    if (value.length === 12 && REGEX.cccd.test(value)) {
      cccdDebounceRef.current = setTimeout(() => {
        checkCccd(value);
      }, 400);
    } else {
      setIsCccdChecking(false);
      setCccdStatus(null);
    }
  };

  // ── Blur validation ───────────────────────────
  const handleBlur = (e) => {
    const { name, value } = e.target;
    setErrors(prev => ({ ...prev, [name]: validateField(name, value) }));
  };

  // ── Submit ────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validateAll();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      addToast('Vui lòng kiểm tra lại các trường thông tin bị lỗi.', 'warning');
      return;
    }

    // Prepare payload (ĐÃ XÓA PASSWORD)
    const payload = {
      email: formData.email.trim(),
      userName: formData.userName.trim(),
      fullName: formData.fullName.trim(),
      phoneNumber: formData.phoneNumber.trim(),
      identityCard: formData.identityCard.trim(),
      country: formData.country.trim(),
      city: formData.city.trim(),
      address: formData.address.trim(),
      birthDay: formData.birthDay ? formData.birthDay : null,
      sex: formData.sex !== '' ? Number(formData.sex) : null,
    };

    setIsSubmitting(true);
    try {
      const res = await api.post(apiEndpoint, payload);
      const successMsg = res.data?.message || res.data?.data?.message || (isResident ? 'Tạo Cư Dân thành công! Mật khẩu đã được gửi qua email.' : 'Tạo Kỹ Thuật Viên thành công! Mật khẩu đã được gửi qua email.');
      addToast(successMsg, 'success');
      setTimeout(() => {
        if (onSuccess) onSuccess();
      }, 1200);
    } catch (err) {
      let errorMessage = 'Đã xảy ra lỗi. Vui lòng thử lại.';
      const backendErrors = err.response?.data?.errors;
      if (backendErrors) {
        const mapped = {};
        if (backendErrors.BirthDay) mapped.birthDay = backendErrors.BirthDay[0];
        if (backendErrors.Sex) mapped.sex = backendErrors.Sex[0];
        if (Object.keys(mapped).length > 0) setErrors(prev => ({ ...prev, ...mapped }));
        const firstKey = Object.keys(backendErrors)[0];
        errorMessage = backendErrors[firstKey][0];
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }
      addToast('LỖI: ' + errorMessage, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Reset & Cancel form ───────────────────────
  const handleReset = () => {
    setFormData(initialForm);
    setErrors({});
    setIsExistingInfo(false);
    setCccdStatus(null);
    setIsCccdChecking(false);
    if (cccdDebounceRef.current) clearTimeout(cccdDebounceRef.current);
  };

  const handleCancel = () => {
    handleReset();
    if (onCancel) onCancel();
  };

  useEffect(() => {
    return () => {
      if (cccdDebounceRef.current) clearTimeout(cccdDebounceRef.current);
    };
  }, []);

  const inputClass = (name) => {
    let cls = 'form-control caf-input';
    if (errors[name]) cls += ' is-invalid';
    else if (formData[name] && !errors[name] && errors[name] !== undefined) cls += ' is-valid';
    return cls;
  };

  // ─────────────────────────────────────────────
  return (
    <>
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <div className="caf-wrapper">
        <div className="caf-header">
          <div className="caf-header__icon">
            {isResident ? (
              <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l9-9 9 9M5 10v9a1 1 0 001 1h4v-5h4v5h4a1 1 0 001-1v-9" /></svg>
            ) : (
              <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            )}
          </div>
          <h5 className="caf-header__title">{title}</h5>
          {onCancel && (
            <button
              type="button"
              className="caf-header__close"
              onClick={handleCancel}
              aria-label="Đóng form"
              title="Đóng"
            >
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} noValidate>
          {/* ── SECTION 1: Account Info ── */}
          <div className="caf-section">
            <div className="caf-section__label">
              <span className="caf-section__badge">1</span>
              Thông tin tài khoản
            </div>

            <div className="row g-3">
              {/* Email */}
              <div className="col-md-6">
                <label className="form-label caf-label" htmlFor="caf-email">
                  Email <span className="caf-required">*</span>
                </label>
                <input
                  id="caf-email"
                  type="email"
                  name="email"
                  className={inputClass('email')}
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="example@gmail.com"
                  autoComplete="email"
                />
                <FieldError error={errors.email} />
              </div>

              {/* Username */}
              <div className="col-md-6">
                <label className="form-label caf-label" htmlFor="caf-userName">
                  Tên đăng nhập <span className="caf-required">*</span>
                </label>
                <input
                  id="caf-userName"
                  type="text"
                  name="userName"
                  className={inputClass('userName')}
                  value={formData.userName}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="user123"
                  autoComplete="username"
                />
                <FieldError error={errors.userName} />
              </div>

              <div className="col-12 mt-2">
                <div className="alert alert-info py-2 small mb-0">
                  <i className="bi bi-shield-lock-fill me-2"></i>
                  <strong>Bảo mật:</strong> Mật khẩu sẽ được hệ thống tự động khởi tạo ngẫu nhiên và gửi trực tiếp vào hòm thư Email của người dùng này.
                </div>
              </div>
            </div>
          </div>

          {/* ── SECTION 2: Personal Info ── */}
          <div className="caf-section">
            <div className="caf-section__label">
              <span className="caf-section__badge">2</span>
              Thông tin cá nhân
              {isExistingInfo && (
                <span className="caf-badge-locked ms-2">
                  <svg width="12" height="12" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
                  Hồ sơ có sẵn – đã khóa
                </span>
              )}
            </div>

            <div className="row g-3">
              {/* CCCD */}
              <div className="col-md-6">
                <label className="form-label caf-label" htmlFor="caf-identityCard">
                  Số CCCD <span className="caf-required">*</span>
                  <span className="caf-hint">Nhập 12 số để tự động tra cứu</span>
                </label>
                <div className="caf-cccd-wrapper">
                  <input
                    id="caf-identityCard"
                    type="text"
                    name="identityCard"
                    className={`${inputClass('identityCard')} ${cccdStatus === 'found' ? 'caf-input--found' : ''} ${cccdStatus === 'not_found' ? 'caf-input--notfound' : ''}`}
                    value={formData.identityCard}
                    onChange={handleCccdChange}
                    onBlur={handleBlur}
                    placeholder="12 chữ số"
                    maxLength={12}
                    inputMode="numeric"
                  />
                  {isCccdChecking && (
                    <div className="caf-cccd-spinner" aria-label="Đang tra cứu CCCD">
                      <div className="caf-spinner" />
                    </div>
                  )}
                  {!isCccdChecking && cccdStatus === 'found' && (
                    <div className="caf-cccd-status caf-cccd-status--found" title="Tìm thấy hồ sơ">✓</div>
                  )}
                  {!isCccdChecking && cccdStatus === 'not_found' && (
                    <div className="caf-cccd-status caf-cccd-status--notfound" title="Không tìm thấy">?</div>
                  )}
                </div>
                <FieldError error={errors.identityCard} />
              </div>

              {/* Full Name */}
              <div className="col-md-6">
                <label className="form-label caf-label" htmlFor="caf-fullName">
                  Họ và Tên <span className="caf-required">*</span>
                </label>
                <input
                  id="caf-fullName"
                  type="text"
                  name="fullName"
                  className={inputClass('fullName')}
                  value={formData.fullName}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Nguyễn Văn A"
                  readOnly={isExistingInfo}
                />
                <FieldError error={errors.fullName} />
              </div>

              {/* Phone */}
              <div className="col-md-6">
                <label className="form-label caf-label" htmlFor="caf-phoneNumber">
                  Số điện thoại <span className="caf-required">*</span>
                </label>
                <input
                  id="caf-phoneNumber"
                  type="tel"
                  name="phoneNumber"
                  className={inputClass('phoneNumber')}
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="0912345678"
                  readOnly={isExistingInfo}
                />
                <FieldError error={errors.phoneNumber} />
              </div>

              {/* BirthDay */}
              <div className="col-md-6">
                <label className="form-label caf-label" htmlFor="caf-birthDay">
                  Ngày sinh
                  <span className="caf-hint"> Tuỳ chọn – phải là ngày trong quá khứ</span>
                </label>
                <input
                  id="caf-birthDay"
                  type="date"
                  name="birthDay"
                  className={inputClass('birthDay')}
                  value={formData.birthDay}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  max={new Date().toISOString().split('T')[0]}
                  readOnly={isExistingInfo}
                />
                <FieldError error={errors.birthDay} />
              </div>

              {/* Sex */}
              <div className="col-md-6">
                <label className="form-label caf-label" htmlFor="caf-sex">Giới tính</label>
                <select
                  id="caf-sex"
                  name="sex"
                  className={inputClass('sex')}
                  value={formData.sex}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={isExistingInfo}
                >
                  <option value="">-- Chọn giới tính --</option>
                  <option value="0">Nam</option>
                  <option value="1">Nữ</option>
                  <option value="2">Khác</option>
                </select>
                <FieldError error={errors.sex} />
              </div>

              {/* Country */}
              <div className="col-md-6">
                <label className="form-label caf-label" htmlFor="caf-country">Quốc gia</label>
                <input
                  id="caf-country"
                  type="text"
                  name="country"
                  className={inputClass('country')}
                  value={formData.country}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Việt Nam"
                  readOnly={isExistingInfo}
                />
              </div>

              {/* City */}
              <div className="col-md-6">
                <label className="form-label caf-label" htmlFor="caf-city">Tỉnh / Thành phố</label>
                <input
                  id="caf-city"
                  type="text"
                  name="city"
                  className={inputClass('city')}
                  value={formData.city}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Hà Nội"
                  readOnly={isExistingInfo}
                />
              </div>

              {/* Address */}
              <div className="col-md-6">
                <label className="form-label caf-label" htmlFor="caf-address">Địa chỉ chi tiết</label>
                <input
                  id="caf-address"
                  type="text"
                  name="address"
                  className={inputClass('address')}
                  value={formData.address}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Số nhà, ngõ, phường..."
                  readOnly={isExistingInfo}
                />
              </div>
            </div>
          </div>

          {/* ── Actions ── */}
          <div className="caf-actions">
            <button
              type="button"
              className="caf-btn-cancel"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
              Hủy
            </button>
            <button
              type="button"
              className="caf-btn-reset"
              onClick={handleReset}
              disabled={isSubmitting}
              title="Xóa toàn bộ dữ liệu đã nhập"
            >
              <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Nhập lại
            </button>
            <button
              type="submit"
              className="caf-btn-submit"
              disabled={isSubmitting || isCccdChecking}
            >
              {isSubmitting ? (
                <>
                  <span className="caf-spinner caf-spinner--sm" />
                  Đang tạo...
                </>
              ) : (
                <>
                  <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  {isResident ? 'Thêm Cư Dân' : 'Thêm KTV'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default CreateAccountForm;