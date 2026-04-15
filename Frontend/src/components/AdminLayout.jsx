import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import api from '../utils/axiosConfig';
import styles from '../styles/AdminLayout.module.css';

const AdminLayout = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);

    const handleLogout = async () => {
        if (isLoggingOut) return;
        setIsLoggingOut(true);

        try {
            await api.post('/Auth/Logout');
        } catch (error) {
            console.error("Lỗi khi gọi API Đăng xuất:", error);
        } finally {
            localStorage.removeItem('token');
            localStorage.removeItem('role');
            setShowLogoutModal(false);
            setIsLoggingOut(false);
            navigate('/login');
        }
    };

    const handleOpenLogoutModal = () => setShowLogoutModal(true);
    const handleCloseLogoutModal = () => {
        if (!isLoggingOut) setShowLogoutModal(false);
    };

    const navItems = [
        { path: '/admin', label: 'Trang chủ', icon: 'bi-speedometer2 me-2' },
        // ĐÃ THÊM: Mục Thông tin cá nhân
        { path: '/admin/profile', label: 'Thông tin cá nhân', icon: 'bi-person-lines-fill me-2' },
        { path: '/admin/buildings', label: 'Tòa nhà', icon: 'bi-building me-2' },
        { path: '/admin/apartments', label: 'Quản lý Căn hộ', icon: 'bi-door-open me-2' },
        { path: '/admin/residents', label: 'Quản lý Cư dân', icon: 'bi-people-fill me-2' },
        { path: '/admin/technicians', label: 'Kỹ thuật viên', icon: 'bi-person-gear me-2' },
        { path: '/admin/accounts', label: 'Tài khoản hệ thống', icon: 'bi-person-lock me-2' },
        { path: '/admin/services', label: 'Dịch vụ tiện ích', icon: 'bi-tools me-2' },
        { path: '/admin/maintenance', label: 'Yêu cầu Bảo trì', icon: 'bi-tools text-primary me-2' },
        { path: '/admin/utilities', label: 'Quản lý Điện Nước', icon: 'bi-lightning-charge-fill text-warning me-2' },
        { path: '/admin/contracts', label: 'Quản lý Hợp đồng', icon: 'bi-file-earmark-text-fill text-success me-2' },
        { path: '/admin/invoices', label: 'Quản lý Hóa đơn', icon: 'bi-receipt text-danger me-2' },
        { path: '/admin/payments', label: 'Xét duyệt Thanh toán', icon: 'bi-wallet2 text-info me-2' },
    ];

    const sidebarWidth = '260px';

    return (
        <div className={`${styles.adminContainer} d-flex`}>
            <aside className={`${styles.sidebar} position-fixed top-0 start-0 bottom-0 d-flex flex-column shadow`} style={{ width: sidebarWidth, zIndex: 1040 }}>
                <div className={styles.sidebarHeader}>
                    <h4 className={styles.logoText}>SENTANA</h4>
                    <small style={{ color: '#00c292', fontSize: '10px' }}>MANAGEMENT SYSTEM</small>
                </div>

                <div className={`${styles.sidebarMenu} flex-grow-1 overflow-y-auto overflow-x-hidden`} style={{ scrollbarWidth: 'thin' }}>
                    <div className={styles.menuLabel}>Chức năng chính</div>
                    <nav>
                        {navItems.map((item) => (
                            <Link key={item.path} to={item.path} className={`${styles.navLink} ${location.pathname === item.path ? styles.activeLink : ''}`}>
                                <i className={`bi ${item.icon}`}></i>
                                <span>{item.label}</span>
                            </Link>
                        ))}
                    </nav>
                </div>

                <div className={`${styles.logoutBtn} mt-auto`} onClick={handleOpenLogoutModal} style={{ cursor: isLoggingOut ? 'not-allowed' : 'pointer', opacity: isLoggingOut ? 0.6 : 1, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                    <i className="bi bi-box-arrow-left me-3"></i>
                    <span className="fw-bold">{isLoggingOut ? 'Đang thoát...' : 'Đăng xuất'}</span>
                </div>
            </aside>

            <div className={styles.mainContent} style={{ marginLeft: sidebarWidth, width: `calc(100% - ${sidebarWidth})`, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
                <header className={`${styles.topbar} sticky-top shadow-sm`} style={{ zIndex: 1030 }}>
                    <div className="d-flex align-items-center">
                        <button className="btn btn-sm text-secondary border-0 me-3"><i className="bi bi-list fs-4"></i></button>
                        <nav aria-label="breadcrumb">
                            <ol className="breadcrumb mb-0">
                                <li className="breadcrumb-item active small" aria-current="page">Hệ thống quản lý tòa nhà v1.0</li>
                            </ol>
                        </nav>
                    </div>

                    <div className="d-flex align-items-center gap-3">
                        <div className="text-end d-none d-md-block">
                            <div className="small fw-bold text-dark">Admin Sentana</div>
                            <div className="text-success small" style={{ fontSize: '11px' }}>● Đang hoạt động</div>
                        </div>
                        <div className="rounded-circle bg-dark text-white d-flex align-items-center justify-content-center fw-bold shadow-sm" style={{ width: '40px', height: '40px', border: '2px solid #00c292' }}>
                            A
                        </div>
                    </div>
                </header>

                <main className={`${styles.contentBody} flex-grow-1`}>
                    <div className="fade-in-animation">
                        <Outlet />
                    </div>
                </main>
            </div>

            {showLogoutModal && <div className="modal-backdrop fade show"></div>}
            {showLogoutModal && (
                <div className="modal fade show d-block" tabIndex="-1" style={{ zIndex: 1050 }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 shadow-lg">
                            <div className="modal-header bg-danger bg-opacity-10 border-0">
                                <h5 className="modal-title fw-bold text-danger d-flex align-items-center gap-2">
                                    <i className="bi bi-exclamation-circle-fill"></i> Xác nhận đăng xuất
                                </h5>
                                <button type="button" className="btn-close" onClick={handleCloseLogoutModal} disabled={isLoggingOut}></button>
                            </div>
                            <div className="modal-body p-4 text-center">
                                <p className="mb-2 text-dark fw-medium">Bạn có chắc chắn muốn đăng xuất khỏi hệ thống?</p>
                                <small className="text-muted">Bạn sẽ cần đăng nhập lại để truy cập các tính năng của ứng dụng.</small>
                            </div>
                            <div className="modal-footer bg-light border-0 d-flex justify-content-center gap-2">
                                <button type="button" className="btn btn-secondary px-4" onClick={handleCloseLogoutModal} disabled={isLoggingOut}>Hủy bỏ</button>
                                <button type="button" className="btn btn-danger px-4" onClick={handleLogout} disabled={isLoggingOut}>
                                    {isLoggingOut ? <><span className="spinner-border spinner-border-sm me-2"></span> Đang thoát...</> : <><i className="bi bi-box-arrow-left me-2"></i> Đăng xuất</>}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminLayout;