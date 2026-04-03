import React, { useState, useEffect } from 'react';
import api from '../../utils/axiosConfig';

const ResidentPage = () => {
    const [newsList, setNewsList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [startIndex, setStartIndex] = useState(0);
    const [selectedNews, setSelectedNews] = useState(null); // Lưu thông tin tin tức đang xem chi tiết

    // --- FETCH DỮ LIỆU TIN TỨC TỪ BACKEND ---
    useEffect(() => {
        const fetchNews = async () => {
            try {
                const res = await api.get('/News');
                const data = res.data?.data || res.data || [];
                // Lấy danh sách tin tức (Backend đã sort sẵn tin mới nhất lên đầu)
                setNewsList(Array.isArray(data) ? data : []);
            } catch (error) {
                console.error("Lỗi tải bảng tin:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchNews();
    }, []);

    // --- LOGIC SLIDER ---
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

    // Lấy tối đa 3 tin tức để hiển thị trên màn hình
    const getVisibleNews = () => {
        if (newsList.length === 0) return [];
        if (newsList.length <= 3) return newsList;

        return [
            newsList[startIndex % newsList.length],
            newsList[(startIndex + 1) % newsList.length],
            newsList[(startIndex + 2) % newsList.length]
        ];
    };

    const visibleNews = getVisibleNews();

    // Helper format ngày hiển thị
    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    return (
        <div className="container py-4">
            <div className="text-center mb-5">
                <h2
                    className="fw-bold text-white mb-2"
                    style={{ textShadow: '2px 2px 8px rgba(0,0,0,0.8)' }}
                >
                    Bản tin SENTANA
                </h2>
                <p
                    className="text-light"
                    style={{ textShadow: '1px 1px 4px rgba(0,0,0,0.8)' }}
                >
                    Cập nhật những thông báo mới nhất từ Ban quản lý tòa nhà
                </p>
            </div>

            {loading ? (
                <div className="text-center py-5">
                    <div className="spinner-border text-white" role="status"></div>
                </div>
            ) : newsList.length === 0 ? (
                <div className="text-center py-5 bg-white bg-opacity-75 rounded-3 shadow-sm">
                    <i className="bi bi-megaphone display-4 text-muted mb-3 d-block opacity-50"></i>
                    <h5 className="text-muted">Hiện tại chưa có thông báo nào từ Ban Quản Lý.</h5>
                </div>
            ) : (
                <div className="position-relative px-2 px-md-5">
                    {/* Nút lùi (Chỉ hiện khi có > 3 tin) */}
                    {newsList.length > 3 && (
                        <button
                            onClick={prevSlide}
                            className="btn btn-white bg-white shadow border rounded-circle position-absolute top-50 start-0 translate-middle-y z-2 d-flex align-items-center justify-content-center hover-dark"
                            style={{ width: '45px', height: '45px', transition: 'all 0.2s', marginLeft: '-15px' }}
                        >
                            <i className="bi bi-chevron-left fs-5"></i>
                        </button>
                    )}

                    <div className="row g-4">
                        {visibleNews.map((news, index) => (
                            <div className="col-lg-4 col-md-6 col-12" key={`${news.newsId}-${index}`}>
                                <div
                                    className="card border-0 shadow-sm bg-white rounded-3 h-100 d-flex flex-column hover-shadow-lg"
                                    style={{ transition: 'transform 0.3s ease, box-shadow 0.3s ease', minHeight: '320px' }}
                                >
                                    <div className="card-body p-4 d-flex flex-column">
                                        <div className="d-flex align-items-center justify-content-between mb-3">
                                            {/* Do DB không có category, ta để mặc định là Thông báo */}
                                            <span className="badge bg-primary bg-opacity-10 text-primary border border-primary-subtle py-2 px-3 rounded-pill">
                                                <i className="bi bi-info-circle-fill me-1"></i> Thông báo
                                            </span>
                                        </div>

                                        <h5 className="fw-bold text-dark mb-3" style={{
                                            display: '-webkit-box',
                                            WebkitLineClamp: 2,
                                            WebkitBoxOrient: 'vertical',
                                            overflow: 'hidden',
                                            height: '3rem',
                                            lineHeight: '1.5rem'
                                        }}>
                                            {news.title}
                                        </h5>

                                        <p className="text-muted fs-6 mb-4 flex-grow-1" style={{
                                            display: '-webkit-box',
                                            WebkitLineClamp: 4,
                                            WebkitBoxOrient: 'vertical',
                                            overflow: 'hidden',
                                            height: '6rem',
                                            lineHeight: '1.5rem',
                                            whiteSpace: 'pre-wrap'
                                        }}>
                                            {news.description}
                                        </p>

                                        <div className="mt-auto pt-3 border-top d-flex justify-content-between align-items-center">
                                            <div className="text-muted small fw-medium">
                                                <i className="bi bi-calendar3 me-2"></i> {formatDate(news.createdAt)}
                                            </div>
                                            <span
                                                className="text-primary small fw-bold"
                                                style={{ cursor: 'pointer' }}
                                                onClick={() => setSelectedNews(news)}
                                                data-bs-toggle="modal"
                                                data-bs-target="#residentNewsDetailModal"
                                            >
                                                Xem chi tiết <i className="bi bi-arrow-right ms-1"></i>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Nút tiến (Chỉ hiện khi có > 3 tin) */}
                    {newsList.length > 3 && (
                        <button
                            onClick={nextSlide}
                            className="btn btn-white bg-white shadow border rounded-circle position-absolute top-50 end-0 translate-middle-y z-2 d-flex align-items-center justify-content-center hover-dark"
                            style={{ width: '45px', height: '45px', transition: 'all 0.2s', marginRight: '-15px' }}
                        >
                            <i className="bi bi-chevron-right fs-5"></i>
                        </button>
                    )}
                </div>
            )}

            {/* --- MODAL XEM CHI TIẾT TIN TỨC --- */}
            {selectedNews && (
                <div className="modal fade" id="residentNewsDetailModal" tabIndex="-1" aria-hidden="true">
                    <div className="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">
                        <div className="modal-content border-0 shadow-lg rounded-4">
                            <div className="modal-header border-bottom px-4 py-3">
                                <div className="d-flex align-items-center">
                                    <div className="bg-primary bg-opacity-10 text-primary rounded-circle d-flex justify-content-center align-items-center me-3" style={{ width: '40px', height: '40px' }}>
                                        <i className="bi bi-building"></i>
                                    </div>
                                    <div>
                                        <h6 className="mb-0 fw-bold text-dark">Ban Quản Lý Sentana</h6>
                                        <small className="text-muted">Đăng lúc: {formatDate(selectedNews.createdAt)}</small>
                                    </div>
                                </div>
                                <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div className="modal-body p-4">
                                <h4 className="fw-bold text-dark mb-4">{selectedNews.title}</h4>
                                <div className="text-dark" style={{ whiteSpace: 'pre-wrap', lineHeight: '1.8', fontSize: '15px' }}>
                                    {selectedNews.description}
                                </div>
                            </div>
                            <div className="modal-footer bg-light border-0 px-4 py-3 rounded-bottom-4">
                                <button type="button" className="btn btn-secondary px-4 rounded-pill" data-bs-dismiss="modal">Đóng</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style jsx="true">{`
                .hover-shadow-lg:hover { 
                    transform: translateY(-5px); 
                    box-shadow: 0 1rem 3rem rgba(0,0,0,.175)!important; 
                }
                .hover-dark:hover { 
                    background-color: #212529 !important; 
                }
                .hover-dark:hover i { 
                    color: white !important; 
                }
            `}</style>
        </div>
    );
};

export default ResidentPage;