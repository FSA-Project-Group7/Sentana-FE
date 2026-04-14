import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/axiosConfig';
import { notify, confirmDelete, confirmAction } from '../../utils/notificationAlert';
import { useSignalR } from '../../hooks/useSignalR';

const AdminDashboard = () => {
    // --- 1. STATE THỐNG KÊ (Nâng cấp thêm số liệu Sự cố) ---
    const [stats, setStats] = useState({ buildings: 0, apartments: 0, residents: 0, pendingTasks: 0, activeTasks: 0 });
    const [loadingStats, setLoadingStats] = useState(true);

    // --- 2. STATE TIN TỨC & SLIDER ---
    const [newsList, setNewsList] = useState([]);
    const [loadingNews, setLoadingNews] = useState(true);
    const [showNewsTrash, setShowNewsTrash] = useState(false);
    const [editingNewsId, setEditingNewsId] = useState(null);
    const [newsForm, setNewsForm] = useState({ title: '', description: '' });
    const [detailNews, setDetailNews] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Auto Slider State
    const [startIndex, setStartIndex] = useState(0);
    const [isHoveringSlider, setIsHoveringSlider] = useState(false);

    // --- 3. STATE REAL-TIME (CHUÔNG & LIVE FEED) ---
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [liveFeed, setLiveFeed] = useState([]);

    const connection = useSignalR();

    // ==========================================
    // 🔗 SIGNALR: BẮT SÓNG THỜI GIAN THỰC
    // ==========================================
    useEffect(() => {
        if (!connection) return;

        const addRealtimeEvent = (title, message, type, icon) => {
            const newItem = { id: Date.now(), title, message, type, icon, time: new Date() };

            // Thêm vào Chuông thông báo
            setNotifications(prev => [newItem, ...prev].slice(0, 20)); // Giữ 20 thông báo mới nhất
            setUnreadCount(prev => prev + 1);

            // Thêm vào Live Feed trên Dashboard
            setLiveFeed(prev => [newItem, ...prev].slice(0, 10)); // Giữ 10 hoạt động mới nhất
        };

        const handleNewReq = (data) => {
            notify.info(`🚨 Yêu cầu mới: P.${data.apartmentCode || data.apartmentName}`);
            addRealtimeEvent("Yêu cầu mới", `P.${data.apartmentCode || data.apartmentName} vừa báo cáo sự cố: ${data.title}`, "danger", "bi-exclamation-circle-fill");
            fetchStats(); // Cập nhật lại số KPI
        };

        const handleProcessing = (data) => {
            addRealtimeEvent("Đang xử lý", `Thợ đã bắt đầu sửa chữa tại P.${data.apartmentCode || data.apartmentName}`, "primary", "bi-tools");
            fetchStats();
        };

        const handleFixedReq = (data) => {
            addRealtimeEvent("Chờ nghiệm thu", `Sự cố tại P.${data.apartmentCode || data.apartmentName} đã sửa xong`, "info", "bi-card-checklist");
        };

        const handleClosedReq = (data) => {
            addRealtimeEvent("Hoàn thành", `Cư dân P.${data.apartmentCode || data.apartmentName} đã nghiệm thu`, "success", "bi-check-circle-fill");
            fetchStats();
        };

        connection.on("ReceiveNewMaintenanceRequest", handleNewReq);
        connection.on("TaskProcessing", handleProcessing);
        connection.on("ReceiveFixedTask", handleFixedReq);
        connection.on("TaskClosed", handleClosedReq);

        return () => {
            connection.off("ReceiveNewMaintenanceRequest", handleNewReq);
            connection.off("TaskProcessing", handleProcessing);
            connection.off("ReceiveFixedTask", handleFixedReq);
            connection.off("TaskClosed", handleClosedReq);
        };
    }, [connection]);

    // ==========================================
    // 📊 FETCH DATA KHỞI TẠO
    // ==========================================
    const fetchStats = async () => {
        try {
            const [bldRes, aptRes, resRes, taskRes] = await Promise.all([
                api.get('/Buildings').catch(() => ({ data: [] })),
                api.get('/Apartments').catch(() => ({ data: [] })),
                api.get('/Residents/GetAllResidents').catch(() => ({ data: [] })),
                api.get('/Maintenance/request', { params: { pageSize: 100 } }).catch(() => ({ data: { items: [] } }))
            ]);

            const tasks = taskRes.data?.data?.items || taskRes.data?.items || [];
            const pending = tasks.filter(t => String(t.status) === '1').length;
            const active = tasks.filter(t => String(t.status) === '2' || String(t.status) === '3').length;

            setStats({
                buildings: (bldRes.data?.data || bldRes.data || []).length,
                apartments: (aptRes.data?.data || aptRes.data || []).length,
                residents: (resRes.data?.data || resRes.data || []).length,
                pendingTasks: pending,
                activeTasks: active
            });
        } catch (error) { console.error(error); }
        finally { setLoadingStats(false); }
    };

    const fetchNews = async () => {
        setLoadingNews(true);
        try {
            const endpoint = showNewsTrash ? '/News/deleted' : '/News';
            const res = await api.get(endpoint);
            setNewsList(Array.isArray(res.data?.data) ? res.data.data : (Array.isArray(res.data) ? res.data : []));
            setStartIndex(0);
        } catch (error) { notify.error("Lỗi tải bản tin."); }
        finally { setLoadingNews(false); }
    };

    useEffect(() => { fetchStats(); }, []);
    useEffect(() => { fetchNews(); }, [showNewsTrash]);

    // ==========================================
    // 🔄 AUTO SLIDER LOGIC
    // ==========================================
    useEffect(() => {
        if (newsList.length <= 3 || isHoveringSlider) return;
        const interval = setInterval(() => {
            setStartIndex(prev => (prev + 1) % newsList.length);
        }, 4000); // Trượt tự động mỗi 4 giây
        return () => clearInterval(interval);
    }, [newsList.length, isHoveringSlider]);

    const getVisibleNews = () => {
        if (newsList.length <= 3) return newsList;
        return [
            newsList[startIndex % newsList.length],
            newsList[(startIndex + 1) % newsList.length],
            newsList[(startIndex + 2) % newsList.length]
        ];
    };

    // --- CÁC HÀM XỬ LÝ FORM TIN TỨC (Giữ nguyên logic của bạn) ---
    const handleNewsInputChange = (e) => setNewsForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    const handleOpenNewsModal = (item = null) => {
        if (item) { setEditingNewsId(item.newsId); setNewsForm({ title: item.title || '', description: item.description || '' }); }
        else { setEditingNewsId(null); setNewsForm({ title: '', description: '' }); }
    };
    const handleNewsSubmit = async (e) => {
        e.preventDefault(); setIsSubmitting(true);
        try {
            if (editingNewsId) await api.put(`/News/${editingNewsId}`, newsForm);
            else await api.post('/News', newsForm);
            notify.success(editingNewsId ? "Đã cập nhật!" : "Đã đăng bài!");
            fetchNews(); document.getElementById('closeNewsModal').click();
        } catch (error) { notify.error("Lỗi đăng tin."); } finally { setIsSubmitting(false); }
    };
    const handleSoftDeleteNews = async (id) => {
        const { isConfirmed } = await confirmDelete.fire({ title: 'Gỡ bản tin?' });
        if (isConfirmed) { await api.delete(`/News/${id}`); fetchNews(); }
    };
    const handleRestoreNews = async (id) => {
        const { isConfirmed } = await confirmAction.fire({ title: 'Khôi phục bản tin?', confirmButtonText: 'Khôi phục' });
        if (isConfirmed) { await api.put(`/News/${id}/restore`); fetchNews(); }
    };
    const handleHardDeleteNews = async (id) => {
        const { isConfirmed } = await confirmDelete.fire({ title: 'XÓA VĨNH VIỄN!' });
        if (isConfirmed) { await api.delete(`/News/${id}/hard`); fetchNews(); }
    };

    // Utils
    const timeAgo = (date) => {
        const seconds = Math.floor((new Date() - new Date(date)) / 1000);
        if (seconds < 60) return 'Vừa xong';
        if (seconds < 3600) return `${Math.floor(seconds / 60)} phút trước`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)} giờ trước`;
        return new Date(date).toLocaleDateString('vi-VN');
    };

    return (
        <div className="container-fluid p-0 pb-5">
            {/* ========================================== */}
            {/* HEADER & QUẢ CHUÔNG THÔNG BÁO               */}
            {/* ========================================== */}
            <div className="d-flex justify-content-between align-items-center mb-4 bg-white p-3 rounded-4 shadow-sm">
                <div>
                    <h3 className="fw-bold mb-0 text-dark">Tổng Quan Hệ Thống</h3>
                    <div className="text-muted small mt-1">Chào mừng quay lại, {localStorage.getItem('fullName') || 'Quản lý'}!</div>
                </div>

                <div className="d-flex align-items-center gap-3">
                    {/* QUẢ CHUÔNG THÔNG BÁO REALTIME */}
                    <div className="dropdown">
                        <button className="btn btn-light position-relative p-2 rounded-circle shadow-sm border" data-bs-toggle="dropdown" onClick={() => setUnreadCount(0)}>
                            <i className="bi bi-bell-fill text-primary fs-5 px-1"></i>
                            {unreadCount > 0 && (
                                <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger border border-white">
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                </span>
                            )}
                        </button>
                        <ul className="dropdown-menu dropdown-menu-end shadow-lg border-0 p-0 rounded-4 overflow-hidden" style={{ width: '320px' }}>
                            <li className="p-3 bg-primary text-white fw-bold d-flex justify-content-between align-items-center">
                                Thông báo mới
                                <i className="bi bi-app-indicator"></i>
                            </li>
                            <div style={{ maxHeight: '350px', overflowY: 'auto' }} className="custom-scrollbar">
                                {notifications.length === 0 ? (
                                    <div className="p-4 text-center text-muted small">Chưa có thông báo nào</div>
                                ) : (
                                    notifications.map(notif => (
                                        <li key={notif.id} className="dropdown-item p-3 border-bottom text-wrap" style={{ cursor: 'default' }}>
                                            <div className="d-flex gap-3">
                                                <div className={`text-${notif.type} fs-4`}><i className={notif.icon}></i></div>
                                                <div>
                                                    <div className="fw-bold small text-dark">{notif.title}</div>
                                                    <div className="text-muted" style={{ fontSize: '13px' }}>{notif.message}</div>
                                                    <div className="text-primary mt-1" style={{ fontSize: '11px' }}>{timeAgo(notif.time)}</div>
                                                </div>
                                            </div>
                                        </li>
                                    ))
                                )}
                            </div>
                        </ul>
                    </div>
                </div>
            </div>

            {/* ========================================== */}
            {/* THỐNG KÊ (KPI CARDS) - Đã Nâng Cấp          */}
            {/* ========================================== */}
            {loadingStats ? (
                <div className="text-center p-5"><div className="spinner-border text-primary"></div></div>
            ) : (
                <div className="row g-4 mb-4">
                    <div className="col-md-3 col-sm-6">
                        <div className="card bg-primary text-white h-100 border-0 shadow-sm rounded-4 overflow-hidden position-relative hover-shadow-lg transition-all">
                            <div className="card-body p-4">
                                <h6 className="fw-bold mb-2 opacity-75 text-uppercase small">Tổng Căn Hộ</h6>
                                <h2 className="display-5 fw-bold mb-0">{stats.apartments}</h2>
                                <i className="bi bi-door-open position-absolute text-white opacity-25" style={{ fontSize: '5rem', bottom: '-10px', right: '10px' }}></i>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-3 col-sm-6">
                        <div className="card bg-success text-white h-100 border-0 shadow-sm rounded-4 overflow-hidden position-relative hover-shadow-lg transition-all">
                            <div className="card-body p-4">
                                <h6 className="fw-bold mb-2 opacity-75 text-uppercase small">Tổng Cư Dân</h6>
                                <h2 className="display-5 fw-bold mb-0">{stats.residents}</h2>
                                <i className="bi bi-people position-absolute text-white opacity-25" style={{ fontSize: '5rem', bottom: '-10px', right: '10px' }}></i>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-3 col-sm-6">
                        <div className="card bg-danger text-white h-100 border-0 shadow-sm rounded-4 overflow-hidden position-relative hover-shadow-lg transition-all">
                            <div className="card-body p-4">
                                <h6 className="fw-bold mb-2 opacity-75 text-uppercase small">Sự cố chờ chia việc</h6>
                                <h2 className="display-5 fw-bold mb-0">{stats.pendingTasks}</h2>
                                <i className="bi bi-exclamation-triangle position-absolute text-white opacity-25" style={{ fontSize: '4.5rem', bottom: '-5px', right: '15px' }}></i>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-3 col-sm-6">
                        <div className="card bg-warning text-dark h-100 border-0 shadow-sm rounded-4 overflow-hidden position-relative hover-shadow-lg transition-all">
                            <div className="card-body p-4">
                                <h6 className="fw-bold mb-2 opacity-75 text-uppercase small">Sự cố đang xử lý</h6>
                                <h2 className="display-5 fw-bold mb-0">{stats.activeTasks}</h2>
                                <i className="bi bi-tools position-absolute text-dark opacity-10" style={{ fontSize: '4.5rem', bottom: '-5px', right: '15px' }}></i>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="row g-4">
                {/* ========================================== */}
                {/* CỘT TRÁI: BẢNG TIN TỨC (Auto Slider)        */}
                {/* ========================================== */}
                <div className="col-xl-8 col-lg-7">
                    <div className="card border-0 shadow-sm rounded-4 h-100">
                        <div className="card-header bg-white border-0 pt-4 px-4 pb-2 d-flex justify-content-between align-items-center">
                            <h5 className="fw-bold mb-0 text-dark">
                                <i className="bi bi-newspaper text-primary me-2"></i>
                                {showNewsTrash ? 'Thùng rác: Bảng Tin' : 'Bản tin Cư Dân'}
                            </h5>
                            <div className="d-flex align-items-center gap-2">
                                {!showNewsTrash && (
                                    <button className="btn btn-primary btn-sm fw-bold rounded-pill px-3" onClick={() => handleOpenNewsModal()} data-bs-toggle="modal" data-bs-target="#newsModal">
                                        <i className="bi bi-plus-lg me-1"></i> Đăng tin
                                    </button>
                                )}
                                <button className={`btn btn-sm fw-bold rounded-pill px-3 ${showNewsTrash ? 'btn-secondary' : 'btn-outline-danger'}`} onClick={() => setShowNewsTrash(!showNewsTrash)}>
                                    <i className={`bi ${showNewsTrash ? 'bi-arrow-left' : 'bi-archive'} me-1`}></i>
                                    {showNewsTrash ? 'Quay lại' : 'Thùng rác'}
                                </button>
                            </div>
                        </div>

                        <div className="card-body p-4" onMouseEnter={() => setIsHoveringSlider(true)} onMouseLeave={() => setIsHoveringSlider(false)}>
                            {loadingNews ? (
                                <div className="text-center p-5"><div className="spinner-border text-primary"></div></div>
                            ) : newsList.length === 0 ? (
                                <div className="text-center p-5 text-muted">Chưa có bản tin nào.</div>
                            ) : (
                                <div className="row g-3">
                                    {getVisibleNews().map((news, index) => (
                                        <div className="col-md-4" key={`${news.newsId}-${index}`}>
                                            <div className={`card h-100 border rounded-4 hover-shadow-sm ${showNewsTrash ? 'bg-light' : 'bg-white'}`}>
                                                <div className="card-body p-3 d-flex flex-column">
                                                    <div className="d-flex justify-content-between mb-2">
                                                        <span className="badge bg-light text-dark border"><i className="bi bi-pin-angle me-1"></i>Tin tức</span>
                                                        <div className="dropdown">
                                                            <i className="bi bi-three-dots text-muted" role="button" data-bs-toggle="dropdown"></i>
                                                            <ul className="dropdown-menu dropdown-menu-end shadow-sm border-0">
                                                                {!showNewsTrash ? (
                                                                    <>
                                                                        <li><button className="dropdown-item small" onClick={() => handleOpenNewsModal(news)} data-bs-toggle="modal" data-bs-target="#newsModal">Sửa tin</button></li>
                                                                        <li><button className="dropdown-item small text-danger" onClick={() => handleSoftDeleteNews(news.newsId)}>Gỡ tin</button></li>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <li><button className="dropdown-item small text-success" onClick={() => handleRestoreNews(news.newsId)}>Khôi phục</button></li>
                                                                        <li><button className="dropdown-item small text-danger" onClick={() => handleHardDeleteNews(news.newsId)}>Xóa vĩnh viễn</button></li>
                                                                    </>
                                                                )}
                                                            </ul>
                                                        </div>
                                                    </div>
                                                    <h6 className="fw-bold mb-2 text-dark line-clamp-2" style={{ height: '2.5rem' }}>{news.title}</h6>
                                                    <p className="small text-muted mb-3 flex-grow-1 line-clamp-3">{news.description}</p>
                                                    <div className="mt-auto d-flex justify-content-between align-items-center border-top pt-2">
                                                        <small className="text-muted" style={{ fontSize: '11px' }}>{new Date(news.createdAt).toLocaleDateString('vi-VN')}</small>
                                                        <span className="text-primary small fw-bold cursor-pointer hover-text-dark" onClick={() => setDetailNews(news)} data-bs-toggle="modal" data-bs-target="#newsDetailModal">Chi tiết <i className="bi bi-arrow-right"></i></span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ========================================== */}
                {/* CỘT PHẢI: LIVE FEED (Hoạt động gần đây)     */}
                {/* ========================================== */}
                <div className="col-xl-4 col-lg-5">
                    <div className="card border-0 shadow-sm rounded-4 h-100 flex-column d-flex overflow-hidden">
                        <div className="card-header bg-white border-bottom pt-4 px-4 pb-3 d-flex justify-content-between align-items-center">
                            <h5 className="fw-bold mb-0 text-dark"><i className="bi bi-activity text-success me-2"></i> Hoạt động Live</h5>
                            {liveFeed.length > 0 && <span className="spinner-grow spinner-grow-sm text-success"></span>}
                        </div>
                        <div className="card-body p-0 custom-scrollbar" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                            {liveFeed.length === 0 ? (
                                <div className="p-5 text-center text-muted small">
                                    <i className="bi bi-check-circle display-4 d-block mb-2 opacity-25"></i>
                                    Hệ thống đang ổn định, chưa có hoạt động mới.
                                </div>
                            ) : (
                                <ul className="list-group list-group-flush border-0">
                                    {liveFeed.map(feed => (
                                        <li key={feed.id} className="list-group-item p-3 border-bottom border-light animate-fade-in">
                                            <div className="d-flex gap-3">
                                                <div className={`text-${feed.type} bg-${feed.type} bg-opacity-10 p-2 rounded-circle d-flex align-items-center justify-content-center`} style={{ width: '40px', height: '40px' }}>
                                                    <i className={`${feed.icon} fs-5`}></i>
                                                </div>
                                                <div>
                                                    <div className="fw-bold text-dark small">{feed.title}</div>
                                                    <div className="text-muted" style={{ fontSize: '13px' }}>{feed.message}</div>
                                                    <div className="text-secondary mt-1" style={{ fontSize: '11px' }}>{timeAgo(feed.time)}</div>
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Các Modal (Thêm/Sửa tin, Xem chi tiết) - Giữ nguyên logic của bạn, chỉ thu gọn layout cho đẹp */}
            {/* Modal Sửa/Thêm News */}
            <div className="modal fade" id="newsModal" tabIndex="-1" aria-hidden="true">
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content border-0 shadow-lg rounded-4">
                        <div className="modal-header bg-primary text-white border-0 px-4 py-3 rounded-top-4">
                            <h5 className="modal-title fw-bold">{editingNewsId ? 'Sửa Bản Tin' : 'Đăng Bản Tin Mới'}</h5>
                            <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal" id="closeNewsModal"></button>
                        </div>
                        <form onSubmit={handleNewsSubmit}>
                            <div className="modal-body p-4">
                                <div className="mb-3">
                                    <label className="form-label fw-bold small text-muted">Tiêu đề bản tin *</label>
                                    <input type="text" className="form-control bg-light border-0" name="title" value={newsForm.title} onChange={handleNewsInputChange} required />
                                </div>
                                <div className="mb-0">
                                    <label className="form-label fw-bold small text-muted">Nội dung chi tiết *</label>
                                    <textarea className="form-control bg-light border-0" name="description" rows="6" value={newsForm.description} onChange={handleNewsInputChange} required></textarea>
                                </div>
                            </div>
                            <div className="modal-footer bg-light border-0 px-4 py-3 rounded-bottom-4">
                                <button type="button" className="btn btn-white border rounded-pill px-4" data-bs-dismiss="modal">Hủy</button>
                                <button type="submit" className="btn btn-primary rounded-pill px-4 fw-bold" disabled={isSubmitting}>Lưu bản tin</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            {/* Modal Xem Chi Tiết News */}
            {detailNews && (
                <div className="modal fade" id="newsDetailModal" tabIndex="-1" aria-hidden="true">
                    <div className="modal-dialog modal-dialog-centered modal-lg">
                        <div className="modal-content border-0 shadow-lg rounded-4">
                            <div className="modal-body p-5">
                                <button type="button" className="btn-close position-absolute top-0 end-0 m-4" data-bs-dismiss="modal"></button>
                                <span className="badge bg-primary bg-opacity-10 text-primary border border-primary px-3 py-2 rounded-pill mb-3">Bản tin cư dân</span>
                                <h3 className="fw-bold text-dark mb-3">{detailNews.title}</h3>
                                <div className="text-muted small mb-4 d-flex align-items-center gap-3 border-bottom pb-4">
                                    <span><i className="bi bi-calendar3 me-1"></i> {new Date(detailNews.createdAt).toLocaleDateString('vi-VN')}</span>
                                    <span><i className="bi bi-person-circle me-1"></i> Ban Quản Lý</span>
                                </div>
                                <div className="text-dark" style={{ whiteSpace: 'pre-wrap', lineHeight: '1.8', fontSize: '15px' }}>
                                    {detailNews.description}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Styles */}
            <style>{`
                .transition-all { transition: all 0.3s ease; }
                .hover-shadow-lg:hover { transform: translateY(-5px); box-shadow: 0 1rem 3rem rgba(0,0,0,.15)!important; }
                .hover-shadow-sm:hover { transform: translateY(-2px); box-shadow: 0 .125rem .25rem rgba(0,0,0,.075)!important; border-color: #0d6efd !important; }
                .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
                .line-clamp-3 { display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
                .cursor-pointer { cursor: pointer; }
                .hover-text-dark:hover { color: #212529 !important; }
                
                .custom-scrollbar::-webkit-scrollbar { width: 5px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #dee2e6; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #adb5bd; }
                
                @keyframes fadeIn { from { opacity: 0; transform: translateX(10px); } to { opacity: 1; transform: translateX(0); } }
                .animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
            `}</style>
        </div>
    );
};

export default AdminDashboard;