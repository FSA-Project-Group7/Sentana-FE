import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/axiosConfig';
import { notify } from '../../utils/notificationAlert';

const ResidentDashboard = () => {
    const navigate = useNavigate();

    // States
    const [invoices, setInvoices] = useState([]);
    const [utilities, setUtilities] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // State Tabs
    const [activeTab, setActiveTab] = useState('invoice'); 
    
    // State cho Sidebar Điện Nước nhiều phòng
    const [selectedAptCode, setSelectedAptCode] = useState('');

    // Modals
    const [showPayModal, setShowPayModal] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [file, setFile] = useState(null);
    const [note, setNote] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [showDetailModal, setShowDetailModal] = useState(false);
    const [detailData, setDetailData] = useState(null);
    const [loadingDetail, setLoadingDetail] = useState(false);

    const [showProofModal, setShowProofModal] = useState(false);
    const [proofImageUrl, setProofImageUrl] = useState(null);

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
                const invoiceRes = await api.get('/Invoice/my-invoices');
                const invData = invoiceRes.data?.data || invoiceRes.data?.Data || [];
                setInvoices(Array.isArray(invData) ? invData : []);
            } catch (error) {
                if (error.response?.status === 404) setInvoices([]); 
                else notify.error("Không thể tải thông tin hóa đơn.");
            }

            try {
                const utilRes = await api.get('/Utility/history/my');
                const utilData = utilRes.data?.data || utilRes.data?.Data || [];
                const dataArray = Array.isArray(utilData) ? utilData : [];
                setUtilities(dataArray);
                
                // Trích xuất danh sách các phòng (Đón đầu BE trả về apartmentCode)
                if (dataArray.length > 0) {
                    const uniqueApts = [...new Set(dataArray.map(u => u.apartmentCode || 'Phòng hiện tại'))];
                    setSelectedAptCode(uniqueApts[0]); // Mặc định chọn phòng đầu tiên
                }
            } catch (error) {
                console.error("Lỗi khi tải điện nước:", error);
            }

            setLoading(false);
        };

        fetchData();
    }, [navigate]);

    const formatCurrency = (amount) => {
        if (amount === undefined || amount === null) return '0 đ';
        return amount.toLocaleString('vi-VN') + ' đ';
    };

    // ==========================================
    // XỬ LÝ CÁC MODAL
    // ==========================================
    const handleOpenPay = (invoice) => {
        setSelectedInvoice(invoice);
        setFile(null);
        setNote('');
        setShowPayModal(true);
        document.body.style.overflow = 'hidden'; 
    };

    const handleOpenDetail = async (invoice) => {
        setSelectedInvoice(invoice);
        setShowDetailModal(true);
        setLoadingDetail(true);
        document.body.style.overflow = 'hidden'; 
        try {
            const res = await api.get(`/Invoice/my-invoices?month=${invoice.billingMonth}&year=${invoice.billingYear}`);
            const dataList = res.data?.data || res.data;
            if (dataList && dataList.length > 0) setDetailData(dataList[0]);
        } catch (error) {
            notify.error("Không thể tải chi tiết hóa đơn.");
        } finally {
            setLoadingDetail(false);
        }
    };

    const handleViewProof = async (invoice) => {
        setSelectedInvoice(invoice); 
        try {
            const payRes = await api.get(`/Payment/invoice/${invoice.invoiceId}`);
            const payData = payRes.data?.data || payRes.data?.Data || [];
            const proofs = payData.filter(p => p.proofUrl || p.paymentProofImage).map(p => p.proofUrl || p.paymentProofImage);

            if (proofs.length > 0) {
                setProofImageUrl(proofs[0]);
                setShowProofModal(true);
                document.body.style.overflow = 'hidden'; 
            } else {
                notify.warning("Chưa tìm thấy ảnh biên lai cho hóa đơn này.");
            }
        } catch (error) {
            notify.error("Lỗi khi tải ảnh biên lai.");
        }
    };

    const closeModal = () => {
        setShowPayModal(false);
        setShowDetailModal(false);
        setShowProofModal(false);
        setSelectedInvoice(null);
        setDetailData(null);
        setProofImageUrl(null);
        document.body.style.overflow = 'auto'; 
    };

    const handleSubmitPayment = async (e) => {
        e.preventDefault();
        if (!file) return notify.error("Vui lòng chọn ảnh biên lai giao dịch!");

        setIsSubmitting(true);
        const formData = new FormData();
        formData.append('File', file); 
        if (note) formData.append('Note', note);

        try {
            const res = await api.post(`/payment/${selectedInvoice.invoiceId}/upload-proof`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            notify.success(res.data?.message || "Đã gửi biên lai thành công!");
            closeModal();
            fetchMyInvoices();
        } catch (error) {
            let errorMsg = "Không thể gửi biên lai.";
            if (error.response?.data) {
                if (error.response.data.message) errorMsg = error.response.data.message;
                else if (error.response.data.title) errorMsg = error.response.data.title;
                else if (error.response.data.errors) {
                    const firstErrorKey = Object.keys(error.response.data.errors)[0];
                    errorMsg = error.response.data.errors[firstErrorKey][0];
                }
            }
            notify.error("LỖI: " + errorMsg);
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

    // --- LOGIC NHIỀU PHÒNG CHO ĐIỆN NƯỚC ---
    const uniqueApartments = [...new Set(utilities.map(u => u.apartmentCode || 'Phòng hiện tại'))];
    const currentAptUtilities = utilities.filter(u => (u.apartmentCode || 'Phòng hiện tại') === selectedAptCode);
    
    const totalElectric = currentAptUtilities.reduce((sum, item) => sum + ((item.electricityNewIndex || 0) - (item.electricityOldIndex || 0)), 0);
    const totalWater = currentAptUtilities.reduce((sum, item) => sum + ((item.waterNewIndex || 0) - (item.waterOldIndex || 0)), 0);

    if (loading) {
        return (
            <div className="container-fluid d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
                <div className="spinner-border text-white" style={{ width: '3rem', height: '3rem' }}></div>
            </div>
        );
    }

    return (
        <div className="container-fluid py-4 px-4 pb-5">

            <div className="text-center mb-4 mt-2">
                <h2 className="fw-bold text-white mb-2 shadow-text">Xin chào, Cư dân!</h2>
                <p className="text-light text-shadow-sm">Quản lý hóa đơn và theo dõi chỉ số sử dụng điện nước</p>
            </div>

            {/* THANH ĐIỀU HƯỚNG TABS */}
            <div className="row justify-content-center mb-5">
                <div className="col-lg-8">
                    <ul className="nav nav-pills justify-content-center bg-white p-2 rounded-pill shadow-sm">
                        <li className="nav-item w-50 text-center">
                            <button 
                                className={`nav-link w-100 rounded-pill fw-bold py-2 ${activeTab === 'invoice' ? 'active bg-success' : 'text-secondary'}`}
                                onClick={() => setActiveTab('invoice')}
                            >
                                <i className="bi bi-receipt-cutoff me-2"></i>Thông Tin Hóa Đơn
                            </button>
                        </li>
                        <li className="nav-item w-50 text-center">
                            <button 
                                className={`nav-link w-100 rounded-pill fw-bold py-2 ${activeTab === 'utility' ? 'active bg-primary' : 'text-secondary'}`}
                                onClick={() => setActiveTab('utility')}
                            >
                                <i className="bi bi-lightning-charge-fill me-2"></i>Thông Tin Điện Nước
                            </button>
                        </li>
                    </ul>
                </div>
            </div>

            {/* TAB 1: THÔNG TIN HÓA ĐƠN */}
            {activeTab === 'invoice' && (
                <div className="mt-2 animate-fade-in">
                    <div className="row g-4">
                        {invoices.length === 0 ? (
                            <div className="col-12 text-center py-5 bg-white rounded-4 shadow-lg border-0 mx-auto" style={{ maxWidth: '800px' }}>
                                <i className="bi bi-check2-circle display-1 text-success opacity-25 d-block mb-3"></i>
                                <h5 className="text-muted fw-bold">Tuyệt vời! Bạn không có hóa đơn nào cần thanh toán.</h5>
                            </div>
                        ) : (
                            invoices.map((inv) => (
                                <div className="col-md-6 col-xl-4" key={inv.invoiceId}>
                                    <div className={`card h-100 shadow-sm border-0 border-top border-4 ${getCardBorderColor(inv.statusName)} rounded-4 bg-white hover-shadow-lg transition-all`}>
                                        <div className="card-body p-4 d-flex flex-column">
                                            <div className="d-flex justify-content-between align-items-start mb-4">
                                                <div>
                                                    <h5 className="fw-bold text-dark mb-1">{inv.billingPeriod || `Tháng ${inv.billingMonth}/${inv.billingYear}`}</h5>
                                                    
                                                    {/* ĐÃ CẬP NHẬT: Hiện tên phòng ngay cạnh Mã HĐ */}
                                                    <small className="text-muted">
                                                        Phòng: <strong className="text-dark">{inv.apartmentCode || 'N/A'}</strong> | Mã HĐ: #{inv.invoiceId}
                                                    </small>
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

                                                {(String(inv.statusName).toLowerCase() === 'pendingverification' || 
                                                  String(inv.statusName).toLowerCase() === 'pending' || 
                                                  String(inv.statusName).toLowerCase() === 'paid') && (
                                                    <button className="btn btn-outline-success w-100 fw-bold rounded-pill shadow-sm" onClick={() => handleViewProof(inv)}>
                                                        <i className="bi bi-image me-1"></i> Biên lai
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
            )}

            {/* TAB 2: CHỈ SỐ ĐIỆN NƯỚC (CÓ SIDEBAR NHIỀU PHÒNG) */}
            {activeTab === 'utility' && (
                <div className="mt-2 animate-fade-in">
                    <div className="row g-4">
                        
                        {/* SIDEBAR: DANH SÁCH PHÒNG */}
                        {uniqueApartments.length > 1 && (
                            <div className="col-lg-3">
                                <div className="card border-0 shadow-lg rounded-4 overflow-hidden bg-white sticky-top" style={{ top: '100px' }}>
                                    <div className="card-header bg-transparent border-bottom pt-4 pb-3 px-4">
                                        <h5 className="fw-bold mb-0 text-dark"><i className="bi bi-buildings text-primary me-2"></i> Danh Sách Căn Hộ</h5>
                                    </div>
                                    <div className="card-body p-3">
                                        <div className="nav flex-column nav-pills gap-2">
                                            {uniqueApartments.map((apt, idx) => (
                                                <button
                                                    key={idx}
                                                    className={`nav-link text-start fw-bold py-3 rounded-3 transition-all ${selectedAptCode === apt ? 'active bg-primary shadow-sm' : 'text-dark bg-light'}`}
                                                    onClick={() => setSelectedAptCode(apt)}
                                                >
                                                    <i className="bi bi-door-open me-2"></i> Phòng: {apt}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* NỘI DUNG ĐIỆN NƯỚC CỦA PHÒNG ĐƯỢC CHỌN */}
                        <div className={uniqueApartments.length > 1 ? "col-lg-9" : "col-12"}>
                            {/* Thẻ Tổng Kết */}
                            <div className="row g-4 mb-4">
                                <div className="col-md-6">
                                    <div className="card border-0 shadow-lg rounded-4 overflow-hidden bg-white">
                                        <div className="card-body p-4 d-flex align-items-center">
                                            <div className="bg-warning bg-opacity-25 p-3 rounded-circle me-4">
                                                <i className="bi bi-lightning-charge-fill text-warning fs-1"></i>
                                            </div>
                                            <div>
                                                <p className="text-muted mb-1 fw-semibold text-uppercase small">Tổng Điện Tiêu Thụ {uniqueApartments.length > 1 && `(P.${selectedAptCode})`}</p>
                                                <h3 className="fw-bold text-dark mb-0">{totalElectric.toLocaleString('vi-VN')} <span className="fs-6 text-muted fw-normal">kWh</span></h3>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <div className="card border-0 shadow-lg rounded-4 overflow-hidden bg-white">
                                        <div className="card-body p-4 d-flex align-items-center">
                                            <div className="bg-info bg-opacity-25 p-3 rounded-circle me-4">
                                                <i className="bi bi-droplet-fill text-info fs-1"></i>
                                            </div>
                                            <div>
                                                <p className="text-muted mb-1 fw-semibold text-uppercase small">Tổng Nước Tiêu Thụ {uniqueApartments.length > 1 && `(P.${selectedAptCode})`}</p>
                                                <h3 className="fw-bold text-dark mb-0">{totalWater.toLocaleString('vi-VN')} <span className="fs-6 text-muted fw-normal">m³</span></h3>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Bảng Chi Tiết Điện Nước */}
                            <div className="card border-0 shadow-lg rounded-4 overflow-hidden bg-white">
                                <div className="card-header bg-transparent border-bottom pt-4 pb-3 px-4 d-flex justify-content-between align-items-center">
                                    <h5 className="fw-bold mb-0 text-dark"><i className="bi bi-table text-primary me-2"></i> Lịch Sử Ghi Nhận</h5>
                                    {uniqueApartments.length > 1 && <span className="badge bg-primary rounded-pill px-3">Phòng: {selectedAptCode}</span>}
                                </div>
                                <div className="card-body p-0">
                                    {currentAptUtilities.length === 0 ? (
                                        <div className="text-center p-5 text-muted">
                                            <i className="bi bi-clipboard-data display-4 opacity-25 d-block mb-3"></i>
                                            Chưa có dữ liệu ghi nhận chỉ số điện nước.
                                        </div>
                                    ) : (
                                        <div className="table-responsive">
                                            <table className="table table-hover align-middle text-center mb-0">
                                                <thead className="table-light">
                                                    <tr>
                                                        <th className="py-3 text-muted small text-uppercase">Kỳ (Tháng/Năm)</th>
                                                        <th className="py-3 text-muted small text-uppercase border-start">Điện cũ</th>
                                                        <th className="py-3 text-muted small text-uppercase">Điện mới</th>
                                                        <th className="py-3 text-warning small text-uppercase fw-bold"><i className="bi bi-lightning-charge-fill"></i> Tiêu thụ (kWh)</th>
                                                        <th className="py-3 text-muted small text-uppercase border-start">Nước cũ</th>
                                                        <th className="py-3 text-muted small text-uppercase">Nước mới</th>
                                                        <th className="py-3 text-info small text-uppercase fw-bold"><i className="bi bi-droplet-fill"></i> Tiêu thụ (m³)</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {currentAptUtilities.map((u, idx) => {
                                                        const elecUsage = (u.electricityNewIndex || 0) - (u.electricityOldIndex || 0);
                                                        const waterUsage = (u.waterNewIndex || 0) - (u.waterOldIndex || 0);
                                                        return (
                                                            <tr key={idx}>
                                                                <td className="py-3 fw-bold text-dark">Tháng {u.month}/{u.year}</td>
                                                                <td className="py-3 border-start">{u.electricityOldIndex}</td>
                                                                <td className="py-3 fw-medium">{u.electricityNewIndex}</td>
                                                                <td className="py-3 fw-bold text-warning bg-warning bg-opacity-10">{elecUsage}</td>
                                                                <td className="py-3 border-start">{u.waterOldIndex}</td>
                                                                <td className="py-3 fw-medium">{u.waterNewIndex}</td>
                                                                <td className="py-3 fw-bold text-info bg-info bg-opacity-10">{waterUsage}</td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            )}

            {/* ========================================= */}
            {/* MODALS HÓA ĐƠN                            */}
            {/* ========================================= */}

            {(showPayModal || showDetailModal) && <div className="modal-backdrop fade show" style={{ zIndex: 1040, backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={closeModal}></div>}

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
                                <button type="button" className="btn btn-white border rounded-pill px-4 fw-bold shadow-sm" onClick={closeModal}>Đóng</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL THANH TOÁN (ẢNH QR TĨNH + THÔNG TIN CHI TIẾT) */}
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
                                    
                                    {/* MÃ QR CHUYỂN KHOẢN TĨNH */}
                                    <div className="text-center mb-4 p-4 border border-success border-opacity-25 rounded-4 bg-success bg-opacity-10">
                                        <p className="fw-bold text-dark mb-3 text-uppercase">Thông Tin Chuyển Khoản</p>
                                        
                                        <img 
                                            // THAY LINK NÀY BẰNG ẢNH QR MẶC ĐỊNH CỦA DỰ ÁN BẠN
                                            src="https://img.freepik.com/premium-vector/qr-code-sample-for-smartphone-scanning-on-white-background_736051-96.jpg" 
                                            alt="Mã QR Chuyển Khoản" 
                                            className="img-fluid rounded-3 shadow-sm border bg-white p-2 mb-3"
                                            style={{ maxWidth: '200px' }}
                                        />
                                        
                                        <div className="bg-white p-3 rounded-3 shadow-sm text-start">
                                            <div className="d-flex justify-content-between align-items-center mb-2 border-bottom pb-2">
                                                <span className="text-muted small">Số tiền cần chuyển:</span>
                                                <strong className="text-danger fs-5">{formatCurrency(selectedInvoice?.debt)}</strong>
                                            </div>
                                            <div className="d-flex justify-content-between align-items-center pt-1">
                                                <span className="text-muted small">Nội dung chuyển khoản:</span>
                                                {/* IN RA NỘI DUNG TỰ ĐỘNG THEO PHÒNG VÀ THÁNG */}
                                                <strong className="text-dark">Thanh toan P.{selectedInvoice?.apartmentCode || 'N/A'} Thang {selectedInvoice?.billingMonth}</strong>
                                            </div>
                                        </div>
                                        
                                        <small className="d-block text-danger mt-3 fw-medium fst-italic"><i className="bi bi-exclamation-circle me-1"></i> Vui lòng chuyển đúng số tiền và nội dung để được duyệt nhanh nhất.</small>
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
                                <div className="modal-footer bg-light border-top px-4 py-3 d-flex gap-2">
                                    <button type="button" className="btn btn-white border rounded-pill px-4 fw-bold shadow-sm" onClick={closeModal}>Hủy</button>
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

            {/* POPUP XEM ẢNH BIÊN LAI */}
            {showProofModal && proofImageUrl && selectedInvoice && (
                <div className="modal fade show d-block" tabIndex="-1" style={{ zIndex: 1050 }} onClick={closeModal}>
                    <div className="modal-dialog modal-dialog-centered" onClick={e => e.stopPropagation()}>
                        <div className="modal-content shadow-lg border-0">
                            <div className="modal-header bg-dark text-white border-0 py-2">
                                <h6 className="modal-title small fw-bold">Minh chứng: P.{selectedInvoice.apartmentCode || 'N/A'} - Tháng {selectedInvoice.billingMonth}</h6>
                                <button type="button" className="btn-close btn-close-white" onClick={closeModal}></button>
                            </div>
                            <div className="modal-body p-1 bg-secondary bg-opacity-10 text-center">
                                <img 
                                    src={proofImageUrl} 
                                    alt="Bill thanh toán" 
                                    className="img-fluid rounded shadow-sm" 
                                    style={{ maxHeight: '75vh', objectFit: 'contain' }}
                                />
                            </div>
                            <div className="modal-footer py-2 border-0 bg-light">
                                <button className="btn btn-sm btn-secondary" onClick={closeModal}>Đóng</button>
                                <a href={proofImageUrl} target="_blank" rel="noreferrer" className="btn btn-sm btn-primary">
                                    <i className="bi bi-box-arrow-up-right me-1"></i> Mở ảnh gốc
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .shadow-text { text-shadow: 1px 1px 4px rgba(0,0,0,0.8); }
                .text-shadow-sm { text-shadow: 1px 1px 2px rgba(0,0,0,0.1); }
                .transition-all { transition: all 0.2s ease-in-out; }
                .hover-bg-light:hover { background-color: #f8f9fa !important; }
                .hover-shadow-lg:hover { transform: translateY(-4px); box-shadow: 0 1rem 3rem rgba(0,0,0,.175)!important; }
                
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
                
                .custom-scrollbar::-webkit-scrollbar { width: 5px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
                .animate-fade-in { animation: fadeIn 0.4s ease-in-out; }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};

export default ResidentDashboard;