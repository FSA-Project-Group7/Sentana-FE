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

    // State cho Modal Báo cáo hoàn tất
    const [selectedTask, setSelectedTask] = useState(null);
    const [resolutionNote, setResolutionNote] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const connection = useSignalR();

    // ==========================================
    // 1. SIGNALR: LẮNG NGHE VIỆC MỚI TỪ QUẢN LÝ
    // ==========================================
    useEffect(() => {
        if (!connection) return;

        connection.start()
            .then(() => {
                console.log("🟢 [Technician] Đã kết nối SignalR!");

                connection.on("ReceiveAssignedTask", (newTask) => {
                    notify.warning(`🛠️ Quản lý vừa giao cho bạn 1 công việc mới: ${newTask.title}`);
                    // Đẩy task mới lên đầu danh sách
                    setTasks(prev => [newTask, ...prev]);
                });
            })
            .catch(err => console.error('Lỗi SignalR: ', err));

        return () => connection.stop();
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
            setTasks(data.items || []);
            setTotalPages(Math.ceil((data.totalCount || 0) / 10));
        } catch (error) {
            notify.error("Không thể tải danh sách công việc.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTasks(currentPage);
    }, [currentPage]);

    // ==========================================
    // 3. HANDLERS: XỬ LÝ NGHIỆP VỤ
    // ==========================================
    const handleStartTask = async (taskId) => {
        try {
            await api.put(`/Maintenance/${taskId}/start`);
            notify.info("Đã cập nhật trạng thái: Đang xử lý");
            // Cập nhật UI trực tiếp
            setTasks(prev => prev.map(t => t.requestId === taskId ? { ...t, status: 'InProgress' } : t));
        } catch (error) {
            notify.error(error.response?.data?.message || "Lỗi khi bắt đầu công việc.");
        }
    };

    const handleFinishTask = async (e) => {
        e.preventDefault();
        if (!resolutionNote.trim()) return notify.error("Vui lòng nhập ghi chú khắc phục!");

        setIsSubmitting(true);
        try {
            await api.put(`/Maintenance/${selectedTask.requestId}/fix`, {
                resolutionNote: resolutionNote
            });
            notify.success("Đã báo cáo hoàn tất công việc!");

            // Cập nhật UI trực tiếp
            setTasks(prev => prev.map(t =>
                t.requestId === selectedRequest.requestId
                    ? { ...t, status: 'Resolved' }
                    : t
            ));

            // Đóng modal & dọn dẹp
            document.getElementById('closeFixModal').click();
            setResolutionNote('');
        } catch (error) {
            notify.error(error.response?.data?.message || "Lỗi khi hoàn tất công việc.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const openFixModal = (task) => {
        setSelectedTask(task);
        setResolutionNote('');
    };

    // ==========================================
    // RENDER HELPERS
    // ==========================================
    const renderStatus = (status) => {
        const s = String(status);
        if (s === '1' || s === '2' || s === 'Pending' || s === 'Accepted')
            return <span className="badge bg-warning text-dark"><i className="bi bi-clock me-1"></i> Chờ xử lý</span>;
        if (s === '3' || s === 'InProgress')
            return <span className="badge bg-primary"><i className="bi bi-tools me-1"></i> Đang làm</span>;
        if (s === '4' || s === 'Resolved')
            return <span className="badge bg-success"><i className="bi bi-check-all me-1"></i> Đã xong</span>;
        return <span className="badge bg-secondary">Không xác định</span>;
    };

    return (
        <div className="container-fluid p-0">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h3 className="fw-bold mb-0 text-dark">Công Việc Của Tôi</h3>
                    <div className="text-muted small mt-1">Danh sách các sự cố được phân công xử lý</div>
                </div>
                <button className="btn btn-outline-secondary bg-white shadow-sm fw-bold" onClick={() => fetchTasks(currentPage)}>
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
                    {tasks.map(task => (
                        <div className="col-12 col-md-6 col-xl-4" key={task.requestId}>
                            <div className={`card border-0 shadow-sm rounded-4 h-100 ${String(task.status) === '4' || String(task.status) === 'Resolved' ? 'opacity-75 bg-light' : ''}`}>
                                <div className="card-body p-4 d-flex flex-column">

                                    {/* Card Header */}
                                    <div className="d-flex justify-content-between align-items-start mb-3">
                                        <div className="badge bg-dark bg-opacity-10 text-dark border px-2 py-1">
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
                                        <span><i className="bi bi-tag me-1"></i>{task.categoryName}</span>
                                        <span><i className="bi bi-calendar-event me-1"></i>{new Date(task.createDay).toLocaleDateString('vi-VN')}</span>
                                    </div>

                                    {/* Card Actions (Thay đổi theo trạng thái) */}
                                    <div className="mt-auto">
                                        {(String(task.status) === '1' || String(task.status) === '2' || String(task.status) === 'Pending' || String(task.status) === 'Accepted') && (
                                            <button
                                                className="btn btn-warning w-100 fw-bold shadow-sm"
                                                onClick={() => handleStartTask(task.requestId)}
                                            >
                                                <i className="bi bi-play-circle me-2"></i> Bắt đầu xử lý
                                            </button>
                                        )}

                                        {(String(task.status) === '3' || String(task.status) === 'InProgress') && (
                                            <button
                                                className="btn btn-primary w-100 fw-bold shadow-sm"
                                                onClick={() => openFixModal(task)}
                                                data-bs-toggle="modal"
                                                data-bs-target="#fixTaskModal"
                                            >
                                                <i className="bi bi-check-circle me-2"></i> Báo cáo hoàn tất
                                            </button>
                                        )}

                                        {(String(task.status) === '4' || String(task.status) === 'Resolved') && (
                                            <button className="btn btn-light border w-100 fw-bold text-success" disabled>
                                                <i className="bi bi-check2-all me-2"></i> Đã hoàn thành
                                            </button>
                                        )}
                                    </div>

                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Phân trang */}
            {totalPages > 1 && (
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
                        <div className="modal-header bg-primary text-white border-0 px-4 py-3 rounded-top-4">
                            <h5 className="modal-title fw-bold">Báo cáo hoàn tất công việc</h5>
                            <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal" id="closeFixModal"></button>
                        </div>
                        <form onSubmit={handleFinishTask}>
                            <div className="modal-body p-4">
                                {selectedTask && (
                                    <div className="alert alert-primary bg-primary bg-opacity-10 border-primary-subtle mb-4">
                                        Đang báo cáo cho sự cố: <strong>{selectedTask.title}</strong> tại phòng <strong>{selectedTask.apartmentCode || selectedTask.apartmentName}</strong>.
                                    </div>
                                )}
                                <div className="mb-3">
                                    <label className="form-label fw-bold">Ghi chú khắc phục (Bắt buộc) <span className="text-danger">*</span></label>
                                    <textarea
                                        className="form-control bg-light"
                                        rows="4"
                                        placeholder="Ví dụ: Đã thay mới đường ống nước chữ T, kiểm tra không còn rò rỉ..."
                                        value={resolutionNote}
                                        onChange={(e) => setResolutionNote(e.target.value)}
                                        required
                                    ></textarea>
                                    <div className="form-text text-muted mt-2">
                                        Ghi chú này sẽ được gửi trực tiếp cho Cư dân và Ban quản lý để nghiệm thu.
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer bg-light border-0 px-4 py-3 rounded-bottom-4">
                                <button type="button" className="btn btn-white border px-4 rounded-pill" data-bs-dismiss="modal">Hủy</button>
                                <button type="submit" className="btn btn-primary px-4 fw-bold rounded-pill shadow-sm" disabled={isSubmitting}>
                                    {isSubmitting ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-send-check me-2"></i>}
                                    Gửi báo cáo
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default TechnicianTasks;