import React, { useState, useEffect } from 'react';
import api from '../../utils/axiosConfig';

const ResidentDashboard = () => {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);

    const [showPayModal, setShowPayModal] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [file, setFile] = useState(null);
    const [note, setNote] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [showDetailModal, setShowDetailModal] = useState(false);
    const [detailData, setDetailData] = useState(null);
    const [loadingDetail, setLoadingDetail] = useState(false);

    const fetchMyInvoices = async () => {
        setLoading(true);
        try {
            const res = await api.get('/Invoice/my-invoices');
            const dataList = res.data?.data || res.data;
            setInvoices(Array.isArray(dataList) ? dataList : []);
        } catch (error) {
            console.error("Lỗi khi tải hóa đơn:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMyInvoices();
    }, []);

    const handleOpenPay = (invoice) => {
        setSelectedInvoice(invoice);
        setFile(null);
        setNote('');
        setShowPayModal(true);
    };

    const handleOpenDetail = async (invoice) => {
        setSelectedInvoice(invoice);
        setShowDetailModal(true);
        setLoadingDetail(true);
        try {
            const res = await api.get(`/Invoice/my-invoices?month=${invoice.billingMonth}&year=${invoice.billingYear}`);
            
            const dataList = res.data?.data || res.data;
            if (dataList && dataList.length > 0) {
                setDetailData(dataList[0]);
            }
        } catch (error) {
            alert("Không thể tải chi tiết hóa đơn.");
        } finally {
            setLoadingDetail(false);
        }
    };

    const closeModal = () => {
        setShowPayModal(false);
        setShowDetailModal(false);
        setSelectedInvoice(null);
        setDetailData(null);
    };

    const handleSubmitPayment = async (e) => {
        e.preventDefault();
        if (!file) {
            alert("Vui lòng chọn ảnh biên lai giao dịch!");
            return;
        }

        setIsSubmitting(true);
        const formData = new FormData();
        formData.append('InvoiceId', selectedInvoice.invoiceId);
        formData.append('ImageFile', file);
        if (note) formData.append('Note', note);

        try {
            const res = await api.post('/Payment/submit-proof', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            alert(res.data?.message || "Đã gửi biên lai thành công! Vui lòng chờ Ban quản lý duyệt.");
            closeModal();
            fetchMyInvoices();
        } catch (error) {
            alert("LỖI: " + (error.response?.data?.message || "Không thể gửi biên lai."));
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatMoney = (amount) => {
        return (amount || 0).toLocaleString('vi-VN') + ' đ';
    };

    const getStatusBadge = (statusName) => {
        if (statusName === 'Paid') return <span className="badge bg-success">Đã thanh toán</span>;
        if (statusName === 'Unpaid') return <span className="badge bg-danger">Chưa thanh toán</span>;
        if (statusName === 'PendingVerification' || statusName === 'Pending') return <span className="badge bg-warning text-dark">Đang chờ duyệt</span>;
        return <span className="badge bg-secondary">{statusName || 'Không rõ'}</span>;
    };

    return (
        <div className="container py-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="fw-bold text-primary mb-1">Xin chào, Cư dân!</h2>
                    <p className="text-muted mb-0">Theo dõi hóa đơn và thanh toán tiện lợi ngay tại đây.</p>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>
            ) : invoices.length === 0 ? (
                <div className="alert alert-success text-center py-4">
                    <i className="bi bi-check-circle-fill fs-1 text-success d-block mb-2"></i>
                    <strong>Tuyệt vời!</strong> Hiện tại bạn không có hóa đơn nào cần thanh toán.
                </div>
            ) : (
                <div className="row g-4">
                    {invoices.map((inv) => (
                        <div className="col-md-6 col-lg-4" key={inv.invoiceId}>
                            <div className={`card h-100 shadow-sm border-0 ${inv.statusName === 'Unpaid' ? 'border-top border-danger border-4' : 'border-top border-success border-4'}`}>
                                <div className="card-body">
                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                        <h5 className="card-title fw-bold mb-0 text-primary">
                                            {inv.billingPeriod || `Tháng ${inv.billingMonth}/${inv.billingYear}`}
                                        </h5>
                                        {getStatusBadge(inv.statusName)}
                                    </div>

                                    <div className="mb-4">
                                        <div className="d-flex justify-content-between small mb-1">
                                            <span className="text-muted">Tổng tiền:</span>
                                            <span className="fw-bold">{formatMoney(inv.totalMoney)}</span>
                                        </div>
                                        <div className="d-flex justify-content-between small mb-1">
                                            <span className="text-muted">Đã trả:</span>
                                            <span className="text-success fw-bold">{formatMoney(inv.pay)}</span>
                                        </div>
                                        <div className="d-flex justify-content-between mt-2 pt-2 border-top">
                                            <span className="fw-bold text-muted">CẦN THANH TOÁN:</span>
                                            <span className="fw-bold text-danger fs-5">{formatMoney(inv.debt)}</span>
                                        </div>
                                    </div>

                                    <div className="d-flex gap-2 mt-auto">
                                        <button className="btn btn-outline-info w-100 fw-bold" onClick={() => handleOpenDetail(inv)}>
                                            <i className="bi bi-receipt me-1"></i> Chi tiết
                                        </button>
                                        {inv.statusName === 'Unpaid' && inv.debt > 0 && (
                                            <button className="btn btn-primary w-100 fw-bold" onClick={() => handleOpenPay(inv)}>
                                                <i className="bi bi-qr-code-scan me-1"></i> Thanh toán
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* MÀN MỜ CHUNG */}
            {(showPayModal || showDetailModal) && <div className="modal-backdrop fade show"></div>}

            {/* MODAL XEM CHI TIẾT HÓA ĐƠN */}
            {showDetailModal && (
                <div className="modal fade show d-block" tabIndex="-1">
                    <div className="modal-dialog modal-lg modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header bg-info text-white">
                                <h5 className="modal-title fw-bold">Chi Tiết Hóa Đơn</h5>
                                <button type="button" className="btn-close btn-close-white" onClick={closeModal}></button>
                            </div>
                            <div className="modal-body">
                                {loadingDetail || !detailData ? (
                                    <div className="text-center p-4"><div className="spinner-border text-info"></div></div>
                                ) : (
                                    <div>
                                        <div className="row mb-4 bg-light p-3 rounded mx-0">
                                            <div className="col-md-6 mb-2">
                                                <span className="text-muted d-block small">Kỳ thanh toán:</span> 
                                                <strong className="text-primary fs-6">
                                                    {detailData.billingPeriod || `Tháng ${detailData.billingMonth}/${detailData.billingYear}`}
                                                </strong>
                                            </div>
                                            <div className="col-md-6 mb-2">
                                                <span className="text-muted d-block small">Mã Phòng:</span> 
                                                <strong className="fs-6">{detailData.apartmentCode}</strong>
                                            </div>
                                            <div className="col-md-6 mb-2">
                                                <span className="text-muted d-block small">Trạng thái:</span> 
                                                {getStatusBadge(detailData.statusName)}
                                            </div>
                                            <div className="col-md-6 mb-2">
                                                <span className="text-muted d-block small">Ngày lập hóa đơn:</span> 
                                                <strong>{detailData.dayCreat || "Đang cập nhật"}</strong>
                                            </div>
                                        </div>

                                        <h6 className="fw-bold text-primary border-bottom pb-2 mb-3">
                                            <i className="bi bi-list-columns-reverse me-2"></i>Bảng Kê Phân Bổ Chi Phí
                                        </h6>
                                        <table className="table table-bordered text-center align-middle">
                                            <thead className="table-light text-muted small text-uppercase">
                                                <tr>
                                                    <th className="text-start ps-3">Hạng mục khoản thu</th>
                                                    <th>Thành tiền (VNĐ)</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {detailData.details && detailData.details.map((d, idx) => (
                                                    <tr key={idx}>
                                                        <td className="text-start ps-3 py-2">{d.feeName}</td>
                                                        <td className="fw-semibold py-2">{formatMoney(d.amount)}</td>
                                                    </tr>
                                                ))}
                                                <tr className="table-secondary">
                                                    <td className="text-end pe-3 fw-bold py-3">TỔNG CỘNG:</td>
                                                    <td className="fw-bold text-danger fs-5 py-3">{formatMoney(detailData.totalMoney)}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                            <div className="modal-footer bg-light">
                                <button type="button" className="btn btn-secondary fw-bold" onClick={closeModal}>Đóng</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL UPLOAD BIÊN LAI */}
            {showPayModal && (
                <div className="modal fade show d-block" tabIndex="-1">
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header bg-primary text-white">
                                <h5 className="modal-title fw-bold">Gửi Biên Lai Giao Dịch</h5>
                                <button type="button" className="btn-close btn-close-white" onClick={closeModal}></button>
                            </div>
                            <form onSubmit={handleSubmitPayment}>
                                <div className="modal-body">
                                    <div className="alert alert-info small mb-4">
                                        Vui lòng chuyển khoản số tiền <strong className="text-danger">{formatMoney(selectedInvoice?.debt)}</strong> theo thông tin của Ban quản lý, sau đó tải ảnh chụp màn hình giao dịch lên đây để được xác nhận.
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label fw-semibold">Tải ảnh biên lai (*)</label>
                                        <input
                                            type="file"
                                            className="form-control"
                                            accept="image/*"
                                            onChange={(e) => setFile(e.target.files[0])}
                                            required
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label fw-semibold">Ghi chú thêm (Tùy chọn)</label>
                                        <textarea
                                            className="form-control"
                                            rows="2"
                                            placeholder="Nhập nội dung chuyển khoản hoặc ghi chú..."
                                            value={note}
                                            onChange={(e) => setNote(e.target.value)}
                                        ></textarea>
                                    </div>
                                </div>
                                <div className="modal-footer bg-light">
                                    <button type="button" className="btn btn-secondary" onClick={closeModal}>Hủy</button>
                                    <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                                        {isSubmitting ? 'Đang tải lên...' : 'Xác nhận Gửi'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ResidentDashboard;