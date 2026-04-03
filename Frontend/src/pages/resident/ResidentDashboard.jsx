import React, { useState, useEffect } from 'react';
import api from '../../utils/axiosConfig';
import { notify } from '../../utils/notificationAlert';

const ResidentDashboard = () => {
    const [roomInfo, setRoomInfo] = useState(null);
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modals
    const [showPayModal, setShowPayModal] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [file, setFile] = useState(null);
    const [note, setNote] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [showDetailModal, setShowDetailModal] = useState(false);
    const [detailData, setDetailData] = useState(null);
    const [loadingDetail, setLoadingDetail] = useState(false);

    const fetchMyInvoices = async () => {
        try {
            const res = await api.get('/Invoice/my-invoices');
            const dataList = res.data?.data || res.data;
            setInvoices(Array.isArray(dataList) ? dataList : []);
        } catch (error) {
            console.error("Lỗi khi tải hóa đơn:", error);
        }
    };

    useEffect(() => {
        const checkFirstLogin = localStorage.getItem('requiresPasswordChange');
        if (checkFirstLogin === 'true') {
            navigate('/first-login-setup');
            return;
        }
        const fetchData = async () => {
            setLoading(true);
            try {
                // Gọi đồng thời 2 API: Một từ RoomsController, một từ InvoiceController
                const [roomRes, invoiceRes] = await Promise.all([
                    api.get('/rooms/my-room'),
                    api.get('/Invoice/my-invoices') // Hãy thử thêm 's' thành /Invoices/ nếu vẫn 404
                ]);

                // Xử lý dữ liệu phòng (Cấu trúc MyRoomResponseDto)
                if (roomRes.data?.isSuccess || roomRes.data?.IsSuccess) {
                    setRoomInfo(roomRes.data.data);
                }

                // Xử lý dữ liệu hóa đơn
                const invData = invoiceRes.data?.data || invoiceRes.data?.Data || [];
                setInvoices(Array.isArray(invData) ? invData : []);

            } catch (error) {
                console.error("Dashboard Error:", error);
                // Nếu lỗi 404 ở Invoice, có thể do chưa có hóa đơn hoặc sai route
                if (error.response?.status === 404) {
                    setInvoices([]);
                } else {
                    notify.error("Không thể tải thông tin dashboard.");
                }
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const formatCurrency = (amount) => {
        if (amount === undefined || amount === null) return '0 đ';
        return amount.toLocaleString('vi-VN') + ' đ';
    };

    // ==========================================
    // XỬ LÝ MODAL AN TOÀN
    // ==========================================
    const handleOpenPay = (invoice) => {
        setSelectedInvoice(invoice);
        setFile(null);
        setNote('');
        setShowPayModal(true);
        document.body.style.overflow = 'hidden'; // Khóa cuộn trang nền
    };

    const handleOpenDetail = async (invoice) => {
        setSelectedInvoice(invoice);
        setShowDetailModal(true);
        setLoadingDetail(true);
        document.body.style.overflow = 'hidden'; // Khóa cuộn trang nền
        try {
            // Lưu ý: Nếu API my-invoices có filter, gọi như thế này
            const res = await api.get(`/Invoice/my-invoices?month=${invoice.billingMonth}&year=${invoice.billingYear}`);
            const dataList = res.data?.data || res.data;
            if (dataList && dataList.length > 0) {
                setDetailData(dataList[0]);
            }
        } catch (error) {
            notify.error("Không thể tải chi tiết hóa đơn.");
        } finally {
            setLoadingDetail(false);
        }
    };

    const closeModal = () => {
        setShowPayModal(false);
        setShowDetailModal(false);
        setSelectedInvoice(null);
        setDetailData(null);
        document.body.style.overflow = 'auto'; // Mở lại cuộn trang nền
    };

    // ==========================================
    // SUBMIT THANH TOÁN
    // ==========================================
    const handleSubmitPayment = async (e) => {
        e.preventDefault();
        if (!file) return notify.error("Vui lòng chọn ảnh biên lai giao dịch!");

        setIsSubmitting(true);
        const formData = new FormData();
        formData.append('InvoiceId', selectedInvoice.invoiceId);
        formData.append('ImageFile', file);
        if (note) formData.append('Note', note);

        try {
            const res = await api.post('/Payment/submit-proof', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            notify.success(res.data?.message || "Đã gửi biên lai thành công!");
            closeModal();
            fetchMyInvoices();
        } catch (error) {
            notify.error("LỖI: " + (error.response?.data?.message || "Không thể gửi biên lai."));
        } finally {
            setIsSubmitting(false);
        }
    };

    // ==========================================
    // RENDER HELPERS
    // ==========================================
    const getStatusBadge = (statusName) => {
        const s = String(statusName).toLowerCase();
        if (s === 'paid') return <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-3 py-1 rounded-pill"><i className="bi bi-check-circle-fill me-1"></i> Đã thanh toán</span>;
        if (s === 'unpaid') return <span className="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 px-3 py-1 rounded-pill"><i className="bi bi-exclamation-circle-fill me-1"></i> Cần thanh toán</span>;
        if (s === 'pendingverification' || s === 'pending') return <span className="badge bg-warning bg-opacity-10 text-dark border border-warning border-opacity-25 px-3 py-1 rounded-pill"><i className="bi bi-hourglass-split me-1"></i> Đang chờ duyệt</span>;
        return <span className="badge bg-secondary rounded-pill">{statusName || 'Không rõ'}</span>;
    };

    const getCardBorderColor = (statusName) => {
        const s = String(statusName).toLowerCase();
        if (s === 'unpaid') return 'border-danger';
        if (s === 'pendingverification' || s === 'pending') return 'border-warning';
        return 'border-success';
    };

    if (loading) {
        return (
            <div className="container-fluid d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
                <div className="spinner-border text-success" style={{ width: '3rem', height: '3rem' }}></div>
            </div>
        );
    }

    if (!roomInfo) {
        return (
            <div className="container-fluid py-4">
                <div className="card border-0 shadow-lg rounded-4 text-center p-5 bg-white">
                    <i className="bi bi-house-x display-1 text-muted opacity-25 mb-3"></i>
                    <h4 className="text-muted fw-bold">Chưa có dữ liệu căn hộ</h4>
                    <p className="text-secondary">Vui lòng liên hệ Ban Quản Lý để được hỗ trợ.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container-fluid py-4 px-4">

            {/* LỜI CHÀO MỪNG */}
            <div className="d-flex align-items-center mb-4 p-4 bg-success bg-opacity-10 rounded-4 shadow-sm border border-success border-opacity-25">
                <div className="bg-success text-white rounded-circle d-flex justify-content-center align-items-center me-4 shadow" style={{ width: '60px', height: '60px' }}>
                    <i className="bi bi-person-fill fs-2"></i>
                </div>
                <div>
                    <h3 className="fw-bold text-success mb-1">Xin chào Cư dân!</h3>
                    <p className="text-dark opacity-75 mb-0 fw-medium">Chào mừng bạn về nhà. Dưới đây là thông tin tổng quan về căn hộ của bạn.</p>
                </div>
            </div>

            <div className="row g-4 align-items-stretch">
                {/* --- CỘT TRÁI: THÔNG TIN CĂN HỘ --- */}
                <div className="col-lg-5">
                    <div className="card border-0 shadow-lg rounded-4 h-100 overflow-hidden bg-white">
                        <div className="card-header bg-transparent border-bottom pt-4 pb-3 px-4">
                            <h5 className="fw-bold mb-0 text-dark"><i className="bi bi-info-square-fill text-success me-2"></i> Thông Tin Căn Hộ</h5>
                        </div>
                        <div className="card-body p-4 d-flex flex-column">
                            <div className="text-center mb-4 p-4 bg-light rounded-4">
                                <div className="display-4 fw-bold text-success mb-2 text-shadow-sm">P.{roomInfo.apartmentCode}</div>
                                <span className="badge bg-success px-3 py-2 fs-6 rounded-pill shadow-sm">Đang cư trú</span>
                            </div>
                            <ul className="list-group list-group-flush flex-grow-1">
                                <li className="list-group-item d-flex justify-content-between align-items-center px-2 py-3 bg-transparent border-light">
                                    <span className="text-muted fw-medium"><i className="bi bi-building text-success me-2"></i>Tòa nhà</span>
                                    <span className="fw-bold text-dark">{roomInfo.buildingName || 'N/A'}</span>
                                </li>
                                <li className="list-group-item d-flex justify-content-between align-items-center px-2 py-3 bg-transparent border-light">
                                    <span className="text-muted fw-medium"><i className="bi bi-layers text-success me-2"></i>Tầng</span>
                                    <span className="fw-bold text-dark">Tầng {roomInfo.floor || 'N/A'}</span>
                                </li>
                                <li className="list-group-item d-flex justify-content-between align-items-center px-2 py-3 bg-transparent border-0">
                                    <span className="text-muted fw-medium"><i className="bi bi-rulers text-success me-2"></i>Diện tích</span>
                                    <span className="fw-bold text-dark">{roomInfo.area || 0} m²</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* --- CỘT PHẢI: THÀNH VIÊN & DỊCH VỤ --- */}
                <div className="col-lg-7">
                    <div className="row g-4 h-100 flex-column m-0">

                        <div className="col-12 p-0 flex-grow-1">
                            <div className="card border-0 shadow-lg rounded-4 h-100 overflow-hidden bg-white d-flex flex-column">
                                <div className="card-header bg-transparent border-bottom pt-4 pb-3 px-4 d-flex justify-content-between align-items-center flex-shrink-0">
                                    <h5 className="fw-bold mb-0 text-dark"><i className="bi bi-people-fill text-primary me-2"></i>Thành Viên</h5>
                                    <span className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 rounded-pill px-3 py-1">{roomInfo.roommates?.length || 0} người</span>
                                </div>
                                {/* Cuộn nội bộ nếu quá nhiều thành viên */}
                                <div className="card-body p-0 custom-scrollbar" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                    {roomInfo.roommates?.map((member, index) => (
                                        <div key={index} className="d-flex justify-content-between align-items-center px-4 py-3 border-bottom hover-bg-light transition-all">
                                            <div className="fw-bold text-dark">{member.fullName}</div>
                                            <span className={`badge ${member.isOwner ? 'bg-danger' : 'bg-info'} bg-opacity-10 text-${member.isOwner ? 'danger' : 'info'} border border-${member.isOwner ? 'danger' : 'info'} border-opacity-25 rounded-pill px-3`}>
                                                {member.isOwner ? 'Chủ hộ' : 'Thành viên'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="col-12 p-0 flex-grow-1 mt-4">
                            <div className="card border-0 shadow-lg rounded-4 h-100 overflow-hidden bg-white d-flex flex-column">
                                <div className="card-header bg-transparent border-bottom pt-4 pb-3 px-4 flex-shrink-0">
                                    <h5 className="fw-bold mb-0 text-dark"><i className="bi bi-box-seam-fill text-warning me-2"></i>Dịch Vụ Đang Sử Dụng</h5>
                                </div>
                                {/* Cuộn nội bộ nếu quá nhiều dịch vụ */}
                                <div className="card-body p-0 custom-scrollbar" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                    <table className="table table-hover mb-0 align-middle">
                                        <tbody>
                                            {roomInfo.services?.map((svc, index) => (
                                                <tr key={index}>
                                                    <td className="ps-4 py-3 text-dark fw-medium border-light">{svc.serviceName}</td>
                                                    <td className="text-end pe-4 fw-bold text-danger py-3 border-light">{formatCurrency(svc.price || svc.serviceFee)}</td>
                                                </tr>
                                            ))}
                                            {(!roomInfo.services || roomInfo.services.length === 0) && (
                                                <tr><td colSpan="2" className="text-center py-4 text-muted">Chưa đăng ký dịch vụ nào.</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            {/* --- PHẦN HÓA ĐƠN ĐƯỢC THIẾT KẾ LẠI --- */}
            <div className="mt-5">
                <div className="d-flex align-items-center mb-4">
                    <h4 className="fw-bold mb-0 text-dark"><i className="bi bi-receipt-cutoff text-success me-2"></i> Hóa Đơn Của Bạn</h4>
                </div>

                <div className="row g-4">
                    {invoices.length === 0 ? (
                        <div className="col-12 text-center py-5">
                            <i className="bi bi-check2-circle display-1 text-success opacity-25 d-block mb-3"></i>
                            <h5 className="text-muted fw-bold">Tuyệt vời! Bạn không có hóa đơn nào tồn đọng.</h5>
                        </div>
                    ) : (
                        invoices.map((inv) => (
                            <div className="col-md-6 col-xl-4" key={inv.invoiceId}>
                                {/* Sửa dứt điểm lỗi màu viền thẻ dựa trên getCardBorderColor */}
                                <div className={`card h-100 shadow-sm border-0 border-top border-4 ${getCardBorderColor(inv.statusName)} rounded-4 bg-white hover-shadow-lg transition-all`}>
                                    <div className="card-body p-4 d-flex flex-column">
                                        <div className="d-flex justify-content-between align-items-start mb-4">
                                            <div>
                                                <h5 className="fw-bold text-dark mb-1">{inv.billingPeriod || `Tháng ${inv.billingMonth}/${inv.billingYear}`}</h5>
                                                <small className="text-muted">Mã HĐ: #{inv.invoiceId}</small>
                                            </div>
                                            {getStatusBadge(inv.statusName)}
                                        </div>

                                        <div className="bg-light rounded-4 p-3 mb-4 flex-grow-1">
                                            <div className="d-flex justify-content-between small mb-2">
                                                <span className="text-muted fw-medium">Tổng phải trả:</span>
                                                <span className="fw-bold text-dark">{formatCurrency(inv.totalMoney)}</span>
                                            </div>
                                            <div className="d-flex justify-content-between pt-2 border-top border-secondary border-opacity-10 mt-2">
                                                <span className="text-muted fw-medium">Đã thanh toán:</span>
                                                <span className="fw-bold text-success">{formatCurrency((inv.totalMoney || 0) - (inv.debt || 0))}</span>
                                            </div>
                                            <div className="d-flex justify-content-between text-danger fw-bold pt-2 border-top border-secondary border-opacity-10 mt-2">
                                                <span>Còn nợ:</span>
                                                <span className="fs-5">{formatCurrency(inv.debt)}</span>
                                            </div>
                                        </div>

                                        <div className="d-flex gap-2 mt-auto">
                                            <button className="btn btn-light border text-dark fw-bold w-100 rounded-pill shadow-sm" onClick={() => handleOpenDetail(inv)}>
                                                Chi tiết
                                            </button>
                                            {String(inv.statusName).toLowerCase() === 'unpaid' && inv.debt > 0 && (
                                                <button className="btn btn-success w-100 fw-bold rounded-pill shadow-sm" onClick={() => handleOpenPay(inv)}>
                                                    Thanh toán
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* ========================================= */}
            {/* CÁC MODAL ĐÃ ĐƯỢC TÚT LẠI UI               */}
            {/* ========================================= */}

            {/* Backdrop làm mờ chuyên nghiệp */}
            {(showPayModal || showDetailModal) && <div className="modal-backdrop fade show" style={{ zIndex: 1040, backgroundColor: 'rgba(0,0,0,0.6)' }}></div>}

            {/* MODAL CHI TIẾT HÓA ĐƠN */}
            {showDetailModal && (
                <div className="modal fade show d-block" tabIndex="-1" style={{ zIndex: 1050 }}>
                    <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
                        <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
                            <div className="modal-header bg-white border-bottom px-4 py-3">
                                <h5 className="modal-title fw-bold text-dark"><i className="bi bi-receipt text-success me-2"></i> Chi Tiết Hóa Đơn</h5>
                                <button type="button" className="btn-close" onClick={closeModal}></button>
                            </div>
                            <div className="modal-body p-0 custom-scrollbar">
                                {loadingDetail || !detailData ? (
                                    <div className="text-center p-5"><div className="spinner-border text-success"></div></div>
                                ) : (
                                    <div className="table-responsive">
                                        <table className="table table-hover align-middle mb-0">
                                            <thead className="table-light">
                                                <tr>
                                                    <th className="ps-4 py-3 text-muted small text-uppercase">Hạng mục thu</th>
                                                    <th className="text-end pe-4 py-3 text-muted small text-uppercase">Số tiền (VNĐ)</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {detailData.details?.map((d, i) => (
                                                    <tr key={i}>
                                                        <td className="ps-4 py-3 fw-medium text-dark">{d.feeName}</td>
                                                        <td className="text-end pe-4 py-3 fw-bold text-dark">{formatCurrency(d.amount)}</td>
                                                    </tr>
                                                ))}
                                                <tr className="bg-light">
                                                    <td className="ps-4 py-3 fw-bold text-dark">TỔNG CỘNG</td>
                                                    <td className="text-end pe-4 py-3 fw-bolder text-danger fs-5">{formatCurrency(detailData.totalMoney)}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                            <div className="modal-footer bg-light border-top px-4 py-3">
                                <button type="button" className="btn btn-white border rounded-pill px-4 fw-medium shadow-sm" onClick={closeModal}>Đóng</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL THANH TOÁN (NỘP BIÊN LAI) */}
            {showPayModal && (
                <div className="modal fade show d-block" tabIndex="-1" style={{ zIndex: 1050 }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
                            <div className="modal-header bg-white border-bottom px-4 py-3">
                                <h5 className="modal-title fw-bold text-dark"><i className="bi bi-wallet2 text-success me-2"></i> Gửi Biên Lai Giao Dịch</h5>
                                <button type="button" className="btn-close" onClick={closeModal}></button>
                            </div>
                            <form onSubmit={handleSubmitPayment}>
                                <div className="modal-body p-4">
                                    <div className="alert bg-danger bg-opacity-10 border border-danger border-opacity-25 rounded-3 p-3 mb-4 text-center">
                                        <span className="text-dark">Số tiền cần thanh toán:</span><br />
                                        <span className="display-6 fw-bold text-danger">{formatCurrency(selectedInvoice?.debt)}</span>
                                    </div>

                                    <div className="mb-4">
                                        <label className="form-label fw-bold small text-muted">Hình ảnh biên lai chuyển khoản <span className="text-danger">*</span></label>
                                        <input type="file" className="form-control bg-light border-0 p-2 rounded-3 modern-file-input" accept="image/*" onChange={(e) => setFile(e.target.files[0])} required />
                                    </div>

                                    <div className="mb-2">
                                        <label className="form-label fw-bold small text-muted">Ghi chú thêm (Nếu có)</label>
                                        <textarea className="form-control bg-light border-0 rounded-3" rows="3" placeholder="Ghi chú giao dịch..." value={note} onChange={(e) => setNote(e.target.value)}></textarea>
                                    </div>
                                </div>
                                <div className="modal-footer bg-light border-top px-4 py-3">
                                    <button type="button" className="btn btn-white border rounded-pill px-4 fw-medium shadow-sm" onClick={closeModal}>Hủy</button>
                                    <button type="submit" className="btn btn-success rounded-pill px-4 fw-bold shadow-sm" disabled={isSubmitting}>
                                        {isSubmitting ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-send-fill me-2"></i>}
                                        Gửi biên lai
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .text-shadow-sm { text-shadow: 1px 1px 2px rgba(0,0,0,0.1); }
                .transition-all { transition: all 0.2s ease-in-out; }
                .hover-bg-light:hover { background-color: #f8f9fa !important; }
                .hover-shadow-lg:hover { transform: translateY(-4px); box-shadow: 0 1rem 3rem rgba(0,0,0,.175)!important; }
                
                /* Nút Upload chuẩn UI hiện đại */
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
                
                /* THANH CUỘN (SCROLLBAR) TUỲ CHỈNH */
                .custom-scrollbar::-webkit-scrollbar { width: 5px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
            `}</style>
        </div>
    );
};

export default ResidentDashboard;