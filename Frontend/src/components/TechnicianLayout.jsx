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
        localStorage.setItem('role', 'Resident'); // Kích hoạt sự kiện storage trong App.jsx
        notify.info("Đã chuyển sang không gian của Cư dân");
    };

    const navItems = [
        { path: '/technician', label: 'Tổng quan công việc', icon: 'bi-grid-1x2-fill', exact: true },
        { path: '/technician/profile', label: 'Thông tin cá nhân', icon: 'bi-person-badge' },
        { path: '/technician/tasks', label: 'Quản lý sự cố', icon: 'bi-tools' },
    ];

    const isActive = (itemPath, exact) => {
        if (exact) return location.pathname === itemPath;
        return location.pathname.startsWith(itemPath) && itemPath !== '/technician';
    };

    return (
        <div className="d-flex" style={{ minHeight: '100vh', backgroundColor: '#f4f7f6' }}>
            {/* === SIDEBAR === */}
            <div className="bg-dark text-white d-flex flex-column shadow" style={{ width: '280px', transition: '0.3s' }}>
                <div className="p-4 d-flex align-items-center justify-content-center border-bottom border-secondary border-opacity-50">
                    <i className="bi bi-gear-wide-connected text-warning fs-2 me-3"></i>
                    <div>
                        <h5 className="fw-bold mb-0 text-white tracking-wide">KỸ THUẬT</h5>
                        <small className="text-warning fw-semibold" style={{ fontSize: '0.75rem', letterSpacing: '1px' }}>SENTANA PORTAL</small>
                    </div>
                </div>

                <div className="p-3 flex-grow-1">
                    <span className="text-uppercase text-muted fw-bold mb-3 d-block ms-2" style={{ fontSize: '0.75rem' }}>Bảng điều khiển</span>
                    <ul className="nav nav-pills flex-column gap-2">
                        {navItems.map((item) => (
                            <li className="nav-item" key={item.path}>
                                <Link
                                    to={item.path}
                                    className={`nav-link d-flex align-items-center fw-medium px-3 py-2 ${isActive(item.path, item.exact)
                                        ? 'active bg-warning text-dark shadow-sm'
                                        : 'text-white-50 hover-bg-light'
                                        }`}
                                    style={{ borderRadius: '8px', transition: 'all 0.2s' }}
                                >
                                    <i className={`${item.icon} fs-5 me-3 ${isActive(item.path, item.exact) ? 'text-dark' : 'text-white-50'}`}></i>
                                    {item.label}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="p-3 border-top border-secondary border-opacity-50">
                    <div className="d-flex align-items-center px-2 py-2 text-white-50">
                        <i className="bi bi-person-badge fs-4 me-3 text-warning"></i>
                        <div>
                            <div className="fw-bold text-white" style={{ fontSize: '0.9rem' }}>Chế độ làm việc</div>
                            <small>Đang trực ca</small>
                        </div>
                    </div>
                </div>
            </div>

            {/* === MAIN CONTENT === */}
            <div className="flex-grow-1 d-flex flex-column" style={{ minWidth: 0 }}>
                {/* HEADER */}
                <header className="bg-white shadow-sm px-4 py-3 d-flex justify-content-between align-items-center sticky-top">
                    <h5 className="mb-0 fw-bold text-dark">
                        {navItems.find(i => isActive(i.path, i.exact))?.label || 'Bảng điều khiển'}
                    </h5>

                    <div className="d-flex align-items-center gap-3">
                        <button
                            className="btn btn-light border-warning text-dark fw-semibold rounded-pill px-4 shadow-sm hover-warning-btn"
                            onClick={handleSwitchToResident}
                        >
                            <i className="bi bi-house-door-fill text-warning me-2"></i> Trở về Căn hộ
                        </button>

                        <div className="dropdown">
                            <button className="btn btn-white border-0 rounded-circle p-1" data-bs-toggle="dropdown">
                                <img src="https://ui-avatars.com/api/?name=Tech&background=ffc107&color=000" alt="Avatar" className="rounded-circle" width="40" height="40" />
                            </button>
                            <ul className="dropdown-menu dropdown-menu-end shadow border-0 mt-2">
                                <li><button className="dropdown-item text-danger fw-bold py-2" onClick={handleLogout}><i className="bi bi-box-arrow-right me-2"></i> Đăng xuất</button></li>
                            </ul>
                        </div>
                    </div>
                </header>

                {/* OUTLET - NƠI HIỂN THỊ CÁC COMPONENT CON */}
                <main className="p-4 flex-grow-1 overflow-auto">
                    <Outlet />
                </main>
            </div>

            <style>{`
                .hover-bg-light:hover { background-color: rgba(255,255,255,0.05); color: #fff !important; }
                .hover-warning-btn:hover { background-color: #ffc107; color: #000 !important; transition: 0.3s; }
                .tracking-wide { letter-spacing: 1.5px; }
            `}</style>
        </div>
    );
};

export default TechnicianLayout;