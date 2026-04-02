import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/axiosConfig';

const TechnicianDashboard = () => {
    // --- STATE THỐNG KÊ ---
    const [stats, setStats] = useState({ total: 0, inProgress: 0, resolved: 0 });
    const [loadingStats, setLoadingStats] = useState(true);

    // --- STATE TIN TỨC ---
    const [newsList, setNewsList] = useState([]);
    const [loadingNews, setLoadingNews] = useState(true);
    const [startIndex, setStartIndex] = useState(0);
    const [detailNews, setDetailNews] = useState(null); // Modal Xem chi tiết

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        // Luồng 1: Thống kê công việc
        setLoadingStats(true);
        try {
            const taskRes = await api.get('/Maintenance/assigned-to-me', { params: { pageSize: 100 } });
            let tasks = [];
            if (Array.isArray(taskRes.data)) tasks = taskRes.data;
            else if (Array.isArray(taskRes.data?.data)) tasks = taskRes.data.data;
            else if (Array.isArray(taskRes.data?.items)) tasks = taskRes.data.items;
            else if (Array.isArray(taskRes.data?.data?.items)) tasks = taskRes.data.data.items;

            const inProgress = tasks.filter(t => ['1', '2', '3', 'Pending', 'Accepted', 'InProgress'].includes(String(t.status))).length;
            const resolved = tasks.filter(t => ['4', 'Resolved'].includes(String(t.status))).length;
            setStats({ total: tasks.length, inProgress, resolved });
        } catch (error) {
            console.error("Lỗi tải Thống kê:", error);
        } finally {
            setLoadingStats(false);
        }

        // Luồng 2: Bảng tin
        setLoadingNews(true);
        try {
            const newsRes = await api.get('/News', { params: { pageIndex: 1, pageSize: 9 } });
            let newsData = [];
            if (Array.isArray(newsRes.data)) newsData = newsRes.data;
            else if (Array.isArray(newsRes.data?.data)) newsData = newsRes.data.data;
            else if (Array.isArray(newsRes.data?.items)) newsData = newsRes.data.items;
            else if (Array.isArray(newsRes.data?.data?.items)) newsData = newsRes.data.data.items;

            setNewsList(newsData);
            setStartIndex(0);
        } catch (error) {
            console.error("Lỗi tải Bảng tin:", error);
        } finally {
            setLoadingNews(false);
        }
    };

    // --- LOGIC SLIDER TIN TỨC (Y HỆT ADMIN) ---
    const nextSlide = () => {
        if (newsList.length > 3) {
            setStartIndex((prev) => (prev + 1) % newsList.length);
        }
    };

    const prevSlide = () => {
        if (newsList.length > 3) {
            setStartIndex((prev) => (prev === 0 ? newsList.length - 1 : prev - 1));
        }
    };

    const getVisibleNews = () => {
        if (newsList.length === 0) return [];
        if (newsList.length <= 3) return newsList;
        return [
            newsList[startIndex % newsList.length],
            newsList[(startIndex + 1) % newsList.length],
            newsList[(startIndex + 2) % newsList.length]
        ];
    };

    const currentNewsList = getVisibleNews();

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    return (
        <div className="container-fluid p-0">
            {/* THỐNG KÊ TỔNG QUAN */}
            {loadingStats ? (
                <div className="text-center p-5"><div className="spinner-border text-warning"></div></div>
            ) : (
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
            )}

            {/* BẢNG TIN CAROUSEL (Y HỆT ADMIN) */}
            <div className="mb-4 d-flex justify-content-between align-items-center">
                <h4 className="fw-bold text-dark mb-0">
                    <i className="bi bi-megaphone-fill text-warning me-2"></i> Bản tin & Thông báo Portal
                </h4>
                <button onClick={fetchDashboardData} className="btn btn-sm btn-outline-secondary fw-semibold rounded">
                    <i className="bi bi-arrow-clockwise me-1"></i> Làm mới
                </button>
            </div>

            {loadingNews ? (
                <div className="text-center p-5"><div className="spinner-border text-warning"></div></div>
            ) : newsList.length === 0 ? (
                <div className="card shadow-sm border-0 rounded-4 mb-4 bg-white">
                    <div className="card-body text-center p-5 text-muted">
                        <i className="bi bi-chat-left-dots display-4 opacity-25 d-block mb-3"></i>
                        Hiện chưa có bản tin nào.
                    </div>
                </div>
            ) : (
                <div className="position-relative px-2 px-md-4 mb-5">
                    {/* Nút lùi (<) */}
                    {newsList.length > 3 && (
                        <button
                            onClick={prevSlide}
                            className="btn btn-white bg-white shadow-sm border rounded-circle position-absolute top-50 start-0 translate-middle-y z-2 d-flex align-items-center justify-content-center hover-warning-btn"
                            style={{ width: '45px', height: '45px', transition: 'all 0.2s', marginLeft: '-10px' }}
                        >
                            <i className="bi bi-chevron-left fs-5"></i>
                        </button>
                    )}

                    <div className="row g-4">
                        {currentNewsList.map((news, index) => (
                            <div className="col-lg-4 col-md-6 col-12" key={`${news.newsId || news.id}-${index}`}>
                                <div
                                    className="card border-0 shadow-sm rounded-4 h-100 d-flex flex-column hover-shadow-lg bg-white"
                                    style={{ transition: 'transform 0.3s ease, box-shadow 0.3s ease', minHeight: '320px' }}
                                >
                                    <div className="card-body p-4 d-flex flex-column">
                                        <div className="d-flex justify-content-between align-items-center mb-3">
                                            <span className="badge bg-light text-dark border py-2 px-3 rounded-3">
                                                {news.categoryName || 'Thông báo'}
                                            </span>
                                            <i className="bi bi-three-dots text-muted"></i>
                                        </div>

                                        <h5 className="fw-bold text-dark mb-3" style={{
                                            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', height: '3rem', lineHeight: '1.5rem'
                                        }}>
                                            {news.title}
                                        </h5>

                                        <p className="text-muted fs-6 mb-4 flex-grow-1" style={{
                                            display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', height: '4.5rem', lineHeight: '1.5rem'
                                        }}>
                                            {news.summary || (news.content?.replace(/<[^>]*>?/gm, '')) || news.description}
                                        </p>

                                        {/* Phần chân Card */}
                                        <div className="mt-auto pt-3 border-top d-flex justify-content-between align-items-center">
                                            <div className="text-muted small fw-medium">
                                                <i className="bi bi-calendar3 me-1 text-warning"></i> {formatDate(news.createdAt || news.createdDate)}
                                            </div>
                                            <span
                                                className="text-warning small fw-bold"
                                                style={{ cursor: 'pointer' }}
                                                onClick={() => setDetailNews(news)}
                                                data-bs-toggle="modal"
                                                data-bs-target="#newsDetailModalTech"
                                            >
                                                Xem chi tiết <i className="bi bi-arrow-right ms-1"></i>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Nút tiến (>) */}
                    {newsList.length > 3 && (
                        <button
                            onClick={nextSlide}
                            className="btn btn-white bg-white shadow-sm border rounded-circle position-absolute top-50 end-0 translate-middle-y z-2 d-flex align-items-center justify-content-center hover-warning-btn"
                            style={{ width: '45px', height: '45px', transition: 'all 0.2s', marginRight: '-10px' }}
                        >
                            <i className="bi bi-chevron-right fs-5"></i>
                        </button>
                    )}
                </div>
            )}

            {/* MODAL XEM CHI TIẾT TIN TỨC */}
            {detailNews && (
                <div className="modal fade" id="newsDetailModalTech" tabIndex="-1" aria-hidden="true">
                    <div className="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">
                        <div className="modal-content border-0 shadow">
                            <div className="modal-header bg-light border-bottom">
                                <h5 className="modal-title fw-bold text-dark">Chi tiết bản tin</h5>
                                <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div className="modal-body p-4">
                                <h4 className="fw-bold text-dark mb-2">{detailNews.title}</h4>
                                <h6 className="text-muted small mb-4 border-bottom pb-3">
                                    <i className="bi bi-calendar3 me-1 text-warning"></i> Đăng lúc: {formatDate(detailNews.createdAt || detailNews.createdDate)}
                                </h6>
                                <div className="text-dark" style={{ whiteSpace: 'pre-wrap', lineHeight: '1.8', fontSize: '15px' }}>
                                    {detailNews.description || detailNews.content}
                                </div>
                            </div>
                            <div className="modal-footer bg-light border-0">
                                <button type="button" className="btn btn-secondary px-4" data-bs-dismiss="modal">Đóng</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .hover-shadow-lg:hover { 
                    transform: translateY(-5px); 
                    box-shadow: 0 1rem 3rem rgba(0,0,0,.1) !important; 
                    border-bottom: 3px solid #ffc107 !important;
                }
                .hover-warning-btn:hover { 
                    background-color: #ffc107 !important; 
                    color: #000 !important; 
                    border-color: #ffc107 !important; 
                }
            `}</style>
        </div>
    );
};

export default TechnicianDashboard;