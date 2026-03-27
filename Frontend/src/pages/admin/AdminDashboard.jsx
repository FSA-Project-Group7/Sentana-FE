import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/axiosConfig';
import { notify, confirmDelete, confirmAction } from '../../utils/notificationAlert';

const AdminDashboard = () => {
    // --- STATE THỐNG KÊ ---
    const [stats, setStats] = useState({ buildings: 0, apartments: 0, residents: 0 });
    const [loadingStats, setLoadingStats] = useState(true);

    // --- STATE TIN TỨC ---
    const [newsList, setNewsList] = useState([]);
    const [loadingNews, setLoadingNews] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showNewsTrash, setShowNewsTrash] = useState(false);

    // State Modal Form (Thêm/Sửa)
    const [editingNewsId, setEditingNewsId] = useState(null);
    const initialNewsForm = { title: '', description: '' };
    const [newsForm, setNewsForm] = useState(initialNewsForm);

    // State Modal Xem Chi Tiết
    const [detailNews, setDetailNews] = useState(null);

    // State Slider Tin Tức
    const [startIndex, setStartIndex] = useState(0);

    // --- FETCH DATA ---
    const fetchStats = async () => {
        try {
            setLoadingStats(true);
            const [bldRes, aptRes, resRes] = await Promise.all([
                api.get('/Buildings').catch(() => ({ data: [] })),
                api.get('/Apartments').catch(() => ({ data: [] })),
                api.get('/Residents/GetAllResidents').catch(() => ({ data: [] }))
            ]);

            setStats({
                buildings: (bldRes.data?.data || bldRes.data || []).length,
                apartments: (aptRes.data?.data || aptRes.data || []).length,
                residents: (resRes.data?.data || resRes.data || []).length
            });
        } catch (error) {
            console.error("Lỗi tải thống kê:", error);
        } finally {
            setLoadingStats(false);
        }
    };

    const fetchNews = async () => {
        try {
            setLoadingNews(true);
            const endpoint = showNewsTrash ? '/News/deleted' : '/News';
            const newsRes = await api.get(endpoint);
            const newsData = newsRes.data?.data || newsRes.data || [];

            setNewsList(Array.isArray(newsData) ? newsData : []);
            setStartIndex(0); // Reset slider về vị trí đầu khi load lại
        } catch (error) {
            notify.error("Lỗi khi tải danh sách bảng tin.");
            setNewsList([]);
        } finally {
            setLoadingNews(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    useEffect(() => {
        fetchNews();
    }, [showNewsTrash]);

    // --- XỬ LÝ FORM TIN TỨC ---
    const handleNewsInputChange = (e) => {
        const { name, value } = e.target;
        setNewsForm(prev => ({ ...prev, [name]: value }));
    };

    const handleOpenNewsModal = (newsItem = null) => {
        if (newsItem) {
            setEditingNewsId(newsItem.newsId);
            setNewsForm({
                title: newsItem.title || '',
                description: newsItem.description || ''
            });
        } else {
            setEditingNewsId(null);
            setNewsForm(initialNewsForm);
        }
    };

    const handleNewsSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (editingNewsId) {
                await api.put(`/News/${editingNewsId}`, newsForm);
                notify.success("Cập nhật bản tin thành công!");
            } else {
                await api.post('/News', newsForm);
                notify.success("Đăng bản tin mới thành công!");
            }
            fetchNews();
            document.getElementById('closeNewsModal').click();
        } catch (error) {
            notify.error(error.response?.data?.message || "Lỗi đầu vào, vui lòng kiểm tra lại.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSoftDeleteNews = async (id) => {
        const { isConfirmed } = await confirmDelete.fire({
            title: 'Gỡ bản tin này?',
            text: "Bản tin sẽ được chuyển vào thùng rác và ẩn khỏi cư dân."
        });

        if (isConfirmed) {
            try {
                await api.delete(`/News/${id}`);
                notify.success("Đã đưa bản tin vào thùng rác!");
                fetchNews();
            } catch (error) {
                notify.error(error.response?.data?.message || "Không thể xóa bản tin này.");
            }
        }
    };

    const handleRestoreNews = async (id) => {
        const { isConfirmed } = await confirmAction.fire({
            title: 'Khôi phục bản tin?',
            text: "Bản tin sẽ hiển thị lại cho cư dân xem.",
            confirmButtonText: '<i class="bi bi-arrow-counterclockwise me-1"></i> Khôi phục'
        });

        if (isConfirmed) {
            try {
                await api.put(`/News/${id}/restore`);
                notify.success("Khôi phục bản tin thành công!");
                fetchNews();
            } catch (error) {
                notify.error(error.response?.data?.message || "Không thể khôi phục.");
            }
        }
    };

    const handleHardDeleteNews = async (id) => {
        const { isConfirmed } = await confirmDelete.fire({
            title: 'XÓA VĨNH VIỄN!',
            text: "Hành động này sẽ xóa hoàn toàn bản tin khỏi cơ sở dữ liệu. Bạn chắc chắn chứ?"
        });

        if (isConfirmed) {
            try {
                await api.delete(`/News/${id}/hard`);
                notify.success("Đã xóa vĩnh viễn bản tin!");
                fetchNews();
            } catch (error) {
                notify.error(error.response?.data?.message || "Lỗi khi xóa vĩnh viễn.");
            }
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    // --- LOGIC SLIDER TIN TỨC ---
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

    // Lấy 3 bản tin hiển thị hiện tại
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

    return (
        <div className="container-fluid p-0">
            {/* Header */}
            <div className="mb-4">
                <h2 className="fw-bold mb-0">Tổng Quan Hệ Thống</h2>
                <div className="text-muted small mt-2">Thống kê dữ liệu chung và bảng tin thông báo</div>
            </div>

            {/* --- PHẦN 1: THỐNG KÊ (3 CARDS) --- */}
            {loadingStats ? (
                <div className="text-center p-5"><div className="spinner-border text-primary"></div></div>
            ) : (
                <div className="row g-4 mb-5">
                    {/* CARD TÒA NHÀ */}
                    <div className="col-md-4">
                        <div className="card text-white bg-primary h-100 border-0 shadow-sm rounded-3">
                            <div className="card-body p-4">
                                <div className="d-flex justify-content-between align-items-center">
                                    <div>
                                        <h6 className="card-title text-uppercase fw-bold mb-2 opacity-75">Tòa Nhà</h6>
                                        <h2 className="display-5 fw-bold mb-0">{stats.buildings}</h2>
                                    </div>
                                    <div className="bg-white bg-opacity-25 p-3 rounded-circle">
                                        <i className="bi bi-building fs-1"></i>
                                    </div>
                                </div>
                            </div>
                            <div className="card-footer bg-transparent border-top border-white border-opacity-25 p-0">
                                <Link to="/admin/buildings" className="text-white text-decoration-none d-flex justify-content-between align-items-center px-4 py-3 bg-primary bg-opacity-10 hover-overlay">
                                    <span className="small fw-semibold">Xem chi tiết</span>
                                    <i className="bi bi-arrow-right-circle-fill"></i>
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* CARD CĂN HỘ */}
                    <div className="col-md-4">
                        <div className="card text-white bg-success h-100 border-0 shadow-sm rounded-3">
                            <div className="card-body p-4">
                                <div className="d-flex justify-content-between align-items-center">
                                    <div>
                                        <h6 className="card-title text-uppercase fw-bold mb-2 opacity-75">Căn Hộ</h6>
                                        <h2 className="display-5 fw-bold mb-0">{stats.apartments}</h2>
                                    </div>
                                    <div className="bg-white bg-opacity-25 p-3 rounded-circle">
                                        <i className="bi bi-door-open fs-1"></i>
                                    </div>
                                </div>
                            </div>
                            <div className="card-footer bg-transparent border-top border-white border-opacity-25 p-0">
                                <Link to="/admin/apartments" className="text-white text-decoration-none d-flex justify-content-between align-items-center px-4 py-3 bg-success bg-opacity-10 hover-overlay">
                                    <span className="small fw-semibold">Xem chi tiết</span>
                                    <i className="bi bi-arrow-right-circle-fill"></i>
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* CARD CƯ DÂN */}
                    <div className="col-md-4">
                        <div className="card text-dark bg-warning h-100 border-0 shadow-sm rounded-3">
                            <div className="card-body p-4">
                                <div className="d-flex justify-content-between align-items-center">
                                    <div>
                                        <h6 className="card-title text-uppercase fw-bold mb-2 opacity-75">Cư Dân</h6>
                                        <h2 className="display-5 fw-bold mb-0">{stats.residents}</h2>
                                    </div>
                                    <div className="bg-dark bg-opacity-10 p-3 rounded-circle text-dark">
                                        <i className="bi bi-people fs-1"></i>
                                    </div>
                                </div>
                            </div>
                            <div className="card-footer bg-transparent border-top border-dark border-opacity-10 p-0">
                                <Link to="/admin/residents" className="text-dark text-decoration-none d-flex justify-content-between align-items-center px-4 py-3 bg-warning bg-opacity-10 hover-overlay">
                                    <span className="small fw-semibold">Xem chi tiết</span>
                                    <i className="bi bi-arrow-right-circle-fill"></i>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- PHẦN 2: BẢNG TIN TỨC (SLIDER) --- */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h4 className="fw-bold mb-0 text-primary">
                    <i className="bi bi-newspaper me-2"></i>
                    {showNewsTrash ? 'Thùng rác: Bảng Tin' : 'Bản tin SENTANA'}
                </h4>
                <div className="d-flex align-items-center">
                    {!showNewsTrash && (
                        <button className="btn btn-primary fw-bold shadow-sm me-2 rounded px-3" onClick={() => handleOpenNewsModal()} data-bs-toggle="modal" data-bs-target="#newsModal">
                            <i className="bi bi-plus-lg me-1"></i> Thêm bản tin mới
                        </button>
                    )}
                    <button className={`btn fw-bold rounded px-3 ${showNewsTrash ? 'btn-outline-secondary' : 'btn-outline-danger'}`} onClick={() => setShowNewsTrash(!showNewsTrash)}>
                        <i className={`bi ${showNewsTrash ? 'bi-arrow-left' : 'bi-archive'} me-1`}></i>
                        {showNewsTrash ? 'Quay lại' : ''}
                    </button>
                </div>
            </div>

            {loadingNews ? (
                <div className="text-center p-5"><div className="spinner-border text-primary"></div></div>
            ) : newsList.length === 0 ? (
                <div className="card shadow-sm border-0 rounded-3 mb-4">
                    <div className="card-body text-center p-5 text-muted">
                        <i className="bi bi-megaphone display-4 opacity-25 d-block mb-3"></i>
                        {showNewsTrash ? 'Thùng rác tin tức đang trống.' : 'Hiện chưa có bản tin nào.'}
                    </div>
                </div>
            ) : (
                <div className="position-relative px-2 px-md-4 mb-5">
                    {/* Nút lùi (Slide Left) */}
                    {newsList.length > 3 && (
                        <button
                            onClick={prevSlide}
                            className="btn btn-white bg-white shadow-sm border rounded-circle position-absolute top-50 start-0 translate-middle-y z-2 d-flex align-items-center justify-content-center hover-dark"
                            style={{ width: '45px', height: '45px', transition: 'all 0.2s', marginLeft: '-10px' }}
                        >
                            <i className="bi bi-chevron-left fs-5"></i>
                        </button>
                    )}

                    <div className="row g-4">
                        {currentNewsList.map((news, index) => (
                            <div className="col-lg-4 col-md-6 col-12" key={`${news.newsId}-${index}`}>
                                <div
                                    className={`card border-0 shadow-sm rounded-3 h-100 d-flex flex-column hover-shadow-lg ${showNewsTrash ? 'bg-light' : 'bg-white'}`}
                                    style={{ transition: 'transform 0.3s ease, box-shadow 0.3s ease', minHeight: '320px' }}
                                >
                                    <div className="card-body p-4 d-flex flex-column">
                                        <div className="d-flex justify-content-between align-items-center mb-3">
                                            <span className={`badge ${showNewsTrash ? 'bg-secondary' : 'bg-light text-dark border'} py-2 px-3`}>
                                                {showNewsTrash ? 'Đã gỡ' : 'Thông báo'}
                                            </span>

                                            {/* Dropdown sửa/xóa (3 chấm) */}
                                            <div className="dropdown">
                                                <button className="btn btn-light bg-white border btn-sm shadow-sm rounded-circle d-flex align-items-center justify-content-center" type="button" data-bs-toggle="dropdown" style={{ width: '32px', height: '32px' }}>
                                                    <i className="bi bi-three-dots-vertical text-secondary"></i>
                                                </button>
                                                <ul className="dropdown-menu dropdown-menu-end shadow border-0">
                                                    {!showNewsTrash ? (
                                                        <>
                                                            <li>
                                                                <button className="dropdown-item py-2" onClick={() => handleOpenNewsModal(news)} data-bs-toggle="modal" data-bs-target="#newsModal">
                                                                    <i className="bi bi-pencil-square me-2 text-info"></i> Sửa tin
                                                                </button>
                                                            </li>
                                                            <li><hr className="dropdown-divider" /></li>
                                                            <li>
                                                                <button className="dropdown-item py-2 text-danger" onClick={() => handleSoftDeleteNews(news.newsId)}>
                                                                    <i className="bi bi-trash me-2"></i> Gỡ tin
                                                                </button>
                                                            </li>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <li>
                                                                <button className="dropdown-item py-2 text-success" onClick={() => handleRestoreNews(news.newsId)}>
                                                                    <i className="bi bi-arrow-counterclockwise me-2"></i> Khôi phục
                                                                </button>
                                                            </li>
                                                            <li><hr className="dropdown-divider" /></li>
                                                            <li>
                                                                <button className="dropdown-item py-2 text-danger" onClick={() => handleHardDeleteNews(news.newsId)}>
                                                                    <i className="bi bi-x-octagon me-2"></i> Xóa vĩnh viễn
                                                                </button>
                                                            </li>
                                                        </>
                                                    )}
                                                </ul>
                                            </div>
                                        </div>

                                        <h5 className={`fw-bold mb-3 ${showNewsTrash ? 'text-muted text-decoration-line-through' : 'text-dark'}`} style={{
                                            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', height: '3rem', lineHeight: '1.5rem'
                                        }}>
                                            {news.title}
                                        </h5>

                                        <p className="text-muted fs-6 mb-4 flex-grow-1" style={{
                                            display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden', height: '6rem', lineHeight: '1.5rem'
                                        }}>
                                            {news.description}
                                        </p>

                                        {/* Phần chân Card: Ngày đăng và Nút xem chi tiết */}
                                        <div className="mt-auto pt-3 border-top d-flex justify-content-between align-items-center">
                                            <div className="text-muted small fw-medium">
                                                <i className="bi bi-calendar3 me-1"></i> {formatDate(news.createdAt)}
                                            </div>
                                            <span
                                                className="text-primary small fw-bold"
                                                style={{ cursor: 'pointer' }}
                                                onClick={() => setDetailNews(news)}
                                                data-bs-toggle="modal"
                                                data-bs-target="#newsDetailModal"
                                            >
                                                Xem chi tiết <i className="bi bi-arrow-right ms-1"></i>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Nút tiến (Slide Right) */}
                    {newsList.length > 3 && (
                        <button
                            onClick={nextSlide}
                            className="btn btn-white bg-white shadow-sm border rounded-circle position-absolute top-50 end-0 translate-middle-y z-2 d-flex align-items-center justify-content-center hover-dark"
                            style={{ width: '45px', height: '45px', transition: 'all 0.2s', marginRight: '-10px' }}
                        >
                            <i className="bi bi-chevron-right fs-5"></i>
                        </button>
                    )}
                </div>
            )}

            {/* --- MODAL FORM THÊM / SỬA TIN TỨC --- */}
            <div className="modal fade" id="newsModal" tabIndex="-1" aria-hidden="true">
                <div className="modal-dialog modal-dialog-centered modal-lg">
                    <div className="modal-content border-0 shadow">
                        <div className="modal-header bg-primary text-white">
                            <h5 className="modal-title fw-bold">
                                {editingNewsId ? 'Chỉnh Sửa Bản Tin' : 'Tạo Bản Tin Mới'}
                            </h5>
                            <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal" id="closeNewsModal"></button>
                        </div>
                        <form onSubmit={handleNewsSubmit}>
                            <div className="modal-body p-4">
                                <div className="mb-3">
                                    <label className="form-label fw-bold small text-muted text-uppercase">Tiêu đề bản tin (*)</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        name="title"
                                        value={newsForm.title}
                                        onChange={handleNewsInputChange}
                                        placeholder="VD: Thông báo cắt điện bảo trì..."
                                        required
                                    />
                                </div>
                                <div className="mb-0">
                                    <label className="form-label fw-bold small text-muted text-uppercase">Nội dung chi tiết (*)</label>
                                    <textarea
                                        className="form-control"
                                        name="description"
                                        rows="8"
                                        value={newsForm.description}
                                        onChange={handleNewsInputChange}
                                        placeholder="Nhập nội dung chi tiết. Bạn có thể Enter xuống dòng thoải mái..."
                                        required
                                    ></textarea>
                                </div>
                            </div>
                            <div className="modal-footer bg-light border-0">
                                <button type="button" className="btn btn-white border px-4" data-bs-dismiss="modal">Hủy</button>
                                <button type="submit" className="btn btn-primary px-4 fw-bold" disabled={isSubmitting}>
                                    {isSubmitting ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-save me-1"></i>}
                                    {editingNewsId ? 'Lưu Thay Đổi' : 'Đăng Bản Tin'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            {/* --- MODAL XEM CHI TIẾT TIN TỨC --- */}
            {detailNews && (
                <div className="modal fade" id="newsDetailModal" tabIndex="-1" aria-hidden="true">
                    <div className="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">
                        <div className="modal-content border-0 shadow">
                            <div className="modal-header bg-light border-bottom">
                                <h5 className="modal-title fw-bold text-primary">Chi tiết bản tin</h5>
                                <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div className="modal-body p-4">
                                <h4 className="fw-bold text-dark mb-2">{detailNews.title}</h4>
                                <h6 className="text-muted small mb-4 border-bottom pb-3">
                                    <i className="bi bi-calendar3 me-1"></i> Đăng lúc: {formatDate(detailNews.createdAt)}
                                </h6>
                                <div className="text-dark" style={{ whiteSpace: 'pre-wrap', lineHeight: '1.8', fontSize: '15px' }}>
                                    {detailNews.description}
                                </div>
                            </div>
                            <div className="modal-footer bg-light border-0">
                                <button type="button" className="btn btn-secondary px-4" data-bs-dismiss="modal">Đóng</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Style CSS */}
            <style>{`
                .hover-overlay:hover {
                    background-color: rgba(255, 255, 255, 0.15) !important;
                    transition: background-color 0.2s ease-in-out;
                }
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

export default AdminDashboard;