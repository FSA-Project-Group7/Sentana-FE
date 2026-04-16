import React, { useState, useEffect } from 'react';
import api from '../../utils/axiosConfig';
import Pagination from '../../components/common/Pagination';
import { notify, confirmAction } from '../../utils/notificationAlert';
import { useSignalR } from '../../hooks/useSignalR';

const MaintenanceRequest = () => {
    const [requests, setRequests] = useState([]);
    const [apartments, setApartments] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [reloadTrigger, setReloadTrigger] = useState(0);

    const [formData, setFormData] = useState({ apartmentId: '', categoryId: '', title: '', description: '', file: null });
    const [rejectReason, setRejectReason] = useState('');
    const [selectedRejectId, setSelectedRejectId] = useState(null);
    const [detailTask, setDetailTask] = useState(null);

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 3;

    const connection = useSignalR();

    // 1. Lắng nghe SignalR - Chỉ kích hoạt reload, không gọi notify để tránh double popup
    useEffect(() => {
        if (!connection) return;

        const refreshData = () => setReloadTrigger(prev => prev + 1);

        connection.on("ReceiveAssignedTask", refreshData);
        connection.on("TaskProcessing", refreshData);
        connection.on("ReceiveFixedTask", refreshData);
        connection.on("TaskClosed", refreshData);

        return () => {
            connection.off("ReceiveAssignedTask", refreshData);
            connection.off("TaskProcessing", refreshData);
            connection.off("ReceiveFixedTask", refreshData);
            connection.off("TaskClosed", refreshData);
        };
    }, [connection]);

    // 2. Fetch Data
    const fetchData = async () => {
        setLoading(true);
        try {
            const [reqRes, aptRes] = await Promise.all([
                api.get('/Maintenance/my-requests'),
                api.get('/Maintenance/my-apartments')
            ]);

            setRequests(reqRes.data?.data || reqRes.data?.Data || []);
            if (reloadTrigger === 0) setCurrentPage(1);

            setApartments(aptRes.data?.data || aptRes.data?.Data || []);
            setCategories([
                { categoryId: 1, categoryName: 'Sự cố Nước / Ống nước' },
                { categoryId: 2, categoryName: 'Sự cố Điện / Chập cháy' },
                { categoryId: 3, categoryName: 'Hư hỏng Nội thất' },
                { categoryId: 4, categoryName: 'Sự cố Khác' }
            ]);
        } catch (error) {
            notify.error("Không thể tải dữ liệu.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [reloadTrigger]);

    // Tính toán phân trang
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentRequests = requests.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(requests.length / itemsPerPage);

    // 3. Handlers
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
        if (!formData.apartmentId || !formData.categoryId || !formData.title.trim()) {
            return notify.warning("Vui lòng điền đủ thông tin!");
        }

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

            setReloadTrigger(prev => prev + 1);
        } catch (error) {
            notify.error("Lỗi gửi yêu cầu.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAccept = async (taskId) => {
        const { isConfirmed } = await confirmAction.fire({
            title: 'Nghiệm thu sự cố?',
            text: "Xác nhận thợ đã hoàn thành tốt công việc.",
            confirmButtonText: 'Đồng ý & Đóng thẻ',
            cancelButtonText: 'Hủy'
        });

        if (isConfirmed) {
            try {
                await api.put(`/Maintenance/${taskId}/resident-accept`);
                notify.success("Đã đóng yêu cầu thành công.");
                document.getElementById('closeDetailModal')?.click();
                setReloadTrigger(prev => prev + 1);
            } catch (error) {
                notify.error("Lỗi xử lý nghiệm thu.");
            }
        }
    };

    const handleReject = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/Maintenance/${selectedRejectId}/resident-reject`, { rejectReason });
            notify.success("Đã yêu cầu thợ làm lại.");

            document.getElementById('closeRejectModal')?.click();
            document.getElementById('closeDetailModal')?.click();
            setRejectReason('');
            setReloadTrigger(prev => prev + 1);
        } catch (error) {
            notify.error("Lỗi xử lý yêu cầu làm lại.");
        }
    };

    // Chuẩn hóa Enum Status thành số
    const getStatusNumber = (status) => {
        const s = String(status).toLowerCase();
        if (s === '1' || s === 'pending') return 1;
        if (s === '2' || s === 'processing' || s === 'accepted') return 2;
        if (s === '3' || s === 'fixed' || s === 'inprogress') return 3;
        if (s === '4' || s === 'closed' || s === 'resolved') return 4;
        if (s === '5' || s === 'reopened') return 5;
        return 99;
    };

    const renderStatusBadge = (status) => {
        const s = getStatusNumber(status);
        if (s === 1) return <span className="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 px-2 py-1 rounded-pill">Chờ xử lý</span>;
        if (s === 2) return <span className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 px-2 py-1 rounded-pill">Đang xử lý</span>;
        if (s === 3) return <span className="badge bg-info bg-opacity-10 text-dark border border-info border-opacity-25 px-2 py-1 rounded-pill">Chờ nghiệm thu</span>;
        if (s === 4) return <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-2 py-1 rounded-pill">Hoàn thành</span>;
        if (s === 5) return <span className="badge bg-warning text-dark px-2 py-1 rounded-pill">Đang làm lại</span>;
        return <span className="badge bg-secondary rounded-pill">Khác</span>;
    };

    const renderTimeline = (status) => {
        const s = getStatusNumber(status);
        const isCanceled = String(status).toLowerCase() === 'canceled';

        const step2Active = s >= 2 && s !== 99;
        const step3Active = s >= 3 && s !== 99;
        const step4Active = s === 4;

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
                    <div className="fw-bold small text-dark">Gửi yêu cầu
                        {detailTask && <span className="text-muted fw-normal ms-1">({new Date(detailTask.createDay || detailTask.CreateDay || detailTask.createdAt).toLocaleString('vi-VN')})</span>}
                    </div>
                </div>

                <div className={`border-start border-2 ps-4 pb-4 position-relative ${step3Active ? 'border-success' : ''}`}>
                    <span className={`position-absolute top-0 start-0 translate-middle badge rounded-circle p-1 ${step2Active ? 'bg-success' : 'bg-secondary'}`}>
                        {step2Active ? <i className="bi bi-check text-white"></i> : <i className="bi bi-circle text-white"></i>}
                    </span>
                    <div className={`fw-bold small ${step2Active ? 'text-dark' : 'text-muted'}`}>
                        Tiếp nhận & Sửa chữa
                        {s === 5 && <span className="text-warning ms-2">(Đang làm lại)</span>}
                    </div>
                </div>

                <div className={`border-start border-2 ps-4 pb-4 position-relative ${step4Active ? 'border-success' : ''}`}>
                    <span className={`position-absolute top-0 start-0 translate-middle badge rounded-circle p-1 ${step3Active ? 'bg-success' : 'bg-secondary'}`}>
                        {step3Active ? <i className="bi bi-check text-white"></i> : <i className="bi bi-circle text-white"></i>}
                    </span>
                    <div className={`fw-bold small ${step3Active ? 'text-dark' : 'text-muted'}`}>Thợ báo cáo hoàn tất</div>
                    {detailTask?.fixDay && step3Active && <small className="text-muted">{new Date(detailTask.fixDay).toLocaleString('vi-VN')}</small>}
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
        <div className="container-fluid py-3 px-4">
            <div className="mb-3">
                <h3 className="fw-bold mb-1 text-white shadow-text">
                    <i className="bi bi-wrench-adjustable-circle text-success me-2"></i> Hỗ Trợ & Bảo Trì
                </h3>
                <p className="text-white opacity-75 fw-medium">Gửi báo cáo sự cố kỹ thuật và theo dõi lịch sử xử lý</p>
            </div>

            <div className="row g-4 align-items-stretch">
                {/* FORM TẠO MỚI */}
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
                                    <label className="form-label fw-bold small text-muted">Hình ảnh đính kèm (Tùy chọn)</label>
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

                {/* LỊCH SỬ YÊU CẦU */}
                <div className="col-xl-8 col-lg-7 d-flex">
                    <div className="card border-0 shadow-lg rounded-4 bg-white flex-grow-1 d-flex flex-column overflow-hidden">
                        <div className="card-header bg-white border-0 pt-4 px-4 pb-2 d-flex justify-content-between align-items-center">
                            <h5 className="fw-bold mb-0 text-dark">Lịch sử của bạn</h5>
                            <button className="btn btn-sm btn-light border rounded-pill px-3" onClick={() => setReloadTrigger(prev => prev + 1)}><i className="bi bi-arrow-clockwise"></i> Làm mới</button>
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
                                    <div className="d-flex flex-column gap-2 mb-3">
                                        {currentRequests.map((req, idx) => (
                                            <div className="card border shadow-none rounded-4 hover-shadow-sm transition-all overflow-hidden" key={req.requestId || idx}>
                                                <div className="card-body p-3">
                                                    <div className="d-flex justify-content-between align-items-start">
                                                        <div>
                                                            <span className="badge bg-light text-dark border me-2 rounded-pill">P.{req.apartmentCode || req.ApartmentCode}</span>
                                                            {renderStatusBadge(req.status || req.Status)}
                                                            <h6 className="fw-bold text-dark mt-2 mb-1">{req.title || req.Title}</h6>
                                                            <small className="text-muted"><i className="bi bi-calendar3 me-1"></i>{new Date(req.createDay || req.CreateDay || req.createdAt).toLocaleDateString('vi-VN')}</small>
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
                                            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
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
                                                        <h6 className="fw-bold text-success small text-uppercase mb-2">Báo cáo từ Kỹ thuật viên</h6>
                                                        <p className="small mb-3 text-dark" style={{ whiteSpace: 'pre-wrap' }}>{detailTask.resolutionNote || detailTask.ResolutionNote}</p>

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

                        {/* Khu vực nút Nghiệm thu (Chỉ hiện khi trạng thái = 3 / Fixed) */}
                        {detailTask && getStatusNumber(detailTask.status || detailTask.Status) === 3 && (
                            <div className="modal-footer bg-white border-top px-4 py-3 d-flex justify-content-end gap-2">
                                <button className="btn btn-outline-danger rounded-pill fw-bold px-4" data-bs-toggle="modal" data-bs-target="#rejectModalResident" onClick={() => setSelectedRejectId(detailTask.requestId || detailTask.RequestId)}>
                                    Chưa đạt (Làm lại)
                                </button>
                                <button className="btn btn-success rounded-pill fw-bold px-4 shadow-sm" onClick={() => handleAccept(detailTask.requestId || detailTask.RequestId)}>
                                    <i className="bi bi-check-all me-1"></i> Xác nhận & Đóng thẻ
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* MODAL TỪ CHỐI / YÊU CẦU LÀM LẠI */}
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
                                <button type="button" className="btn btn-white border rounded-pill px-4" data-bs-dismiss="modal">Hủy bỏ</button>
                                <button type="submit" className="btn btn-danger rounded-pill px-4 fw-bold shadow-sm">Gửi yêu cầu</button>
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