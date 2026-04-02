import React, { useState, useEffect } from 'react';
import api from '../../utils/axiosConfig';
import { notify } from '../../utils/notificationAlert';

const ResidentDashboard = () => {
    const [roomInfo, setRoomInfo] = useState(null);
    const [invoices, setInvoices] = useState([]); // Thêm state cho invoices bị thiếu
    const [loading, setLoading] = useState(true);

    const [showPayModal, setShowPayModal] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [file, setFile] = useState(null);
    const [note, setNote] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [showDetailModal, setShowDetailModal] = useState(false);
    const [detailData, setDetailData] = useState(null);
    const [loadingDetail, setLoadingDetail] = useState(false);

    // Hàm lấy danh sách hóa đơn
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
        const fetchData = async () => {
            setLoading(true);
            try {
                // Gọi song song cả 2 API để tối ưu tốc độ
                const [roomRes, invoiceRes] = await Promise.all([
                    api.get('/Residents/MyRoom'),
                    api.get('/Invoice/my-invoices')
                ]);

                const roomData = roomRes.data?.data || roomRes.data;
                setRoomInfo(roomData);

                const invData = invoiceRes.data?.data || invoiceRes.data;
                setInvoices(Array.isArray(invData) ? invData : []);
            } catch (error) {
                console.error("Lỗi tải dữ liệu dashboard:", error);
                notify.error("Không thể tải thông tin dashboard.");
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
    };

    const handleSubmitPayment = async (e) => {
        e.preventDefault();
        if (!file) {
            notify.error("Vui lòng chọn ảnh biên lai giao dịch!");
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
            notify.success(res.data?.message || "Đã gửi biên lai thành công!");
            closeModal();
            fetchMyInvoices();
        } catch (error) {
            notify.error("LỖI: " + (error.response?.data?.message || "Không thể gửi biên lai."));
        } finally {
            setIsSubmitting(false);
        }
    };

    const getStatusBadge = (statusName) => {
        if (statusName === 'Paid') return <span className="badge bg-success">Đã thanh toán</span>;
        if (statusName === 'Unpaid') return <span className="badge bg-danger">Chưa thanh toán</span>;
        if (statusName === 'PendingVerification' || statusName === 'Pending') return <span className="badge bg-warning text-dark">Đang chờ duyệt</span>;
        return <span className="badge bg-secondary">{statusName || 'Không rõ'}</span>;
    };

    if (loading) {
        return (
            <div className="container-fluid d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
                <div className="spinner-border text-primary" style={{ width: '3rem', height: '3rem' }}></div>
            </div>
        );
    }

    if (!roomInfo) {
        return (
            <div className="container-fluid py-4">
                <div className="card border-0 shadow-sm rounded-4 text-center p-5">
                    <i className="bi bi-house-x display-1 text-muted opacity-25 mb-3"></i>
                    <h4 className="text-muted fw-bold">Chưa có dữ liệu căn hộ</h4>
                    <p className="text-secondary">Vui lòng liên hệ Ban Quản Lý để được hỗ trợ.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container-fluid py-4">
            {/* LỜI CHÀO MỪNG */}
            <div className="d-flex align-items-center mb-4 p-4 bg-primary bg-opacity-10 rounded-4 shadow-sm border border-primary-subtle">
                <div className="bg-primary text-white rounded-circle d-flex justify-content-center align-items-center me-4 shadow" style={{ width: '60px', height: '60px' }}>
                    <i className="bi bi-person-fill fs-2"></i>
                </div>
                <div>
                    <h3 className="fw-bold text-primary mb-1">Xin chào Cư dân!</h3>
                    <p className="text-secondary mb-0">Chào mừng bạn về nhà. Dưới đây là thông tin tổng quan về căn hộ của bạn.</p>
                </div>
            </div>

            <div className="row g-4">
                {/* --- CỘT TRÁI: THÔNG TIN CĂN HỘ --- */}
                <div className="col-lg-5">
                    <div className="card border-0 shadow-sm rounded-4 h-100">
                        <div className="card-header bg-white border-bottom py-3">
                            <h5 className="fw-bold mb-0 text-dark"><i className="bi bi-info-square-fill text-primary me-2"></i>Thông Tin Căn Hộ</h5>
                        </div>
                        <div className="card-body p-4">
                            <div className="text-center mb-4">
                                <div className="display-4 fw-bold text-primary mb-2">{roomInfo.apartmentCode}</div>
                                <span className="badge bg-success px-3 py-2 fs-6 rounded-pill">Đang cư trú</span>
                            </div>
                            <ul className="list-group list-group-flush">
                                <li className="list-group-item d-flex justify-content-between align-items-center px-0 py-3">
                                    <span className="text-muted"><i className="bi bi-building me-2"></i>Tòa nhà</span>
                                    <span className="fw-bold text-dark">{roomInfo.buildingName || 'N/A'}</span>
                                </li>
                                <li className="list-group-item d-flex justify-content-between align-items-center px-0 py-3">
                                    <span className="text-muted"><i className="bi bi-layers me-2"></i>Tầng</span>
                                    <span className="fw-bold text-dark">Tầng {roomInfo.floor || 'N/A'}</span>
                                </li>
                                <li className="list-group-item d-flex justify-content-between align-items-center px-0 py-3">
                                    <span className="text-muted"><i className="bi bi-rulers me-2"></i>Diện tích</span>
                                    <span className="fw-bold text-dark">{roomInfo.area || 0} m²</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* --- CỘT PHẢI: THÀNH VIÊN & DỊCH VỤ --- */}
                <div className="col-lg-7">
                    <div className="row g-4">
                        <div className="col-12">
                            <div className="card border-0 shadow-sm rounded-4">
                                <div className="card-header bg-white border-bottom py-3 d-flex justify-content-between align-items-center">
                                    <h5 className="fw-bold mb-0 text-dark"><i className="bi bi-people-fill text-warning me-2"></i>Thành Viên</h5>
                                    <span className="badge bg-warning text-dark rounded-pill">{roomInfo.roommates?.length || 0} người</span>
                                </div>
                                <div className="card-body p-0">
                                    {roomInfo.roommates?.map((member, index) => (
                                        <div key={index} className="d-flex justify-content-between align-items-center p-3 border-bottom hover-bg-light">
                                            <div className="fw-bold">{member.fullName}</div>
                                            <span className={`badge ${member.isOwner ? 'bg-danger' : 'bg-info'} bg-opacity-10 text-${member.isOwner ? 'danger' : 'info'}`}>
                                                {member.isOwner ? 'Chủ hộ' : 'Thành viên'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="col-12">
                            <div className="card border-0 shadow-sm rounded-4">
                                <div className="card-header bg-white border-bottom py-3">
                                    <h5 className="fw-bold mb-0 text-dark"><i className="bi bi-box-seam-fill text-success me-2"></i>Dịch Vụ Đang Sử Dụng</h5>
                                </div>
                                <div className="card-body p-0">
                                    <table className="table table-hover mb-0">
                                        <tbody>
                                            {roomInfo.services?.map((svc, index) => (
                                                <tr key={index}>
                                                    <td className="ps-4">{svc.serviceName}</td>
                                                    <td className="text-end pe-4 fw-bold text-danger">{formatCurrency(svc.price || svc.serviceFee)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- PHẦN HÓA ĐƠN --- */}
            <div className="mt-5">
                <h4 className="fw-bold mb-4 text-dark"><i className="bi bi-receipt-cutoff text-primary me-2"></i>Danh Sách Hóa Đơn</h4>
                <div className="row g-4">
                    {invoices.length === 0 ? (
                        <div className="col-12 text-center py-5 text-muted">Không có dữ liệu hóa đơn.</div>
                    ) : (
                        invoices.map((inv) => (
                            <div className="col-md-6 col-lg-4" key={inv.invoiceId}>
                                <div className={`card h-100 shadow-sm border-0 border-top border-4 ${inv.statusName === 'Unpaid' ? 'border-danger' : 'border-success'}`}>
                                    <div className="card-body">
                                        <div className="d-flex justify-content-between align-items-center mb-3">
                                            <h5 className="fw-bold text-primary mb-0">{inv.billingPeriod || `Tháng ${inv.billingMonth}/${inv.billingYear}`}</h5>
                                            {getStatusBadge(inv.statusName)}
                                        </div>
                                        <div className="d-flex justify-content-between small mb-1">
                                            <span>Tổng tiền:</span> <span className="fw-bold">{formatCurrency(inv.totalMoney)}</span>
                                        </div>
                                        <div className="d-flex justify-content-between text-danger fw-bold border-top pt-2 mt-2">
                                            <span>Còn nợ:</span> <span className="fs-5">{formatCurrency(inv.debt)}</span>
                                        </div>
                                        <div className="d-flex gap-2 mt-4">
                                            <button className="btn btn-outline-info w-100 btn-sm" onClick={() => handleOpenDetail(inv)}>Chi tiết</button>
                                            {inv.statusName === 'Unpaid' && inv.debt > 0 && (
                                                <button className="btn btn-primary w-100 btn-sm" onClick={() => handleOpenPay(inv)}>Thanh toán</button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* MODALS */}
            {/* Modal Detail & Pay Code giữ nguyên như bản technician-ui */}
            {/* ... (Các Modal Detail và Pay như trong code của bạn) ... */}

            {(showPayModal || showDetailModal) && <div className="modal-backdrop fade show"></div>}

            {/* Render Modal Detail & Pay ở đây tương tự như code cũ của bạn */}
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
                                    <table className="table table-bordered">
                                        <thead><tr><th>Hạng mục</th><th>Số tiền</th></tr></thead>
                                        <tbody>
                                            {detailData.details?.map((d, i) => (
                                                <tr key={i}><td>{d.feeName}</td><td>{formatCurrency(d.amount)}</td></tr>
                                            ))}
                                            <tr className="table-secondary fw-bold"><td>TỔNG CỘNG</td><td className="text-danger">{formatCurrency(detailData.totalMoney)}</td></tr>
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

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
                                    <p>Vui lòng chuyển nợ: <strong className="text-danger">{formatCurrency(selectedInvoice?.debt)}</strong></p>
                                    <input type="file" className="form-control mb-3" accept="image/*" onChange={(e) => setFile(e.target.files[0])} required />
                                    <textarea className="form-control" placeholder="Ghi chú..." value={note} onChange={(e) => setNote(e.target.value)}></textarea>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={closeModal}>Hủy</button>
                                    <button type="submit" className="btn btn-primary" disabled={isSubmitting}>Xác nhận</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            <style>{`.hover-bg-light:hover { background-color: #f8f9fa !important; }`}</style>
        </div>
    );
};

export default ResidentDashboard;