import React, { useState, useEffect } from 'react';
import api from '../../utils/axiosConfig';

const TechnicianProfile = () => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                // 1. TÌM ID BẰNG MỌI GIÁ (Giải mã thẳng JWT Token nếu cần)
                let currentId = localStorage.getItem('accountId') || localStorage.getItem('userId') || localStorage.getItem('id');

                if (!currentId) {
                    const token = localStorage.getItem('token');
                    if (token) {
                        try {
                            // Cắt chuỗi token để lấy phần Payload (Khúc giữa)
                            const payload = JSON.parse(atob(token.split('.')[1]));
                            // C# JWT thường lưu ID ở các claim này:
                            currentId = payload.AccountId || payload.accountId || payload.nameid || payload.id || payload.sub;
                        } catch (e) {
                            console.warn("Lỗi giải mã token");
                        }
                    }
                }

                // 2. GỌI API
                let apiData = {};
                if (currentId) {
                    try {
                        const res = await api.get(`/Technicians/${currentId}`);
                        apiData = res.data?.data || res.data || {};
                    } catch (err) {
                        console.error("🔴 Lỗi API Profile:", err.response?.data || err.message);
                    }
                }

                // 3. MAPPING DỮ LIỆU (Bao quát cả PascalCase của C# và camelCase của JS)
                setProfile({
                    accountId: apiData.accountId || apiData.AccountId || currentId || "N/A",
                    code: apiData.code || apiData.Code || "Chưa cập nhật",
                    userName: apiData.userName || apiData.UserName || "N/A",
                    fullName: apiData.fullName || apiData.FullName || localStorage.getItem('fullName') || "Chưa cập nhật",
                    email: apiData.email || apiData.Email || "Chưa cập nhật",
                    phoneNumber: apiData.phoneNumber || apiData.PhoneNumber || "Chưa cập nhật",
                    identityCard: apiData.identityCard || apiData.IdentityCard || "Chưa cập nhật",
                    address: apiData.address || apiData.Address || "Chưa cập nhật",
                    city: apiData.city || apiData.City || "",
                    country: apiData.country || apiData.Country || "",
                    birthDay: apiData.birthDay || apiData.BirthDay,
                    sex: apiData.sex !== undefined ? apiData.sex : apiData.Sex,
                    techAvailability: apiData.techAvailability !== undefined ? apiData.techAvailability : apiData.TechAvailability
                });

            } catch (error) {
                console.error("Lỗi hệ thống khi load profile:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const formatDate = (dateString) => {
        if (!dateString) return "Chưa cập nhật";
        return new Date(dateString).toLocaleDateString('vi-VN');
    };

    const getGenderLabel = (sexEnum) => {
        if (sexEnum === 0 || sexEnum === 'Male') return "Nam";
        if (sexEnum === 1 || sexEnum === 'Female') return "Nữ";
        if (sexEnum === 2 || sexEnum === 'Other') return "Khác";
        return "Chưa cập nhật";
    };

    const getAvailabilityLabel = (status) => {
        if (status === 1 || status === 'Free') return <span className="badge bg-success">Đang rảnh</span>;
        if (status === 0 || status === 'Busy') return <span className="badge bg-warning text-dark">Đang bận (Xử lý sự cố)</span>;
        return <span className="badge bg-primary">Sẵn sàng</span>;
    };

    if (loading) return <div className="text-center p-5"><div className="spinner-border text-warning"></div></div>;

    return (
        <div className="container-fluid p-0">
            <h4 className="fw-bold text-dark mb-4">Thông tin cá nhân</h4>

            <div className="row">
                <div className="col-12 col-xl-10">
                    <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
                        <div className="card-header bg-white border-0 pt-4 px-4 d-flex justify-content-between align-items-center">
                            <h5 className="fw-bold text-dark mb-0"><i className="bi bi-person-badge-fill text-warning me-2"></i> Hồ sơ Kỹ thuật viên</h5>
                            {getAvailabilityLabel(profile?.techAvailability)}
                        </div>
                        <div className="card-body p-4 p-md-5">
                            <div className="row align-items-center">
                                <div className="col-md-auto text-center mb-4 mb-md-0">
                                    <div className="position-relative d-inline-block">
                                        <img
                                            src={`https://ui-avatars.com/api/?name=${profile?.fullName || 'T'}&background=ffc107&color=000&size=150`}
                                            alt="Avatar"
                                            className="rounded-circle border border-4 border-white shadow-sm"
                                            style={{ width: '150px', height: '150px', objectFit: 'cover' }}
                                        />
                                    </div>
                                </div>

                                <div className="col-md ps-md-5">
                                    <div className="row g-4">
                                        <div className="col-sm-6">
                                            <label className="text-muted small fw-bold text-uppercase d-block mb-1">Họ và Tên</label>
                                            <div className="fw-bold fs-5 text-dark">{profile?.fullName}</div>
                                        </div>
                                        <div className="col-sm-6">
                                            <label className="text-muted small fw-bold text-uppercase d-block mb-1">Mã nhân sự (Code)</label>
                                            <div className="fw-bold fs-5 text-warning">{profile?.code}</div>
                                        </div>
                                        <div className="col-sm-6">
                                            <label className="text-muted small fw-bold text-uppercase d-block mb-1">Tên đăng nhập</label>
                                            <div className="fw-semibold text-dark">{profile?.userName}</div>
                                        </div>
                                        <div className="col-sm-6">
                                            <label className="text-muted small fw-bold text-uppercase d-block mb-1">CCCD / CMND</label>
                                            <div className="fw-semibold text-dark">{profile?.identityCard}</div>
                                        </div>
                                        <div className="col-sm-6">
                                            <label className="text-muted small fw-bold text-uppercase d-block mb-1">Ngày sinh</label>
                                            <div className="fw-semibold text-dark">{formatDate(profile?.birthDay)}</div>
                                        </div>
                                        <div className="col-sm-6">
                                            <label className="text-muted small fw-bold text-uppercase d-block mb-1">Giới tính</label>
                                            <div className="fw-semibold text-dark">{getGenderLabel(profile?.sex)}</div>
                                        </div>
                                        <div className="col-sm-6">
                                            <label className="text-muted small fw-bold text-uppercase d-block mb-1">Số điện thoại</label>
                                            <div className="fw-semibold text-dark">{profile?.phoneNumber}</div>
                                        </div>
                                        <div className="col-sm-6">
                                            <label className="text-muted small fw-bold text-uppercase d-block mb-1">Email liên hệ</label>
                                            <div className="fw-semibold text-dark">{profile?.email}</div>
                                        </div>
                                        <div className="col-12">
                                            <label className="text-muted small fw-bold text-uppercase d-block mb-1">Địa chỉ thường trú</label>
                                            <div className="fw-semibold text-dark">
                                                {profile?.address !== "Chưa cập nhật" ? `${profile?.address}, ${profile?.city}, ${profile?.country}` : "Chưa cập nhật"}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TechnicianProfile;