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
        { path: '/technician/tasks', label: 'Quản lý sự cố', icon: 'bi-tools' },
        { path: '/technician/profile', label: 'Thông tin cá nhân', icon: 'bi-person-badge-fill' },
    ];

    const isActive = (itemPath, exact) => {
        if (exact) return location.pathname === itemPath;
        return location.pathname.startsWith(itemPath) && itemPath !== '/technician';
    };

    // Lấy tên từ LocalStorage để hiển thị trên Header (Nếu có)
    const currentName = localStorage.getItem('fullName') || localStorage.getItem('name') || 'Kỹ thuật viên';

    return (
        <div className="d-flex" style={{ minHeight: '100vh', backgroundColor: '#f4f7f6' }}>
            {/* === SIDEBAR (THANH ĐIỀU HƯỚNG BÊN TRÁI) === */}
            <div className="bg-dark text-white d-flex flex-column shadow" style={{ width: '280px', transition: '0.3s' }}>
                {/* Logo & Tên Portal */}
                <div className="p-4 d-flex align-items-center justify-content-center border-bottom border-secondary border-opacity-50">
                    <i className="bi bi-gear-wide-connected text-warning fs-2 me-3"></i>
                    <div>
                        <h5 className="fw-bold mb-0 text-white tracking-wide">KỸ THUẬT</h5>
                        <small className="text-warning fw-semibold" style={{ fontSize: '0.75rem', letterSpacing: '1px' }}>SENTANA PORTAL</small>
                    </div>
                </div>

                {/* Danh sách Menu */}
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

                {/* Nút Đăng xuất ở cuối Sidebar (Chuẩn Admin) */}
                <div className="p-3 border-top border-secondary border-opacity-50 mt-auto">
                    <button
                        onClick={handleLogout}
                        className="btn w-100 d-flex align-items-center px-3 py-2 text-white-50 hover-bg-light border-0"
                        style={{ borderRadius: '8px', transition: 'all 0.2s' }}
                    >
                        <i className="bi bi-box-arrow-right fs-5 me-3 text-danger"></i>
                        <span className="fw-medium">Đăng xuất hệ thống</span>
                    </button>
                </div>
            </div>

            {/* === MAIN CONTENT (NỘI DUNG CHÍNH) === */}
            <div className="flex-grow-1 d-flex flex-column" style={{ minWidth: 0 }}>
                {/* HEADER */}
                <header className="bg-white shadow-sm px-4 py-3 d-flex justify-content-between align-items-center sticky-top">
                    {/* Tiêu đề trang động */}
                    <h5 className="mb-0 fw-bold text-dark">
                        {navItems.find(i => isActive(i.path, i.exact))?.label || 'Bảng điều khiển'}
                    </h5>

                    {/* Cụm chức năng góc phải */}
                    <div className="d-flex align-items-center gap-3">

                        {/* Trạng thái hoạt động (Đưa từ dưới lên đây) */}
                        <div className="d-flex align-items-center bg-success bg-opacity-10 px-3 py-2 rounded-pill border border-success border-opacity-25 d-none d-md-flex">
                            <span className="spinner-grow spinner-grow-sm text-success me-2" style={{ width: '0.6rem', height: '0.6rem' }} role="status"></span>
                            <span className="text-success fw-bold small mb-0">Đang trực ca</span>
                        </div>

                        {/* Nút Trở về Căn hộ */}
                        <button
                            className="btn btn-light border-warning text-dark fw-semibold rounded-pill px-4 shadow-sm hover-warning-btn d-none d-sm-block"
                            onClick={handleSwitchToResident}
                        >
                            <i className="bi bi-house-door-fill text-warning me-2"></i> Trở về Căn hộ
                        </button>

                        {/* Dropdown Avatar */}
                        <div className="dropdown ms-2">
                            <button className="btn btn-white border-0 rounded-pill p-1 d-flex align-items-center gap-2 shadow-sm" data-bs-toggle="dropdown">
                                <img src={`https://ui-avatars.com/api/?name=${currentName}&background=ffc107&color=000`} alt="Avatar" className="rounded-circle" width="38" height="38" />
                            </button>
                            <ul className="dropdown-menu dropdown-menu-end shadow border-0 mt-2">
                                <li className="px-3 py-2 border-bottom mb-1">
                                    <div className="fw-bold text-dark">{currentName}</div>
                                    <small className="text-muted">Kỹ thuật viên</small>
                                </li>
                                <li>
                                    <Link className="dropdown-item py-2 fw-medium" to="/technician/profile">
                                        <i className="bi bi-person-badge me-2 text-warning"></i> Hồ sơ của tôi
                                    </Link>
                                </li>
                                <li><hr className="dropdown-divider" /></li>
                                <li>
                                    <button className="dropdown-item text-danger fw-bold py-2" onClick={handleLogout}>
                                        <i className="bi bi-box-arrow-right me-2"></i> Đăng xuất
                                    </button>
                                </li>
                            </ul>
                        </div>
                    </div>
                </header>

                {/* OUTLET - NƠI HIỂN THỊ CÁC COMPONENT CON */}
                <main className="p-4 flex-grow-1 overflow-auto">
                    <Outlet />
                </main>
            </div>

            {/* CSS Tùy chỉnh */}
            <style>{`
                .hover-bg-light:hover { background-color: rgba(255,255,255,0.05); color: #fff !important; }
                .hover-warning-btn:hover { background-color: #ffc107; color: #000 !important; transition: 0.3s; }
                .tracking-wide { letter-spacing: 1.5px; }
            `}</style>
        </div>
    );
};

export default TechnicianLayout;