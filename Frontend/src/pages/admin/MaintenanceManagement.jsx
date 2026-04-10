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
    const [reloadTrigger, setReloadTrigger] = useState(0);

    const connection = useSignalR();

    useEffect(() => {
        if (!connection) return;

        const handleNewReq = (newReq) => { notify.info(`🚨 Yêu cầu mới: P.${newReq.apartmentCode || newReq.apartmentName}`); setReloadTrigger(prev => prev + 1); };
        const handleProcessing = () => { notify.info(`🛠️ Kỹ thuật viên đã tiếp nhận và đang xử lý`); setReloadTrigger(prev => prev + 1); };
        const handleFixedReq = () => { notify.success(`✅ Thợ báo cáo đã xử lý xong, chờ cư dân nghiệm thu`); setReloadTrigger(prev => prev + 1); };
        const handleClosedReq = () => { notify.success(`🎉 Cư dân đã nghiệm thu hoàn tất sự cố`); setReloadTrigger(prev => prev + 1); };


        connection.on("ReceiveNewMaintenanceRequest", handleNewReq);
        connection.on("TaskProcessing", handleProcessing);
        connection.on("ReceiveFixedTask", handleFixedReq);
        connection.on("TaskClosed", handleClosedReq);


        return () => {
            connection.off("ReceiveNewMaintenanceRequest", handleNewReq);
            connection.off("TaskProcessing", handleProcessing);
            connection.off("ReceiveFixedTask", handleFixedReq);
            connection.off("TaskClosed", handleClosedReq);
        };
    }, [connection]);

    useEffect(() => {
        fetchRequests(currentPage);
    }, [currentPage, reloadTrigger]);

    const fetchRequests = async (page) => {
        try {
            setLoading(true);
            const res = await api.get('/Maintenance/request', {
                params: { pageIndex: page, pageSize: pageSize }
            });

            const data = res.data?.data || res.data;
            const itemsList = Array.isArray(data?.items) ? data.items : (Array.isArray(data) ? data : []);
            setRequests(itemsList);
            const totalCount = Number(data?.totalCount || 0);
            const calcPages = Math.ceil(totalCount / pageSize);
            if (Number.isInteger(calcPages) && calcPages >= 1) {
                setTotalPages(calcPages);
            } else {
                setTotalPages(1);
            }

        } catch (error) {
            console.error("Lỗi fetch API:", error);
            setRequests([]);
            setTotalPages(1);
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
            notify.error("Không thể tải danh sách Kỹ thuật viên.");
        }
    };

    const handleOpenAssignModal = (req) => {
        setSelectedRequest(req);
        setAssignForm({ technicianId: '', priority: req.priority || 2 });
        fetchAvailableTechnicians();
    };

    const submitAssignTechnician = async (e) => {
        e.preventDefault();
        const techId = parseInt(assignForm.technicianId);
        if (!techId) return notify.error("Vui lòng chọn Kỹ thuật viên!");

        setIsAssigning(true);
        try {
            await api.put(`/Maintenance/requests/${selectedRequest.requestId}/assign`, {
                technicianId: techId,
                priority: parseInt(assignForm.priority)
            });

            notify.success("Giao việc thành công!");
            document.getElementById('closeAssignModal')?.click();
            setReloadTrigger(prev => prev + 1);

        } catch (error) {
            notify.error("Lỗi khi gán việc.");
        } finally {
            setIsAssigning(false);
        }
    };

    const renderStatusBadge = (status) => {
        const s = String(status).toLowerCase();

        // 1. Vừa tạo
        if (s === '1' || s === 'pending')
            return <span className="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 rounded-pill px-3"><i className="bi bi-hourglass-split me-1"></i> Chờ phân công</span>;

        // 2. Admin giao việc (Nhưng thợ chưa bấm Bắt đầu)
        if (s === '2' || s === 'accepted')
            return <span className="badge bg-warning bg-opacity-10 text-dark border border-warning border-opacity-25 rounded-pill px-3"><i className="bi bi-person-check me-1"></i> Đã phân công, Chờ tiếp nhận</span>;

        // 3. Thợ bấm "Bắt đầu xử lý"
        if (s === '3' || s === 'inprogress' || s === 'processing')
            return <span className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 rounded-pill px-3"><i className="bi bi-tools me-1"></i> Đã tiếp nhận</span>;

        // 4. Thợ bấm "Hoàn tất"
        if (s === '4' || s === 'fixed')
            return <span className="badge bg-info bg-opacity-10 text-info border border-info border-opacity-25 rounded-pill px-3"><i className="bi bi-card-checklist me-1"></i> Đã sửa xong, Chờ nghiệm thu</span>;

        // 5. Cư dân bấm "Nghiệm thu"
        if (s === '5' || s === 'resolved' || s === 'closed')
            return <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 rounded-pill px-3"><i className="bi bi-check2-all me-1"></i> Hoàn thành</span>;

        return <span className="badge bg-secondary rounded-pill px-3">{status}</span>;
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
        <div className="container-fluid px-4 py-3">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h3 className="fw-bold text-dark mb-1">Quản Lý Bảo Trì</h3>
                    <p className="text-muted small">Phân công và giám sát tiến độ sửa chữa căn hộ</p>
                </div>
                <button className="btn btn-success rounded-pill px-4 shadow-sm" onClick={() => setReloadTrigger(prev => prev + 1)}>
                    <i className="bi bi-arrow-clockwise me-2"></i>Làm mới
                </button>
            </div>

            <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-4">
                <div className="card-body p-0">
                    <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0">
                            <thead className="bg-light text-muted small text-uppercase">
                                <tr>
                                    <th className="ps-4 py-3">Mã YC</th>
                                    <th className="py-3">Căn hộ</th>
                                    <th className="py-3" style={{ minWidth: '200px' }}>Tiêu đề sự cố</th>
                                    <th className="py-3">Trạng thái</th>
                                    <th className="py-3">Kỹ thuật viên</th>
                                    <th className="text-end pe-4 py-3">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan="6" className="text-center py-5"><div className="spinner-border text-success"></div></td></tr>
                                ) : requests.length > 0 ? (
                                    requests.map((req) => (
                                        <tr key={req.requestId}>
                                            <td className="ps-4 fw-semibold text-secondary">#{req.requestId}</td>
                                            <td>
                                                <div className="fw-bold text-dark">P.{req.apartmentName || req.apartmentCode}</div>
                                                <div className="small text-muted">{req.residentName}</div>
                                            </td>
                                            <td className="fw-semibold text-dark text-truncate" style={{ maxWidth: '250px' }}>{req.title}</td>
                                            <td>{renderStatusBadge(req.status)}</td>
                                            <td>
                                                {req.assignedTechnicianName ? (
                                                    <span className="text-primary fw-medium"><i className="bi bi-person-check me-1"></i>{req.assignedTechnicianName}</span>
                                                ) : (
                                                    <button className="btn btn-sm btn-outline-danger rounded-pill px-3 shadow-sm"
                                                        onClick={() => handleOpenAssignModal(req)} data-bs-toggle="modal" data-bs-target="#assignTechnicianModal">
                                                        <i className="bi bi-plus-lg me-1"></i>Giao việc
                                                    </button>
                                                )}
                                            </td>
                                            <td className="text-end pe-4">
                                                <button className="btn btn-light border btn-sm rounded-circle text-primary shadow-sm"
                                                    title="Xem chi tiết" onClick={() => setSelectedRequest(req)} data-bs-toggle="modal" data-bs-target="#maintenanceDetailModal">
                                                    <i className="bi bi-eye"></i>
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan="6" className="text-center py-5 text-muted">Không có yêu cầu bảo trì nào</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* CHỐT CHẶN BẢO VỆ GIAO DIỆN KHỎI RANGE_ERROR */}
            {!loading && requests.length > 0 && totalPages > 1 && !isNaN(totalPages) && (
                <div className="d-flex justify-content-center">
                    <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                </div>
            )}

            {/* ======================================================= */}
            {/* === MODAL: CHI TIẾT SỰ CỐ (ĐỒNG BỘ RESIDENT STYLE) === */}
            {/* ======================================================= */}
            <div className="modal fade" id="maintenanceDetailModal" tabIndex="-1" aria-hidden="true">
                <div className="modal-dialog modal-dialog-centered modal-xl modal-dialog-scrollable">
                    <div className="modal-content border-0 shadow-lg rounded-4 bg-light">
                        <div className="modal-header border-bottom bg-white px-4 py-3 rounded-top-4">
                            <div className="d-flex align-items-center gap-3">
                                <h5 className="fw-bold mb-0 text-dark">Chi Tiết Sự Cố #{selectedRequest?.requestId}</h5>
                                {selectedRequest && renderStatusBadge(selectedRequest.status)}
                            </div>
                            <button type="button" className="btn-close" data-bs-dismiss="modal"></button>
                        </div>

                        <div className="modal-body p-4">
                            {selectedRequest && (
                                <div className="row g-4">
                                    {/* CỘT TRÁI: THÔNG TIN CHI TIẾT */}
                                    <div className="col-lg-7">
                                        <div className="card border-0 shadow-sm rounded-4 h-100">
                                            <div className="card-body p-4">
                                                <h4 className="fw-bold text-primary mb-4">{selectedRequest.title}</h4>

                                                <div className="d-flex align-items-center mb-3">
                                                    <div className="bg-light rounded-circle p-2 me-3 text-secondary">
                                                        <i className="bi bi-person-vcard fs-4"></i>
                                                    </div>
                                                    <div>
                                                        <div className="text-muted small text-uppercase fw-bold">Người báo cáo</div>
                                                        <div className="fw-semibold fs-6 text-dark">
                                                            {selectedRequest.residentName} <span className="badge bg-secondary ms-1">P.{selectedRequest.apartmentName || selectedRequest.apartmentCode}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="d-flex align-items-center mb-4">
                                                    <div className="bg-light rounded-circle p-2 me-3 text-secondary">
                                                        <i className="bi bi-clock-history fs-4"></i>
                                                    </div>
                                                    <div>
                                                        <div className="text-muted small text-uppercase fw-bold">Thời gian gửi</div>
                                                        <div className="fw-semibold text-dark">{formatDate(selectedRequest.createDay)}</div>
                                                    </div>
                                                </div>

                                                <div className="mb-4">
                                                    <div className="text-muted small text-uppercase fw-bold mb-2">Mô tả hỏng hóc</div>
                                                    <div className="p-3 bg-light rounded-3 text-secondary border" style={{ whiteSpace: 'pre-wrap', fontSize: '15px' }}>
                                                        {selectedRequest.description || "Không có mô tả chi tiết."}
                                                    </div>
                                                </div>

                                                {selectedRequest.resolutionNote && (
                                                    <div className="mt-4">
                                                        <div className="text-success small text-uppercase fw-bold mb-2 d-flex align-items-center">
                                                            <i className="bi bi-tools me-2"></i> Báo cáo khắc phục (Từ thợ)
                                                        </div>
                                                        <div className="p-3 bg-success bg-opacity-10 border border-success-subtle rounded-3 text-dark fw-medium">
                                                            {selectedRequest.resolutionNote}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* CỘT PHẢI: HÌNH ẢNH VÀ QUẢN LÝ */}
                                    <div className="col-lg-5">
                                        <div className="card border-0 shadow-sm rounded-4 mb-4">
                                            <div className="card-body p-3">
                                                <div className="text-muted small text-uppercase fw-bold mb-2">Ảnh đính kèm</div>
                                                {selectedRequest.imageUrl ? (
                                                    <div className="rounded-3 overflow-hidden shadow-sm">
                                                        <img
                                                            src={selectedRequest.imageUrl}
                                                            alt="Sự cố"
                                                            className="img-fluid w-100"
                                                            style={{ maxHeight: '280px', objectFit: 'cover' }}
                                                            onError={(e) => { e.target.src = 'https://via.placeholder.com/400x250?text=Lỗi+tải+ảnh' }}
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="p-5 text-center bg-light border border-dashed rounded-3 text-muted small">
                                                        <i className="bi bi-images display-6 d-block mb-2 opacity-25"></i>
                                                        Không có ảnh đính kèm
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="card border-0 shadow-sm rounded-4 bg-primary bg-opacity-10 border-start border-primary border-4">
                                            <div className="card-body p-3">
                                                <div className="fw-bold text-primary small mb-3 text-uppercase">Bảng điều phối</div>
                                                <div className="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom border-primary border-opacity-25">
                                                    <span className="text-muted small fw-medium">Mức độ ưu tiên:</span>
                                                    <span>{renderPriorityText(selectedRequest.priority)}</span>
                                                </div>
                                                <div className="d-flex justify-content-between align-items-center">
                                                    <span className="text-muted small fw-medium">Kỹ thuật viên:</span>
                                                    <span className="fw-bold text-dark">{selectedRequest.assignedTechnicianName || 'Chưa phân công'}</span>
                                                </div>
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

            {/* === MODAL: ASSIGN TECHNICIAN === */}
            <div className="modal fade" id="assignTechnicianModal" tabIndex="-1" aria-hidden="true">
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content border-0 shadow-lg rounded-4">
                        <div className="modal-header bg-success text-white border-0 rounded-top-4 py-3 px-4">
                            <h5 className="modal-title fw-bold">Phân Công Công Việc</h5>
                            <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal" id="closeAssignModal"></button>
                        </div>
                        <form onSubmit={submitAssignTechnician}>
                            <div className="modal-body p-4">
                                <label className="form-label fw-bold small text-muted text-uppercase">Chọn Kỹ thuật viên rảnh (*)</label>
                                <select className="form-select bg-light border-0 py-2 mb-4" value={assignForm.technicianId} onChange={(e) => setAssignForm({ ...assignForm, technicianId: e.target.value })} required>
                                    <option value="" disabled>-- Danh sách thợ --</option>
                                    {technicians.map(tech => (
                                        <option key={tech.technicianId || tech.accountId} value={tech.technicianId || tech.accountId}>
                                            {tech.fullName}
                                        </option>
                                    ))}
                                </select>

                                <label className="form-label fw-bold small text-muted text-uppercase">Mức độ ưu tiên</label>
                                <select className="form-select bg-light border-0 py-2" value={assignForm.priority} onChange={(e) => setAssignForm({ ...assignForm, priority: e.target.value })}>
                                    <option value="1">Thấp</option>
                                    <option value="2">Bình thường</option>
                                    <option value="3">Cao</option>
                                    <option value="4">Khẩn cấp</option>
                                </select>
                            </div>
                            <div className="modal-footer border-top bg-white rounded-bottom-4 px-4 py-3">
                                <button type="button" className="btn btn-light border rounded-pill px-4" data-bs-dismiss="modal">Hủy</button>
                                <button type="submit" className="btn btn-success rounded-pill px-4 fw-bold shadow-sm" disabled={isAssigning}>
                                    {isAssigning ? <span className="spinner-border spinner-border-sm me-2"></span> : "XÁC NHẬN GIAO VIỆC"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            <style>{`
                .border-dashed { border-style: dashed !important; border-width: 2px !important; }
            `}</style>
        </div>
    );
};

export default MaintenanceManagement;