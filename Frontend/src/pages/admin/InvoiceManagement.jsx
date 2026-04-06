import React, { useState, useEffect } from 'react';
import api from '../../utils/axiosConfig';
import Pagination from '../../components/common/Pagination';
import { notify, confirmAction } from '../../utils/notificationAlert';

const InvoiceManagement = () => {
    const [invoices, setInvoices] = useState([]);
    const [apartments, setApartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    const availableYears = Array.from(new Array(6), (_, index) => currentYear - 3 + index);

    // Mặc định rỗng để hiển thị toàn bộ (Clear default filter)
    const [filters, setFilters] = useState({ month: '', year: '', status: '' });
    const [pagination, setPagination] = useState({ pageNumber: 1, pageSize: 10, totalCount: 0 });

    const [activeModal, setActiveModal] = useState(null); 
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [detailData, setDetailData] = useState(null);

    const [formData, setFormData] = useState({
        genMonth: currentMonth, genYear: currentYear, genApartmentId: '',
        additionalFee: 0, note: ''
    });

    const fetchInvoices = async (page = pagination.pageNumber) => {
        setLoading(true);
        try {
            const params = {
                PageNumber: page,
                PageSize: pagination.pageSize,
            };

            if (filters.month) params.Month = Number(filters.month);
            if (filters.year) params.Year = Number(filters.year);
            if (filters.status !== '') params.Status = Number(filters.status);

            const res = await api.get('/Invoice/list', { params });
            const data = res.data?.data;

            if (data) {
                setInvoices(data.items || []);
                setPagination(prev => ({ ...prev, pageNumber: data.pageNumber, totalCount: data.totalCount }));
            }
        } catch (error) {
            notify.error("Không thể tải danh sách hóa đơn.");
            setInvoices([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchApartments = async () => {
        try {
            const res = await api.get('/Apartments');
            const aList = res.data?.data || res.data;
            setApartments(Array.isArray(aList) ? aList : []);
        } catch (error) {
            notify.error("Lỗi khi tải danh sách phòng.");
        }
    };

    useEffect(() => {
        fetchApartments();
    }, []);

    useEffect(() => {
        fetchInvoices(1);
    }, [filters.month, filters.year, filters.status]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const openModal = async (type, invoice = null) => {
        setActiveModal(type);
        setSelectedInvoice(invoice);

        if (type === 'generate') {
            setFormData(prev => ({ ...prev, genMonth: currentMonth, genYear: currentYear, genApartmentId: '' }));
        } else if (type === 'edit') {
            setFormData(prev => ({ ...prev, additionalFee: 0, note: '' }));
        } else if (type === 'detail') {
            try {
                const res = await api.get(`/Invoice/apartment/${invoice.apartmentId}?month=${invoice.billingMonth}&year=${invoice.billingYear}`);
                const dataList = res.data?.data;
                if (dataList && dataList.length > 0) {
                    setDetailData(dataList[0]);
                }
            } catch (error) {
                notify.error("Không thể tải chi tiết hóa đơn.");
            }
        }
    };

    const closeModal = () => {
        setActiveModal(null);
        setSelectedInvoice(null);
        setDetailData(null);
    };

    const handleGenerate = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const payload = {
                month: Number(formData.genMonth),
                year: Number(formData.genYear),
                apartmentId: formData.genApartmentId ? Number(formData.genApartmentId) : null
            };
            const res = await api.post('/Invoice/generate', payload);

            notify.success(res.data?.message || "Tạo hóa đơn thành công!");
            fetchInvoices(1);
            closeModal();
        } catch (error) {
            notify.error(error.response?.data?.message || "Không thể tạo hóa đơn tự động.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEdit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const payload = {
                additionalFee: Number(formData.additionalFee),
                note: formData.note
            };
            const res = await api.put(`/Invoice/${selectedInvoice.invoiceId}`, payload);

            notify.success(res.data?.message || "Cập nhật phụ phí thành công!");
            fetchInvoices();
            closeModal();
        } catch (error) {
            notify.error(error.response?.data?.message || "Lỗi khi cập nhật hóa đơn.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleNotify = async (invoiceId) => {
        const { isConfirmed } = await confirmAction.fire({
            title: 'Gửi Email Nhắc Nợ?',
            text: 'Hệ thống sẽ gửi email tự động tới chủ hộ yêu cầu thanh toán hóa đơn này.',
            confirmButtonText: '<i class="bi bi-envelope-paper me-1"></i> Gửi ngay'
        });

        if (!isConfirmed) return;

        try {
            const res = await api.post(`/Invoice/${invoiceId}/notify`);
            notify.success(res.data?.message || "Đã gửi Email nhắc nợ thành công!");
        } catch (error) {
            notify.error(error.response?.data?.message || "Gửi Email thất bại.");
        }
    };

    const getStatusBadge = (statusName) => {
        if (statusName === 'Paid') return <span className="badge bg-success">Đã thanh toán</span>;
        if (statusName === 'Unpaid') return <span className="badge bg-danger">Chưa thanh toán</span>;
        return <span className="badge bg-secondary">{statusName || 'Không rõ'}</span>;
    };

    return (
        <div className="container-fluid p-0">
            <div className="d-flex justify-content-between align-items-start mb-4">
                <div>
                    <h2 className="fw-bold mb-0">Quản lý Hóa Đơn</h2>
                    <div className="text-muted small mt-2">Sinh hóa đơn định kỳ, cộng phụ phí và gửi nhắc nợ</div>
                </div>
                <button className="btn btn-primary" onClick={() => openModal('generate')}>
                    <i className="bi bi-magic me-2"></i> Sinh Hóa Đơn Tự Động
                </button>
            </div>

            <div className="card shadow-sm border-0 mb-4 bg-light">
                <div className="card-body py-3">
                    <div className="row g-3 align-items-end">
                        <div className="col-md-3">
                            <label className="form-label small fw-bold text-muted mb-1">Tháng</label>
                            <select className="form-select form-select-sm" name="month" value={filters.month} onChange={handleFilterChange}>
                                <option value="">Tất cả</option>
                                {[...Array(12).keys()].map(m => (
                                    <option key={m + 1} value={m + 1}>Tháng {m + 1}</option>
                                ))}
                            </select>
                        </div>
                        <div className="col-md-3">
                            <label className="form-label small fw-bold text-muted mb-1">Năm</label>
                            <select className="form-select form-select-sm" name="year" value={filters.year} onChange={handleFilterChange}>
                                <option value="">Tất cả các năm</option>
                                {availableYears.map(y => (
                                    <option key={y} value={y}>Năm {y}</option>
                                ))}
                            </select>
                        </div>
                        <div className="col-md-3">
                        <label className="form-label small fw-bold text-muted mb-1">Trạng thái</label>
                            <select className="form-select form-select-sm" name="status" value={filters.status} onChange={handleFilterChange}>
                                <option value="">Tất cả</option>
                                <option value="1">Chưa thanh toán (Unpaid)</option>
                                <option value="2">Chờ xác duyệt (Pending)</option>
                                <option value="3">Đã thanh toán (Paid)</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            <div className="card shadow-sm border-0">
                <div className="card-body p-0">
                    {loading ? (
                        <div className="text-center p-5"><div className="spinner-border text-primary"></div></div>
                    ) : invoices.length === 0 ? (
                        <div className="text-center p-5 text-muted">Chưa có dữ liệu hóa đơn nào trong hệ thống.</div>
                    ) : (
                        <>
                            <div className="table-responsive">
                                <table className="table table-hover table-bordered mb-0 align-middle text-center">
                                    <thead className="table-light text-muted small">
                                        <tr>
                                            <th>Mã Phòng</th>
                                            <th>Kỳ HĐ</th>
                                            <th>Ngày Lập</th>
                                            <th>Tổng Cần Thu</th>
                                            <th>Dư Nợ</th>
                                            <th>Trạng Thái</th>
                                            <th>Thao Tác</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {invoices.map((inv) => (
                                            <tr key={inv.invoiceId}>
                                                <td className="fw-bold text-primary">{inv.apartmentCode}</td>
                                                <td className="fw-semibold text-primary">
                                                    {inv.billingPeriod || `Tháng ${inv.billingMonth}/${inv.billingYear}`}
                                                </td>
                                                <td className="small text-muted">{inv.createdAt}</td>
                                                <td className="fw-bold text-success">{inv.totalMoney?.toLocaleString()} đ</td>
                                                <td className="fw-bold text-danger">{inv.debt?.toLocaleString()} đ</td>
                                                <td>{getStatusBadge(inv.statusName)}</td>
                                                <td>
                                                    <button className="btn btn-sm btn-outline-info me-1 mb-1" onClick={() => openModal('detail', inv)}>
                                                        <i className="bi bi-eye me-1"></i> Chi tiết
                                                    </button>
                                                    {inv.statusName === 'Unpaid' && (
                                                        <>
                                                            <button className="btn btn-sm btn-outline-warning me-1 mb-1" onClick={() => openModal('edit', inv)}>
                                                                <i className="bi bi-plus-slash-minus me-1"></i> Phụ phí
                                                            </button>
                                                            <button className="btn btn-sm btn-outline-danger mb-1" onClick={() => handleNotify(inv.invoiceId)}>
                                                                <i className="bi bi-envelope-exclamation me-1"></i> Nhắc nợ
                                                            </button>
                                                        </>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="mt-3">
                                <Pagination totalItems={pagination.totalCount} itemsPerPage={pagination.pageSize} currentPage={pagination.pageNumber} onPageChange={fetchInvoices} />
                            </div>
                        </>
                    )}
                </div>
            </div>

            {activeModal && <div className="modal-backdrop fade show"></div>}

            {/* --- MODAL 1: SINH HÓA ĐƠN --- */}
            {activeModal === 'generate' && (
                <div className="modal fade show d-block" tabIndex="-1">
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header bg-primary text-white">
                                <h5 className="modal-title fw-bold">Sinh Hóa Đơn Tự Động</h5>
                                <button type="button" className="btn-close btn-close-white" onClick={closeModal}></button>
                            </div>
                            <form onSubmit={handleGenerate}>
                                <div className="modal-body">
                                    <div className="alert alert-info small">
                                        <i className="bi bi-info-circle me-1"></i>
                                        Hệ thống sẽ tự động tổng hợp Tiền phòng, Điện, Nước và Phí dịch vụ của tháng được chọn.
                                    </div>
                                    <div className="row g-3">
                                        <div className="col-6">
                                            <label className="form-label fw-semibold">Tháng (*)</label>
                                            {/* Áp dụng Dropdown List (Danh sách thả xuống) cho Tháng */}
                                            <select className="form-select" name="genMonth" value={formData.genMonth} onChange={handleInputChange} required>
                                                {[...Array(12).keys()].map(m => (
                                                    <option key={m + 1} value={m + 1}>Tháng {m + 1}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="col-6">
                                            <label className="form-label fw-semibold">Năm (*)</label>
                                            {/* Áp dụng Dropdown List (Danh sách thả xuống) cho Năm */}
                                            <select className="form-select" name="genYear" value={formData.genYear} onChange={handleInputChange} required>
                                                {availableYears.map(y => (
                                                    <option key={y} value={y}>Năm {y}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="col-12">
                                            <label className="form-label fw-semibold">Áp dụng cho phòng</label>
                                            <select className="form-select" name="genApartmentId" value={formData.genApartmentId} onChange={handleInputChange}>
                                                <option value="">-- Tất cả phòng đang thuê --</option>
                                                {apartments.filter(a => a.status === 2).map(apt => (
                                                    <option key={apt.apartmentId} value={apt.apartmentId}>{apt.apartmentCode} - {apt.apartmentName}</option>
                                                ))}
                                            </select>
                                            <small className="text-muted mt-1 d-block">* Để trống nếu muốn tính tiền cho toàn bộ hệ thống.</small>
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-footer bg-light">
                                    <button type="button" className="btn btn-secondary" onClick={closeModal}>Hủy</button>
                                    <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                                        {isSubmitting ? 'Đang xử lý...' : 'Bắt đầu Tạo'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* --- MODAL 2: THÊM PHỤ PHÍ --- */}
            {activeModal === 'edit' && (
                <div className="modal fade show d-block" tabIndex="-1">
                    <div className="modal-dialog">
                        <div className="modal-content border-warning">
                            <div className="modal-header bg-warning text-dark">
                                <h5 className="modal-title fw-bold">Thêm Phụ Phí (Phạt)</h5>
                                <button type="button" className="btn-close" onClick={closeModal}></button>
                            </div>
                            <form onSubmit={handleEdit}>
                                <div className="modal-body">
                                    <p>Hóa đơn phòng: <strong className="text-primary">{selectedInvoice?.apartmentCode}</strong></p>
                                    <div className="mb-3">
                                        <label className="form-label fw-semibold">Số tiền thu thêm (VNĐ) (*)</label>
                                        <input type="number" min="0" className="form-control" name="additionalFee" value={formData.additionalFee} onChange={handleInputChange} required />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label fw-semibold">Lý do (Ghi chú)</label>
                                        <textarea className="form-control" name="note" rows="2" value={formData.note} onChange={handleInputChange} placeholder="VD: Phạt nộp muộn, đền bù đồ đạc..."></textarea>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={closeModal}>Hủy</button>
                                    <button type="submit" className="btn btn-warning" disabled={isSubmitting}>
                                        {isSubmitting ? 'Đang xử lý...' : 'Cập nhật Hóa Đơn'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* --- MODAL 3: XEM CHI TIẾT --- */}
            {activeModal === 'detail' && (
                <div className="modal fade show d-block" tabIndex="-1">
                    <div className="modal-dialog modal-lg">
                        <div className="modal-content">
                            <div className="modal-header bg-info text-white">
                                <h5 className="modal-title fw-bold">Chi Tiết Hóa Đơn</h5>
                                <button type="button" className="btn-close btn-close-white" onClick={closeModal}></button>
                            </div>
                            <div className="modal-body">
                                {!detailData ? (
                                    <div className="text-center p-4"><div className="spinner-border text-info"></div></div>
                                ) : (
                                    <div>
                                        <div className="row mb-3 bg-light p-3 rounded">
                                            <div className="col-md-6">
                                                <p className="mb-1 text-muted">Mã Phòng:</p> 
                                                <h6 className="fw-bold">{detailData.apartmentCode}</h6>
                                            </div>
                                            <div className="col-md-6">
                                                <p className="mb-1 text-muted">Kỳ thanh toán:</p> 
                                                <h6 className="fw-bold text-primary">
                                                    {detailData.billingPeriod || `Tháng ${detailData.billingMonth}/${detailData.billingYear}`}
                                                </h6>
                                            </div>
                                            <div className="col-md-6 mt-2">
                                                <p className="mb-1 text-muted">Trạng thái:</p> 
                                                <h6>{getStatusBadge(detailData.statusName)}</h6>
                                            </div>
                                            <div className="col-md-6 mt-2">
                                                <p className="mb-1 text-muted">Ngày lập:</p> 
                                                <h6>{detailData.dayCreat || "Đang cập nhật"}</h6>
                                            </div>
                                        </div>

                                        {detailData.utilityHistory && (
                                            <>
                                                <h6 className="fw-bold text-warning border-bottom pb-2 mb-3 mt-4">
                                                    <i className="bi bi-speedometer2 me-2"></i>Chỉ Số Tiêu Thụ Điện / Nước
                                                </h6>
                                                <div className="row mb-4">
                                                    <div className="col-md-6">
                                                        <div className="card border-info h-100">
                                                            <div className="card-header bg-info text-dark fw-bold py-2">
                                                                <i className="bi bi-lightning-charge-fill me-1"></i> Điện năng (kWh)
                                                            </div>
                                                            <div className="card-body py-2 small">
                                                                <div className="d-flex justify-content-between border-bottom pb-1 mb-1">
                                                                    <span className="text-muted">Chỉ số cũ:</span>
                                                                    <strong>{detailData.utilityHistory.oldElectricIndex}</strong>
                                                                </div>
                                                                <div className="d-flex justify-content-between border-bottom pb-1 mb-1">
                                                                    <span className="text-muted">Chỉ số mới:</span>
                                                                    <strong>{detailData.utilityHistory.newElectricIndex}</strong>
                                                                </div>
                                                                <div className="d-flex justify-content-between">
                                                                    <span className="fw-semibold text-danger">Tiêu thụ:</span>
                                                                    <strong className="text-danger fs-6">{detailData.utilityHistory.electricUsage}</strong>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="col-md-6">
                                                        <div className="card border-primary h-100">
                                                            <div className="card-header bg-primary text-white fw-bold py-2">
                                                                <i className="bi bi-droplet-fill me-1"></i> Nước sinh hoạt (m³)
                                                            </div>
                                                            <div className="card-body py-2 small">
                                                                <div className="d-flex justify-content-between border-bottom pb-1 mb-1">
                                                                    <span className="text-muted">Chỉ số cũ:</span>
                                                                    <strong>{detailData.utilityHistory.oldWaterIndex}</strong>
                                                                </div>
                                                                <div className="d-flex justify-content-between border-bottom pb-1 mb-1">
                                                                    <span className="text-muted">Chỉ số mới:</span>
                                                                    <strong>{detailData.utilityHistory.newWaterIndex}</strong>
                                                                </div>
                                                                <div className="d-flex justify-content-between">
                                                                    <span className="fw-semibold text-primary">Tiêu thụ:</span>
                                                                    <strong className="text-primary fs-6">{detailData.utilityHistory.waterUsage}</strong>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </>
                                        )}

                                        <h6 className="fw-bold text-primary border-bottom pb-2 mb-3 mt-4">
                                            <i className="bi bi-receipt me-2"></i>Bảng Kê Chi Tiết
                                        </h6>
                                        <table className="table table-sm table-bordered text-center">
                                            <thead className="table-light">
                                                <tr><th>Khoản thu</th><th>Thành tiền (VNĐ)</th></tr>
                                            </thead>
                                            <tbody>
                                                {detailData.details && detailData.details.map((d, idx) => (
                                                    <tr key={idx}>
                                                        <td className="text-start ps-3">{d.feeName}</td>
                                                        <td className="fw-semibold">{d.amount?.toLocaleString()}</td>
                                                    </tr>
                                                ))}
                                                <tr className="table-secondary">
                                                    <td className="text-end pe-3 fw-bold">TỔNG CỘNG:</td>
                                                    <td className="fw-bold text-danger fs-5">{detailData.totalMoney?.toLocaleString()} đ</td>
                                                </tr>
                                            </tbody>
                                        </table>

                                        <div className="row mt-3 text-center">
                                            <div className="col-6">
                                                <div className="p-2 border rounded border-success">
                                                    <span className="text-muted d-block small">Đã nộp</span>
                                                    <strong className="text-success">{detailData.pay?.toLocaleString()} đ</strong>
                                                </div>
                                            </div>
                                            <div className="col-6">
                                                <div className="p-2 border rounded border-danger">
                                                    <span className="text-muted d-block small">Còn nợ</span>
                                                    <strong className="text-danger">{detailData.debt?.toLocaleString()} đ</strong>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="modal-footer bg-light">
                                <button type="button" className="btn btn-secondary" onClick={closeModal}>Đóng</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InvoiceManagement;