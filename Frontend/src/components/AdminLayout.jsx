import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import api from '../utils/axiosConfig';
import styles from '../styles/AdminLayout.module.css';
import { useSignalR } from '../hooks/useSignalR';
import { notify } from '../utils/notificationAlert';

const AdminLayout = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);

    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    const connection = useSignalR();

    // Tải danh sách thông báo và xử lý phân trang
    const fetchNotifications = async (pageNumber = 1) => {
        try {
            if (pageNumber > 1) setIsLoadingMore(true);

            const res = await api.get(`/notifications/my-notifications?pageIndex=${pageNumber}&pageSize=10`);
            const newItems = res.data?.items || res.data?.data || [];
            const totalUnread = res.data?.unreadCount || 0;

            setNotifications(prev => pageNumber === 1 ? newItems : [...prev, ...newItems]);
            if (pageNumber === 1) setUnreadCount(totalUnread);
            setHasMore(newItems.length === 10);

        } catch (error) {
            console.error("Lỗi tải thông báo:", error);
        } finally {
            setIsLoadingMore(false);
        }
    };

    useEffect(() => {
        fetchNotifications(1);
    }, []);

    // Xử lý sự kiện xem thêm thông báo
    const handleLoadMore = (e) => {
        e.stopPropagation();
        const nextPage = page + 1;
        setPage(nextPage);
        fetchNotifications(nextPage);
    };

    // Lắng nghe SignalR và hiển thị Pop-up thông báo toàn cục
    useEffect(() => {
        if (!connection) return;

        const handleRealtimeNotif = (data, title, message) => {
            notify.info(`${title}: ${message}`);

            const newNotif = {
                notificationId: data.notificationId || Date.now(),
                title: title,
                message: message,
                isRead: false,
                createdAt: "Vừa xong"
            };
            setNotifications(prev => [newNotif, ...prev]);
            setUnreadCount(prev => prev + 1);
        };

        const handleNewReq = (data) => handleRealtimeNotif(data, "Yêu cầu mới", `P.${data.apartmentCode || data.apartmentName} báo sự cố: ${data.title}`);
        const handleProcessing = (data) => handleRealtimeNotif(data, "Đang xử lý", `Thợ đã tiếp nhận sửa chữa tại P.${data.apartmentCode || data.apartmentName}`);
        const handleFixedReq = (data) => handleRealtimeNotif(data, "Chờ nghiệm thu", `Sự cố tại P.${data.apartmentCode || data.apartmentName} đã được thợ sửa xong`);
        const handleClosedReq = (data) => handleRealtimeNotif(data, "Hoàn thành", `Cư dân P.${data.apartmentCode || data.apartmentName} đã nghiệm thu thành công`);
        const handleRejectedReq = (data) => handleRealtimeNotif(data, "Yêu cầu làm lại", `Cư dân P.${data.apartmentCode || data.apartmentName} chưa nghiệm thu sự cố '${data.title}' và yêu cầu thợ xử lý lại.`);

        connection.on("ReceiveNewMaintenanceRequest", handleNewReq);
        connection.on("TaskProcessing", handleProcessing);
        connection.on("ReceiveFixedTask", handleFixedReq);
        connection.on("TaskClosed", handleClosedReq);
        connection.on("TaskRejectedByManager", handleRejectedReq);

        return () => {
            connection.off("ReceiveNewMaintenanceRequest", handleNewReq);
            connection.off("TaskProcessing", handleProcessing);
            connection.off("ReceiveFixedTask", handleFixedReq);
            connection.off("TaskClosed", handleClosedReq);
            connection.off("TaskRejectedByManager", handleRejectedReq);
        };
    }, [connection]);

    // Trả về Icon và Link điều hướng dựa trên tiêu đề thông báo
    const getNotificationMeta = (title) => {
        const t = String(title).toLowerCase();
        if (t.includes('mới')) return { icon: 'bi-exclamation-circle-fill', color: 'danger', link: '/admin/maintenance' };
        if (t.includes('xử lý')) return { icon: 'bi-tools', color: 'primary', link: '/admin/maintenance' };
        if (t.includes('nghiệm thu')) return { icon: 'bi-card-checklist', color: 'info', link: '/admin/maintenance' };
        if (t.includes('hoàn thành')) return { icon: 'bi-check-circle-fill', color: 'success', link: '/admin/maintenance' };
        return { icon: 'bi-bell-fill', color: 'secondary', link: '/admin' };
    };

    // Đánh dấu 1 thông báo đã đọc và chuyển hướng
    const handleReadNotification = async (notif) => {
        if (!notif.isRead && notif.notificationId) {
            try {
                setNotifications(prev => prev.map(n => n.notificationId === notif.notificationId ? { ...n, isRead: true } : n));
                setUnreadCount(prev => Math.max(0, prev - 1));
                await api.put(`/notifications/${notif.notificationId}/read`);
            } catch (error) {
                console.error("Lỗi mark as read:", error);
            }
        }
        navigate(getNotificationMeta(notif.title).link);
    };

    // Đánh dấu tất cả thông báo hiện có là đã đọc
    const handleMarkAllRead = async (e) => {
        e.stopPropagation();
        const unreadNotifs = notifications.filter(n => !n.isRead);

        if (unreadNotifs.length === 0) return;

        try {
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
            await Promise.all(unreadNotifs.map(n => api.put(`/notifications/${n.notificationId}/read`)));
        } catch (error) {
            console.error("Lỗi mark all as read:", error);
        }
    };

    // Xử lý đăng xuất
    const handleLogout = async () => {
        if (isLoggingOut) return;
        setIsLoggingOut(true);
        try {
            await api.post('/Auth/Logout');
        } catch (error) {
            console.error("Lỗi:", error);
        } finally {
            localStorage.removeItem('token');
            localStorage.removeItem('role');
            setShowLogoutModal(false);
            setIsLoggingOut(false);
            navigate('/login');
        }
    };

    const navItems = [
        { path: '/admin', label: 'Trang chủ', icon: 'bi-speedometer2 me-2' },
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
            {/* Sidebar */}
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
                                <i className={`bi ${item.icon}`}></i><span>{item.label}</span>
                            </Link>
                        ))}
                    </nav>
                </div>
                <div className={`${styles.logoutBtn} mt-auto`} onClick={() => setShowLogoutModal(true)} style={{ cursor: isLoggingOut ? 'not-allowed' : 'pointer', opacity: isLoggingOut ? 0.6 : 1, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                    <i className="bi bi-box-arrow-left me-3"></i>
                    <span className="fw-bold">{isLoggingOut ? 'Đang thoát...' : 'Đăng xuất'}</span>
                </div>
            </aside>

            {/* Main Content */}
            <div className={styles.mainContent} style={{ marginLeft: sidebarWidth, width: `calc(100% - ${sidebarWidth})`, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
                <header className={`${styles.topbar} sticky-top shadow-sm`} style={{ zIndex: 1030 }}>
                    <div className="d-flex align-items-center">
                        <button className="btn btn-sm text-secondary border-0 me-3"><i className="bi bi-list fs-4"></i></button>
                        <div className="fw-bold text-muted text-uppercase small d-none d-md-block">Hệ thống quản lý tòa nhà v1.0</div>
                    </div>

                    <div className="d-flex align-items-center gap-3">
                        {/* QUẢ CHUÔNG THÔNG BÁO */}
                        <div className="dropdown">
                            <button className="btn btn-light position-relative p-2 rounded-circle shadow-sm border" data-bs-toggle="dropdown">
                                <i className="bi bi-bell-fill text-primary fs-5 px-1"></i>
                                {unreadCount > 0 && (
                                    <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger border border-white">
                                        {unreadCount > 99 ? '99+' : unreadCount}
                                    </span>
                                )}
                            </button>

                            <ul className="dropdown-menu dropdown-menu-end shadow-lg border-0 p-0 rounded-4 overflow-hidden" style={{ width: '360px' }}>
                                <li className="p-3 bg-white border-bottom d-flex justify-content-between align-items-center">
                                    <span className="fw-bold text-dark fs-6">Thông báo</span>
                                    <button
                                        className="btn btn-link btn-sm text-primary text-decoration-none fw-medium p-0"
                                        onClick={handleMarkAllRead}
                                        disabled={unreadCount === 0}
                                    >
                                        Đánh dấu tất cả đã đọc
                                    </button>
                                </li>

                                <div style={{ maxHeight: '420px', overflowY: 'auto' }} className="custom-scrollbar">
                                    {notifications.length === 0 ? (
                                        <div className="p-5 text-center text-muted small">
                                            <i className="bi bi-bell-slash display-6 d-block mb-2 opacity-25"></i>
                                            Chưa có thông báo nào
                                        </div>
                                    ) : (
                                        notifications.map(notif => {
                                            const meta = getNotificationMeta(notif.title);
                                            return (
                                                <li key={notif.notificationId} className="dropdown-item p-0 border-bottom">
                                                    <div
                                                        className={`p-3 d-flex gap-3 hover-bg-light transition-all ${!notif.isRead ? 'bg-primary bg-opacity-10' : 'bg-white'}`}
                                                        style={{ cursor: 'pointer' }}
                                                        onClick={() => handleReadNotification(notif)}
                                                    >
                                                        <div className={`text-${meta.color} fs-3 mt-1 d-flex flex-column align-items-center`}>
                                                            <i className={meta.icon}></i>
                                                            {!notif.isRead && <span className="p-1 bg-primary rounded-circle mt-2"></span>}
                                                        </div>
                                                        <div className="flex-grow-1 text-wrap">
                                                            <div className={`small ${!notif.isRead ? 'fw-bold text-dark' : 'fw-medium text-secondary'}`}>
                                                                {notif.title}
                                                            </div>
                                                            <div className={`mt-1 mb-2 ${!notif.isRead ? 'text-dark' : 'text-muted'}`} style={{ fontSize: '13px', lineHeight: '1.4' }}>
                                                                {notif.message}
                                                            </div>
                                                            <div className="text-secondary" style={{ fontSize: '11px' }}>
                                                                <i className="bi bi-clock me-1"></i>{notif.createdAt}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </li>
                                            );
                                        })
                                    )}
                                </div>
                                {/* NÚT XEM THÊM NẰM Ở ĐÁY DROPDOWN */}
                                {notifications.length > 0 && hasMore && (
                                    <li className="p-0 border-top text-center bg-light rounded-bottom-4">
                                        <button
                                            className="btn btn-link w-100 text-decoration-none fw-bold text-primary py-2"
                                            onClick={handleLoadMore}
                                            disabled={isLoadingMore}
                                        >
                                            {isLoadingMore ? (
                                                <><span className="spinner-border spinner-border-sm me-2"></span>Đang tải...</>
                                            ) : (
                                                "Xem thêm thông báo"
                                            )}
                                        </button>
                                    </li>
                                )}

                                {/* Thông báo khi đã cuộn hết dữ liệu */}
                                {notifications.length > 0 && !hasMore && (
                                    <li className="p-2 border-top text-center bg-light rounded-bottom-4">
                                        <span className="small text-muted">Đã hiển thị tất cả thông báo</span>
                                    </li>
                                )}
                            </ul>
                        </div>

                        {/* ADMIN PROFILE */}
                        <div className="text-end d-none d-md-block ms-2 border-start ps-3">
                            <div className="small fw-bold text-dark">{localStorage.getItem('fullName') || 'Admin Sentana'}</div>
                            <div className="text-success small" style={{ fontSize: '11px' }}>● Đang hoạt động</div>
                        </div>
                        <div className="rounded-circle bg-dark text-white d-flex align-items-center justify-content-center fw-bold shadow-sm" style={{ width: '40px', height: '40px', border: '2px solid #00c292' }}>
                            S
                        </div>
                    </div>
                </header>

                <main className={`${styles.contentBody} flex-grow-1`}>
                    <div className="fade-in-animation h-100">
                        <Outlet />
                    </div>
                </main>
            </div>

            {/* MODAL LOGOUT */}
            {showLogoutModal && <div className="modal-backdrop fade show"></div>}
            {showLogoutModal && (
                <div className="modal fade show d-block" tabIndex="-1" style={{ zIndex: 1050 }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 shadow-lg rounded-4">
                            <div className="modal-header bg-danger bg-opacity-10 border-0 rounded-top-4 p-4">
                                <h5 className="modal-title fw-bold text-danger d-flex align-items-center gap-2"><i className="bi bi-exclamation-triangle-fill fs-4"></i> Xác nhận đăng xuất</h5>
                                <button type="button" className="btn-close" onClick={() => setShowLogoutModal(false)} disabled={isLoggingOut}></button>
                            </div>
                            <div className="modal-body p-4 text-center">
                                <p className="mb-2 text-dark fw-medium fs-5">Bạn có chắc chắn muốn đăng xuất khỏi hệ thống?</p>
                            </div>
                            <div className="modal-footer bg-light border-0 d-flex justify-content-center gap-3 p-4 rounded-bottom-4">
                                <button type="button" className="btn btn-light border px-4 rounded-pill fw-bold" onClick={() => setShowLogoutModal(false)} disabled={isLoggingOut}>Hủy bỏ</button>
                                <button type="button" className="btn btn-danger px-5 rounded-pill fw-bold shadow-sm" onClick={handleLogout} disabled={isLoggingOut}>
                                    {isLoggingOut ? <><span className="spinner-border spinner-border-sm me-2"></span> Đang thoát...</> : "Đăng xuất"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #dee2e6; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #adb5bd; }
                .hover-bg-light:hover { background-color: #f8f9fa !important; }
                .transition-all { transition: all 0.2s ease-in-out; }
            `}</style>
        </div>
    );
};

export default AdminLayout;