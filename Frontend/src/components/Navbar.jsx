import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import logoImg from '../assets/logo.png';
import api from '../utils/axiosConfig';

// Nhận prop isResident (mặc định là false)
const Navbar = ({ isResident = false }) => {
    const navigate = useNavigate();
    const location = useLocation();

    const [isVisible, setIsVisible] = useState(true);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [fullName, setFullName] = useState('');

    // Modal Logout States
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    // ==========================================
    // NOTIFICATION STATES
    // ==========================================
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0); // Dùng state riêng cho unreadCount từ Backend
    const [showNotifDropdown, setShowNotifDropdown] = useState(false);
    const [selectedNotif, setSelectedNotif] = useState(null);
    const notifDropdownRef = useRef(null);

    useEffect(() => {
        // --- LOGIC SCROLL ---
        const handleScroll = () => {
            if (window.scrollY < 80) {
                setIsVisible(true);
            } else {
                setIsVisible(false);
            }
        };
        window.addEventListener('scroll', handleScroll);

        const token = localStorage.getItem('token');
        if (token) {
            setIsLoggedIn(true);
            try {
                const base64Url = token.split('.')[1];
                const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
                    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                }).join(''));

                const payload = JSON.parse(jsonPayload);
                const nameFromToken = payload.unique_name || payload.name || payload.sub || 'bạn';
                setFullName(nameFromToken);

            } catch (error) {
                console.error("Lỗi giải mã Token:", error);
                setFullName('bạn');
            }
        }

        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // ==========================================
    // FETCH NOTIFICATIONS CHO RESIDENT
    // ==========================================
    useEffect(() => {
        const fetchNotifications = async () => {
            if (isResident && isLoggedIn) {
                try {
                    const res = await api.get('/notifications/my-notifications');

                    // FIX LỖI Ở ĐÂY: Quét tìm 'items' (cấu trúc BE mới) hoặc 'data' (BE cũ), nếu null thì mảng rỗng []
                    const fetchedList = res.data?.items || res.data?.data || [];
                    const totalUnread = res.data?.unreadCount || fetchedList.filter(n => !n.isRead).length;

                    setNotifications(fetchedList);
                    setUnreadCount(totalUnread);

                } catch (error) {
                    console.error("Lỗi lấy thông báo:", error);
                }
            }
        };
        fetchNotifications();
    }, [isResident, isLoggedIn]);

    // Đóng Dropdown khi click ra ngoài (Click Outside Logic)
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (notifDropdownRef.current && !notifDropdownRef.current.contains(event.target)) {
                setShowNotifDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // ==========================================
    // XỬ LÝ MARK AS READ KHI CLICK VÀO THÔNG BÁO
    // ==========================================
    const handleReadNotification = async (notif) => {
        // Mở popup chi tiết và đóng dropdown
        setSelectedNotif(notif);
        setShowNotifDropdown(false);

        // Nếu đã đọc rồi thì không gọi API nữa
        if (notif.isRead) return;

        try {
            await api.put(`/notifications/${notif.notificationId}/read`);

            // Cập nhật lại UI ngay lập tức
            setNotifications(prevNotifs =>
                prevNotifs.map(n =>
                    n.notificationId === notif.notificationId
                        ? { ...n, isRead: true }
                        : n
                )
            );
            setUnreadCount(prev => Math.max(0, prev - 1));

        } catch (error) {
            console.error("Lỗi cập nhật trạng thái đã đọc:", error);
        }
    };

    const handleMarkAllAsRead = async (e) => {
        e.stopPropagation();
        const unreadNotifs = notifications.filter(n => !n.isRead);
        if (unreadNotifs.length === 0) return;

        try {
            // Đổi UI ngay lập tức cho mượt
            setNotifications(prevNotifs => prevNotifs.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);

            // Bắn một loạt API ngầm
            await Promise.all(
                unreadNotifs.map(notif => api.put(`/notifications/${notif.notificationId}/read`))
            );
        } catch (error) {
            console.error("Lỗi đánh dấu tất cả đã đọc:", error);
        }
    };

    // ==========================================
    // LOGOUT LOGIC
    // ==========================================
    const handleLogout = async () => {
        if (isLoggingOut) return;
        setIsLoggingOut(true);

        try {
            console.log("Gọi API logout...");
            await api.post('/Auth/Logout');
            console.log("Đã logout khỏi Backend thành công!");
        } catch (error) {
            console.error("Lỗi khi gọi API Đăng xuất:", error);
        } finally {
            localStorage.removeItem('token');
            localStorage.removeItem('role');
            localStorage.removeItem('refreshToken');

            setShowLogoutModal(false);
            setIsLoggingOut(false);
            navigate('/login');
        }
    };

    const handleOpenLogoutModal = () => setShowLogoutModal(true);
    const handleCloseLogoutModal = () => {
        if (!isLoggingOut) setShowLogoutModal(false);
    };

    const isActive = (path) => location.pathname === path ? 'fw-bold border-bottom border-2 border-white' : '';

    // Tránh lỗi undefined khi render HTML
    const safeNotifications = notifications || [];

    return (
        <>
            <nav
                className="navbar navbar-expand-lg navbar-dark fixed-top"
                style={{
                    backgroundColor: 'rgba(33, 37, 41, 0.95)',
                    transition: 'transform 0.3s ease-in-out',
                    transform: isVisible ? 'translateY(0)' : 'translateY(-100%)',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
                }}
            >
                <div className="container">
                    <Link className="navbar-brand d-flex align-items-center gap-2" to={isResident ? "/resident" : "#home"}>
                        <img
                            src={logoImg}
                            alt="Sentana Logo"
                            width="38"
                            height="38"
                            className="d-inline-block align-text-top rounded-circle bg-white p-1"
                            style={{ objectFit: 'contain' }}
                        />
                        <span className="fw-semibold fs-5 tracking-tight text-white">Sentana</span>
                    </Link>

                    <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                        <span className="navbar-toggler-icon"></span>
                    </button>

                    <div className="collapse navbar-collapse" id="navbarNav">
                        <ul className="navbar-nav mx-auto gap-4">
                            {isResident ? (
                                <>
                                    <li className="nav-item"><Link className={`nav-link ${isActive('/resident')}`} to="/resident">Tổng quan</Link></li>
                                    <li className="nav-item"><Link className={`nav-link ${isActive('/resident/profile')}`} to="/resident/profile">Thông tin cá nhân</Link></li>
                                    <li className="nav-item"><Link className={`nav-link ${isActive('/resident/my-contract')}`} to="/resident/my-contract">Hợp đồng</Link></li>
                                    <li className="nav-item"><Link className={`nav-link ${isActive('/resident/dashboard')}`} to="/resident/dashboard">Hóa đơn</Link></li>
                                    <li className="nav-item"><Link className={`nav-link ${isActive('/resident/maintenance')}`} to="/resident/maintenance">Báo cáo sự cố</Link></li>
                                </>
                            ) : (
                                <>
                                    <li className="nav-item"><a className="nav-link fw-normal" href="#home">Trang chủ</a></li>
                                    <li className="nav-item"><a className="nav-link fw-normal" href="#about">Giới thiệu</a></li>
                                    <li className="nav-item"><a className="nav-link fw-normal" href="#facilities">Tiện ích</a></li>
                                    <li className="nav-item"><a className="nav-link fw-normal" href="#rooms">Các loại phòng</a></li>
                                    <li className="nav-item"><a className="nav-link fw-normal" href="#contact">Liên hệ</a></li>
                                </>
                            )}
                        </ul>

                        {/* VÙNG CHỨA CHUÔNG THÔNG BÁO VÀ NÚT LOGOUT */}
                        <div className="d-flex align-items-center gap-3">

                            {/* CHUÔNG THÔNG BÁO (CHỈ HIỆN VỚI RESIDENT) */}
                            {isResident && isLoggedIn && (
                                <div className="position-relative" ref={notifDropdownRef}>
                                    <button
                                        className="btn btn-link text-white p-1 position-relative shadow-none text-decoration-none"
                                        onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                                        style={{ opacity: showNotifDropdown ? 1 : 0.8, transition: 'opacity 0.2s' }}
                                        onMouseOver={e => e.currentTarget.style.opacity = 1}
                                        onMouseOut={e => { if (!showNotifDropdown) e.currentTarget.style.opacity = 0.8 }}
                                    >
                                        <i className="bi bi-bell-fill fs-5"></i>
                                        {/* Badge báo số lượng chưa đọc */}
                                        {unreadCount > 0 && (
                                            <span
                                                className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger border border-dark"
                                                style={{ fontSize: '0.65rem', padding: '0.25em 0.4em', transform: 'translate(-30%, 10%)' }}
                                            >
                                                {unreadCount > 99 ? '99+' : unreadCount}
                                            </span>
                                        )}
                                    </button>

                                    {/* BẢNG DROPDOWN THÔNG BÁO */}
                                    {showNotifDropdown && (
                                        <div
                                            className="dropdown-menu dropdown-menu-end show shadow-lg border-0 rounded-3 mt-3 p-0 overflow-hidden"
                                            style={{ position: 'absolute', right: 0, width: '350px', animation: 'fadeIn 0.2s ease-out' }}
                                        >
                                            <div className="bg-light border-bottom px-3 py-2 d-flex justify-content-between align-items-center">
                                                <h6 className="mb-0 fw-bold text-dark">Thông báo của bạn</h6>
                                                <div className="d-flex align-items-center gap-2">
                                                    {unreadCount > 0 && (
                                                        <button
                                                            className="btn btn-link text-decoration-none p-0 text-primary small"
                                                            style={{ fontSize: '0.8rem' }}
                                                            onClick={handleMarkAllAsRead}
                                                        >
                                                            <i className="bi bi-check2-all me-1"></i>Đánh dấu đã đọc
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="custom-notif-scroll" style={{ maxHeight: '380px', overflowY: 'auto' }}>
                                                {safeNotifications.length === 0 ? (
                                                    <div className="text-center p-4 text-muted small">
                                                        <i className="bi bi-bell-slash fs-3 d-block mb-2 opacity-50"></i>
                                                        Bạn chưa có thông báo nào.
                                                    </div>
                                                ) : (
                                                    safeNotifications.map(notif => (
                                                        <div
                                                            key={notif.notificationId}
                                                            className={`dropdown-item border-bottom p-3 text-wrap ${!notif.isRead ? 'bg-primary bg-opacity-10' : 'bg-white'}`}
                                                            style={{ cursor: 'pointer', transition: 'background-color 0.2s' }}
                                                            onClick={() => handleReadNotification(notif)}
                                                            onMouseOver={e => e.currentTarget.classList.add('bg-light')}
                                                            onMouseOut={e => e.currentTarget.classList.remove('bg-light')}
                                                        >
                                                            <div className="d-flex justify-content-between align-items-start mb-1">
                                                                <strong className={`mb-0 ${!notif.isRead ? 'text-primary' : 'text-dark'}`} style={{ fontSize: '0.9rem', lineHeight: '1.2' }}>
                                                                    {notif.title}
                                                                </strong>
                                                                {/* Chấm tròn xanh (Indicator) cho tin chưa đọc */}
                                                                {!notif.isRead && <span className="badge bg-primary rounded-circle p-1 ms-2 mt-1" style={{ width: '8px', height: '8px' }}></span>}
                                                            </div>
                                                            <p className="mb-1 text-muted" style={{ fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                                                                {notif.message}
                                                            </p>
                                                            <small className="text-muted opacity-75" style={{ fontSize: '0.75rem' }}>
                                                                <i className="bi bi-clock me-1"></i>{notif.createdAt}
                                                            </small>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* NÚT LOGIN / LOGOUT */}
                            {isResident ? (
                                <button onClick={handleOpenLogoutModal} className="btn btn-outline-light btn-sm fw-normal px-3 rounded-pill">
                                    Đăng xuất
                                </button>
                            ) : isLoggedIn ? (
                                <Link to="/login"
                                    className="nav-link d-flex align-items-center gap-1 text-decoration-none px-3 py-1 rounded"
                                    style={{
                                        fontSize: '0.95rem',
                                        fontWeight: 400,
                                        color: 'rgba(255, 255, 255, 0.85)',
                                        backgroundColor: 'transparent',
                                        transition: 'all 0.2s ease-out',
                                    }}
                                    onMouseOver={(e) => {
                                        e.currentTarget.style.color = '#fff';
                                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                                    }}
                                    onMouseOut={(e) => {
                                        e.currentTarget.style.color = 'rgba(255, 255, 255, 0.85)';
                                        e.currentTarget.style.backgroundColor = 'transparent';
                                    }}
                                >
                                    <span style={{ opacity: '0.6' }}>Xin chào,</span>
                                    <span className="fw-medium text-white">{fullName}</span>
                                    <i className="bi bi-chevron-right ms-1 small" style={{ opacity: '0.4' }}></i>
                                </Link>
                            ) : (
                                <Link to="/login" className="btn btn-outline-light btn-sm fw-normal px-3 rounded-2">
                                    Đăng nhập
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            {/* MODAL PORTAL LOGOUT */}
            {showLogoutModal && ReactDOM.createPortal(
                <>
                    <div className="modal-backdrop fade show" style={{ zIndex: 1040, position: 'fixed' }}></div>
                    <div className="modal fade show d-block" tabIndex="-1" style={{ zIndex: 1050, position: 'fixed' }}>
                        <div className="modal-dialog modal-dialog-centered">
                            <div className="modal-content border-0 shadow-lg">
                                <div className="modal-header bg-danger bg-opacity-10 border-0">
                                    <h5 className="modal-title fw-bold text-danger d-flex align-items-center gap-2">
                                        <i className="bi bi-exclamation-circle-fill"></i>
                                        Xác nhận đăng xuất
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
                                        {isLoggingOut ? <><span className="spinner-border spinner-border-sm me-2"></span> Đang thoát...</> : <><i className="bi bi-box-arrow-right me-2"></i> Đăng xuất</>}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </>,
                document.body
            )}

            {/* MODAL CHI TIẾT THÔNG BÁO */}
            {selectedNotif && ReactDOM.createPortal(
                <>
                    <div className="modal-backdrop fade show" style={{ zIndex: 1040, position: 'fixed' }}></div>
                    <div className="modal fade show d-block" tabIndex="-1" style={{ zIndex: 1050, position: 'fixed' }}>
                        <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
                            <div className="modal-content border-0 shadow-lg rounded-4">
                                <div className="modal-header bg-primary bg-opacity-10 border-0 px-4 py-3">
                                    <h5 className="modal-title fw-bold text-primary d-flex align-items-center gap-2">
                                        <i className="bi bi-info-circle-fill"></i>
                                        Chi tiết thông báo
                                    </h5>
                                    <button type="button" className="btn-close" onClick={() => setSelectedNotif(null)}></button>
                                </div>
                                <div className="modal-body p-4">
                                    <h6 className="fw-bold text-dark mb-2">{selectedNotif.title}</h6>
                                    <p className="text-muted small mb-3 border-bottom pb-2">
                                        <i className="bi bi-clock me-1"></i>{selectedNotif.createdAt}
                                    </p>
                                    <div className="text-dark" style={{ whiteSpace: 'pre-wrap', fontSize: '0.95rem' }}>
                                        {selectedNotif.message}
                                    </div>
                                </div>
                                <div className="modal-footer bg-light border-0 px-4 py-3">
                                    <button type="button" className="btn btn-secondary rounded-pill px-4" onClick={() => setSelectedNotif(null)}>Đóng</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </>,
                document.body
            )}

            {/* CSS TÙY CHỈNH CHO DROPDOWN THÔNG BÁO */}
            <style>{`
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(-10px); }
                to { opacity: 1; transform: translateY(0); }
            }
            .custom-notif-scroll::-webkit-scrollbar { width: 6px; }
            .custom-notif-scroll::-webkit-scrollbar-track { background: #f8f9fa; }
            .custom-notif-scroll::-webkit-scrollbar-thumb { background: #ced4da; border-radius: 10px; }
            .custom-notif-scroll::-webkit-scrollbar-thumb:hover { background: #adb5bd; }
        `}</style>
        </>
    );
};

export default Navbar;