import React, { useState, useEffect, useRef } from 'react';
import api from '../utils/axiosConfig'; // Đã sửa đường dẫn dựa trên ảnh VS Code của bạn

const NotificationDropdown = () => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    const fetchData = async () => {
        try {
            // Gọi đúng endpoint đã cấu hình ở Backend
            const res = await api.get('/notifications/my-notifications');
            const data = res.data?.data || res.data?.Data || [];
            setNotifications(data);
            setUnreadCount(data.filter(n => !(n.isRead || n.IsRead)).length);
        } catch (err) {
            console.error("Lỗi fetch thông báo:", err);
        }
    };

    useEffect(() => {
        fetchData();
        const clickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setIsOpen(false);
        };
        document.addEventListener("mousedown", clickOutside);
        return () => document.removeEventListener("mousedown", clickOutside);
    }, []);

    const handleRead = async (notif) => {
        const id = notif.notificationId || notif.NotificationId;
        if (notif.isRead || notif.IsRead) return;

        try {
            await api.put(`/notifications/${id}/read`);
            // Cập nhật giao diện ngay lập tức
            setNotifications(prev => prev.map(n => 
                (n.notificationId === id || n.NotificationId === id) ? { ...n, isRead: true, IsRead: true } : n
            ));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (err) {
            fetchData();
        }
    };

    return (
        <div className="position-relative me-3" ref={dropdownRef}>
            {/* Nút Chuông */}
            <button className="btn btn-light rounded-circle shadow-sm border-0 position-relative" 
                    style={{width: '40px', height: '40px'}} 
                    onClick={() => setIsOpen(!isOpen)}>
                <i className={`bi bi-bell${unreadCount > 0 ? '-fill text-primary' : ''} fs-5`}></i>
                {unreadCount > 0 && (
                    <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger border border-white" style={{fontSize: '0.65rem'}}>
                        {unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="dropdown-menu dropdown-menu-end show shadow-lg border-0 rounded-4 mt-2 p-0" 
                     style={{ width: '350px', right: 0, zIndex: 1050 }}>
                    <div className="p-3 border-bottom bg-light rounded-top-4">
                        <h6 className="mb-0 fw-bold text-dark">Thông báo hệ thống</h6>
                    </div>
                    
                    <div className="overflow-auto" style={{ maxHeight: '400px' }}>
                        {notifications.length === 0 ? (
                            <div className="p-4 text-center text-muted small">Không có thông báo mới</div>
                        ) : (
                            notifications.map((n, idx) => {
                                const isRead = n.isRead || n.IsRead;
                                return (
                                    <div key={idx} 
                                         onClick={() => handleRead(n)}
                                         className={`p-3 border-bottom d-flex gap-3 notification-item ${!isRead ? 'bg-primary bg-opacity-10' : 'bg-white'}`}
                                         style={{ cursor: 'pointer', transition: '0.2s' }}>
                                        <div className="flex-shrink-0 mt-1">
                                            <i className={`bi bi-info-circle${!isRead ? '-fill text-primary' : ' text-secondary'}`}></i>
                                        </div>
                                        <div className="flex-grow-1">
                                            <p className={`mb-0 small ${!isRead ? 'fw-bold text-dark' : 'text-secondary'}`}>{n.title || n.Title}</p>
                                            <p className="mb-1 text-muted small lh-sm" style={{fontSize: '0.8rem'}}>{n.message || n.Message}</p>
                                            <small className="text-muted d-block" style={{fontSize: '0.7rem'}}>
                                                <i className="bi bi-clock me-1"></i>{n.createdAt || n.CreatedAt}
                                            </small>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                    
                    <div className="p-2 border-top text-center bg-light rounded-bottom-4">
                        <button className="btn btn-sm btn-link text-decoration-none text-secondary" onClick={() => setIsOpen(false)}>Đóng</button>
                    </div>
                </div>
            )}
            <style>{`.notification-item:hover { background-color: #f8f9fa !important; }`}</style>
        </div>
    );
};

export default NotificationDropdown;