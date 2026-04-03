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
    const [reloadTrigger, setReloadTrigger] = useState(0); // Trigger an toàn để reload data

    // State cho Modal Báo cáo hoàn tất
    const [selectedTask, setSelectedTask] = useState(null);
    const [resolutionNote, setResolutionNote] = useState('');
    const [photo, setPhoto] = useState(null); // Thêm state lưu file ảnh đính kèm
    const [isSubmitting, setIsSubmitting] = useState(false);

    const connection = useSignalR();

    // ==========================================
    // 1. SIGNALR: LẮNG NGHE AN TOÀN (KHÔNG GÂY LỖI ABORT)
    // ==========================================
    useEffect(() => {
        if (!connection) return;

        const handleAssigned = (newTask) => {
            notify.warning(`🛠️ Quản lý vừa giao cho bạn 1 công việc mới: ${newTask.title}`);
            setReloadTrigger(prev => prev + 1);
        };

        const handleRejected = (rejectedTask) => {
            notify.error(`❌ Sự cố "${rejectedTask.title}" chưa đạt, yêu cầu làm lại!`);
            setReloadTrigger(prev => prev + 1);
        };

        // Gỡ event cũ trước khi gán mới
        connection.off("ReceiveAssignedTask", handleAssigned);
        connection.off("TaskRejectedByManager", handleRejected);

        // Đăng ký event
        connection.on("ReceiveAssignedTask", handleAssigned);
        connection.on("TaskRejectedByManager", handleRejected);

        return () => {
            connection.off("ReceiveAssignedTask", handleAssigned);
            connection.off("TaskRejectedByManager", handleRejected);
        };
    }, [connection]);

    // ==========================================
    // 2. FETCH DANH SÁCH CÔNG VIỆC
    // ==========================================
    const fetchTasks = async (page) => {
        try {
            setLoading(true);
            const res = await api.get('/Maintenance/assigned-to-me', {
                params: { pageIndex: page, pageSize: 10 }
            });
            const data = res.data?.data || res.data;
            const itemsList = Array.isArray(data?.items) ? data.items : [];
            setTasks(itemsList);

            // Tính phân trang an toàn chống RangeError
            const totalCount = Number(data?.totalCount || 0);
            const calcPages = Math.ceil(totalCount / 10);
            setTotalPages(calcPages >= 1 ? calcPages : 1);
        } catch (error) {
            notify.error("Không thể tải danh sách công việc.");
            setTasks([]);
            setTotalPages(1);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTasks(currentPage);
    }, [currentPage, reloadTrigger]);

    // ==========================================
    // 3. HANDLERS: XỬ LÝ NGHIỆP VỤ
    // ==========================================
    const handleStartTask = async (taskId) => {
        try {
            await api.put(`/Maintenance/${taskId}/start`);
            notify.info("Đã cập nhật trạng thái: Đang xử lý");
            setReloadTrigger(prev => prev + 1);
        } catch (error) {
            notify.error(error.response?.data?.message || "Lỗi khi bắt đầu công việc.");
        }
    };

    // FIX LỖI 400 BAD REQUEST: SỬ DỤNG FORMDATA
    const handleFinishTask = async (e) => {
        e.preventDefault();
        if (!resolutionNote.trim()) return notify.error("Vui lòng nhập ghi chú khắc phục!");

        setIsSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('ResolutionNote', resolutionNote);
            if (photo) {
                formData.append('Photo', photo); // 'Photo' phải khớp chữ hoa/thường bên C# DTO
            }

            await api.put(`/Maintenance/${selectedTask.requestId}/fix`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            notify.success("Đã báo cáo hoàn tất công việc!");

            // Đóng modal & dọn dẹp
            document.getElementById('closeFixModal').click();
            setResolutionNote('');
            setPhoto(null);

            // Tải lại dữ liệu
            setReloadTrigger(prev => prev + 1);

        } catch (error) {
            console.error(error);
            notify.error(error.response?.data?.message || "Lỗi khi hoàn tất công việc.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const openFixModal = (task) => {
        setSelectedTask(task);
        setResolutionNote('');
        setPhoto(null); // Reset ảnh khi mở lại modal
    };

    const handlePhotoChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setPhoto(e.target.files[0]);
        }
    };

    // ==========================================
    // RENDER HELPERS
    // ==========================================
    const renderStatus = (status) => {
        const s = String(status).toLowerCase();

        if (s === '1' || s === 'pending')
            return <span className="badge bg-danger text-white"><i className="bi bi-clock me-1"></i> Chờ xử lý</span>;

        if (s === '2' || s === 'inprogress' || s === 'processing' || s === 'accepted')
            return <span className="badge bg-warning text-dark"><i className="bi bi-tools me-1"></i> Đang bảo trì</span>;

        if (s === '3' || s === 'fixed')
            return <span className="badge bg-info text-dark"><i className="bi bi-card-checklist me-1"></i> Chờ nghiệm thu</span>;

        if (s === '4' || s === 'resolved' || s === 'closed')
            return <span className="badge bg-success text-white"><i className="bi bi-check-all me-1"></i> Đã hoàn tất</span>;

        return <span className="badge bg-secondary">Trạng thái: {status}</span>;
    };

    return (
        <div className="container-fluid p-0 pb-5">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h4 className="fw-bold mb-0 text-dark">
                        <i className="bi bi-list-task text-warning me-2"></i> Công Việc Của Tôi
                    </h4>
                    <div className="text-muted small mt-1">Danh sách các sự cố được phân công xử lý</div>
                </div>
                <button className="btn btn-white border shadow-sm fw-bold rounded" onClick={() => setReloadTrigger(prev => prev + 1)}>
                    <i className="bi bi-arrow-clockwise me-1"></i> Làm mới
                </button>
            </div>

            {/* Task Cards Grid */}
            {loading ? (
                <div className="text-center p-5"><div className="spinner-border text-warning"></div></div>
            ) : tasks.length === 0 ? (
                <div className="card border-0 shadow-sm rounded-4 p-5 text-center bg-white">
                    <i className="bi bi-cup-hot display-1 text-secondary mb-3 opacity-25"></i>
                    <h5 className="fw-bold text-muted">Tuyệt vời, bạn không có việc nào tồn đọng!</h5>
                </div>
            ) : (
                <div className="row g-4">
                    {tasks.map(task => {
                        const taskStatus = String(task.status).toLowerCase();
                        const isDone = taskStatus === '4' || taskStatus === 'resolved' || taskStatus === 'closed';

                        return (
                            <div className="col-12 col-md-6 col-xl-4" key={task.requestId}>
                                <div className={`card border-0 shadow-sm rounded-4 h-100 transition-all hover-card-tech ${isDone ? 'opacity-75 bg-light' : 'bg-white'}`}>
                                    <div className="card-body p-4 d-flex flex-column">

                                        {/* Card Header */}
                                        <div className="d-flex justify-content-between align-items-start mb-3">
                                            <div className="badge bg-dark bg-opacity-10 text-dark border px-2 py-1 rounded-3">
                                                <i className="bi bi-door-open-fill me-1 text-warning"></i>
                                                P.{task.apartmentCode || task.apartmentName || 'N/A'}
                                            </div>
                                            {renderStatus(task.status)}
                                        </div>

                                        {/* Card Body */}
                                        <h5 className="fw-bold text-dark mb-2">{task.title}</h5>
                                        <p className="text-muted small mb-3 flex-grow-1" style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                            {task.description || "Không có mô tả chi tiết."}
                                        </p>

                                        <div className="d-flex align-items-center justify-content-between text-muted small fw-medium pt-3 border-top mb-3">
                                            <span><i className="bi bi-tag me-1 text-warning"></i>{task.categoryName || 'Sự cố'}</span>
                                            <span><i className="bi bi-calendar-event me-1 text-warning"></i>{new Date(task.createDay || task.createdAt || task.createdDate).toLocaleDateString('vi-VN')}</span>
                                        </div>

                                        {/* Card Actions */}
                                        <div className="mt-auto">
                                            {(taskStatus === '1' || taskStatus === 'pending') && (
                                                <button
                                                    className="btn btn-warning text-dark w-100 fw-bold shadow-sm rounded-3"
                                                    onClick={() => handleStartTask(task.requestId)}
                                                >
                                                    <i className="bi bi-play-circle me-2"></i> Bắt đầu xử lý
                                                </button>
                                            )}

                                            {(taskStatus === '2' || taskStatus === 'inprogress' || taskStatus === 'processing' || taskStatus === 'accepted') && (
                                                <button
                                                    className="btn btn-warning text-dark border w-100 fw-bold shadow-sm rounded-3"
                                                    onClick={() => openFixModal(task)}
                                                    data-bs-toggle="modal"
                                                    data-bs-target="#fixTaskModal"
                                                >
                                                    <i className="bi bi-check-circle me-2"></i> Báo cáo hoàn tất
                                                </button>
                                            )}

                                            {(taskStatus === '3' || taskStatus === 'fixed') && (
                                                <button className="btn btn-info text-dark w-100 fw-bold rounded-3 opacity-75" disabled>
                                                    <i className="bi bi-hourglass-split me-2"></i> Chờ nghiệm thu
                                                </button>
                                            )}

                                            {isDone && (
                                                <button className="btn btn-light border w-100 fw-bold text-success rounded-3" disabled>
                                                    <i className="bi bi-check2-all me-2"></i> Đã hoàn thành
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

            {/* Phân trang */}
            {totalPages > 1 && !isNaN(totalPages) && (
                <div className="d-flex justify-content-end mt-4">
                    <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                </div>
            )}

            {/* ========================================= */}
            {/* MODAL: BÁO CÁO HOÀN TẤT */}
            {/* ========================================= */}
            <div className="modal fade" id="fixTaskModal" tabIndex="-1" aria-hidden="true">
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content border-0 shadow-lg rounded-4">
                        <div className="modal-header bg-warning border-0 px-4 py-3 rounded-top-4">
                            <h5 className="modal-title fw-bold text-dark">
                                <i className="bi bi-clipboard-check me-2"></i> Báo cáo hoàn tất
                            </h5>
                            <button type="button" className="btn-close" data-bs-dismiss="modal" id="closeFixModal"></button>
                        </div>
                        <form onSubmit={handleFinishTask}>
                            <div className="modal-body p-4">
                                {selectedTask && (
                                    <div className="alert bg-warning bg-opacity-10 border border-warning border-opacity-25 text-dark mb-4 rounded-3">
                                        Đang báo cáo cho sự cố: <strong className="fw-bold">{selectedTask.title}</strong> tại phòng <strong className="fw-bold">{selectedTask.apartmentCode || selectedTask.apartmentName}</strong>.
                                    </div>
                                )}

                                <div className="mb-3">
                                    <label className="form-label fw-bold text-dark">Ghi chú khắc phục <span className="text-danger">*</span></label>
                                    <textarea
                                        className="form-control bg-light"
                                        rows="3"
                                        placeholder="Ví dụ: Đã thay mới đường ống nước, kiểm tra không còn rò rỉ..."
                                        value={resolutionNote}
                                        onChange={(e) => setResolutionNote(e.target.value)}
                                        required
                                    ></textarea>
                                </div>

                                {/* THÊM PHẦN ĐÍNH KÈM ẢNH */}
                                <div className="mb-3">
                                    <label className="form-label fw-bold text-dark">Ảnh hiện trạng sau khi sửa (Tùy chọn)</label>
                                    <input
                                        type="file"
                                        className="form-control bg-light"
                                        accept="image/jpeg, image/png, image/jpg"
                                        onChange={handlePhotoChange}
                                    />
                                    <div className="form-text text-muted mt-2 small">
                                        <i className="bi bi-info-circle me-1"></i> Báo cáo có hình ảnh sẽ giúp Cư dân nghiệm thu nhanh chóng hơn.
                                    </div>
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
                    border-bottom: 3px solid #ffc107 !important;
                }
            `}</style>
        </div>
    );
};

export default TechnicianTasks;