import React, { useState, useEffect } from 'react';
import api from '../../utils/axiosConfig';
import { notify } from '../../utils/notificationAlert';
import { useSignalR } from '../../hooks/useSignalR';
import Pagination from '../../components/common/Pagination';

const TechnicianTasks = () => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [reloadTrigger, setReloadTrigger] = useState(0);

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    const [selectedTask, setSelectedTask] = useState(null);
    const [resolutionNote, setResolutionNote] = useState('');
    const [photo, setPhoto] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const connection = useSignalR();

    useEffect(() => {
        if (!connection) return;
        const refreshData = () => setReloadTrigger(prev => prev + 1);

        connection.on("ReceiveAssignedTask", refreshData);
        connection.on("TaskRejectedByManager", refreshData);
        connection.on("TaskClosed", refreshData);

        return () => {
            connection.off("ReceiveAssignedTask", refreshData);
            connection.off("TaskRejectedByManager", refreshData);
            connection.off("TaskClosed", refreshData);
        };
    }, [connection]);

    const fetchTasks = async (page) => {
        try {
            setLoading(true);
            const res = await api.get('/Maintenance/assigned-to-me', {
                params: { pageIndex: page, pageSize: 20 }
            });
            const data = res.data?.data || res.data;
            setTasks(Array.isArray(data?.items) ? data.items : []);

            const totalCount = Number(data?.totalCount || 0);
            const calcPages = Math.ceil(totalCount / 20);
            setTotalPages(calcPages >= 1 ? calcPages : 1);
        } catch (error) {
            notify.error("Không thể tải danh sách công việc.");
            setTasks([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTasks(currentPage);
    }, [currentPage, reloadTrigger]);

    // =========================================================
    // HELPER: Đồng bộ dữ liệu Backend thành Số
    // =========================================================
    const getStatusNumber = (status) => {
        const s = String(status).toLowerCase();
        if (s === '1' || s === 'pending') return 1;
        if (s === '2' || s === 'processing' || s === 'inprogress') return 2;
        if (s === '3' || s === 'fixed') return 3;
        if (s === '4' || s === 'closed' || s === 'resolved') return 4;
        if (s === '5' || s === '6' || s === 'reopened' || s === 'rejected') return 5;
        return 99;
    };

    // TRỌNG SỐ SẮP XẾP: Ép mã 5 (Làm lại) thành số 0 để nó trồi lên trên cùng!
    const getSortWeight = (status) => {
        const s = getStatusNumber(status);
        if (s === 5) return 0; // Trọng số cao nhất
        return s; // 1, 2, 3, 4, 99 giữ nguyên
    };

    const getPriorityNumber = (priority) => {
        const p = String(priority).toLowerCase();
        if (p === '4' || p === 'emergency') return 4;
        if (p === '3' || p === 'high') return 3;
        if (p === '2' || p === 'medium') return 2;
        if (p === '1' || p === 'low') return 1;
        return 0;
    };

    // =========================================================
    // THUẬT TOÁN LỌC VÀ SẮP XẾP CHUẨN XÁC
    // =========================================================
    const filteredAndSortedTasks = tasks.filter(task => {
        const matchSearch = (task.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (task.apartmentCode || task.apartmentName || '').toLowerCase().includes(searchTerm.toLowerCase());
        const taskStatusNum = getStatusNumber(task.status);
        const matchStatus = statusFilter === 'all' || taskStatusNum === parseInt(statusFilter);
        return matchSearch && matchStatus;
    }).sort((a, b) => {
        // 1. Sắp xếp theo trạng thái (Làm lại (5->0) -> Chờ nhận (1) -> Đang xử lý (2))
        const weightA = getSortWeight(a.status);
        const weightB = getSortWeight(b.status);
        if (weightA !== weightB) return weightA - weightB;

        // 2. Cùng trạng thái -> Khẩn cấp lên trước
        const prioA = getPriorityNumber(a.priority);
        const prioB = getPriorityNumber(b.priority);
        if (prioA !== prioB) return prioB - prioA;

        // 3. Cùng trạng thái & cùng ưu tiên -> Mới nhất lên trước
        return new Date(b.createDay || b.createdAt || 0) - new Date(a.createDay || a.createdAt || 0);
    });

    // =========================================================
    // API ACTIONS
    // =========================================================
    const handleStartTask = async (taskId) => {
        try {
            await api.put(`/Maintenance/${taskId}/start`);
            notify.success("Đã tiếp nhận công việc thành công!");
            setReloadTrigger(prev => prev + 1);
        } catch (error) {
            notify.error(error.response?.data?.message || "Lỗi khi nhận việc.");
        }
    };

    const handleFinishTask = async (e) => {
        e.preventDefault();
        if (!resolutionNote.trim()) return notify.error("Vui lòng nhập ghi chú khắc phục!");

        setIsSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('ResolutionNote', resolutionNote);
            if (photo) formData.append('Photo', photo);

            await api.put(`/Maintenance/${selectedTask.requestId}/fix`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            notify.success("Đã báo cáo hoàn tất công việc!");
            document.getElementById('closeFixModal')?.click();
            setResolutionNote('');
            setPhoto(null);
            setReloadTrigger(prev => prev + 1);
        } catch (error) {
            notify.error(error.response?.data?.message || "Lỗi khi hoàn tất công việc.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const openFixModal = (task) => {
        setSelectedTask(task);
        setResolutionNote('');
        setPhoto(null);
    };

    const handlePhotoChange = (e) => {
        if (e.target.files && e.target.files[0]) setPhoto(e.target.files[0]);
    };

    // =========================================================
    // UI RENDER HELPERS
    // =========================================================
    const renderStatus = (status) => {
        const s = getStatusNumber(status);
        if (s === 1) return <span className="badge bg-warning text-dark"><i className="bi bi-hand-index-thumb me-1"></i> Chờ nhận việc</span>;
        if (s === 2) return <span className="badge bg-primary text-white"><i className="bi bi-tools me-1"></i> Đang xử lý</span>;
        if (s === 3) return <span className="badge bg-info text-dark"><i className="bi bi-card-checklist me-1"></i> Chờ nghiệm thu</span>;
        if (s === 4) return <span className="badge bg-success text-white"><i className="bi bi-check2-all me-1"></i> Đã hoàn tất</span>;
        if (s === 5) return <span className="badge bg-danger text-white shadow-sm"><i className="bi bi-exclamation-triangle-fill me-1"></i> Yêu cầu làm lại</span>;
        return <span className="badge bg-secondary">Khác</span>;
    };

    const renderPriorityText = (priority) => {
        const p = getPriorityNumber(priority);
        if (p === 1) return <span className="badge bg-secondary bg-opacity-10 text-secondary border">Thấp</span>;
        if (p === 2) return <span className="badge bg-primary bg-opacity-10 text-primary border">Bình thường</span>;
        if (p === 3) return <span className="badge bg-warning bg-opacity-10 text-warning border">Cao</span>;
        if (p === 4) return <span className="badge bg-danger bg-opacity-10 text-danger border">Khẩn cấp</span>;
        return null;
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Chưa có';
        const d = new Date(dateString);
        return `${d.toLocaleDateString('vi-VN')} ${d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;
    };

    return (
        <div className="container-fluid p-0 pb-5">
            <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
                <div>
                    <h4 className="fw-bold mb-0 text-dark">
                        <i className="bi bi-list-task text-warning me-2"></i> Công Việc Của Tôi
                    </h4>
                    <div className="text-muted small mt-1">Danh sách các sự cố được phân công xử lý</div>
                </div>

                <div className="d-flex gap-2 align-items-center flex-wrap">
                    <div className="input-group shadow-sm" style={{ width: '250px' }}>
                        <span className="input-group-text bg-white border-end-0"><i className="bi bi-search text-muted"></i></span>
                        <input type="text" className="form-control border-start-0" placeholder="Tìm tên, phòng..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                    </div>
                    <select className="form-select shadow-sm" style={{ width: '180px' }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                        <option value="all">Tất cả trạng thái</option>
                        <option value="5">Yêu cầu làm lại</option>
                        <option value="1">Chờ nhận việc</option>
                        <option value="2">Đang xử lý</option>
                        <option value="3">Chờ nghiệm thu</option>
                        <option value="4">Đã hoàn thành</option>
                    </select>
                    <button className="btn btn-white border shadow-sm fw-bold rounded" onClick={() => setReloadTrigger(prev => prev + 1)}>
                        <i className="bi bi-arrow-clockwise"></i>
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="text-center p-5"><div className="spinner-border text-warning"></div></div>
            ) : filteredAndSortedTasks.length === 0 ? (
                <div className="card border-0 shadow-sm rounded-4 p-5 text-center bg-white">
                    <i className="bi bi-clipboard-x display-1 text-secondary mb-3 opacity-25"></i>
                    <h5 className="fw-bold text-muted">Không tìm thấy công việc nào phù hợp!</h5>
                </div>
            ) : (
                <div className="row g-4">
                    {filteredAndSortedTasks.map(task => {
                        const taskStatus = getStatusNumber(task.status);
                        const isDone = taskStatus === 4;

                        return (
                            <div className="col-12 col-md-6 col-xl-4" key={task.requestId}>
                                <div className={`card border-0 shadow-sm rounded-4 h-100 transition-all hover-card-tech ${isDone ? 'opacity-75 bg-light' : taskStatus === 5 ? 'border-danger border-2' : 'bg-white'}`}>
                                    <div className="card-body p-4 d-flex flex-column">
                                        <div className="d-flex justify-content-between align-items-start mb-3">
                                            <div className="badge bg-dark bg-opacity-10 text-dark border px-2 py-1 rounded-3">
                                                <i className="bi bi-door-open-fill me-1 text-warning"></i>
                                                P.{task.apartmentCode || task.apartmentName || 'N/A'}
                                            </div>
                                            {renderPriorityText(task.priority)}
                                        </div>

                                        <h5 className="fw-bold text-dark mb-2">{task.title}</h5>
                                        <p className="text-muted small mb-3 flex-grow-1" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                            {task.description || "Không có mô tả chi tiết."}
                                        </p>

                                        <div className="d-flex align-items-center justify-content-between text-muted small fw-medium pt-3 border-top mb-3">
                                            <span>{renderStatus(task.status)}</span>
                                            <span><i className="bi bi-calendar-event me-1"></i>{new Date(task.createDay || task.createdAt || task.updatedAt).toLocaleDateString('vi-VN')}</span>
                                        </div>

                                        <div className="d-flex gap-2 mt-auto">
                                            <button
                                                className={`btn border fw-bold shadow-sm rounded-3 flex-grow-0 px-3 ${taskStatus === 5 ? 'btn-danger text-white' : 'btn-light text-primary'}`}
                                                title="Xem chi tiết"
                                                onClick={() => setSelectedTask(task)}
                                                data-bs-toggle="modal"
                                                data-bs-target="#techDetailModal"
                                            >
                                                <i className="bi bi-eye"></i>
                                            </button>

                                            {taskStatus === 1 && (
                                                <button className="btn btn-primary text-white flex-grow-1 fw-bold shadow-sm rounded-3" onClick={() => handleStartTask(task.requestId)}>
                                                    <i className="bi bi-hand-index-thumb me-2"></i> Nhận việc
                                                </button>
                                            )}

                                            {(taskStatus === 2 || taskStatus === 5) && (
                                                <button
                                                    className={`btn border flex-grow-1 fw-bold shadow-sm rounded-3 ${taskStatus === 5 ? 'btn-danger text-white border-danger' : 'btn-warning text-dark'}`}
                                                    onClick={() => openFixModal(task)}
                                                    data-bs-toggle="modal"
                                                    data-bs-target="#fixTaskModal"
                                                >
                                                    <i className={`bi ${taskStatus === 5 ? 'bi-tools' : 'bi-check-circle'} me-2`}></i>
                                                    {taskStatus === 5 ? 'Khắc phục lại' : 'Báo cáo xong'}
                                                </button>
                                            )}

                                            {taskStatus === 3 && (
                                                <button className="btn btn-info text-dark flex-grow-1 fw-bold rounded-3 opacity-75" disabled>
                                                    Chờ nghiệm thu
                                                </button>
                                            )}

                                            {taskStatus === 4 && (
                                                <button className="btn btn-light border text-success flex-grow-1 fw-bold rounded-3" disabled>
                                                    Đã hoàn thành
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {totalPages > 1 && !isNaN(totalPages) && (
                <div className="d-flex justify-content-end mt-4">
                    <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                </div>
            )}

            {/* MODAL: CHI TIẾT SỰ CỐ */}
            <div className="modal fade" id="techDetailModal" tabIndex="-1" aria-hidden="true">
                <div className="modal-dialog modal-dialog-centered modal-xl modal-dialog-scrollable">
                    <div className="modal-content border-0 shadow-lg rounded-4 bg-light">
                        <div className="modal-header border-bottom bg-white px-4 py-3 rounded-top-4">
                            <div className="d-flex align-items-center gap-3">
                                <h5 className="fw-bold mb-0 text-dark">Chi Tiết Sự Cố #{selectedTask?.requestId}</h5>
                                {selectedTask && renderStatus(selectedTask.status)}
                            </div>
                            <button type="button" className="btn-close" data-bs-dismiss="modal"></button>
                        </div>

                        <div className="modal-body p-4">
                            {selectedTask && (
                                <div className="row g-4">
                                    <div className="col-lg-7">
                                        <div className="card border-0 shadow-sm rounded-4 h-100">
                                            <div className="card-body p-4">
                                                <h4 className="fw-bold text-primary mb-3">{selectedTask.title}</h4>

                                                <div className="d-flex align-items-center mb-3">
                                                    <div className="bg-light rounded-circle p-2 me-3 text-secondary">
                                                        <i className="bi bi-geo-alt fs-4"></i>
                                                    </div>
                                                    <div>
                                                        <div className="text-muted small text-uppercase fw-bold">Vị trí & Người báo cáo</div>
                                                        <div className="fw-semibold fs-6 text-dark">
                                                            Phòng {selectedTask.apartmentCode || selectedTask.apartmentName}
                                                            {selectedTask.residentName && selectedTask.residentName.trim() !== '' && (
                                                                <span className="text-muted fw-normal ms-2">({selectedTask.residentName})</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="d-flex align-items-center mb-4">
                                                    <div className="bg-light rounded-circle p-2 me-3 text-secondary">
                                                        <i className="bi bi-clock-history fs-4"></i>
                                                    </div>
                                                    <div>
                                                        <div className="text-muted small text-uppercase fw-bold">Thời gian yêu cầu</div>
                                                        <div className="fw-semibold text-dark">{formatDate(selectedTask.createDay || selectedTask.createdAt)}</div>
                                                    </div>
                                                </div>

                                                <div className="mb-4">
                                                    <div className="text-muted small text-uppercase fw-bold mb-2">Mô tả chi tiết từ cư dân</div>
                                                    <div className="p-3 bg-light rounded-3 text-secondary border" style={{ whiteSpace: 'pre-wrap', fontSize: '15px' }}>
                                                        {selectedTask.description || "Không có mô tả chi tiết."}
                                                    </div>
                                                </div>

                                                {selectedTask.resolutionNote && (
                                                    <div className="mt-4">
                                                        <div className="text-danger small text-uppercase fw-bold mb-2 d-flex align-items-center">
                                                            <i className="bi bi-exclamation-triangle-fill me-2"></i> Lịch sử xử lý & Lời nhắn
                                                        </div>
                                                        <div className="p-3 bg-danger bg-opacity-10 border border-danger-subtle rounded-3 text-dark fw-medium" style={{ whiteSpace: 'pre-wrap' }}>
                                                            {selectedTask.resolutionNote}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="col-lg-5">
                                        <div className="card border-0 shadow-sm rounded-4 h-100">
                                            <div className="card-body p-3 d-flex flex-column">
                                                <div className="text-muted small text-uppercase fw-bold mb-3">Ảnh đính kèm từ cư dân</div>
                                                {selectedTask.imageUrl ? (
                                                    <div className="rounded-3 overflow-hidden shadow-sm flex-grow-1 bg-dark">
                                                        <img
                                                            src={selectedTask.imageUrl}
                                                            alt="Sự cố"
                                                            className="img-fluid w-100 h-100"
                                                            style={{ objectFit: 'contain', minHeight: '300px' }}
                                                            onError={(e) => { e.target.src = 'https://via.placeholder.com/400x300?text=Lỗi+tải+ảnh' }}
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="flex-grow-1 d-flex flex-column justify-content-center align-items-center bg-light border border-dashed rounded-3 text-muted">
                                                        <i className="bi bi-images display-6 mb-2 opacity-25"></i>
                                                        <span className="small">Không có ảnh đính kèm</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="modal-footer border-top bg-white rounded-bottom-4 px-4 py-3">
                            <button type="button" className="btn btn-secondary rounded-pill px-4 fw-medium" data-bs-dismiss="modal">Đóng</button>
                        </div>
                    </div>
                </div>
            </div>

            {/* MODAL: BÁO CÁO HOÀN TẤT LẠI */}
            <div className="modal fade" id="fixTaskModal" tabIndex="-1" aria-hidden="true">
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content border-0 shadow-lg rounded-4">
                        <div className="modal-header bg-warning border-0 px-4 py-3 rounded-top-4">
                            <h5 className="modal-title fw-bold text-dark">
                                <i className="bi bi-clipboard-check me-2"></i> Báo cáo khắc phục
                            </h5>
                            <button type="button" className="btn-close" data-bs-dismiss="modal" id="closeFixModal"></button>
                        </div>
                        <form onSubmit={handleFinishTask}>
                            <div className="modal-body p-4">
                                {selectedTask && (
                                    <div className="alert bg-warning bg-opacity-10 border border-warning border-opacity-25 text-dark mb-4 rounded-3">
                                        Báo cáo sửa chữa: <strong className="fw-bold">{selectedTask.title}</strong> - Phòng <strong className="fw-bold">{selectedTask.apartmentCode || selectedTask.apartmentName}</strong>.
                                    </div>
                                )}

                                <div className="mb-3">
                                    <label className="form-label fw-bold text-dark">Ghi chú khắc phục <span className="text-danger">*</span></label>
                                    <textarea className="form-control bg-light" rows="3" placeholder="Ví dụ: Đã khắc phục triệt để lỗi trước đó..." value={resolutionNote} onChange={(e) => setResolutionNote(e.target.value)} required></textarea>
                                </div>

                                <div className="mb-3">
                                    <label className="form-label fw-bold text-dark">Ảnh hiện trạng sau khi sửa (Tùy chọn)</label>
                                    <input type="file" className="form-control bg-light" accept="image/*" onChange={handlePhotoChange} />
                                </div>
                            </div>
                            <div className="modal-footer bg-light border-0 px-4 py-3 rounded-bottom-4">
                                <button type="button" className="btn btn-white border px-4 rounded-pill fw-medium" data-bs-dismiss="modal">Hủy</button>
                                <button type="submit" className="btn btn-warning text-dark px-4 fw-bold rounded-pill shadow-sm" disabled={isSubmitting}>
                                    {isSubmitting ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-send-check-fill me-2"></i>}
                                    Gửi báo cáo
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            <style>{`
                .transition-all { transition: all 0.3s ease; }
                .hover-card-tech:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 0.5rem 1rem rgba(0,0,0,0.1) !important;
                }
                .border-dashed { border-style: dashed !important; border-width: 2px !important; }
            `}</style>
        </div>
    );
};

export default TechnicianTasks;