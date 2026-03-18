import React, { useState, useEffect } from 'react';
import api from '../../utils/axiosConfig';

const ResidentDashboard = () => {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal Thanh toán
    const [showPayModal, setShowPayModal] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [file, setFile] = useState(null);
    const [note, setNote] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // 1. Lấy danh sách hóa đơn của chính Cư dân này đang đăng nhập
    const fetchMyInvoices = async () => {
        setLoading(true);
        try {
            // LƯU Ý: Đảm bảo Backend có API này (lấy hóa đơn theo AccountId từ Token)
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

    // 2. Mở Modal Thanh toán
    const handleOpenPay = (invoice) => {
        setSelectedInvoice(invoice);
        setFile(null);
        setNote('');
        setShowPayModal(true);
    };

    // 3. Xử lý Upload Ảnh (Gửi FormData chứa File lên Backend)
    const handleSubmitPayment = async (e) => {
        e.preventDefault();
        if (!file) {
            alert("Vui lòng chọn ảnh biên lai chuyển khoản!");
            return;
        }

        setIsSubmitting(true);
        const formData = new FormData();
        formData.append('InvoiceId', selectedInvoice.invoiceId);
        formData.append('ImageFile', file); // Biến ImageFile phải khớp với DTO bên BE
        if (note) formData.append('Note', note);

        try {
            // LƯU Ý: Đường dẫn này phụ thuộc vào PaymentController của bạn
            const res = await api.post('/Payment/submit-proof', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            alert(res.data?.message || "Đã gửi biên lai thành công! Vui lòng chờ Ban quản lý duyệt.");
            setShowPayModal(false);
            fetchMyInvoices(); // Tải lại danh sách để cập nhật trạng thái
        } catch (error) {
            alert("LỖI: " + (error.response?.data?.message || "Không thể gửi biên lai."));
        } finally {
            setIsSubmitting(false);
        }
    };

    // Helper: Định dạng tiền tệ
    const formatMoney = (amount) => {
        return amount?.toLocaleString('vi-VN') + ' đ';
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
                                        <h5 className="card-title fw-bold mb-0">Tháng {inv.billingMonth}/{inv.billingYear}</h5>
                                        {inv.statusName === 'Unpaid' ? (
                                            <span className="badge bg-danger">Chưa thanh toán</span>
                                        ) : inv.statusName === 'Pending' ? (
                                            <span className="badge bg-warning text-dark">Đang chờ duyệt</span>
                                        ) : (
                                            <span className="badge bg-success">Đã thanh toán</span>
                                        )}
                                    </div>

                                    <div className="mb-3">
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

                                    {inv.statusName === 'Unpaid' && inv.debt > 0 && (
                                        <button
                                            className="btn btn-primary w-100 fw-bold"
                                            onClick={() => handleOpenPay(inv)}
                                        >
                                            <i className="bi bi-qr-code-scan me-2"></i> Thanh toán ngay
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* MODAL UPLOAD BIÊN LAI */}
            {showPayModal && <div className="modal-backdrop fade show"></div>}
            {showPayModal && (
                <div className="modal fade show d-block" tabIndex="-1">
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header bg-primary text-white">
                                <h5 className="modal-title fw-bold">Gửi Biên Lai Thanh Toán</h5>
                                <button type="button" className="btn-close btn-close-white" onClick={() => setShowPayModal(false)}></button>
                            </div>
                            <form onSubmit={handleSubmitPayment}>
                                <div className="modal-body">
                                    <div className="alert alert-info small mb-4">
                                        Vui lòng chuyển khoản số tiền <strong className="text-danger">{formatMoney(selectedInvoice?.debt)}</strong> theo thông tin của Ban quản lý, sau đó tải ảnh chụp màn hình giao dịch lên đây.
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
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowPayModal(false)}>Hủy</button>
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