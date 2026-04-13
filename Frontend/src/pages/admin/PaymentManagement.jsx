import React, { useState, useEffect } from 'react';
import api from '../../utils/axiosConfig';
import Pagination from '../../components/common/Pagination';
import { notify, confirmAction } from '../../utils/notificationAlert';

const PaymentManagement = () => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    // Phân trang
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    // Modal
    const [activeModal, setActiveModal] = useState(null); // 'view_proof', 'reject', 'view_reason'
    const [selectedTxn, setSelectedTxn] = useState(null);
    const [rejectReason, setRejectReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Fetch dữ liệu
    const fetchTransactions = async () => {
        setLoading(true);
        try {
            const res = await api.get('/payment/all');
            const dataList = res.data?.data || res.data;
            // Sắp xếp các giao dịch mới nhất lên đầu
            const sortedList = Array.isArray(dataList) ? dataList.sort((a, b) => b.transactionId - a.transactionId) : [];
            setTransactions(sortedList);
        } catch (error) {
            notify.error("Không thể tải danh sách giao dịch.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTransactions();
    }, []);

    // Xử lý Mở/Đóng Modal
    const openModal = (type, txn) => {
        setActiveModal(type);
        setSelectedTxn(txn);
        setRejectReason('');
    };

    const closeModal = () => {
        setActiveModal(null);
        setSelectedTxn(null);
    };

    // XỬ LÝ DUYỆT (APPROVE)
    const handleApprove = async (id) => {
        const { isConfirmed } = await confirmAction.fire({
            title: 'Xác Nhận Duyệt?',
            text: "Hóa đơn liên quan sẽ được gạch nợ lập tức sau khi bạn đồng ý.",
            confirmButtonText: '<i class="bi bi-check-all me-1"></i> Xác nhận Duyệt'
        });

        if (!isConfirmed) return;

        try {
            const res = await api.put(`/Invoice/transaction/${id}/approve`);
            notify.success(res.data?.message || "Đã duyệt thanh toán thành công!");
            fetchTransactions();
        } catch (error) {
            notify.error(error.response?.data?.message || "Không thể duyệt giao dịch.");
        }
    };

    // XỬ LÝ TỪ CHỐI (REJECT)
    const handleReject = async (e) => {
        e.preventDefault();
        if (!rejectReason.trim()) return notify.warning("Vui lòng nhập lý do từ chối!");

        setIsSubmitting(true);
        try {
            const res = await api.put(`/Invoice/transaction/${selectedTxn.transactionId}/reject`, {
                reason: rejectReason
            });
            notify.success(res.data?.message || "Đã từ chối thanh toán!");
            fetchTransactions();
            closeModal();
        } catch (error) {
            notify.error(error.response?.data?.message || "Không thể từ chối giao dịch.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- RENDER HELPERS ---
    const getStatusBadge = (status) => {
        switch (status) {
            case 0: return <span className="badge bg-warning bg-opacity-10 text-dark border border-warning border-opacity-25 rounded-pill px-3 py-2"><i className="bi bi-hourglass-split me-1"></i> Chờ duyệt</span>;
            case 1: return <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 rounded-pill px-3 py-2"><i className="bi bi-check-circle-fill me-1"></i> Đã duyệt</span>;
            case 2: return <span className="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 rounded-pill px-3 py-2"><i className="bi bi-x-circle-fill me-1"></i> Từ chối</span>;
            default: return <span className="badge bg-secondary rounded-pill px-3 py-2">Không xác định</span>;
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleString('vi-VN', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentTransactions = transactions.slice(indexOfFirstItem, indexOfLastItem);

    return (
        <div className="container-fluid p-0">
            {/* --- HEADER --- */}
            <div className="d-flex justify-content-between align-items-start mb-4">
                <div>
                    <h2 className="fw-bold mb-0">Xét Duyệt Thanh Toán</h2>
                    <div className="text-muted small mt-2">Xác nhận minh chứng chuyển khoản của cư dân để gạch nợ trên hệ thống</div>
                </div>
                <button className="btn btn-primary shadow-sm" onClick={fetchTransactions} disabled={loading}>
                    <i className={`bi bi-arrow-clockwise me-2 ${loading ? 'spinner-border spinner-border-sm border-0' : ''}`}></i>
                    Làm mới danh sách
                </button>
            </div>

            {/* --- BẢNG DỮ LIỆU --- */}
            <div className="card shadow-sm border-0">
                <div className="card-body p-0">
                    {loading ? (
                        <div className="text-center p-5"><div className="spinner-border text-primary"></div><p className="mt-2 text-muted small">Đang tải dữ liệu giao dịch...</p></div>
                    ) : transactions.length === 0 ? (
                        <div className="text-center p-5 text-muted">
                            <i className="bi bi-check2-circle display-4 opacity-25 d-block mb-3"></i>
                            <h5 className="fw-bold">Tuyệt vời!</h5>
                            <p className="mt-2">Không có giao dịch nào cần bạn xét duyệt.</p>
                        </div>
                    ) : (
                        <>
                            <div className="table-responsive">
                                <table className="table table-hover align-middle text-center mb-0">
                                    <thead className="bg-light text-muted small">
                                        <tr>
                                            <th className="py-3 ps-4">Mã Giao Dịch</th>
                                            <th className="py-3 text-start">Căn Hộ</th>
                                            <th className="py-3">Kỳ Hóa Đơn</th>
                                            <th className="py-3">Thời Gian Gửi</th>
                                            <th className="py-3">Minh Chứng</th>
                                            <th className="py-3">Trạng Thái</th>
                                            <th className="py-3">Hành Động</th>
                                        </tr>
                                    </thead>
                                    <tbody className="small">
                                        {currentTransactions.map((txn) => (
                                            <tr key={txn.transactionId}>
                                                <td className="fw-bold text-primary ps-4">TXN#{txn.transactionId}</td>
                                                <td className="text-start">
                                                    <div className="fw-bold">{txn.apartmentCode}</div>
                                                    <div className="text-muted" style={{ fontSize: '11px' }}>{txn.apartmentName}</div>
                                                </td>
                                                <td>
                                                    <span className="badge bg-light text-dark border">
                                                        Tháng {txn.billingMonth}/{txn.billingYear}
                                                    </span>
                                                </td>
                                                <td className="text-muted">{formatDate(txn.submitDate)}</td>
                                                <td>
                                                    <button className="btn btn-sm btn-outline-primary" onClick={() => openModal('view_proof', txn)}>
                                                        <i className="bi bi-image me-1"></i> Xem Bill
                                                    </button>
                                                </td>
                                                <td>{getStatusBadge(txn.status)}</td>
                                                <td>
                                                    {txn.status === 0 ? (
                                                        <div className="btn-group shadow-sm rounded">
                                                            <button className="btn btn-sm btn-success" onClick={() => handleApprove(txn.transactionId)} title="Duyệt giao dịch">
                                                                <i className="bi bi-check-lg me-1"></i> Duyệt
                                                            </button>
                                                            <button className="btn btn-sm btn-danger" onClick={() => openModal('reject', txn)} title="Từ chối">
                                                                <i className="bi bi-x-lg me-1"></i> Từ chối
                                                            </button>
                                                        </div>
                                                    ) : txn.status === 2 ? (
                                                        <button className="btn btn-sm btn-outline-secondary" onClick={() => openModal('view_reason', txn)}>
                                                            <i className="bi bi-info-circle me-1"></i> Xem lý do
                                                        </button>
                                                    ) : (
                                                        <span className="text-success"><i className="bi bi-shield-check"></i> Hoàn tất</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="p-3 border-top">
                                <Pagination totalItems={transactions.length} itemsPerPage={itemsPerPage} currentPage={currentPage} onPageChange={setCurrentPage} />
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* --- MODAL 1: XEM ẢNH BILL --- */}
            {activeModal === 'view_proof' && selectedTxn && (
                <>
                    <div className="modal-backdrop fade show"></div>
                    <div className="modal fade show d-block" tabIndex="-1" onClick={closeModal}>
                        <div className="modal-dialog modal-dialog-centered" onClick={e => e.stopPropagation()}>
                            <div className="modal-content shadow-lg border-0 rounded-4">
                                <div className="modal-header bg-dark text-white border-0 py-2">
                                    <h6 className="modal-title small fw-bold">Minh chứng: {selectedTxn.apartmentCode} - Tháng {selectedTxn.billingMonth}</h6>
                                    <button type="button" className="btn-close btn-close-white" onClick={closeModal}></button>
                                </div>
                                <div className="modal-body p-1 bg-secondary bg-opacity-10 text-center">
                                    {selectedTxn.proofUrl ? (
                                        <img
                                            src={selectedTxn.proofUrl}
                                            alt="Bill thanh toán"
                                            className="img-fluid rounded shadow-sm"
                                            style={{ maxHeight: '75vh', objectFit: 'contain' }}
                                        />
                                    ) : (
                                        <div className="py-5 text-muted">
                                            <i className="bi bi-exclamation-triangle display-4"></i>
                                            <p className="mt-2">Không tìm thấy file ảnh minh chứng.</p>
                                        </div>
                                    )}
                                </div>
                                <div className="modal-footer py-2 border-0 bg-light">
                                    <button className="btn btn-sm btn-secondary" onClick={closeModal}>Đóng</button>
                                    <a href={selectedTxn.proofUrl} target="_blank" rel="noreferrer" className="btn btn-sm btn-primary">
                                        <i className="bi bi-box-arrow-up-right me-1"></i> Mở ảnh gốc
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* --- MODAL 2: TỪ CHỐI --- */}
            {activeModal === 'reject' && selectedTxn && (
                <>
                    <div className="modal-backdrop fade show"></div>
                    <div className="modal fade show d-block" tabIndex="-1">
                        <div className="modal-dialog">
                            <div className="modal-content border-0 shadow-lg rounded-4">
                                <div className="modal-header bg-danger text-white border-0">
                                    <h5 className="modal-title fw-bold"><i className="bi bi-exclamation-octagon me-2"></i>Từ Chối Thanh Toán</h5>
                                    <button type="button" className="btn-close btn-close-white" onClick={closeModal}></button>
                                </div>
                                <form onSubmit={handleReject}>
                                    <div className="modal-body py-4">
                                        <div className="d-flex align-items-center mb-3">
                                            <div className="bg-danger bg-opacity-10 p-3 rounded-circle me-3 text-danger">
                                                <i className="bi bi-send-x fs-4"></i>
                                            </div>
                                            <div>
                                                <div className="fw-bold">Phòng {selectedTxn.apartmentCode}</div>
                                                <div className="small text-muted">Hệ thống sẽ gửi thông báo lý do này qua email cho cư dân.</div>
                                            </div>
                                        </div>

                                        <div className="mb-0">
                                            <label className="form-label small fw-bold">Lý do từ chối cụ thể (*)</label>
                                            <textarea
                                                className="form-control border-danger border-opacity-25 shadow-none"
                                                rows="4"
                                                value={rejectReason}
                                                onChange={(e) => setRejectReason(e.target.value)}
                                                placeholder="VD: Số tiền chuyển khoản không khớp, Ảnh bill quá mờ không kiểm tra được, Sai nội dung chuyển khoản..."
                                                required
                                            ></textarea>
                                        </div>
                                    </div>
                                    <div className="modal-footer bg-light border-0">
                                        <button type="button" className="btn btn-white border" onClick={closeModal}>Hủy</button>
                                        <button type="submit" className="btn btn-danger px-4 fw-bold" disabled={isSubmitting}>
                                            {isSubmitting ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-send me-1"></i>}
                                            Xác nhận Từ chối
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* --- MODAL 3: XEM LÝ DO TỪ CHỐI --- */}
            {activeModal === 'view_reason' && selectedTxn && (
                <>
                    <div className="modal-backdrop fade show"></div>
                    <div className="modal fade show d-block" tabIndex="-1">
                        <div className="modal-dialog modal-dialog-centered">
                            <div className="modal-content border-0 shadow-lg rounded-4">
                                <div className="modal-header bg-secondary bg-opacity-10 border-0">
                                    <h5 className="modal-title fw-bold text-dark">Lý do từ chối</h5>
                                    <button type="button" className="btn-close" onClick={closeModal}></button>
                                </div>
                                <div className="modal-body p-4">
                                    <div className="alert alert-danger border-0">
                                        {selectedTxn.note || "Không có lý do được cung cấp."}
                                    </div>
                                </div>
                                <div className="modal-footer bg-light border-0"><button type="button" className="btn btn-secondary px-4" onClick={closeModal}>Đóng</button></div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default PaymentManagement;