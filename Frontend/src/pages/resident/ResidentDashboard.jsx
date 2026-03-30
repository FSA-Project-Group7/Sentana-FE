import React, { useState, useEffect } from 'react';
import api from '../../utils/axiosConfig';
import { notify } from '../../utils/notificationAlert';

const ResidentDashboard = () => {
    const [roomInfo, setRoomInfo] = useState(null);
    const [loading, setLoading] = useState(true);

    // --- FETCH THÔNG TIN PHÒNG TỪ API ---
    useEffect(() => {
        const fetchMyRoom = async () => {
            try {
                // Gọi API lấy thông tin phòng của user đang đăng nhập
                const res = await api.get('/Residents/MyRoom');
                const data = res.data?.data || res.data;
                setRoomInfo(data);
            } catch (error) {
                console.error("Lỗi tải thông tin phòng:", error);
                notify.error("Không thể tải thông tin căn hộ của bạn.");
            } finally {
                setLoading(false);
            }
        };

        fetchMyRoom();
    }, []);

    // Helper format tiền tệ
    const formatCurrency = (amount) => {
        if (amount === undefined || amount === null) return '0 đ';
        return amount.toLocaleString('vi-VN') + ' đ';
    };

    if (loading) {
        return (
            <div className="container-fluid d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
                <div className="spinner-border text-primary" style={{ width: '3rem', height: '3rem' }}></div>
            </div>
        );
    }

    if (!roomInfo) {
        return (
            <div className="container-fluid py-4">
                <div className="card border-0 shadow-sm rounded-4 text-center p-5">
                    <i className="bi bi-house-x display-1 text-muted opacity-25 mb-3"></i>
                    <h4 className="text-muted fw-bold">Chưa có dữ liệu căn hộ</h4>
                    <p className="text-secondary">Tài khoản của bạn hiện chưa được gán vào căn hộ nào. Vui lòng liên hệ Ban Quản Lý để được hỗ trợ.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container-fluid py-4">
            {/* LỜI CHÀO MỪNG */}
            <div className="d-flex align-items-center mb-4 p-4 bg-primary bg-opacity-10 rounded-4 shadow-sm border border-primary-subtle">
                <div className="bg-primary text-white rounded-circle d-flex justify-content-center align-items-center me-4 shadow" style={{ width: '60px', height: '60px' }}>
                    <i className="bi bi-person-fill fs-2"></i>
                </div>
                <div>
                    <h3 className="fw-bold text-primary mb-1">Xin chào Cư dân!</h3>
                    <p className="text-secondary mb-0">Chào mừng bạn về nhà. Dưới đây là thông tin tổng quan về căn hộ của bạn.</p>
                </div>
            </div>

            <div className="row g-4">
                {/* --- CỘT TRÁI: THÔNG TIN CĂN HỘ --- */}
                <div className="col-lg-5">
                    <div className="card border-0 shadow-sm rounded-4 h-100">
                        <div className="card-header bg-white border-bottom py-3">
                            <h5 className="fw-bold mb-0 text-dark"><i className="bi bi-info-square-fill text-primary me-2"></i>Thông Tin Căn Hộ</h5>
                        </div>
                        <div className="card-body p-4">
                            <div className="text-center mb-4">
                                <div className="display-4 fw-bold text-primary mb-2">{roomInfo.apartmentCode}</div>
                                <span className="badge bg-success px-3 py-2 fs-6 rounded-pill">Đang cư trú</span>
                            </div>

                            <ul className="list-group list-group-flush">
                                <li className="list-group-item d-flex justify-content-between align-items-center px-0 py-3">
                                    <span className="text-muted"><i className="bi bi-building me-2"></i>Tòa nhà</span>
                                    <span className="fw-bold text-dark">{roomInfo.buildingName || 'N/A'}</span>
                                </li>
                                <li className="list-group-item d-flex justify-content-between align-items-center px-0 py-3">
                                    <span className="text-muted"><i className="bi bi-layers me-2"></i>Tầng</span>
                                    <span className="fw-bold text-dark">Tầng {roomInfo.floor || 'N/A'}</span>
                                </li>
                                <li className="list-group-item d-flex justify-content-between align-items-center px-0 py-3">
                                    <span className="text-muted"><i className="bi bi-rulers me-2"></i>Diện tích</span>
                                    <span className="fw-bold text-dark">{roomInfo.area || 0} m²</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* --- CỘT PHẢI: DỊCH VỤ & THÀNH VIÊN --- */}
                <div className="col-lg-7">
                    <div className="row g-4 h-100">

                        {/* DANH SÁCH THÀNH VIÊN (ROOMMATES) */}
                        <div className="col-12">
                            <div className="card border-0 shadow-sm rounded-4">
                                <div className="card-header bg-white border-bottom py-3 d-flex justify-content-between align-items-center">
                                    <h5 className="fw-bold mb-0 text-dark"><i className="bi bi-people-fill text-warning me-2"></i>Thành Viên Trong Phòng</h5>
                                    <span className="badge bg-warning text-dark rounded-pill">{roomInfo.roommates?.length || 0} người</span>
                                </div>
                                <div className="card-body p-0">
                                    {roomInfo.roommates && roomInfo.roommates.length > 0 ? (
                                        <ul className="list-group list-group-flush">
                                            {roomInfo.roommates.map((member, index) => (
                                                <li key={index} className="list-group-item d-flex justify-content-between align-items-center p-3 hover-bg-light">
                                                    <div className="d-flex align-items-center">
                                                        <div className="bg-secondary bg-opacity-10 text-secondary rounded-circle d-flex justify-content-center align-items-center me-3" style={{ width: '40px', height: '40px' }}>
                                                            <i className="bi bi-person"></i>
                                                        </div>
                                                        <div>
                                                            <div className="fw-bold text-dark">{member.fullName}</div>
                                                            <div className="small text-muted">{member.phoneNumber || 'Chưa cập nhật SĐT'}</div>
                                                        </div>
                                                    </div>
                                                    {member.isOwner ? (
                                                        <span className="badge bg-danger bg-opacity-10 text-danger border border-danger-subtle px-3 py-1 rounded-pill">Chủ hộ</span>
                                                    ) : (
                                                        <span className="badge bg-info bg-opacity-10 text-info border border-info-subtle px-3 py-1 rounded-pill">Thành viên</span>
                                                    )}
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <div className="p-4 text-center text-muted small">Chưa có thông tin thành viên.</div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* DANH SÁCH DỊCH VỤ ĐANG SỬ DỤNG */}
                        <div className="col-12">
                            <div className="card border-0 shadow-sm rounded-4">
                                <div className="card-header bg-white border-bottom py-3 d-flex justify-content-between align-items-center">
                                    <h5 className="fw-bold mb-0 text-dark"><i className="bi bi-box-seam-fill text-success me-2"></i>Dịch Vụ Đang Đăng Ký</h5>
                                </div>
                                <div className="card-body p-0">
                                    {roomInfo.services && roomInfo.services.length > 0 ? (
                                        <div className="table-responsive">
                                            <table className="table table-hover align-middle mb-0">
                                                <thead className="table-light small text-muted text-uppercase">
                                                    <tr>
                                                        <th className="ps-4 py-3">Tên dịch vụ</th>
                                                        <th className="text-end pe-4 py-3">Đơn giá / Tháng</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {roomInfo.services.map((svc, index) => (
                                                        <tr key={index}>
                                                            <td className="ps-4 py-3 fw-semibold text-dark">
                                                                <i className="bi bi-check-circle-fill text-success me-2 small"></i>
                                                                {svc.serviceName}
                                                            </td>
                                                            <td className="text-end pe-4 py-3 fw-bold text-danger">
                                                                {formatCurrency(svc.price || svc.serviceFee)}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <div className="p-4 text-center text-muted small">Căn hộ chưa đăng ký dịch vụ nào ngoài các dịch vụ mặc định.</div>
                                    )}
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            {/* Thêm chút CSS cho hiệu ứng hover nhẹ nhàng */}
            <style>{`
                .hover-bg-light:hover {
                    background-color: #f8f9fa !important;
                    transition: background-color 0.2s ease-in-out;
                }
            `}</style>
        </div>
    );
};

export default ResidentDashboard;