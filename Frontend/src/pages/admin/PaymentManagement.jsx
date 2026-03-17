import React, { useState, useEffect } from 'react';
import api from '../../utils/axiosConfig';
import Pagination from '../../components/common/Pagination';

const PaymentManagement = () => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    // Phân trang
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    // Modal
    const [activeModal, setActiveModal] = useState(null); // 'view_proof', 'reject'
    const [selectedTxn, setSelectedTxn] = useState(null);
    const [rejectReason, setRejectReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Fetch dữ liệu
    const fetchTransactions = async () => {
        setLoading(true);
        try {
            const res = await api.get('/payment/all');
            const dataList = res.data?.data || res.data;
            setTransactions(Array.isArray(dataList) ? dataList : []);
        } catch (error) {
            console.error("Lỗi khi tải giao dịch:", error);
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
        if (window.confirm("Bạn có chắc chắn muốn DUYỆT giao dịch này? Hóa đơn sẽ được gạch nợ lập tức.")) {
            try {
                // Gọi sang hàm ApprovePayment bên InvoiceController
                const res = await api.put(`/Invoice/transaction/${id}/approve`);
                alert(res.data?.message || "Đã duyệt thanh toán thành công!");
                fetchTransactions(); // Tải lại bảng
            } catch (error) {
                alert("LỖI: " + (error.response?.data?.message || "Không thể duyệt giao dịch."));
            }
        }
    };

    // XỬ LÝ TỪ CHỐI (REJECT)
    const handleReject = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            // Gọi sang hàm RejectPayment bên InvoiceController
            const res = await api.put(`/Invoice/transaction/${selectedTxn.transactionId}/reject`, {
                reason: rejectReason
            });
            alert(res.data?.message || "Đã từ chối thanh toán!");
            fetchTransactions();
            closeModal();
        } catch (error) {
            alert("LỖI: " + (error.response?.data?.message || "Không thể từ chối giao dịch."));
        } finally {
            setIsSubmitting(false);
        }
    };

    // Helper hiển thị trạng thái
    const getStatusBadge = (status) => {
        if (status === 0) return <span className="badge bg-warning text-dark">Chờ duyệt</span>;
        if (status === 1) return <span className="badge bg-success">Đã duyệt</span>;
        if (status === 2) return <span className="badge bg-danger">Đã từ chối</span>;
        return <span className="badge bg-secondary">Không xác định</span>;
    };

    // Helper fomat ngày
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleString('vi-VN');
    };

    // Phân trang
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentTransactions = transactions.slice(indexOfFirstItem, indexOfLastItem);

    return (
        <div className="container-fluid p-0">
            <div className="d-flex justify-content-between align-items-start mb-4">
                <div>
                    <h2 className="fw-bold mb-0">Xét Duyệt Thanh Toán</h2>
                    <div className="text-muted small mt-2">Kiểm tra và xác nhận hóa đơn do cư dân chuyển khoản</div>
                </div>
                <button className="btn btn-outline-secondary" onClick={fetchTransactions}>
                    <i className="bi bi-arrow-clockwise me-2"></i> Làm mới dữ liệu
                </button>
            </div>

            <div className="card shadow-sm border-0">
                <div className="card-body p-0">
                    {loading ? (
                        <div className="text-center p-5"><div className="spinner-border text-primary"></div></div>
                    ) : transactions.length === 0 ? (
                        <div className="text-center p-5 text-muted">Hiện chưa có giao dịch nào trên hệ thống.</div>
                    ) : (
                        <>
                            <div className="table-responsive">
                                <table className="table table-hover table-bordered mb-0 align-middle text-center">
                                    <thead className="table-light text-muted small">
                                        <tr>
                                            <th>Mã Giao Dịch</th>
                                            <th>Phòng</th>
                                            <th>Kỳ Hóa Đơn</th>
                                            <th>Ngày Gửi</th>
                                            <th>Ảnh Bill</th>
                                            <th>Trạng Thái</th>
                                            <th>Thao Tác</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {currentTransactions.map((txn) => (
                                            <tr key={txn.transactionId}>
                                                <td className="fw-bold text-primary">TXN-{txn.transactionId}</td>
                                                <td className="fw-semibold">{txn.apartmentCode}</td>
                                                <td>Tháng {txn.billingMonth}/{txn.billingYear}</td>
                                                <td className="small">{formatDate(txn.submitDate)}</td>
                                                <td>
                                                    <button className="btn btn-sm btn-outline-info" onClick={() => openModal('view_proof', txn)}>
                                                        <i className="bi bi-image me-1"></i> Xem Bill
                                                    </button>
                                                </td>
                                                <td>{getStatusBadge(txn.status)}</td>
                                                <td>
                                                    {txn.status === 0 && (
                                                        <>
                                                            <button className="btn btn-sm btn-success me-2" onClick={() => handleApprove(txn.transactionId)} title="Duyệt">
                                                                <i className="bi bi-check-circle me-1"></i> Duyệt
                                                            </button>
                                                            <button className="btn btn-sm btn-danger" onClick={() => openModal('reject', txn)} title="Từ chối">
                                                                <i className="bi bi-x-circle me-1"></i> Từ chối
                                                            </button>
                                                        </>
                                                    )}
                                                    {txn.status === 2 && (
                                                        <span className="small text-danger fst-italic">Lý do: {txn.note}</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <Pagination totalItems={transactions.length} itemsPerPage={itemsPerPage} currentPage={currentPage} onPageChange={setCurrentPage} />
                        </>
                    )}
                </div>
            </div>

            {/* Backdrop */}
            {activeModal && <div className="modal-backdrop fade show"></div>}

            {/* MODAL 1: XEM ẢNH BILL CHUYỂN KHOẢN */}
            {activeModal === 'view_proof' && (
                <div className="modal fade show d-block" tabIndex="-1" onClick={closeModal}>
                    <div className="modal-dialog modal-dialog-centered modal-lg" onClick={e => e.stopPropagation()}>
                        <div className="modal-content">
                            <div className="modal-header bg-dark text-white">
                                <h5 className="modal-title">Biên Lai Chuyển Khoản - {selectedTxn.apartmentCode}</h5>
                                <button type="button" className="btn-close btn-close-white" onClick={closeModal}></button>
                            </div>
                            <div className="modal-body text-center bg-light">
                                {selectedTxn.proofUrl ? (
                                    <img
                                        src={selectedTxn.proofUrl}
                                        alt="Proof of Payment"
                                        className="img-fluid rounded border shadow-sm"
                                        style={{ maxHeight: '70vh', objectFit: 'contain' }}
                                    />
                                ) : (
                                    <div className="text-danger py-5">Người dùng không đính kèm ảnh (Lỗi dữ liệu).</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL 2: NHẬP LÝ DO TỪ CHỐI */}
            {activeModal === 'reject' && (
                <div className="modal fade show d-block" tabIndex="-1">
                    <div className="modal-dialog">
                        <div className="modal-content border-danger">
                            <div className="modal-header bg-danger text-white">
                                <h5 className="modal-title fw-bold">Từ Chối Thanh Toán</h5>
                                <button type="button" className="btn-close btn-close-white" onClick={closeModal}></button>
                            </div>
                            <form onSubmit={handleReject}>
                                <div className="modal-body">
                                    <div className="alert alert-warning small">
                                        Email chứa lý do này sẽ được gửi tự động đến chủ hộ <strong>{selectedTxn.apartmentCode}</strong> yêu cầu nộp lại.
                                    </div>
                                    <label className="form-label fw-semibold">Lý do từ chối (*)</label>
                                    <textarea
                                        className="form-control border-danger"
                                        rows="3"
                                        value={rejectReason}
                                        onChange={(e) => setRejectReason(e.target.value)}
                                        placeholder="Ví dụ: Ảnh mờ, Chuyển thiếu tiền, Sai nội dung..."
                                        required
                                    ></textarea>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={closeModal}>Hủy</button>
                                    <button type="submit" className="btn btn-danger" disabled={isSubmitting}>Xác nhận Từ chối</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PaymentManagement;