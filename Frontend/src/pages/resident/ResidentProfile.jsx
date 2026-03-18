import React, { useState, useEffect } from 'react';
import api from '../../utils/axiosConfig';

const ResidentProfile = () => {
    const [userInfo, setUserInfo] = useState(null);
    const [loading, setLoading] = useState(true);

    const [showModal, setShowModal] = useState(false);
    const [editForm, setEditForm] = useState({
        fullName: '',
        phoneNumber: '',
        email: '',
        birthDay: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchProfile = async () => {
        setLoading(true);
        try {
            const res = await api.get('/Auth/profile');
            const data = res.data?.data || res.data;

            console.log("🔍 DATA ĐÃ NÂNG CẤP TỪ BACKEND:", data);

            setUserInfo({
                ...data,
                contractStart: data.contractStart ? new Date(data.contractStart).toLocaleDateString('vi-VN') : 'N/A',
                contractEnd: data.contractEnd ? new Date(data.contractEnd).toLocaleDateString('vi-VN') : 'N/A',

                status: data.status || (data.apartmentCode ? 'Đang cư trú' : 'Chưa có hợp đồng')
            });

        } catch (error) {
            console.error("Lỗi khi tải Profile:", error);
            alert("Không thể tải thông tin cá nhân!");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    const formatDateForInput = (dateString) => {
        if (!dateString) return '';
        try {
            return new Date(dateString).toISOString().split('T')[0];
        } catch (error) {
            return '';
        }
    };

    const handleOpenModal = () => {
        setEditForm({
            fullName: userInfo?.fullName || '',
            phoneNumber: userInfo?.phoneNumber || '',
            email: userInfo?.email || '',
            birthDay: formatDateForInput(userInfo?.birthDay)
        });
        setShowModal(true);
    };

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const payload = {
                FullName: editForm.fullName,
                PhoneNumber: editForm.phoneNumber,
                Email: editForm.email,
                BirthDay: editForm.birthDay ? new Date(editForm.birthDay).toISOString() : null
            };

            console.log("Đang gửi dữ liệu lên BE:", payload);

            await api.put('/Auth/profile', payload);

            alert("Cập nhật thông tin thành công!");
            setShowModal(false);
            fetchProfile();

        } catch (error) {
            console.error("Lỗi chi tiết từ Backend:", error.response?.data);
            let errorMessage = "Không thể cập nhật thông tin lúc này.";

            if (error.response?.data?.errors) {
                const validationErrors = error.response.data.errors;
                const firstErrorKey = Object.keys(validationErrors)[0];
                errorMessage = validationErrors[firstErrorKey][0];
            } else if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (typeof error.response?.data === 'string') {
                errorMessage = error.response.data;
            }

            alert("LỖI TỪ HỆ THỐNG:\n" + errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return <div className="text-center py-5"><div className="spinner-border text-white"></div></div>;
    }

    return (
        <div className="container pb-5">
            <div className="text-center mb-5">
                <h2 className="fw-bold text-white mb-2" style={{ textShadow: '2px 2px 8px rgba(0,0,0,0.8)' }}>Thông tin cá nhân</h2>
                <p className="text-light" style={{ textShadow: '1px 1px 4px rgba(0,0,0,0.8)' }}>Quản lý thông tin hồ sơ và hợp đồng căn hộ của bạn</p>
            </div>

            <div className="row justify-content-center">
                <div className="col-lg-10">
                    <div className="card border-0 shadow-lg rounded-4 overflow-hidden">
                        <div className="row g-0">
                            <div className="col-md-4 bg-light p-4 p-md-5 text-center d-flex flex-column align-items-center justify-content-center border-end">
                                <div className="rounded-circle bg-white shadow-sm d-flex align-items-center justify-content-center mb-4" style={{ width: '120px', height: '120px', border: '4px solid #dee2e6' }}>
                                    <i className="bi bi-person-fill text-secondary" style={{ fontSize: '4rem' }}></i>
                                </div>
                                <h4 className="fw-bold text-dark mb-1">{userInfo?.fullName}</h4>
                                <span className={`badge ${userInfo?.status === 'Đang cư trú' ? 'bg-success' : 'bg-secondary'} mb-3 px-3 py-2 rounded-pill`}>
                                    {userInfo?.status}
                                </span>
                                <div className="w-100 text-start mt-3">
                                    <p className="text-muted small mb-1">Căn hộ hiện tại</p>
                                    <h5 className="fw-bold text-primary mb-0">{userInfo?.apartmentCode || 'N/A'}</h5>
                                    <small className="text-secondary">{userInfo?.buildingName}</small>
                                </div>
                            </div>

                            <div className="col-md-8 p-4 p-md-5 bg-white">
                                <div className="d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom">
                                    <h5 className="fw-bold text-dark mb-0"><i className="bi bi-card-list me-2"></i>Chi tiết hồ sơ</h5>
                                    <button onClick={handleOpenModal} className="btn btn-sm btn-outline-primary fw-semibold">
                                        <i className="bi bi-pencil-square me-1"></i> Cập nhật
                                    </button>
                                </div>

                                <div className="row g-4">
                                    <div className="col-sm-6">
                                        <label className="text-muted small fw-semibold text-uppercase mb-1">Họ và tên</label>
                                        <div className="fw-medium text-dark">{userInfo?.fullName}</div>
                                    </div>
                                    <div className="col-sm-6">
                                        <label className="text-muted small fw-semibold text-uppercase mb-1">Số CMND/CCCD</label>
                                        <div className="fw-medium text-dark">{userInfo?.cmndCccd || 'Chưa cập nhật'}</div>
                                    </div>
                                    <div className="col-sm-6">
                                        <label className="text-muted small fw-semibold text-uppercase mb-1">Số điện thoại</label>
                                        <div className="fw-medium text-dark">{userInfo?.phoneNumber || 'Chưa cập nhật'}</div>
                                    </div>
                                    <div className="col-sm-6">
                                        <label className="text-muted small fw-semibold text-uppercase mb-1">Email</label>
                                        <div className="fw-medium text-dark">{userInfo?.email || 'Chưa cập nhật'}</div>
                                    </div>

                                    <div className="col-12 mt-4 pt-4 border-top">
                                        <h6 className="fw-bold text-dark mb-3"><i className="bi bi-file-earmark-text me-2"></i>Thông tin hợp đồng</h6>
                                        <div className="row bg-light rounded-3 p-3 g-3">
                                            <div className="col-sm-6">
                                                <label className="text-muted small fw-semibold mb-1">Ngày bắt đầu</label>
                                                <div className="fw-bold text-dark">{userInfo?.contractStart || 'N/A'}</div>
                                            </div>
                                            <div className="col-sm-6">
                                                <label className="text-muted small fw-semibold mb-1">Ngày kết thúc</label>
                                                <div className="fw-bold text-danger">{userInfo?.contractEnd || 'N/A'}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {showModal && <div className="modal-backdrop fade show"></div>}
            {showModal && (
                <div className="modal fade show d-block" tabIndex="-1">
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 shadow-lg">
                            <div className="modal-header bg-light">
                                <h5 className="modal-title fw-bold text-dark">Cập nhật thông tin</h5>
                                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
                            </div>
                            <form onSubmit={handleSaveProfile}>
                                <div className="modal-body p-4">
                                    <div className="mb-3">
                                        <label className="form-label fw-semibold">Họ và tên (*)</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={editForm.fullName}
                                            onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                                            required
                                            pattern="^[a-zA-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂưăạảấầẩẫậắằẳẵặẹẻẽềềểỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪễệỉịọỏốồổỗộớờởỡợụủứừỬỮỰỲỴÝỶỸửữựỳỵỷỹ\s]+$"
                                            title="Chỉ được phép nhập chữ cái và khoảng trắng"
                                        />
                                    </div>
                                    <div className="row">
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label fw-semibold">Số điện thoại (*)</label>
                                            <input
                                                type="tel"
                                                className="form-control"
                                                value={editForm.phoneNumber}
                                                onChange={(e) => setEditForm({ ...editForm, phoneNumber: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label fw-semibold">Ngày sinh (*)</label>
                                            <input
                                                type="date"
                                                className="form-control"
                                                value={editForm.birthDay}
                                                max={new Date().toISOString().split("T")[0]}
                                                onChange={(e) => setEditForm({ ...editForm, birthDay: e.target.value })}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label fw-semibold">Email liên hệ (*)</label>
                                        <input
                                            type="email"
                                            className="form-control"
                                            value={editForm.email}
                                            onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                            required
                                        />
                                        <small className="text-muted">Định dạng bắt buộc: @gmail.com</small>
                                    </div>
                                </div>
                                <div className="modal-footer bg-light">
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Hủy bỏ</button>
                                    <button type="submit" className="btn btn-primary px-4" disabled={isSubmitting}>
                                        {isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ResidentProfile;