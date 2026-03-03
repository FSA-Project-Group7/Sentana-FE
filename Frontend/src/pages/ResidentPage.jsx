import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import News from '../components/News';
const ResidentPage = () => {
    const navigate = useNavigate();
    
    const [activeMenu, setActiveMenu] = useState('dashboard');

    const handleLogout = () => {
        
        navigate('/login');
    };

    const navyColor = '#122240';

    return (
        <div className="d-flex" style={{ height: '100vh', backgroundColor: '#f5f7fa' }}>
            <div
                className="text-white d-flex flex-column shadow"
                style={{ width: '280px', backgroundColor: navyColor }}
            >
                <div className="p-4 text-center border-bottom border-secondary">
                    <h3 className="fw-bold mb-0">SENTANA</h3>
                    <small className="text-light">Cổng thông tin Cư dân</small>
                </div>

                <div className="d-flex flex-column p-3 gap-2 flex-grow-1 overflow-auto">
                    <button className={`btn text-start text-white border-0 ${activeMenu === 'dashboard' ? 'bg-primary' : ''}`} onClick={() => setActiveMenu('dashboard')}>
                        🏠 Trang chủ (Tổng quan)
                    </button>
                    <button className="btn text-start text-white border-0" onClick={() => setActiveMenu('profile')}>
                        👤 Thông tin cá nhân
                    </button>
                    <button className="btn text-start text-white border-0" onClick={() => setActiveMenu('room')}>
                        🔑 Thông tin phòng & Hợp đồng
                    </button>
                    <button className="btn text-start text-white border-0" onClick={() => setActiveMenu('invoice')}>
                        💰 Hóa đơn & Thanh toán
                    </button>

                    <button className="btn text-start text-white border-0" onClick={() => setActiveMenu('maintenance')}>
                        🛠️ Yêu cầu sửa chữa
                    </button>
                </div>

                <div className="p-3 border-top border-secondary">
                    <button onClick={handleLogout} className="btn btn-outline-light w-100 fw-bold">
                        Đăng xuất
                    </button>
                </div>
            </div>
            <div className="flex-grow-1 d-flex flex-column" style={{ overflowY: 'auto' }}>

                <div className="bg-white shadow-sm p-3 d-flex justify-content-between align-items-center sticky-top">
                    <h5 className="mb-0 fw-bold" style={{ color: navyColor }}>Xin chào, Nguyễn Văn A (Phòng 12A05)</h5>
                    <div className="d-flex gap-3 align-items-center">
                        <button className="btn btn-light position-relative rounded-circle">
                            🔔
                            <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                                2
                            </span>
                        </button>
                        <div className="bg-secondary rounded-circle" style={{ width: '40px', height: '40px' }}></div>
                    </div>
                </div>

                <div className="p-4">

                    <div className="row mb-4">
                        <div className="col-md-4">
                            <div className="card shadow-sm border-0" style={{ borderRadius: '10px', borderLeft: '5px solid #dc3545' }}>
                                <div className="card-body">
                                    <h6 className="text-muted">Hóa đơn kỳ này (Chưa thanh toán)</h6>
                                    <h3 className="fw-bold text-danger">1,250,000 VNĐ</h3>
                                    <button className="btn btn-sm btn-outline-danger mt-2">Thanh toán ngay (Upload Bill)</button>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-4">
                            <div className="card shadow-sm border-0" style={{ borderRadius: '10px', borderLeft: '5px solid #ffc107' }}>
                                <div className="card-body">
                                    <h6 className="text-muted">Yêu cầu sửa chữa (Đang xử lý)</h6>
                                    <h3 className="fw-bold text-warning">1 sự cố</h3>
                                    <button className="btn btn-sm btn-outline-warning mt-2">Theo dõi tiến độ</button>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-4">
                            <div className="card shadow-sm border-0" style={{ borderRadius: '10px', borderLeft: '5px solid #198754' }}>
                                <div className="card-body">
                                    <h6 className="text-muted">Tình trạng phòng</h6>
                                    <h3 className="fw-bold text-success">Đang hiệu lực</h3>
                                    <small className="text-muted">2 người ở chung | HĐ còn 6 tháng</small>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-4 shadow-sm" style={{ borderRadius: '10px' }}>
                        <h4 className="fw-bold mb-4" style={{ color: navyColor, borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
                            BẢN TIN BAN QUẢN LÝ
                        </h4>
                        <News />
                    </div>

                </div>
            </div>

        </div>
    );
};

export default ResidentPage;