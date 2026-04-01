import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { notify } from '../utils/notificationAlert';

const TechnicianLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    const handleSwitchToResident = () => {
        // Giả lập việc đổi Role. Thực tế bạn có thể check mảng Roles từ Backend.
        localStorage.setItem('currentRole', 'Resident');
        notify.info("Đã chuyển sang góc nhìn Cư dân");
        navigate('/resident');
    };

    const navItems = [
        { path: '/technician', label: 'Bảng điều khiển', icon: 'bi-speedometer2' },
        { path: '/technician/tasks', label: 'Công việc Bảo trì', icon: 'bi-tools' },
        { path: '/technician/utilities', label: 'Ghi chỉ số Điện Nước', icon: 'bi-droplet-fill' },
    ];

    return (
        <div className="d-flex" style={{ minHeight: '100vh', backgroundColor: '#f4f6f9' }}>
            {/* --- SIDEBAR --- */}
            <div className="bg-dark text-white shadow-lg" style={{ width: '260px', transition: 'all 0.3s' }}>
                <div className="p-4 text-center border-bottom border-secondary">
                    <h4 className="fw-bold text-warning mb-0">
                        <i className="bi bi-gear-fill me-2"></i>KỸ THUẬT VIÊN
                    </h4>
                </div>
                <div className="p-3">
                    <ul className="nav flex-column gap-2">
                        {navItems.map((item) => (
                            <li className="nav-item" key={item.path}>
                                <Link
                                    to={item.path}
                                    className={`nav-link rounded-3 d-flex align-items-center ${location.pathname === item.path ? 'bg-warning text-dark fw-bold' : 'text-white-50 hover-bg-secondary'
                                        }`}
                                    style={{ padding: '12px 20px', transition: 'all 0.2s' }}
                                >
                                    <i className={`${item.icon} me-3 fs-5`}></i>
                                    {item.label}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* --- MAIN CONTENT AREA --- */}
            <div className="flex-grow-1 d-flex flex-column" style={{ minWidth: 0 }}>
                {/* HEADER */}
                <header className="bg-white shadow-sm px-4 py-3 d-flex justify-content-between align-items-center">
                    <h5 className="mb-0 fw-bold text-dark">Hệ thống Quản lý Vận hành</h5>

                    <div className="d-flex align-items-center gap-3">
                        {/* NÚT CHUYỂN ROLE VÀO ĐÂY */}
                        <button
                            className="btn btn-outline-primary btn-sm rounded-pill fw-semibold d-flex align-items-center"
                            onClick={handleSwitchToResident}
                            title="Chuyển sang giao diện nhà của tôi"
                        >
                            <i className="bi bi-arrow-left-right me-2"></i> Đóng vai Cư dân
                        </button>

                        <div className="dropdown">
                            <button className="btn btn-light rounded-circle p-2 shadow-sm" data-bs-toggle="dropdown">
                                <i className="bi bi-person-circle fs-4 text-secondary"></i>
                            </button>
                            <ul className="dropdown-menu dropdown-menu-end shadow border-0 mt-2">
                                <li><button className="dropdown-item text-danger fw-bold" onClick={handleLogout}><i className="bi bi-box-arrow-right me-2"></i> Đăng xuất</button></li>
                            </ul>
                        </div>
                    </div>
                </header>

                {/* PAGE CONTENT (OUTLET) */}
                <main className="p-4 flex-grow-1 overflow-auto">
                    <Outlet />
                </main>
            </div>

            <style>{`
                .hover-bg-secondary:hover { background-color: rgba(255,255,255,0.1); color: #fff !important; }
            `}</style>
        </div>
    );
};

export default TechnicianLayout;