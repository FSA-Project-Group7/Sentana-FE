import React, { useState, useEffect } from 'react';
import api from '../../utils/axiosConfig';
import Pagination from '../../components/common/Pagination';
import { notify } from '../../utils/notificationAlert';
import { useSignalR } from '../../hooks/useSignalR';

const MaintenanceManagement = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const pageSize = 10;

    const [selectedRequest, setSelectedRequest] = useState(null);
    const [technicians, setTechnicians] = useState([]);
    const [assignForm, setAssignForm] = useState({ technicianId: '', priority: 2 });
    const [isAssigning, setIsAssigning] = useState(false);

    const connection = useSignalR();

    useEffect(() => {
        if (!connection) return;

        connection.start()
            .then(() => {
                // Tối ưu UX: Lắng nghe SignalR và update trực tiếp state 'requests' 
                // thay vì gọi lại API fetchRequests() để tránh giật lag bảng dữ liệu.
                connection.on("ReceiveNewMaintenanceRequest", (newReq) => {
                    notify.info(`🚨 Sự cố mới: ${newReq.title} tại P.${newReq.apartmentCode || newReq.apartmentName}`);
                    setRequests(prev => [newReq, ...prev]);
                });

                connection.on("ReceiveFixedTask", (fixedReq) => {
                    notify.success(`✅ Thợ đã xử lý xong sự cố #${fixedReq.requestId}`);
                    setRequests(prev => prev.map(req =>
                        req.requestId === fixedReq.requestId
                            ? { ...req, status: 'Resolved', resolutionNote: fixedReq.resolutionNote }
                            : req
                    ));
                });

                connection.on("TaskProcessing", (procReq) => {
                    setRequests(prev => prev.map(req =>
                        req.requestId === procReq.requestId ? { ...req, status: 'InProgress' } : req
                    ));
                });
            })
            .catch(err => console.error('SignalR Connection Error: ', err));

        return () => connection.stop();
    }, [connection]);

    useEffect(() => {
        fetchRequests(currentPage);
    }, [currentPage]);

    const fetchRequests = async (page) => {
        try {
            setLoading(true);
            const res = await api.get('/Maintenance/request', {
                params: { pageIndex: page, pageSize: pageSize }
            });
            const data = res.data?.data || res.data;
            setRequests(data.items || []);
            setTotalPages(Math.ceil((data.totalCount || 0) / pageSize));
        } catch (error) {
            notify.error("Không thể tải danh sách sự cố.");
        } finally {
            setLoading(false);
        }
    };

    const fetchAvailableTechnicians = async () => {
        try {
            const res = await api.get('/Technicians/available');
            const data = res.data?.data || res.data || [];
            setTechnicians(Array.isArray(data) ? data : []);
        } catch (error) {
            notify.error("Không thể tải danh sách Kỹ thuật viên rảnh.");
        }
    };

    const handleOpenAssignModal = (req) => {
        setSelectedRequest(req);
        setAssignForm({ technicianId: '', priority: req.priority || 2 });
        fetchAvailableTechnicians();
    };

    const submitAssignTechnician = async (e) => {
        e.preventDefault();

        // Parse số và kiểm tra an toàn
        const techId = parseInt(assignForm.technicianId);
        const priorityLevel = parseInt(assignForm.priority);

        if (isNaN(techId)) {
            return notify.error("Lỗi dữ liệu: Không lấy được ID của Kỹ thuật viên này!");
        }

        setIsAssigning(true);
        try {
            await api.put(`/Maintenance/requests/${selectedRequest.requestId}/assign`, {
                technicianId: techId,
                priority: priorityLevel
            });

            setRequests(prev => prev.map(req =>
                req.requestId === selectedRequest.requestId
                    ? {
                        ...req,
                        status: 'Accepted',
                        assignedTechnicianName: technicians.find(t => (t.technicianId || t.accountId || t.id) === techId)?.fullName || 'Đã phân công',
                        priority: priorityLevel
                    }
                    : req
            ));

            notify.success("Gán Kỹ thuật viên thành công!");
            document.getElementById('closeAssignModal').click();
        } catch (error) {
            notify.error(error.response?.data?.message || "Lỗi khi gán Kỹ thuật viên.");
        } finally {
            setIsAssigning(false);
        }
    };

    const renderStatusBadge = (status) => {
        switch (String(status)) {
            case '1': case 'Pending': return <span className="badge bg-warning text-dark"><i className="bi bi-hourglass-split me-1"></i> Chờ tiếp nhận</span>;
            case '2': case 'Accepted': return <span className="badge bg-info text-dark"><i className="bi bi-person-check me-1"></i> Đã phân công</span>;
            case '3': case 'InProgress': return <span className="badge bg-primary"><i className="bi bi-tools me-1"></i> Đang xử lý</span>;
            case '4': case 'Resolved': return <span className="badge bg-success"><i className="bi bi-check2-circle me-1"></i> Đã hoàn tất</span>;
            default: return <span className="badge bg-secondary">Không xác định</span>;
        }
    };

    const renderPriorityText = (priority) => {
        switch (String(priority)) {
            case '1': return <span className="text-secondary fw-semibold">Thấp</span>;
            case '2': return <span className="text-primary fw-semibold">Vừa</span>;
            case '3': return <span className="text-warning fw-semibold">Cao</span>;
            case '4': return <span className="text-danger fw-bold">Khẩn cấp</span>;
            default: return 'Chưa rõ';
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Chưa có';
        const d = new Date(dateString);
        return `${d.toLocaleDateString('vi-VN')} ${d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;
    };

    return (
        <div className="container-fluid p-0">
            {/* === HEADER === */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="fw-bold mb-0">Quản Lý Sự Cố & Bảo Trì</h2>
                    <div className="text-muted small mt-2">Theo dõi và điều phối yêu cầu sửa chữa từ cư dân</div>
                </div>
                <button className="btn btn-primary shadow-sm fw-bold" onClick={() => fetchRequests(currentPage)}>
                    <i className="bi bi-arrow-clockwise me-1"></i> Làm mới
                </button>
            </div>

            {/* === MAIN DATA TABLE === */}
            <div className="card shadow-sm border-0 mb-4">
                <div className="card-body p-0">
                    {loading ? (
                        <div className="text-center p-5"><div className="spinner-border text-primary"></div></div>
                    ) : requests.length === 0 ? (
                        <div className="text-center p-5 text-muted">
                            <i className="bi bi-inbox display-4 d-block mb-3 opacity-50"></i>
                            Chưa có yêu cầu bảo trì nào.
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-hover align-middle mb-0">
                                <thead className="table-light text-muted small text-uppercase">
                                    <tr>
                                        <th className="ps-4 py-3">Mã YC</th>
                                        <th className="py-3">Người báo cáo</th>
                                        <th className="py-3" style={{ minWidth: '200px' }}>Tiêu đề sự cố</th>
                                        <th className="py-3">Danh mục</th>
                                        <th className="py-3">Trạng thái</th>
                                        <th className="py-3">Kỹ thuật viên</th>
                                        <th className="py-3">Ngày gửi</th>
                                        <th className="text-end pe-4 py-3">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {requests.map((req) => (
                                        <tr key={req.requestId}>
                                            <td className="ps-4 fw-semibold text-secondary">#{req.requestId}</td>

                                            <td>
                                                <div className="fw-semibold text-dark">{req.residentName}</div>
                                                <div className="badge bg-light text-dark border mt-1 px-2 py-1">
                                                    P.{req.apartmentName || req.apartmentCode}
                                                </div>
                                            </td>

                                            <td className="fw-semibold text-dark text-truncate" style={{ maxWidth: '250px' }}>
                                                {req.title}
                                            </td>

                                            <td>{req.categoryName}</td>
                                            <td>{renderStatusBadge(req.status)}</td>

                                            <td>
                                                {req.assignedTechnicianName ? (
                                                    <span className="text-primary fw-medium">
                                                        <i className="bi bi-person-gear me-1"></i> {req.assignedTechnicianName}
                                                    </span>
                                                ) : (
                                                    <div className="d-flex align-items-center">
                                                        <span className="text-muted fst-italic small me-2">Chưa có thợ</span>
                                                        <button
                                                            className="btn btn-sm btn-outline-primary rounded-circle d-flex align-items-center justify-content-center"
                                                            style={{ width: '28px', height: '28px' }}
                                                            title="Phân công Kỹ thuật viên"
                                                            onClick={() => handleOpenAssignModal(req)}
                                                            data-bs-toggle="modal"
                                                            data-bs-target="#assignTechnicianModal"
                                                        >
                                                            <i className="bi bi-plus-lg"></i>
                                                        </button>
                                                    </div>
                                                )}
                                            </td>

                                            <td className="small text-muted">{formatDate(req.createDay)}</td>

                                            <td className="text-end pe-4">
                                                <button
                                                    className="btn btn-light btn-sm border rounded-circle text-primary shadow-sm"
                                                    title="Xem chi tiết"
                                                    onClick={() => setSelectedRequest(req)}
                                                    data-bs-toggle="modal"
                                                    data-bs-target="#maintenanceDetailModal"
                                                >
                                                    <i className="bi bi-eye"></i>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {totalPages > 1 && (
                <div className="d-flex justify-content-end">
                    <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                </div>
            )}

            {/* === MODAL: DETAIL === */}
            {selectedRequest && (
                <div className="modal fade" id="maintenanceDetailModal" tabIndex="-1" aria-hidden="true">
                    <div className="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">
                        <div className="modal-content border-0 shadow">
                            <div className="modal-header bg-light border-bottom">
                                <h5 className="modal-title fw-bold text-primary">Chi tiết yêu cầu</h5>
                                <button type="button" className="btn-close" data-bs-dismiss="modal"></button>
                            </div>
                            <div className="modal-body p-4">
                                <h4 className="fw-bold text-dark mb-4 pb-3 border-bottom">
                                    {selectedRequest.title}
                                </h4>

                                <div className="row g-4">
                                    <div className="col-md-7">
                                        <div className="mb-3">
                                            <span className="text-muted small text-uppercase fw-bold d-block mb-1">Người báo cáo</span>
                                            <div className="fs-6 fw-semibold text-dark">
                                                {selectedRequest.residentName}
                                                <span className="badge bg-light text-dark border ms-2">P.{selectedRequest.apartmentName || selectedRequest.apartmentCode}</span>
                                            </div>
                                        </div>

                                        <div className="mb-3">
                                            <span className="text-muted small text-uppercase fw-bold d-block mb-1">Mô tả chi tiết</span>
                                            <div className="p-3 bg-light rounded border text-secondary" style={{ whiteSpace: 'pre-wrap', fontSize: '15px' }}>
                                                {selectedRequest.description || "Không có mô tả chi tiết."}
                                            </div>
                                        </div>

                                        {selectedRequest.resolutionNote && (
                                            <div className="mb-3">
                                                <span className="text-success small text-uppercase fw-bold d-block mb-1">Báo cáo khắc phục (Từ thợ)</span>
                                                <div className="p-3 bg-success bg-opacity-10 border border-success-subtle rounded text-dark fw-medium">
                                                    {selectedRequest.resolutionNote}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="col-md-5">
                                        <div className="card bg-light border-0 shadow-sm mb-3">
                                            <div className="card-body p-3">
                                                <div className="d-flex justify-content-between mb-2">
                                                    <span className="text-muted small">Trạng thái:</span>
                                                    {renderStatusBadge(selectedRequest.status)}
                                                </div>
                                                <div className="d-flex justify-content-between mb-2">
                                                    <span className="text-muted small">Mức độ:</span>
                                                    <span>{renderPriorityText(selectedRequest.priority)}</span>
                                                </div>
                                                <div className="d-flex justify-content-between mb-2">
                                                    <span className="text-muted small">Kỹ thuật viên:</span>
                                                    <span className="fw-semibold">{selectedRequest.assignedTechnicianName || 'Chưa phân công'}</span>
                                                </div>
                                                <div className="d-flex justify-content-between">
                                                    <span className="text-muted small">Ngày gửi:</span>
                                                    <span className="fw-semibold text-end">{formatDate(selectedRequest.createDay)}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <span className="text-muted small text-uppercase fw-bold d-block mb-2">Ảnh đính kèm</span>
                                        {selectedRequest.imageUrl ? (
                                            <div className="rounded border overflow-hidden shadow-sm">
                                                <img
                                                    src={selectedRequest.imageUrl}
                                                    alt="Sự cố"
                                                    className="img-fluid w-100"
                                                    style={{ maxHeight: '200px', objectFit: 'cover' }}
                                                    onError={(e) => { e.target.src = 'https://via.placeholder.com/400x200?text=Lỗi+tải+ảnh' }}
                                                />
                                            </div>
                                        ) : (
                                            <div className="p-3 text-center bg-light border rounded text-muted small">
                                                Cư dân không đính kèm ảnh
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer bg-light border-0">
                                <button type="button" className="btn btn-secondary px-4" data-bs-dismiss="modal">Đóng</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* === MODAL: ASSIGN TECHNICIAN === */}
            <div className="modal fade" id="assignTechnicianModal" tabIndex="-1" aria-hidden="true">
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content border-0 shadow">
                        <div className="modal-header bg-primary text-white">
                            <h5 className="modal-title fw-bold">Phân công Kỹ thuật viên</h5>
                            <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal" id="closeAssignModal"></button>
                        </div>
                        <form onSubmit={submitAssignTechnician}>
                            <div className="modal-body p-4">
                                {selectedRequest && (
                                    <p className="mb-4 text-secondary">
                                        Chọn thợ để xử lý sự cố: <strong className="text-dark">{selectedRequest.title}</strong> tại <strong>P.{selectedRequest.apartmentName || selectedRequest.apartmentCode}</strong>.
                                    </p>
                                )}

                                <div className="mb-4">
                                    <label className="form-label fw-bold">Kỹ thuật viên (*)</label>
                                    <select
                                        className="form-select"
                                        value={assignForm.technicianId}
                                        onChange={(e) => setAssignForm({ ...assignForm, technicianId: e.target.value })}
                                        required
                                    >
                                        <option value="" disabled>-- Chọn Kỹ thuật viên --</option>
                                        {technicians.map(tech => {
                                            const tId = tech.technicianId || tech.accountId || tech.id || tech.userId;
                                            const tName = tech.fullName || tech.name || tech.userName || `KTV - ID: ${tId}`;

                                            return (
                                                <option key={tId} value={tId}>
                                                    {tName}
                                                </option>
                                            );
                                        })}
                                    </select>
                                </div>

                                <div className="mb-3">
                                    <label className="form-label fw-bold">Mức độ ưu tiên</label>
                                    <div className="d-flex gap-3">
                                        {[
                                            { id: 'pri1', val: 1, label: 'Thấp', cls: 'text-secondary' },
                                            { id: 'pri2', val: 2, label: 'Vừa', cls: 'text-primary' },
                                            { id: 'pri3', val: 3, label: 'Cao', cls: 'text-warning' },
                                            { id: 'pri4', val: 4, label: 'Khẩn cấp', cls: 'text-danger fw-bold' }
                                        ].map(pri => (
                                            <div className="form-check" key={pri.id}>
                                                <input
                                                    className="form-check-input"
                                                    type="radio"
                                                    name="priority"
                                                    id={pri.id}
                                                    value={pri.val}
                                                    checked={assignForm.priority == pri.val}
                                                    onChange={(e) => setAssignForm({ ...assignForm, priority: e.target.value })}
                                                />
                                                <label className={`form-check-label ${pri.cls} fw-semibold`} htmlFor={pri.id}>{pri.label}</label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer bg-light border-0">
                                <button type="button" className="btn btn-white border px-4" data-bs-dismiss="modal">Hủy</button>
                                <button type="submit" className="btn btn-primary px-4 fw-bold" disabled={isAssigning}>
                                    {isAssigning ? <span className="spinner-border spinner-border-sm me-2"></span> : null}
                                    Xác nhận Gán
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MaintenanceManagement;