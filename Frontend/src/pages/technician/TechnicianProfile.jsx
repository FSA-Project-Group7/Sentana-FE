import React, { useState, useEffect } from 'react';
import api from '../../utils/axiosConfig';

const TechnicianProfile = () => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                // 1. Vét sạch dữ liệu từ LocalStorage (bao quát mọi cách lưu của tính năng Login)
                let localUser = {};
                const userObjStr = localStorage.getItem('user') || localStorage.getItem('userInfo');
                if (userObjStr) {
                    try { localUser = JSON.parse(userObjStr); } catch (e) { console.warn("Lỗi parse user JSON"); }
                }

                const currentId = localUser.accountId || localUser.id || localStorage.getItem('accountId') || localStorage.getItem('userId');

                let apiData = {};
                // 2. Thử gọi API Backend nếu có (Bắt theo chuẩn API RESTful)
                if (currentId) {
                    try {
                        const res = await api.get(`/Accounts/${currentId}`);
                        apiData = res.data?.data || res.data;
                    } catch (err) {
                        try { // Fallback thử endpoint Technicians
                            const techRes = await api.get(`/Technicians/${currentId}`);
                            apiData = techRes.data?.data || techRes.data;
                        } catch (e) { }
                    }
                }

                // 3. Mapping dữ liệu: Kết hợp giữa API trả về và LocalStorage
                const finalProfile = {
                    fullName: apiData.fullName || apiData.name || localUser.fullName || localUser.userName || localStorage.getItem('fullName') || localStorage.getItem('name') || "Chưa có dữ liệu",
                    email: apiData.email || localUser.email || localStorage.getItem('email') || "Chưa có dữ liệu",
                    accountId: apiData.accountId || apiData.id || localUser.accountId || localUser.id || currentId || "N/A",
                    phoneNumber: apiData.phoneNumber || apiData.phone || localUser.phoneNumber || localUser.phone || localStorage.getItem('phoneNumber') || "Chưa cập nhật",
                    specialization: apiData.specialization || localUser.specialization || "Kỹ thuật bảo trì tòa nhà",
                    avatar: apiData.avatar || apiData.avatarUrl || localUser.avatar,
                    joinDate: apiData.joinDate || apiData.createDate || apiData.createdAt || localUser.createDate
                };

                setProfile(finalProfile);

            } catch (error) {
                console.error("Lỗi khi load profile:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const formatDate = (dateString) => {
        if (!dateString) return "Chưa có thông tin";
        return new Date(dateString).toLocaleDateString('vi-VN');
    };

    if (loading) return <div className="text-center p-5"><div className="spinner-border text-warning"></div></div>;

    return (
        <div className="container-fluid p-0">
            <h4 className="fw-bold text-dark mb-4">Thông tin cá nhân</h4>

            <div className="row">
                <div className="col-12 col-xl-10">
                    <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
                        <div className="card-header bg-white border-0 pt-4 px-4">
                            <h5 className="fw-bold text-dark mb-0"><i className="bi bi-person-badge-fill text-warning me-2"></i> Hồ sơ Kỹ thuật viên</h5>
                        </div>
                        <div className="card-body p-4 p-md-5">
                            <div className="row align-items-center">
                                {/* Avatar */}
                                <div className="col-md-auto text-center mb-4 mb-md-0">
                                    <div className="position-relative d-inline-block">
                                        <img
                                            src={profile?.avatar || `https://ui-avatars.com/api/?name=${profile?.fullName}&background=ffc107&color=fff&size=150`}
                                            alt="Avatar"
                                            className="rounded-circle border border-4 border-white shadow-sm"
                                            style={{ width: '150px', height: '150px', objectFit: 'cover' }}
                                        />
                                        <span className="position-absolute bottom-0 end-0 bg-success border border-2 border-white rounded-circle p-2" title="Đang trực tuyến"></span>
                                    </div>
                                </div>

                                {/* Thông tin chi tiết */}
                                <div className="col-md ps-md-5">
                                    <div className="row g-4">
                                        <div className="col-sm-6">
                                            <label className="text-muted small fw-bold text-uppercase d-block mb-1">Họ và Tên</label>
                                            <div className="fw-bold fs-5 text-dark">{profile?.fullName}</div>
                                        </div>
                                        <div className="col-sm-6">
                                            <label className="text-muted small fw-bold text-uppercase d-block mb-1">Mã nhân sự</label>
                                            <div className="fw-bold fs-5 text-dark text-warning">#{profile?.accountId}</div>
                                        </div>
                                        <div className="col-sm-6">
                                            <label className="text-muted small fw-bold text-uppercase d-block mb-1">Chuyên môn</label>
                                            <div className="badge bg-warning bg-opacity-10 text-warning px-3 py-2 rounded-pill fw-bold">
                                                {profile?.specialization}
                                            </div>
                                        </div>
                                        <div className="col-sm-6">
                                            <label className="text-muted small fw-bold text-uppercase d-block mb-1">Số điện thoại</label>
                                            <div className="fw-semibold text-dark">{profile?.phoneNumber}</div>
                                        </div>
                                        <div className="col-sm-6">
                                            <label className="text-muted small fw-bold text-uppercase d-block mb-1">Email nội bộ</label>
                                            <div className="fw-semibold text-dark">{profile?.email}</div>
                                        </div>
                                        <div className="col-sm-6">
                                            <label className="text-muted small fw-bold text-uppercase d-block mb-1">Ngày tham gia hệ thống</label>
                                            <div className="fw-semibold text-dark">{formatDate(profile?.joinDate)}</div>
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