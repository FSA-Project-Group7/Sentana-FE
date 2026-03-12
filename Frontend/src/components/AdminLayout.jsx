import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import styles from '../styles/AdminLayout.module.css';

const AdminLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    const navItems = [
        { path: '/admin', label: 'Trang chủ', icon: 'bi-speedometer2' },
        { path: '/admin/buildings', label: 'Tòa nhà', icon: 'bi-building' },
        { path: '/admin/apartments', label: 'Danh sách phòng', icon: 'bi-door-open' },
        { path: '/admin/residents', label: 'Quản lý Cư dân', icon: 'bi-people-fill' },
        { path: '/admin/accounts', label: 'Tài khoản hệ thống', icon: 'bi-person-lock' },
        { path: '/admin/technicians', label: 'Kỹ thuật viên', icon: 'bi-person-gear' },
        { path: '/admin/services', label: 'Dịch vụ tiện ích', icon: 'bi-tools' },
        { path: '/admin/utilities', label: 'Quản lý Điện Nước', icon: 'bi-lightning-charge-fill text-warning' },
    ];

    return (
        <div className={styles.adminContainer}>
            {/* Sidebar nhất quán màu Sentana */}
            <aside className={styles.sidebar}>
                <div className={styles.sidebarHeader}>
                    <h4 className={styles.logoText}>SENTANA</h4>
                    <small style={{ color: '#00c292', fontSize: '10px' }}>MANAGEMENT SYSTEM</small>
                </div>

                <div className={styles.sidebarMenu}>
                    <div className={styles.menuLabel}>Chức năng chính</div>
                    <nav>
                        {navItems.map((item) => (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`${styles.navLink} ${location.pathname === item.path ? styles.activeLink : ''
                                    }`}
                            >
                                <i className={`bi ${item.icon}`}></i>
                                <span>{item.label}</span>
                            </Link>
                        ))}
                    </nav>
                </div>

                <div className={styles.logoutBtn} onClick={handleLogout}>
                    <i className="bi bi-box-arrow-left me-3"></i>
                    <span className="fw-bold">Đăng xuất</span>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className={styles.mainContent}>
                {/* Topbar trắng sạch sẽ */}
                <header className={styles.topbar}>
                    <div className="d-flex align-items-center">
                        <button className="btn btn-sm text-secondary border-0 me-3">
                            <i className="bi bi-list fs-4"></i>
                        </button>
                        <nav aria-label="breadcrumb">
                            <ol className="breadcrumb mb-0">
                                <li className="breadcrumb-item active small" aria-current="page">
                                    Hệ thống quản lý tòa nhà v1.0
                                </li>
                            </ol>
                        </nav>
                    </div>

                    <div className="d-flex align-items-center gap-3">
                        <div className="text-end d-none d-md-block">
                            <div className="small fw-bold text-dark">Admin Sentana</div>
                            <div className="text-success small" style={{ fontSize: '11px' }}>● Đang hoạt động</div>
                        </div>
                        <div
                            className="rounded-circle bg-dark text-white d-flex align-items-center justify-content-center fw-bold shadow-sm"
                            style={{ width: '40px', height: '40px', border: '2px solid #00c292' }}
                        >
                            S
                        </div>
                    </div>
                </header>

                {/* Content Render Area */}
                <main className={styles.contentBody}>
                    <div className="fade-in-animation">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;