import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/axiosConfig';

const TechnicianDashboard = () => {
    const [stats, setStats] = useState({ total: 0, inProgress: 0, resolved: 0 });
    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(true);

    // State cho Carousel vô hạn
    const [currentNewsIndex, setCurrentNewsIndex] = useState(0);
    const itemsToShow = 3;

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        setLoading(true);

        // Luồng 1: API Thống kê công việc
        const fetchTasks = async () => {
            try {
                const taskRes = await api.get('/Maintenance/assigned-to-me', { params: { pageSize: 100 } });

                // Quét mảng Task
                let tasks = [];
                if (Array.isArray(taskRes.data)) tasks = taskRes.data;
                else if (Array.isArray(taskRes.data?.data)) tasks = taskRes.data.data;
                else if (Array.isArray(taskRes.data?.items)) tasks = taskRes.data.items;
                else if (Array.isArray(taskRes.data?.data?.items)) tasks = taskRes.data.data.items;

                const inProgress = tasks.filter(t => ['1', '2', '3', 'Pending', 'Accepted', 'InProgress'].includes(String(t.status))).length;
                const resolved = tasks.filter(t => ['4', 'Resolved'].includes(String(t.status))).length;
                setStats({ total: tasks.length, inProgress, resolved });
            } catch (error) { console.error("Lỗi tải Task:", error); }
        };

        // Luồng 2: API Bảng tin
        const fetchNews = async () => {
            try {
                const newsRes = await api.get('/News', { params: { pageIndex: 1, pageSize: 9 } });
                console.log("🟢 [DEBUG] Dữ liệu News trả về từ Backend:", newsRes.data); // In ra để kiểm tra

                // Thuật toán quét mảng bao quát 100% các kiểu trả về của Backend
                let newsData = [];
                if (Array.isArray(newsRes.data)) {
                    newsData = newsRes.data;
                } else if (newsRes.data && Array.isArray(newsRes.data.data)) {
                    newsData = newsRes.data.data;
                } else if (newsRes.data && Array.isArray(newsRes.data.items)) {
                    newsData = newsRes.data.items;
                } else if (newsRes.data?.data && Array.isArray(newsRes.data.data.items)) {
                    newsData = newsRes.data.data.items;
                }

                console.log("🟢 [DEBUG] Mảng News sau khi trích xuất:", newsData);
                setNews(newsData);
            } catch (error) {
                console.error("Lỗi tải News:", error);
            }
        };

        await Promise.all([fetchTasks(), fetchNews()]);
        setLoading(false);
    };

    const handleNextNews = () => {
        if (currentNewsIndex >= news.length - itemsToShow) setCurrentNewsIndex(0);
        else setCurrentNewsIndex(prev => prev + 1);
    };

    const handlePrevNews = () => {
        if (currentNewsIndex === 0) setCurrentNewsIndex(news.length - itemsToShow > 0 ? news.length - itemsToShow : 0);
        else setCurrentNewsIndex(prev => prev - 1);
    };

    const visibleNews = news.slice(currentNewsIndex, currentNewsIndex + itemsToShow);

    const formatDate = (dateString) => {
        if (!dateString) return "Chưa cập nhật";
        return new Date(dateString).toLocaleDateString('vi-VN');
    };

    if (loading) return <div className="text-center p-5"><div className="spinner-border text-warning"></div></div>;

    return (
        <div className="container-fluid p-0 pb-5">
            {/* THỐNG KÊ */}
            <div className="row g-4 mb-5">
                <div className="col-md-4">
                    <div className="card border-0 shadow-sm rounded-4 h-100 bg-white">
                        <div className="card-body p-4 position-relative overflow-hidden">
                            <i className="bi bi-briefcase position-absolute end-0 top-0 mt-2 me-2 text-light opacity-50" style={{ fontSize: '3rem' }}></i>
                            <h6 className="text-muted fw-bold text-uppercase small mb-2">Tổng số sự cố</h6>
                            <h2 className="fw-bold text-dark mb-0">{stats.total}</h2>
                        </div>
                    </div>
                </div>
                <div className="col-md-4">
                    <div className="card border-0 shadow-sm rounded-4 h-100 bg-warning bg-opacity-10 border-start border-warning border-4">
                        <div className="card-body p-4">
                            <h6 className="text-warning fw-bold text-uppercase small mb-2">Đang bảo trì</h6>
                            <h2 className="fw-bold text-warning mb-0">{stats.inProgress}</h2>
                        </div>
                    </div>
                </div>
                <div className="col-md-4">
                    <div className="card border-0 shadow-sm rounded-4 h-100 bg-success bg-opacity-10 border-start border-success border-4">
                        <div className="card-body p-4">
                            <h6 className="text-success fw-bold text-uppercase small mb-2">Thành công</h6>
                            <h2 className="fw-bold text-success mb-0">{stats.resolved}</h2>
                        </div>
                    </div>
                </div>
            </div>

            {/* BẢNG TIN CAROUSEL */}
            {/* === MODULE BẢNG TIN (Nút trượt ở 2 bên) === */}
            <div className="mb-5">
                <div className="mb-4">
                    <h5 className="fw-bold text-dark mb-0">
                        <i className="bi bi-megaphone-fill text-warning me-2"></i> Bản tin & Thông báo Portal
                    </h5>
                </div>

                {news.length === 0 ? (
                    <div className="p-5 text-center bg-white rounded-4 shadow-sm text-muted">
                        Chưa có thông báo nào.
                    </div>
                ) : (
                    <div className="d-flex align-items-center gap-3">
                        {/* Nút Prev (<) bên trái */}
                        <button
                            onClick={handlePrevNews}
                            className="btn btn-white border shadow-sm rounded-circle d-flex justify-content-center align-items-center flex-shrink-0 nav-btn-tech"
                        >
                            <i className="bi bi-chevron-left fs-5"></i>
                        </button>

                        {/* Vùng chứa các thẻ Card ở giữa */}
                        <div className="flex-grow-1 overflow-hidden py-2">
                            <div className="row g-4 flex-nowrap m-0">
                                {visibleNews.map((item) => (
                                    <div key={item.newsId || item.id} className="col-md-4 px-2">
                                        <div className="card h-100 border-0 shadow-sm rounded-4 news-card-tech-v2">
                                            <div className="card-body p-4 d-flex flex-column">
                                                <div className="d-flex justify-content-between mb-3">
                                                    <span className="badge bg-light text-dark border px-3 py-2 rounded-3">{item.categoryName || 'Tin tức'}</span>
                                                    <i className="bi bi-three-dots text-muted"></i>
                                                </div>
                                                <h4 className="fw-bold text-dark mb-2 tracking-tight" style={{ fontSize: '1.75rem' }}>{item.title}</h4>
                                                <p className="text-muted small mb-4 text-truncate-2">{item.summary || (item.content?.replace(/<[^>]*>?/gm, '')) || "Nhấn để xem chi tiết..."}</p>
                                                <hr className="mt-auto opacity-10" />
                                                <div className="d-flex justify-content-between align-items-center mt-2">
                                                    <div className="small text-muted fw-bold"><i className="bi bi-calendar3 me-2 text-warning"></i>{formatDate(item.createdDate || item.createAt)}</div>
                                                    <Link to={`/technician/news/${item.newsId || item.id}`} className="btn btn-link p-0 text-warning fw-bold text-decoration-none">Chi tiết <i className="bi bi-arrow-right"></i></Link>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Nút Next (>) bên phải */}
                        <button
                            onClick={handleNextNews}
                            className="btn btn-white border shadow-sm rounded-circle d-flex justify-content-center align-items-center flex-shrink-0 nav-btn-tech"
                        >
                            <i className="bi bi-chevron-right fs-5"></i>
                        </button>
                    </div>
                )}
            </div>

            <style>{`
                .news-card-tech-v2 { transition: 0.3s; border: 2px solid transparent !important; }
                .news-card-tech-v2:hover { border-color: #ffc107 !important; transform: translateY(-5px); }
                .nav-btn-tech { width: 45px; height: 45px; display: flex; align-items: center; justify-content: center; transition: 0.2s; }
                .nav-btn-tech:hover { background-color: #ffc107 !important; color: #fff !important; border-color: #ffc107 !important; }
                .tracking-tight { letter-spacing: -1px; }
                .text-truncate-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
            `}</style>
        </div>
    );
};

export default TechnicianDashboard;