import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import api from '../utils/axiosConfig';
import styles from '../styles/AdminLayout.module.css';

const AdminLayout = () => {
    const location = useLocation();
    const [isLoggingOut, setIsLoggingOut] = useState(false);


    const handleLogout = async () => {
        if (isLoggingOut) return;
        setIsLoggingOut(true);

        try {

            await api.post('/Auth/Logout');
            console.log("Đã hủy Token Admin ở Backend thành công!");
        } catch (error) {
            console.error("Lỗi khi gọi API Đăng xuất:", error);
        } finally {

            localStorage.removeItem('token');
            localStorage.removeItem('role');


            window.location.href = '/login';
        }
    };

    const navItems = [
        { path: '/admin', label: 'Trang chủ', icon: 'bi-speedometer2 me-2' },
        { path: '/admin/buildings', label: 'Tòa nhà', icon: 'bi-building me-2' },
        { path: '/admin/apartments', label: 'Danh sách phòng', icon: 'bi-door-open me-2' },
        { path: '/admin/residents', label: 'Quản lý Cư dân', icon: 'bi-people-fill me-2' },
        { path: '/admin/technicians', label: 'Kỹ thuật viên', icon: 'bi-person-gear me-2' },
        { path: '/admin/accounts', label: 'Tài khoản hệ thống', icon: 'bi-person-lock me-2' },
        { path: '/admin/services', label: 'Dịch vụ tiện ích', icon: 'bi-tools me-2' },
        { path: '/admin/utilities', label: 'Quản lý Điện Nước', icon: 'bi-lightning-charge-fill text-warning me-2' },
        { path: '/admin/contracts', label: 'Quản lý Hợp đồng', icon: 'bi-file-earmark-text-fill text-success me-2' },
        { path: '/admin/invoices', label: 'Quản lý Hóa đơn', icon: 'bi-receipt text-danger me-2' },
        { path: '/admin/payments', label: 'Xét duyệt Thanh toán', icon: 'bi-wallet2 text-info me-2' },
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

                {/* Gắn sự kiện và hiệu ứng loading cho nút Đăng xuất */}
                <div
                    className={styles.logoutBtn}
                    onClick={handleLogout}
                    style={{
                        cursor: isLoggingOut ? 'not-allowed' : 'pointer',
                        opacity: isLoggingOut ? 0.6 : 1
                    }}
                >
                    <i className="bi bi-box-arrow-left me-3"></i>
                    <span className="fw-bold">{isLoggingOut ? 'Đang thoát...' : 'Đăng xuất'}</span>
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