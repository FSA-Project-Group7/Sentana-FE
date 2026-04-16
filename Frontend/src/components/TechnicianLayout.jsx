import React, { useEffect, useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { notify } from '../utils/notificationAlert';
import api from '../utils/axiosConfig';
import { useSignalR } from '../hooks/useSignalR';

const TechnicianLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    // States Thông báo
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    const connection = useSignalR();

    // Kiểm tra đổi mật khẩu lần đầu
    useEffect(() => {
        const checkFirstLogin = localStorage.getItem('requiresPasswordChange');
        if (checkFirstLogin === 'true' || checkFirstLogin === true) {
            notify.warning("Bạn cần thiết lập mật khẩu trong lần đầu đăng nhập!");
            navigate('/first-login-setup');
        }
    }, [navigate]);

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

        const handleAssigned = (data) => handleRealtimeNotif(data, "Việc mới", `Bạn vừa được giao sửa chữa tại P.${data.apartmentCode || data.apartmentName}`);
        const handleRejected = (data) => handleRealtimeNotif(data, "Yêu cầu làm lại", `Sự cố tại P.${data.apartmentCode || data.apartmentName} chưa đạt, cần xử lý lại.`);
        const handleClosed = (data) => handleRealtimeNotif(data, "Đã nghiệm thu", `Sự cố tại P.${data.apartmentCode || data.apartmentName} đã được đóng thành công.`);

        connection.on("ReceiveAssignedTask", handleAssigned);
        connection.on("TaskRejectedByManager", handleRejected);
        connection.on("TaskClosed", handleClosed);

        return () => {
            connection.off("ReceiveAssignedTask", handleAssigned);
            connection.off("TaskRejectedByManager", handleRejected);
            connection.off("TaskClosed", handleClosed);
        };
    }, [connection]);

    const getNotificationMeta = (title) => {
        const t = String(title).toLowerCase();
        if (t.includes('mới')) return { icon: 'bi-exclamation-circle-fill', color: 'danger', link: '/technician/tasks' };
        if (t.includes('làm lại')) return { icon: 'bi-arrow-repeat', color: 'warning', link: '/technician/tasks' };
        if (t.includes('nghiệm thu')) return { icon: 'bi-check-circle-fill', color: 'success', link: '/technician/tasks' };
        return { icon: 'bi-bell-fill', color: 'secondary', link: '/technician/tasks' };
    };

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

    const handleLogout = async () => {
        if (isLoggingOut) return;
        setIsLoggingOut(true);
        try {
            await api.post('/Auth/Logout');
        } catch (error) {
            console.error("Lỗi khi gọi API Đăng xuất:", error);
        } finally {
            localStorage.clear();
            setShowLogoutModal(false);
            setIsLoggingOut(false);
            navigate('/login');
        }
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

    const currentName = localStorage.getItem('fullName') || localStorage.getItem('name') || 'Kỹ thuật viên';

    return (
        <div className="d-flex vh-100 overflow-hidden" style={{ backgroundColor: '#f4f7f6' }}>
            {/* SIDEBAR */}
            <div className="bg-dark text-white d-flex flex-column shadow h-100 flex-shrink-0" style={{ width: '280px', transition: '0.3s', zIndex: 1040 }}>
                <div className="p-4 d-flex align-items-center justify-content-center border-bottom border-secondary border-opacity-50">
                    <i className="bi bi-gear-wide-connected text-warning fs-2 me-3"></i>
                    <div>
                        <h5 className="fw-bold mb-0 text-white tracking-wide">KỸ THUẬT</h5>
                        <small className="text-warning fw-semibold" style={{ fontSize: '0.75rem', letterSpacing: '1px' }}>SENTANA PORTAL</small>
                    </div>
                </div>

                <div className="p-3 flex-grow-1 overflow-y-auto">
                    <span className="text-uppercase text-muted fw-bold mb-3 d-block ms-2" style={{ fontSize: '0.75rem' }}>Bảng điều khiển</span>
                    <ul className="nav nav-pills flex-column gap-2">
                        {navItems.map((item) => (
                            <li className="nav-item" key={item.path}>
                                <Link
                                    to={item.path}
                                    className={`nav-link d-flex align-items-center fw-medium px-3 py-2 ${isActive(item.path, item.exact) ? 'active bg-warning text-dark shadow-sm' : 'text-white-50 hover-bg-light'}`}
                                    style={{ borderRadius: '8px', transition: 'all 0.2s' }}
                                >
                                    <i className={`${item.icon} fs-5 me-3 ${isActive(item.path, item.exact) ? 'text-dark' : 'text-white-50'}`}></i>
                                    {item.label}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="p-3 border-top border-secondary border-opacity-50 mt-auto">
                    <button
                        onClick={() => setShowLogoutModal(true)}
                        className="btn w-100 d-flex align-items-center px-3 py-2 text-white-50 hover-bg-light border-0"
                        style={{ borderRadius: '8px', transition: 'all 0.2s' }}
                    >
                        <i className="bi bi-box-arrow-right fs-5 me-3 text-danger"></i>
                        <span className="fw-medium">Đăng xuất hệ thống</span>
                    </button>
                </div>
            </div>

            {/* MAIN CONTENT */}
            <div className="flex-grow-1 d-flex flex-column h-100 bg-light" style={{ minWidth: 0 }}>
                <header className="bg-white shadow-sm px-4 py-3 d-flex justify-content-between align-items-center" style={{ zIndex: 1030 }}>
                    <h5 className="mb-0 fw-bold text-dark">
                        {navItems.find(i => isActive(i.path, i.exact))?.label || 'Bảng điều khiển'}
                    </h5>

                    <div className="d-flex align-items-center gap-3">
                        <div className="d-flex align-items-center bg-success bg-opacity-10 px-3 py-2 rounded-pill border border-success border-opacity-25 d-none d-md-flex">
                            <span className="spinner-grow spinner-grow-sm text-success me-2" style={{ width: '0.6rem', height: '0.6rem' }} role="status"></span>
                            <span className="text-success fw-bold small mb-0">Đang trực ca</span>
                        </div>

                        {/* QUẢ CHUÔNG THÔNG BÁO */}
                        <div className="dropdown">
                            <button className="btn btn-light position-relative p-2 rounded-circle shadow-sm border d-flex align-items-center justify-content-center" data-bs-toggle="dropdown" style={{ width: '40px', height: '40px' }}>
                                <i className="bi bi-bell-fill text-warning fs-5"></i>
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
                                                        className={`p-3 d-flex gap-3 hover-bg-light transition-all ${!notif.isRead ? 'bg-warning bg-opacity-10' : 'bg-white'}`}
                                                        style={{ cursor: 'pointer' }}
                                                        onClick={() => handleReadNotification(notif)}
                                                    >
                                                        <div className={`text-${meta.color} fs-3 mt-1 d-flex flex-column align-items-center`}>
                                                            <i className={meta.icon}></i>
                                                            {!notif.isRead && <span className="p-1 bg-warning rounded-circle mt-2"></span>}
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
                                {notifications.length > 0 && hasMore && (
                                    <li className="p-0 border-top text-center bg-light rounded-bottom-4">
                                        <button
                                            className="btn btn-link w-100 text-decoration-none fw-bold text-warning py-2"
                                            onClick={handleLoadMore}
                                            disabled={isLoadingMore}
                                        >
                                            {isLoadingMore ? <><span className="spinner-border spinner-border-sm me-2"></span>Đang tải...</> : "Xem thêm thông báo"}
                                        </button>
                                    </li>
                                )}
                                {notifications.length > 0 && !hasMore && (
                                    <li className="p-2 border-top text-center bg-light rounded-bottom-4">
                                        <span className="small text-muted">Đã hiển thị tất cả thông báo</span>
                                    </li>
                                )}
                            </ul>
                        </div>

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
                                    <button className="dropdown-item text-danger fw-bold py-2" onClick={() => setShowLogoutModal(true)}>
                                        <i className="bi bi-box-arrow-right me-2"></i> Đăng xuất
                                    </button>
                                </li>
                            </ul>
                        </div>
                    </div>
                </header>

                <main className="p-4 flex-grow-1 overflow-auto">
                    <Outlet />
                </main>
            </div>

            <style>{`
                .hover-bg-light:hover { background-color: rgba(255,255,255,0.05); color: #fff !important; }
                .tracking-wide { letter-spacing: 1.5px; }
                main::-webkit-scrollbar { width: 8px; }
                main::-webkit-scrollbar-track { background: #f1f1f1; }
                main::-webkit-scrollbar-thumb { background: #c1c1c1; border-radius: 4px; }
                main::-webkit-scrollbar-thumb:hover { background: #a8a8a8; }
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #dee2e6; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #adb5bd; }
            `}</style>

            {showLogoutModal && <div className="modal-backdrop fade show"></div>}
            {showLogoutModal && (
                <div className="modal fade show d-block" tabIndex="-1" style={{ zIndex: 1050 }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 shadow-lg">
                            <div className="modal-header bg-danger bg-opacity-10 border-0">
                                <h5 className="modal-title fw-bold text-danger d-flex align-items-center gap-2">
                                    <i className="bi bi-exclamation-circle-fill"></i> Xác nhận đăng xuất
                                </h5>
                                <button type="button" className="btn-close" onClick={() => !isLoggingOut && setShowLogoutModal(false)} disabled={isLoggingOut}></button>
                            </div>
                            <div className="modal-body p-4 text-center">
                                <p className="mb-2 text-dark fw-medium">Bạn có chắc chắn muốn đăng xuất khỏi hệ thống?</p>
                                <small className="text-muted">Bạn sẽ cần đăng nhập lại để truy cập các tính năng của ứng dụng.</small>
                            </div>
                            <div className="modal-footer bg-light border-0 d-flex justify-content-center gap-2">
                                <button type="button" className="btn btn-secondary px-4" onClick={() => !isLoggingOut && setShowLogoutModal(false)} disabled={isLoggingOut}>Hủy bỏ</button>
                                <button type="button" className="btn btn-danger px-4" onClick={handleLogout} disabled={isLoggingOut}>
                                    {isLoggingOut ? <><span className="spinner-border spinner-border-sm me-2"></span> Đang thoát...</> : <><i className="bi bi-box-arrow-right me-2"></i> Đăng xuất</>}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TechnicianLayout;