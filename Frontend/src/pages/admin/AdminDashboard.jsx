import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/axiosConfig';
import Pagination from '../../components/common/Pagination';
import { notify, confirmDelete } from '../../utils/notificationAlert';

const AdminDashboard = () => {
    // --- STATE THỐNG KÊ ---
    const [stats, setStats] = useState({ buildings: 0, apartments: 0, residents: 0 });
    const [loadingStats, setLoadingStats] = useState(true);

    // --- STATE TIN TỨC ---
    const [newsList, setNewsList] = useState([]);
    const [loadingNews, setLoadingNews] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showNewsTrash, setShowNewsTrash] = useState(false);

    // State Modal Form
    const [editingNewsId, setEditingNewsId] = useState(null);
    const initialNewsForm = { title: '', description: '' };
    const [newsForm, setNewsForm] = useState(initialNewsForm);

    // State Phân Trang
    const [newsCurrentPage, setNewsCurrentPage] = useState(1);
    const [newsItemsPerPage] = useState(5); // Hiển thị 5 tin mỗi trang cho giống News Feed

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
            setNewsCurrentPage(1);
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
        try {
            await api.put(`/News/${id}/restore`);
            notify.success("Khôi phục bản tin thành công!");
            fetchNews();
        } catch (error) {
            notify.error(error.response?.data?.message || "Không thể khôi phục.");
        }
    };

    const handleHardDeleteNews = async (id) => {
        const { isConfirmed } = await confirmDelete.fire({
            title: 'XÓA VĨNH VIỄN!',
            text: "Hành động này sẽ xóa hoàn toàn bản tin. Bạn chắc chắn chứ?"
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

    // Helper format ngày hiển thị dạng Feed
    const formatFeedDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' lúc ' + date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    };

    // Pagination Logic
    const indexOfLastNews = newsCurrentPage * newsItemsPerPage;
    const indexOfFirstNews = indexOfLastNews - newsItemsPerPage;
    const currentNewsList = newsList.slice(indexOfFirstNews, indexOfLastNews);

    return (
        <div className="container-fluid p-0">
            <div className="mb-4">
                <h2 className="fw-bold mb-0">Tổng Quan Hệ Thống</h2>
                <div className="text-muted small mt-2">Thống kê dữ liệu chung và bảng tin thông báo</div>
            </div>

            {/* --- PHẦN 1: THỐNG KÊ --- */}
            {loadingStats ? (
                <div className="text-center p-5"><div className="spinner-border text-primary"></div></div>
            ) : (
                <div className="row g-4 mb-5">
                    <div className="col-md-4">
                        <div className="card text-white bg-primary h-100 border-0 shadow-sm rounded-3">
                            <div className="card-body p-4">
                                <div className="d-flex justify-content-between align-items-center">
                                    <div>
                                        <h6 className="card-title text-uppercase fw-bold mb-2 opacity-75">Tòa Nhà</h6>
                                        <h2 className="display-5 fw-bold mb-0">{stats.buildings}</h2>
                                    </div>
                                    <div className="bg-white bg-opacity-25 p-3 rounded-circle"><i className="bi bi-building fs-1"></i></div>
                                </div>
                            </div>
                            <div className="card-footer bg-transparent border-top border-white border-opacity-25 p-0">
                                <Link to="/admin/buildings" className="text-white text-decoration-none d-flex justify-content-between align-items-center px-4 py-3 bg-primary bg-opacity-10 hover-overlay">
                                    <span className="small fw-semibold">Xem chi tiết</span><i className="bi bi-arrow-right-circle-fill"></i>
                                </Link>
                            </div>
                        </div>
                    </div>

                    <div className="col-md-4">
                        <div className="card text-white bg-success h-100 border-0 shadow-sm rounded-3">
                            <div className="card-body p-4">
                                <div className="d-flex justify-content-between align-items-center">
                                    <div>
                                        <h6 className="card-title text-uppercase fw-bold mb-2 opacity-75">Căn Hộ</h6>
                                        <h2 className="display-5 fw-bold mb-0">{stats.apartments}</h2>
                                    </div>
                                    <div className="bg-white bg-opacity-25 p-3 rounded-circle"><i className="bi bi-door-open fs-1"></i></div>
                                </div>
                            </div>
                            <div className="card-footer bg-transparent border-top border-white border-opacity-25 p-0">
                                <Link to="/admin/apartments" className="text-white text-decoration-none d-flex justify-content-between align-items-center px-4 py-3 bg-success bg-opacity-10 hover-overlay">
                                    <span className="small fw-semibold">Xem chi tiết</span><i className="bi bi-arrow-right-circle-fill"></i>
                                </Link>
                            </div>
                        </div>
                    </div>

                    <div className="col-md-4">
                        <div className="card text-dark bg-warning h-100 border-0 shadow-sm rounded-3">
                            <div className="card-body p-4">
                                <div className="d-flex justify-content-between align-items-center">
                                    <div>
                                        <h6 className="card-title text-uppercase fw-bold mb-2 opacity-75">Cư Dân</h6>
                                        <h2 className="display-5 fw-bold mb-0">{stats.residents}</h2>
                                    </div>
                                    <div className="bg-dark bg-opacity-10 p-3 rounded-circle text-dark"><i className="bi bi-people fs-1"></i></div>
                                </div>
                            </div>
                            <div className="card-footer bg-transparent border-top border-dark border-opacity-10 p-0">
                                <Link to="/admin/residents" className="text-dark text-decoration-none d-flex justify-content-between align-items-center px-4 py-3 bg-warning bg-opacity-10 hover-overlay">
                                    <span className="small fw-semibold">Xem chi tiết</span><i className="bi bi-arrow-right-circle-fill"></i>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- PHẦN 2: BẢNG TIN TỨC (DẠNG NEWS FEED) --- */}
            <div className="row justify-content-center">
                <div className="col-lg-9 col-xl-8">
                    <div className="d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom">
                        <h4 className="fw-bold mb-0 text-dark">
                            <i className="bi bi-newspaper me-2 text-primary"></i>
                            {showNewsTrash ? 'Thùng rác: Bảng Tin' : 'Bảng Tin Cộng Đồng'}
                        </h4>
                        <div className="d-flex align-items-center">
                            {!showNewsTrash && (
                                <button className="btn btn-primary fw-bold shadow-sm me-2 rounded-pill px-3" onClick={() => handleOpenNewsModal()} data-bs-toggle="modal" data-bs-target="#newsModal">
                                    <i className="bi bi-pencil-square me-1"></i> Viết tin
                                </button>
                            )}
                            <button className={`btn fw-bold rounded-pill px-3 ${showNewsTrash ? 'btn-outline-secondary' : 'btn-outline-danger'}`} onClick={() => setShowNewsTrash(!showNewsTrash)}>
                                <i className={`bi ${showNewsTrash ? 'bi-arrow-left' : 'bi-archive'} me-1`}></i>
                                {showNewsTrash ? 'Quay lại' : 'Thùng rác'}
                            </button>
                        </div>
                    </div>

                    {loadingNews ? (
                        <div className="text-center p-5"><div className="spinner-border text-primary"></div></div>
                    ) : newsList.length === 0 ? (
                        <div className="card shadow-sm border-0 rounded-4 mb-4">
                            <div className="card-body text-center p-5 text-muted">
                                <i className="bi bi-megaphone display-4 opacity-25 d-block mb-3"></i>
                                {showNewsTrash ? 'Thùng rác tin tức đang trống.' : 'Hiện chưa có bài viết nào. Hãy là người đầu tiên đăng tin!'}
                            </div>
                        </div>
                    ) : (
                        <>
                            {currentNewsList.map((news) => (
                                <div className={`card shadow-sm border-0 rounded-4 mb-4 ${showNewsTrash ? 'bg-light' : ''}`} key={news.newsId}>
                                    <div className="card-body p-4">
                                        {/* HEADER CỦA BÀI ĐĂNG (AVATAR + TÊN + NGÀY) */}
                                        <div className="d-flex justify-content-between align-items-center mb-3">
                                            <div className="d-flex align-items-center">
                                                <div className="bg-primary bg-opacity-10 text-primary rounded-circle d-flex justify-content-center align-items-center me-3" style={{ width: '48px', height: '48px' }}>
                                                    <i className="bi bi-building fs-4"></i>
                                                </div>
                                                <div>
                                                    <h6 className={`mb-0 fw-bold ${showNewsTrash ? 'text-muted' : 'text-dark'}`}>Ban Quản Lý Sentana</h6>
                                                    <small className="text-muted">
                                                        <i className="bi bi-clock me-1"></i>
                                                        {showNewsTrash ? 'Đã gỡ lúc ' : ''}{formatFeedDate(news.createdAt)}
                                                    </small>
                                                </div>
                                            </div>

                                            {/* NÚT THAO TÁC (3 CHẤM CỦA ADMIN) */}
                                            <div className="dropdown">
                                                <button className="btn btn-light btn-sm rounded-circle text-muted" type="button" data-bs-toggle="dropdown" style={{ width: '32px', height: '32px' }}>
                                                    <i className="bi bi-three-dots"></i>
                                                </button>
                                                <ul className="dropdown-menu dropdown-menu-end border-0 shadow-sm rounded-3">
                                                    {!showNewsTrash ? (
                                                        <>
                                                            <li>
                                                                <button className="dropdown-item py-2" onClick={() => handleOpenNewsModal(news)} data-bs-toggle="modal" data-bs-target="#newsModal">
                                                                    <i className="bi bi-pencil-square me-2 text-info"></i> Sửa bài viết
                                                                </button>
                                                            </li>
                                                            <li><hr className="dropdown-divider" /></li>
                                                            <li>
                                                                <button className="dropdown-item py-2 text-danger" onClick={() => handleSoftDeleteNews(news.newsId)}>
                                                                    <i className="bi bi-trash me-2"></i> Gỡ bài viết
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

                                        {/* NỘI DUNG BÀI ĐĂNG */}
                                        <div className="mt-2">
                                            <h5 className={`fw-bold mb-2 ${showNewsTrash ? 'text-muted' : 'text-dark'}`}>{news.title}</h5>
                                            <div
                                                className={`card-text ${showNewsTrash ? 'text-muted text-decoration-line-through' : 'text-dark'}`}
                                                style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6', fontSize: '15px' }}
                                            >
                                                {news.description}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {/* Phân trang */}
                            {newsList.length > newsItemsPerPage && (
                                <div className="mt-2 mb-5 d-flex justify-content-center">
                                    <Pagination
                                        totalItems={newsList.length}
                                        itemsPerPage={newsItemsPerPage}
                                        currentPage={newsCurrentPage}
                                        onPageChange={setNewsCurrentPage}
                                    />
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* --- MODAL FORM THÊM / SỬA TIN TỨC --- */}
            <div className="modal fade" id="newsModal" tabIndex="-1" aria-hidden="true">
                <div className="modal-dialog modal-dialog-centered modal-lg">
                    <div className="modal-content border-0 shadow-lg rounded-4">
                        <div className="modal-header border-bottom px-4 py-3">
                            <h5 className="modal-title fw-bold text-dark">
                                {editingNewsId ? 'Chỉnh Sửa Bài Viết' : 'Tạo Bài Viết Mới'}
                            </h5>
                            <button type="button" className="btn-close" data-bs-dismiss="modal" id="closeNewsModal"></button>
                        </div>
                        <form onSubmit={handleNewsSubmit}>
                            <div className="modal-body p-4">
                                {/* Giao diện soạn thảo kiểu Facebook */}
                                <div className="d-flex align-items-center mb-4">
                                    <div className="bg-primary bg-opacity-10 text-primary rounded-circle d-flex justify-content-center align-items-center me-3" style={{ width: '40px', height: '40px' }}>
                                        <i className="bi bi-building"></i>
                                    </div>
                                    <div>
                                        <h6 className="mb-0 fw-bold text-dark">Ban Quản Lý Sentana</h6>
                                        <span className="badge bg-secondary bg-opacity-10 text-secondary border border-secondary-subtle px-2 py-1 mt-1 rounded-pill">
                                            <i className="bi bi-globe me-1"></i> Công khai
                                        </span>
                                    </div>
                                </div>

                                <div className="mb-3">
                                    <input
                                        type="text"
                                        className="form-control border-0 fw-bold fs-5 px-0 shadow-none"
                                        name="title"
                                        value={newsForm.title}
                                        onChange={handleNewsInputChange}
                                        placeholder="Nhập tiêu đề bài viết..."
                                        required
                                        style={{ outline: 'none' }}
                                    />
                                </div>
                                <div className="mb-0">
                                    <textarea
                                        className="form-control border-0 px-0 shadow-none"
                                        name="description"
                                        rows="6"
                                        value={newsForm.description}
                                        onChange={handleNewsInputChange}
                                        placeholder="Hôm nay tòa nhà có tin gì mới?"
                                        required
                                        style={{ resize: 'none', fontSize: '15px' }}
                                    ></textarea>
                                </div>
                            </div>
                            <div className="modal-footer bg-light border-0 px-4 py-3 rounded-bottom-4">
                                <button type="button" className="btn btn-white border rounded-pill px-4" data-bs-dismiss="modal">Hủy</button>
                                <button type="submit" className="btn btn-primary rounded-pill px-4 fw-bold" disabled={isSubmitting}>
                                    {isSubmitting ? <span className="spinner-border spinner-border-sm me-2"></span> : null}
                                    {editingNewsId ? 'Lưu Thay Đổi' : 'Đăng Bài'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            {/* Style nội bộ */}
            <style>{`
                .hover-overlay:hover {
                    background-color: rgba(255, 255, 255, 0.15) !important;
                    transition: background-color 0.2s ease-in-out;
                }
                .form-control:focus {
                    box-shadow: none !important;
                }
            `}</style>
        </div>
    );
};

export default AdminDashboard;