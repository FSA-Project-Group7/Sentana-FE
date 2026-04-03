import React, { useState, useEffect } from 'react';
import api from '../../utils/axiosConfig';
import { notify, confirmAction } from '../../utils/notificationAlert';
import { useSignalR } from '../../hooks/useSignalR';

const MaintenanceRequest = () => {
    // --- STATES ---
    const [requests, setRequests] = useState([]);
    const [apartments, setApartments] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form State
    const [formData, setFormData] = useState({ apartmentId: '', categoryId: '', title: '', description: '', file: null });

    // Modals State
    const [rejectReason, setRejectReason] = useState('');
    const [selectedRejectId, setSelectedRejectId] = useState(null);
    const [detailTask, setDetailTask] = useState(null);

    // Phân trang
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 3;

    const connection = useSignalR();

    useEffect(() => {
        if (!connection) return;

        // BẮT SỰ KIỆN: THỢ ĐÃ SỬA XONG
        const handleFixedReq = (payload) => {
            notify.success(`✅ Sự cố "${payload.title}" của bạn đã được thợ xử lý xong! Vui lòng vào nghiệm thu.`);
            if (typeof setReloadTrigger === 'function') {
                setReloadTrigger(prev => prev + 1);
            }
        };
        connection.on("ReceiveFixedTask", handleFixedReq);

        return () => {
            // Hủy đăng ký khi rời trang
            connection.off("ReceiveFixedTask", handleFixedReq);
        };
    }, [connection]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [reqRes, aptRes] = await Promise.all([
                api.get('/Maintenance/my-requests'),
                api.get('/Maintenance/my-apartments')
            ]);
            setRequests(reqRes.data?.data || reqRes.data?.Data || []);
            setCurrentPage(1);

            setApartments(aptRes.data?.data || aptRes.data?.Data || []);
            setCategories([
                { categoryId: 1, categoryName: 'Sự cố Nước / Ống nước' },
                { categoryId: 2, categoryName: 'Sự cố Điện / Chập cháy' },
                { categoryId: 3, categoryName: 'Hư hỏng Nội thất' },
                { categoryId: 4, categoryName: 'Sự cố Khác' }
            ]);
        } catch (error) { notify.error("Không thể tải dữ liệu."); }
        setLoading(false);
    };

    useEffect(() => { fetchData(); }, []);

    // ==========================================
    // LOGIC PHÂN TRANG
    // ==========================================
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentRequests = requests.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(requests.length / itemsPerPage);

    // ==========================================
    // 2. HANDLERS
    // ==========================================
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file && file.size > 5 * 1024 * 1024) {
            notify.error("Ảnh quá lớn (>5MB)");
            e.target.value = '';
            return;
        }
        setFormData(prev => ({ ...prev, file }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.apartmentId || !formData.categoryId || !formData.title.trim()) return notify.warning("Vui lòng điền đủ thông tin!");

        setIsSubmitting(true);
        const payload = new FormData();
        payload.append("ApartmentId", formData.apartmentId);
        payload.append("CategoryId", formData.categoryId);
        payload.append("Title", formData.title.trim());
        payload.append("Description", formData.description.trim());
        if (formData.file) payload.append("Photo", formData.file);

        try {
            await api.post('/Maintenance/requests', payload, { headers: { 'Content-Type': 'multipart/form-data' } });
            notify.success("Đã gửi yêu cầu thành công!");
            setFormData({ apartmentId: '', categoryId: '', title: '', description: '', file: null });
            if (document.getElementById('photoUpload')) document.getElementById('photoUpload').value = '';
            fetchData();
        } catch (error) { notify.error("Lỗi gửi yêu cầu."); }
        setIsSubmitting(false);
    };

    const handleAccept = async (taskId) => {
        const { isConfirmed } = await confirmAction.fire({
            title: 'Nghiệm thu sự cố?',
            text: "Xác nhận thợ đã hoàn thành tốt công việc.",
            confirmButtonText: 'Đồng ý & Đóng thẻ'
        });
        if (isConfirmed) {
            try {
                await api.put(`/Maintenance/${taskId}/resident-accept`);
                notify.success("Đã đóng yêu cầu.");
                fetchData();
                document.getElementById('closeDetailModal')?.click();
            } catch (error) { notify.error("Lỗi xử lý."); }
        }
    };

    const handleReject = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/Maintenance/${selectedRejectId}/resident-reject`, { rejectReason });
            notify.success("Đã yêu cầu thợ làm lại.");
            document.getElementById('closeRejectModal').click();
            setRejectReason('');
            fetchData();
            document.getElementById('closeDetailModal')?.click();
        } catch (error) { notify.error("Lỗi xử lý."); }
    };

    // ==========================================
    // RENDER HELPERS
    // ==========================================
    const renderStatusBadge = (status) => {
        const s = String(status).toLowerCase();
        if (s === '1' || s === 'pending') return <span className="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 px-2 py-1 rounded-pill">Chờ phân công</span>;
        if (s === '2' || s === 'processing') return <span className="badge bg-warning bg-opacity-10 text-dark border border-warning border-opacity-25 px-2 py-1 rounded-pill text-dark">Đang sửa chữa</span>;
        if (s === '3' || s === 'fixed') return <span className="badge bg-info bg-opacity-10 text-dark border border-info border-opacity-25 px-2 py-1 rounded-pill text-dark">Chờ nghiệm thu</span>;
        if (s === '4' || s === 'closed' || s === 'resolved') return <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-2 py-1 rounded-pill">Đã hoàn tất</span>;
        if (s === '6' || s === 'reopened') return <span className="badge bg-danger text-white px-2 py-1 rounded-pill">Yêu cầu làm lại</span>;
        return <span className="badge bg-secondary rounded-pill">Đã hủy</span>;
    };

    const renderTimeline = (status) => {
        const s = String(status).toLowerCase();
        const isCanceled = s === '5' || s === 'canceled';

        const step2Active = ['2', '3', '4', '6', 'processing', 'fixed', 'closed', 'resolved', 'reopened'].includes(s);
        const step3Active = ['3', '4', 'fixed', 'closed', 'resolved'].includes(s);
        const step4Active = ['4', 'closed', 'resolved'].includes(s);

        if (isCanceled) {
            return (
                <div className="ps-2">
                    <div className="border-start border-2 border-danger ps-4 pb-4 position-relative">
                        <span className="position-absolute top-0 start-0 translate-middle badge rounded-circle bg-success p-1"><i className="bi bi-check text-white"></i></span>
                        <div className="fw-bold small text-dark">Đã gửi yêu cầu</div>
                    </div>
                    <div className="ps-4 position-relative">
                        <span className="position-absolute top-0 start-0 translate-middle badge rounded-circle bg-danger p-1"><i className="bi bi-x text-white"></i></span>
                        <div className="fw-bold small text-danger">Sự cố đã bị hủy</div>
                        <small className="text-muted fst-italic">Bởi Ban quản lý hoặc Cư dân</small>
                    </div>
                </div>
            );
        }

        return (
            <div className="ps-2 timeline-wrapper">
                <div className={`border-start border-2 ps-4 pb-4 position-relative ${step2Active ? 'border-success' : ''}`}>
                    <span className="position-absolute top-0 start-0 translate-middle badge rounded-circle bg-success p-1"><i className="bi bi-check text-white"></i></span>
                    <div className="fw-bold small text-dark">Gửi yêu cầu <span className="text-muted fw-normal ms-1">({new Date(detailTask.createDay || detailTask.CreateDay).toLocaleString('vi-VN')})</span></div>
                </div>

                <div className={`border-start border-2 ps-4 pb-4 position-relative ${step3Active ? 'border-success' : ''}`}>
                    <span className={`position-absolute top-0 start-0 translate-middle badge rounded-circle p-1 ${step2Active ? 'bg-success' : 'bg-secondary'}`}>
                        {step2Active ? <i className="bi bi-check text-white"></i> : <i className="bi bi-circle text-white"></i>}
                    </span>
                    <div className={`fw-bold small ${step2Active ? 'text-dark' : 'text-muted'}`}>
                        Tiếp nhận & Sửa chữa
                        {(s === '6' || s === 'reopened') && <span className="text-danger ms-2">(Đang làm lại)</span>}
                    </div>
                </div>

                <div className={`border-start border-2 ps-4 pb-4 position-relative ${step4Active ? 'border-success' : ''}`}>
                    <span className={`position-absolute top-0 start-0 translate-middle badge rounded-circle p-1 ${step3Active ? 'bg-success' : 'bg-secondary'}`}>
                        {step3Active ? <i className="bi bi-check text-white"></i> : <i className="bi bi-circle text-white"></i>}
                    </span>
                    <div className={`fw-bold small ${step3Active ? 'text-dark' : 'text-muted'}`}>Thợ báo cáo hoàn tất</div>
                    {detailTask.fixDay && <small className="text-muted">{new Date(detailTask.fixDay).toLocaleString('vi-VN')}</small>}
                </div>

                <div className="ps-4 position-relative">
                    <span className={`position-absolute top-0 start-0 translate-middle badge rounded-circle p-1 ${step4Active ? 'bg-success' : 'bg-secondary'}`}>
                        {step4Active ? <i className="bi bi-check text-white"></i> : <i className="bi bi-circle text-white"></i>}
                    </span>
                    <div className={`fw-bold small ${step4Active ? 'text-dark' : 'text-muted'}`}>Nghiệm thu (Đóng thẻ)</div>
                    <small className="text-muted fst-italic">{step4Active ? 'Đã nghiệm thu' : 'Chưa hoàn thành'}</small>
                </div>
            </div>
        );
    };

    return (
        // Đổi p-4 thành py-3 px-4 để tiết kiệm chiều dọc, tránh sinh scrollbar
        <div className="container-fluid py-3 px-4">
            {/* Header: Đưa về bên trái, giảm margin-bottom để tối ưu không gian */}
            <div className="mb-3">
                <h3 className="fw-bold mb-1 text-white shadow-text">
                    <i className="bi bi-wrench-adjustable-circle text-success me-2"></i> Hỗ Trợ & Bảo Trì
                </h3>
                <p className="text-white opacity-75 fw-medium">Gửi báo cáo sự cố kỹ thuật và theo dõi lịch sử xử lý</p>
            </div>

            <div className="row g-4 align-items-stretch">

                {/* FORM TẠO MỚI (CỘT TRÁI) */}
                <div className="col-xl-4 col-lg-5">
                    <div className="card border-0 shadow-lg rounded-4 bg-white h-100 flex-column d-flex overflow-hidden">
                        <div className="card-header bg-transparent border-0 pt-4 px-4 pb-2">
                            <h5 className="fw-bold mb-0 text-dark"><i className="bi bi-send-plus-fill text-success me-2"></i> Gửi Yêu Cầu Mới</h5>
                        </div>
                        <div className="card-body p-4 d-flex flex-column pt-2">
                            <form onSubmit={handleSubmit} className="d-flex flex-column h-100">
                                <div className="mb-3">
                                    <label className="form-label fw-bold small text-muted">Căn hộ của bạn *</label>
                                    <select className="form-select bg-light border-0 py-2 rounded-3" value={formData.apartmentId} onChange={e => setFormData({ ...formData, apartmentId: e.target.value })} required>
                                        <option value="">-- Chọn Căn hộ --</option>
                                        {apartments.map(a => <option key={a.apartmentId || a.ApartmentId} value={a.apartmentId || a.ApartmentId}>Phòng {a.apartmentCode || a.ApartmentCode}</option>)}
                                    </select>
                                </div>
                                <div className="mb-3">
                                    <label className="form-label fw-bold small text-muted">Loại sự cố *</label>
                                    <select className="form-select bg-light border-0 py-2 rounded-3" value={formData.categoryId} onChange={e => setFormData({ ...formData, categoryId: e.target.value })} required>
                                        <option value="">-- Chọn Danh mục --</option>
                                        {categories.map(c => <option key={c.categoryId} value={c.categoryId}>{c.categoryName}</option>)}
                                    </select>
                                </div>
                                <div className="mb-3">
                                    <label className="form-label fw-bold small text-muted">Tiêu đề sự cố *</label>
                                    <input type="text" className="form-control bg-light border-0 py-2 rounded-3" placeholder="VD: Hỏng bóng đèn hành lang..." value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} required />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label fw-bold small text-muted">Mô tả chi tiết *</label>
                                    <textarea className="form-control bg-light border-0 rounded-3" rows="3" placeholder="Mô tả hiện trạng..." value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} required></textarea>
                                </div>
                                <div className="mb-4">
                                    <label className="form-label fw-bold small text-muted">Hình ảnh đính kèm</label>
                                    <input id="photoUpload" type="file" className="form-control bg-light border-0 rounded-3 p-2 modern-file-input" accept="image/*" onChange={handleFileChange} />
                                </div>
                                <button type="submit" className="btn btn-success w-100 fw-bold rounded-pill py-2 shadow-sm mt-auto" disabled={isSubmitting}>
                                    {isSubmitting ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-cloud-arrow-up-fill me-2"></i>}
                                    {isSubmitting ? "Đang gửi..." : "Gửi Yêu Cầu"}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>

                {/* LỊCH SỬ YÊU CẦU (CỘT PHẢI) */}
                <div className="col-xl-8 col-lg-7 d-flex">
                    <div className="card border-0 shadow-lg rounded-4 bg-white flex-grow-1 d-flex flex-column overflow-hidden">
                        <div className="card-header bg-white border-0 pt-4 px-4 pb-2 d-flex justify-content-between align-items-center">
                            <h5 className="fw-bold mb-0 text-dark">Lịch sử của bạn</h5>
                            <button className="btn btn-sm btn-light border rounded-pill px-3" onClick={fetchData}><i className="bi bi-arrow-clockwise"></i></button>
                        </div>
                        <div className="card-body p-4 d-flex flex-column pt-2">
                            {loading ? (
                                <div className="text-center p-5 flex-grow-1 d-flex align-items-center justify-content-center"><div className="spinner-border text-success"></div></div>
                            ) : requests.length === 0 ? (
                                <div className="text-center p-5 text-muted flex-grow-1 d-flex align-items-center justify-content-center">
                                    <div>
                                        <i className="bi bi-inbox opacity-25 display-1 d-block mb-3"></i>
                                        Bạn chưa có yêu cầu nào.
                                    </div>
                                </div>
                            ) : (
                                <div className="d-flex flex-column flex-grow-1 justify-content-between">
                                    {/* Giảm gap xuống một chút để khít hơn */}
                                    <div className="d-flex flex-column gap-2 mb-3">
                                        {currentRequests.map((req, idx) => (
                                            <div className="card border shadow-none rounded-4 hover-shadow-sm transition-all overflow-hidden" key={req.requestId || idx}>
                                                <div className="card-body p-3">
                                                    <div className="d-flex justify-content-between align-items-start">
                                                        <div>
                                                            <span className="badge bg-light text-dark border me-2 rounded-pill">P.{req.apartmentCode || req.ApartmentCode}</span>
                                                            {renderStatusBadge(req.status || req.Status)}
                                                            <h6 className="fw-bold text-dark mt-2 mb-1">{req.title || req.Title}</h6>
                                                            <small className="text-muted"><i className="bi bi-calendar3 me-1"></i>{new Date(req.createDay || req.CreateDay).toLocaleDateString('vi-VN')}</small>
                                                        </div>
                                                        <button className="btn btn-link text-success fw-bold text-decoration-none p-0 flex-shrink-0" onClick={() => setDetailTask(req)} data-bs-toggle="modal" data-bs-target="#detailModal">
                                                            Chi tiết <i className="bi bi-chevron-right"></i>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {totalPages > 1 && (
                                        <div className="d-flex justify-content-center mt-auto">
                                            <nav>
                                                <ul className="pagination pagination-sm mb-0 shadow-sm rounded-pill overflow-hidden">
                                                    <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                                        <button className="page-link text-success border-0 px-3" onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}>Trước</button>
                                                    </li>
                                                    {[...Array(totalPages)].map((_, i) => (
                                                        <li key={i} className={`page-item ${currentPage === i + 1 ? 'active' : ''}`}>
                                                            <button className={`page-link border-0 ${currentPage === i + 1 ? 'bg-success text-white' : 'text-dark'}`} onClick={() => setCurrentPage(i + 1)}>
                                                                {i + 1}
                                                            </button>
                                                        </li>
                                                    ))}
                                                    <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                                                        <button className="page-link text-success border-0 px-3" onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}>Sau</button>
                                                    </li>
                                                </ul>
                                            </nav>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* MODAL CHI TIẾT */}
            <div className="modal fade" id="detailModal" tabIndex="-1" aria-hidden="true">
                <div className="modal-dialog modal-dialog-centered modal-xl">
                    <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
                        <div className="modal-header border-bottom px-4">
                            <h5 className="fw-bold mb-0">Chi tiết xử lý sự cố</h5>
                            <button type="button" className="btn-close" data-bs-dismiss="modal" id="closeDetailModal"></button>
                        </div>
                        <div className="modal-body p-4 bg-light">
                            {detailTask && (
                                <div className="row g-4">
                                    <div className="col-lg-7">
                                        <div className="card border-0 shadow-sm rounded-4 w-100 overflow-hidden">
                                            <div className="card-header bg-white border-bottom pt-3 pb-2 px-4">
                                                <h6 className="fw-bold text-muted small text-uppercase mb-0">Thông tin phản hồi</h6>
                                            </div>
                                            <div className="card-body custom-scrollbar p-4" style={{ height: '55vh', overflowY: 'auto' }}>
                                                <h5 className="fw-bold text-dark">{detailTask.title || detailTask.Title}</h5>
                                                <p className="text-dark small bg-light p-3 rounded-3">{detailTask.description || detailTask.Description}</p>

                                                {(detailTask.imageUrl || detailTask.ImageUrl) && (
                                                    <div className="mt-3">
                                                        <label className="fw-bold small text-muted mb-2">Hình ảnh hiện trạng:</label>
                                                        <img src={detailTask.imageUrl || detailTask.ImageUrl} alt="Lỗi" className="img-fluid rounded-3 border shadow-sm w-100" style={{ objectFit: 'contain', maxHeight: '250px' }} />
                                                    </div>
                                                )}

                                                {(detailTask.resolutionNote || detailTask.ResolutionNote) && (
                                                    <div className="mt-4 pt-3 border-top border-success border-opacity-25">
                                                        <h6 className="fw-bold text-success small text-uppercase mb-2">Báo cáo từ Thợ</h6>
                                                        <p className="small mb-3 text-dark">{detailTask.resolutionNote || detailTask.ResolutionNote}</p>

                                                        {(detailTask.fixedImageUrl || detailTask.FixedImageUrl) && (
                                                            <img src={detailTask.fixedImageUrl || detailTask.FixedImageUrl} alt="Đã sửa" className="img-fluid rounded-3 w-100 border shadow-sm" style={{ objectFit: 'contain', maxHeight: '250px' }} />
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="col-lg-5">
                                        <div className="card border-0 shadow-sm rounded-4 w-100 overflow-hidden">
                                            <div className="card-header bg-white border-bottom pt-3 pb-2 px-4">
                                                <h6 className="fw-bold small text-muted text-uppercase mb-0">Tiến độ xử lý</h6>
                                            </div>
                                            <div className="card-body custom-scrollbar p-4" style={{ height: '55vh', overflowY: 'auto' }}>
                                                {renderTimeline(detailTask.status || detailTask.Status)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                        {detailTask && (String(detailTask.status).toLowerCase() === '3' || String(detailTask.status).toLowerCase() === 'fixed') && (
                            <div className="modal-footer bg-white border-top px-4 py-3 d-flex justify-content-end gap-2">
                                <button className="btn btn-outline-danger rounded-pill fw-bold px-4" data-bs-toggle="modal" data-bs-target="#rejectModalResident" onClick={() => setSelectedRejectId(detailTask.requestId || detailTask.RequestId)}>Chưa đạt</button>
                                <button className="btn btn-success rounded-pill fw-bold px-4" onClick={() => handleAccept(detailTask.requestId || detailTask.RequestId)}>Xác nhận & Đóng thẻ</button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* MODAL TỪ CHỐI */}
            <div className="modal fade" id="rejectModalResident" tabIndex="-1" aria-hidden="true">
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
                        <div className="modal-header bg-danger text-white border-0 px-4 py-3">
                            <h5 className="modal-title fw-bold">Yêu cầu xử lý lại</h5>
                            <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal" id="closeRejectModal"></button>
                        </div>
                        <form onSubmit={handleReject}>
                            <div className="modal-body p-4">
                                <label className="form-label fw-bold small">Lý do chưa đạt yêu cầu *</label>
                                <textarea className="form-control bg-light border-0 rounded-3" rows="4" placeholder="VD: Nước vẫn rỉ, bóng đèn vẫn chập chờn..." value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} required></textarea>
                            </div>
                            <div className="modal-footer bg-light border-0 px-4 py-3">
                                <button type="button" className="btn btn-white border rounded-pill px-4" data-bs-dismiss="modal" onClick={() => document.getElementById('closeDetailModal')?.click()}>Hủy</button>
                                <button type="submit" className="btn btn-danger rounded-pill px-4 fw-bold">Gửi yêu cầu</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            <style>{`
                .shadow-text { text-shadow: 1px 1px 2px rgba(0,0,0,0.5); }
                .transition-all { transition: all 0.2s ease-in-out; }
                .hover-shadow-sm:hover { transform: translateY(-2px); box-shadow: 0 .125rem .25rem rgba(0,0,0,.075)!important; border-color: #198754 !important; }
                
                .modern-file-input::file-selector-button {
                    background-color: #6c757d !important;
                    color: white !important;
                    border: none !important;
                    padding: 6px 12px !important;
                    border-radius: 6px !important;
                    margin: 0 12px 0 0 !important;
                    cursor: pointer;
                    font-size: 13px;
                    font-weight: 600;
                    transition: 0.3s;
                }
                .modern-file-input::file-selector-button:hover { background-color: #5c636a !important; }
                
                .timeline-wrapper .badge { font-size: 12px; }
                
                .custom-scrollbar::-webkit-scrollbar { width: 5px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
            `}</style>
        </div>
    );
};

export default MaintenanceRequest;