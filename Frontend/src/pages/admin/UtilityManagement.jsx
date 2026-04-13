import React, { useState, useEffect } from 'react';
import api from '../../utils/axiosConfig';
import Pagination from '../../components/common/Pagination';
import { notify, confirmAction } from '../../utils/notificationAlert';

const UtilityManagement = () => {
    // --- STATE CHUNG ---
    const [apartments, setApartments] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedApt, setSelectedApt] = useState(null);
    
    // --- STATE LỊCH SỬ ---
    const [history, setHistory] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [historyError, setHistoryError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isGeneratingRow, setIsGeneratingRow] = useState(false);

    // --- PHÂN TRANG LỊCH SỬ ---
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    // --- STATE THỜI GIAN & NHẬP LIỆU ---
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    const contractStartDate = history.length > 0 ? new Date(history[history.length - 1].contractStartDate) : null;

    let availableYears = [];
    if (contractStartDate) {
        for (let y = contractStartDate.getFullYear(); y <= currentYear; y++) {
            availableYears.push(y);
        }
    } else {
        availableYears = [currentYear];
    }

    const [formData, setFormData] = useState({
        month: currentMonth,
        year: currentYear,
        electricIndex: '',
        waterIndex: ''
    });

    let availableMonths = [];
    if (contractStartDate) {
        let startM = Number(formData.year) === contractStartDate.getFullYear() ? contractStartDate.getMonth() + 1 : 1;
        let endM = Number(formData.year) === currentYear ? currentMonth : 12;
        for (let m = startM; m <= endM; m++) {
            availableMonths.push(m);
        }
    } else {
        availableMonths = [...Array(12)].map((_, i) => i + 1);
    }

    // Tự động nắn tháng về hợp lệ nếu đổi năm
    useEffect(() => {
        if (availableMonths.length > 0 && !availableMonths.includes(Number(formData.month))) {
            setFormData(prev => ({ ...prev, month: availableMonths[availableMonths.length - 1] }));
        }
    }, [formData.year, availableMonths]);

    // --- STATE CÁC MODAL ---
    const [showGenModal, setShowGenModal] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [genData, setGenData] = useState({ genMonth: currentMonth, genYear: currentYear });

    const [showExcelModal, setShowExcelModal] = useState(false);
    const [excelFile, setExcelFile] = useState(null);
    const [isImporting, setIsImporting] = useState(false);

    // 1. LẤY DANH SÁCH CĂN HỘ
    useEffect(() => {
        const fetchApartments = async () => {
            try {
                const res = await api.get('/Apartments');
                const data = res.data?.data || res.data;
                const occupiedApts = (Array.isArray(data) ? data : []).filter(a => a.status === 2);
                setApartments(occupiedApts);
            } catch (error) {
                notify.error("Lỗi tải danh sách căn hộ");
            }
        };
        fetchApartments();
    }, []);

    // 2. LẤY LỊCH SỬ KHI BẤM CHỌN PHÒNG
    const fetchHistory = async (apartmentId) => {
        setLoadingHistory(true);
        setHistoryError('');
        try {
            const res = await api.get(`/Utility/history/apartment/${apartmentId}`);
            const historyData = res.data?.data || res.data;
            setHistory(Array.isArray(historyData) ? historyData : []);
            setCurrentPage(1);
        } catch (error) {
            setHistoryError(error.response?.data?.message || "Không thể tải lịch sử tiêu thụ");
            setHistory([]);
        } finally {
            setLoadingHistory(false);
        }
    };

    const handleSelectApartment = (apt) => {
        setSelectedApt(apt);
        setFormData(prev => ({ ...prev, electricIndex: '', waterIndex: '' }));
        fetchHistory(apt.apartmentId);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // 3. XỬ LÝ LƯU CHỈ SỐ (CÓ POPUP XÁC THỰC LẠI)
    const handleSubmitUtility = async (e) => {
        e.preventDefault();

        if (!selectedApt) return notify.warning("Vui lòng chọn một căn hộ bên trái!");
        if (!formData.electricIndex && !formData.waterIndex)
            return notify.warning("Vui lòng nhập ít nhất một chỉ số (Điện hoặc Nước)!");

        const { isConfirmed } = await confirmAction.fire({
            title: 'Xác nhận chốt chỉ số',
            html: `
                <div class="text-start fs-6">
                    <p class="mb-2">Căn hộ: <strong class="text-primary">${selectedApt.apartmentCode}</strong></p>
                    <p class="mb-3 border-bottom pb-2">Kỳ ghi số: <strong>Tháng ${formData.month}/${formData.year}</strong></p>
                    <div class="d-flex justify-content-between mb-2">
                        <span>Chỉ số Điện mới:</span> 
                        <strong class="text-warning">${formData.electricIndex ? formData.electricIndex + ' kWh' : 'Bỏ qua'}</strong>
                    </div>
                    <div class="d-flex justify-content-between">
                        <span>Chỉ số Nước mới:</span> 
                        <strong class="text-info">${formData.waterIndex ? formData.waterIndex + ' m³' : 'Bỏ qua'}</strong>
                    </div>
                </div>
            `,
            confirmButtonText: '<i class="bi bi-check-circle me-1"></i> Đồng ý Lưu'
        });

        if (!isConfirmed) return;

        setIsSubmitting(true);
        const formattedDate = `${formData.year}-${String(formData.month).padStart(2, '0')}-01T00:00:00`;
        let successCount = 0;
        let errors = [];

        const processUtility = async (type, value, endpoint) => {
            let payload = {
                apartmentId: selectedApt.apartmentId,
                registrationDate: formattedDate,
                newIndex: Number(value),
                isMerge: false
            };

            try {
                await api.post(endpoint, payload);
                successCount++;
                setFormData(prev => ({ ...prev, [type === 'Điện' ? 'electricIndex' : 'waterIndex']: '' }));
            } catch (error) {
                const errorMsg = error.response?.data?.message || `Lỗi lưu số ${type.toLowerCase()}`;
                if (errorMsg.startsWith("REQUIRE_MERGE|")) {
                    const confirmText = errorMsg.split("|")[1];
                    const { isConfirmed: mergeConfirmed } = await confirmAction.fire({
                        title: 'Phát hiện thiếu hụt kỳ',
                        text: confirmText,
                        confirmButtonText: '<i class="bi bi-check-circle me-1"></i> Đồng ý gộp'
                    });

                    if (mergeConfirmed) {
                        payload.isMerge = true;
                        try {
                            await api.post(endpoint, payload);
                            successCount++;
                            setFormData(prev => ({ ...prev, [type === 'Điện' ? 'electricIndex' : 'waterIndex']: '' }));
                        } catch (retryError) {
                            errors.push(`${type}: ${retryError.response?.data?.message || "Lỗi xử lý gộp kỳ."}`);
                        }
                    } else {
                        errors.push(`${type}: Đã hủy thao tác gộp kỳ.`);
                    }
                } else {
                    errors.push(`${type}: ${errorMsg}`);
                }
            }
        };

        if (formData.electricIndex) await processUtility('Điện', formData.electricIndex, '/Utility/electric/input');
        if (formData.waterIndex) await processUtility('Nước', formData.waterIndex, '/Utility/water/input');

        if (successCount > 0) notify.success(`Đã chốt thành công ${successCount} chỉ số!`);
        if (errors.length > 0) errors.forEach(err => notify.error(err));

        await fetchHistory(selectedApt.apartmentId);
        setIsSubmitting(false);
    };

    // 4. SINH HÓA ĐƠN TỪNG DÒNG (CÓ HỎI LẠI)
    const handleGenerateRowInvoice = async (month, year) => {
        const { isConfirmed } = await confirmAction.fire({
            title: 'Xác nhận tạo hóa đơn',
            html: `Hệ thống sẽ tổng hợp tiền phòng, phí dịch vụ và điện nước để tạo hóa đơn cho phòng <strong class="text-primary">${selectedApt.apartmentCode}</strong> kỳ <strong class="text-danger">Tháng ${month}/${year}</strong>.`,
            confirmButtonText: '<i class="bi bi-check-circle me-1"></i> Bắt đầu tạo',
            confirmButtonColor: '#0d6efd'
        });

        if (!isConfirmed) return;

        try {
            setIsGeneratingRow(true);
            const payload = { month: Number(month), year: Number(year), apartmentId: selectedApt.apartmentId };
            await api.post('/Invoice/generate', payload);
            notify.success(`Đã tạo hóa đơn tháng ${month}/${year} cho phòng ${selectedApt.apartmentCode}`);
            await fetchHistory(selectedApt.apartmentId); 
        } catch (error) {
             notify.error(error.response?.data?.message || "Tạo hóa đơn thất bại.");
        } finally {
            setIsGeneratingRow(false);
        }
    };

    // 5. SINH HÓA ĐƠN TỔNG
    const handleGenerateGlobalInvoice = async (e) => {
        e.preventDefault();
        setIsGenerating(true);
        try {
            const payload = { month: Number(genData.genMonth), year: Number(genData.genYear), apartmentId: null };
            const res = await api.post('/Invoice/generate', payload);
            notify.success(res.data?.message || "Tạo hóa đơn hàng loạt thành công!");
            setShowGenModal(false);
            if (selectedApt) fetchHistory(selectedApt.apartmentId);
        } catch (error) {
            notify.error(error.response?.data?.message || "Không thể tạo hóa đơn tự động.");
        } finally {
            setIsGenerating(false);
        }
    };

    // 6. XỬ LÝ IMPORT EXCEL (ĐÃ CẬP NHẬT LUỒNG MỚI ĐỌC 4 CỘT)
    const handleImportExcel = async (e) => {
        e.preventDefault();
        if (!excelFile) return notify.warning("Vui lòng chọn file Excel!");

        setIsImporting(true);
        const data = new FormData();
        data.append('file', excelFile);

        try {
            // Đã bỏ ?utilityType đi theo yêu cầu của API mới
            const res = await api.post('/Utility/import-excel', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            notify.success(res.data?.message || "Nhập dữ liệu thành công!");
            setShowExcelModal(false);
            if (selectedApt) fetchHistory(selectedApt.apartmentId);
        } catch (error) {
            notify.error(error.response?.data?.message || "Lỗi khi nhập dữ liệu Excel.");
        } finally {
            setIsImporting(false);
            setExcelFile(null);
        }
    };

    const filteredApts = apartments.filter(a => a.apartmentCode?.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // Tìm record gần nhất có số khác 0 để gợi ý
    const latestRecord = history.find(h => h.electricityNewIndex > 0 || h.waterNewIndex > 0) || null;

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentHistory = history.slice(indexOfFirstItem, indexOfLastItem);

    return (
        <div className="container-fluid p-0">
            {/* HEADER & NÚT CÔNG CỤ */}
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4">
                <div>
                    <h2 className="fw-bold mb-0 text-dark">Ghi Số Điện Nước</h2>
                    <div className="text-muted small mt-2">Chốt chỉ số tiêu thụ hàng tháng cho từng căn hộ nhanh chóng</div>
                </div>
                <div className="d-flex gap-2 mt-3 mt-md-0">
                    <button className="btn btn-success shadow-sm fw-bold" onClick={() => setShowExcelModal(true)}>
                        <i className="bi bi-file-earmark-excel me-2"></i> Nhập từ Excel
                    </button>
                    <button className="btn btn-primary shadow-sm fw-bold" onClick={() => setShowGenModal(true)}>
                        <i className="bi bi-magic me-2"></i> Sinh HĐ Toàn Hệ Thống
                    </button>
                </div>
            </div>

            <div className="row g-4 align-items-stretch">
                {/* CỘT TRÁI: DANH SÁCH CĂN HỘ */}
                <div className="col-lg-3 col-md-4">
                    <div className="card shadow-sm border-0 h-100 bg-white overflow-hidden rounded-4">
                        <div className="card-header bg-white pt-4 pb-3 px-4 border-bottom">
                            <h6 className="fw-bold text-dark mb-3"><i className="bi bi-buildings text-primary me-2"></i>Chọn Căn Hộ</h6>
                            <div className="input-group input-group-sm">
                                <span className="input-group-text bg-light border-end-0"><i className="bi bi-search text-muted"></i></span>
                                <input type="text" className="form-control bg-light border-start-0 ps-0 shadow-none" placeholder="Tìm mã phòng..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                            </div>
                        </div>
                        <div className="card-body p-0 custom-scrollbar" style={{ height: 'calc(100vh - 280px)', overflowY: 'auto' }}>
                            <div className="list-group list-group-flush rounded-0">
                                {filteredApts.length === 0 ? (
                                    <div className="text-center p-4 text-muted small">Không tìm thấy phòng nào.</div>
                                ) : (
                                    filteredApts.map(apt => (
                                        <button key={apt.apartmentId}
                                            className={`list-group-item list-group-item-action py-3 px-4 border-bottom-0 border-top ${selectedApt?.apartmentId === apt.apartmentId ? 'active bg-primary text-white shadow-sm z-1' : 'text-dark'}`}
                                            onClick={() => handleSelectApartment(apt)}
                                            style={{ transition: 'all 0.2s' }}>
                                            <div className="d-flex justify-content-between align-items-center">
                                                <span className="fw-bold fs-6">{apt.apartmentCode}</span>
                                                <i className="bi bi-chevron-right small opacity-50"></i>
                                            </div>
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* CỘT PHẢI: CHI TIẾT PHÒNG */}
                <div className="col-lg-9 col-md-8">
                    {!selectedApt ? (
                        <div className="card border-0 shadow-sm rounded-4 h-100 d-flex justify-content-center align-items-center bg-white" style={{ minHeight: '500px' }}>
                            <div className="text-center text-muted">
                                <i className="bi bi-cursor display-1 d-block mb-3 opacity-25 text-primary"></i>
                                <h5>Chọn một phòng ở danh sách bên trái để ghi số</h5>
                                <p className="small">Thông tin hợp đồng và lịch sử tiêu thụ sẽ tự động hiển thị tại đây.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="d-flex flex-column gap-4 h-100 animate-fade-in">
                            
                            {/* CARD 1: FORM NHẬP CHỈ SỐ */}
                            <div className="card border-0 shadow-sm rounded-4 bg-white">
                                <div className="card-header bg-white border-bottom py-3 px-4 d-flex justify-content-between align-items-center">
                                    <h5 className="fw-bold text-dark mb-0">
                                        <i className="bi bi-pencil-square text-primary me-2"></i>Chốt Số Căn Hộ: <span className="text-primary">{selectedApt.apartmentCode}</span>
                                    </h5>
                                </div>
                                <div className="card-body p-4">
                                    <div className="alert bg-primary bg-opacity-10 border border-primary border-opacity-25 rounded-3 p-3 mb-4 d-flex align-items-start">
                                        <i className="bi bi-lightbulb-fill text-primary fs-4 me-3 mt-1"></i>
                                        <div>
                                            <strong className="text-dark d-block mb-1">Gợi ý dữ liệu:</strong>
                                            {loadingHistory ? (
                                                <span className="text-muted small"><span className="spinner-border spinner-border-sm me-1"></span> Đang tải...</span>
                                            ) : historyError ? (
                                                <span className="text-danger small">{historyError}</span>
                                            ) : latestRecord ? (
                                                <span className="text-muted small">
                                                    Kỳ chốt gần nhất: <strong>Tháng {latestRecord.month}/{latestRecord.year}</strong>. 
                                                    Chỉ số cũ: Điện <strong className="text-warning">{latestRecord.electricityNewIndex}</strong> | Nước <strong className="text-info">{latestRecord.waterNewIndex}</strong>.
                                                </span>
                                            ) : (
                                                <span className="text-muted small">Phòng này chưa từng ghi số điện nước. Vui lòng ghi nhận chỉ số bắt đầu làm mốc tính toán.</span>
                                            )}
                                        </div>
                                    </div>

                                    <form onSubmit={handleSubmitUtility}>
                                        <div className="row g-4 align-items-end">
                                            <div className="col-md-3 col-sm-6">
                                                <label className="form-label small fw-bold text-muted text-uppercase mb-1">Năm</label>
                                                <select className="form-select bg-light" name="year" value={formData.year} onChange={handleInputChange}>
                                                    {availableYears.map(y => (<option key={y} value={y}>Năm {y}</option>))}
                                                </select>
                                            </div>
                                            <div className="col-md-3 col-sm-6">
                                                <label className="form-label small fw-bold text-muted text-uppercase mb-1">Tháng Ghi Số</label>
                                                <select className="form-select bg-light" name="month" value={formData.month} onChange={handleInputChange}>
                                                    {availableMonths.map(m => (<option key={m} value={m}>Tháng {m}</option>))}
                                                </select>
                                            </div>
                                            <div className="col-md-3 col-sm-6">
                                                <label className="form-label fw-bold text-warning small text-uppercase mb-1"><i className="bi bi-lightning-charge-fill me-1"></i>Chỉ số Điện mới</label>
                                                <div className="input-group">
                                                    <input type="number" min="0" step="any" className="form-control border-warning border-opacity-50 shadow-none" name="electricIndex" value={formData.electricIndex} onChange={handleInputChange} placeholder="Số kWh" />
                                                </div>
                                            </div>
                                            <div className="col-md-3 col-sm-6">
                                                <label className="form-label fw-bold text-info small text-uppercase mb-1"><i className="bi bi-droplet-fill me-1"></i>Chỉ số Nước mới</label>
                                                <div className="input-group">
                                                    <input type="number" min="0" step="any" className="form-control border-info border-opacity-50 shadow-none" name="waterIndex" value={formData.waterIndex} onChange={handleInputChange} placeholder="Số m³" />
                                                </div>
                                            </div>
                                            <div className="col-12 mt-4 text-end border-top pt-3">
                                                <button type="button" className="btn btn-white border shadow-sm px-4 me-2" onClick={() => setFormData(prev => ({ ...prev, electricIndex: '', waterIndex: '' }))}>Xóa trắng</button>
                                                <button type="submit" className="btn btn-primary px-5 fw-bold shadow-sm" disabled={isSubmitting || loadingHistory || !!historyError}>
                                                    {isSubmitting ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-cloud-arrow-up-fill me-2"></i>}
                                                    Cập Nhật Chỉ Số
                                                </button>
                                            </div>
                                        </div>
                                    </form>
                                </div>
                            </div>

                            {/* CARD 2: BẢNG LỊCH SỬ */}
                            <div className="card border-0 shadow-sm rounded-4 bg-white flex-grow-1">
                                <div className="card-header bg-white border-bottom py-3 px-4">
                                    <h6 className="fw-bold text-dark mb-0"><i className="bi bi-table text-secondary me-2"></i>Lịch Sử & Phát Hành Hóa Đơn</h6>
                                </div>
                                <div className="card-body p-0">
                                    {loadingHistory ? (
                                        <div className="text-center p-5"><div className="spinner-border text-primary"></div></div>
                                    ) : historyError ? (
                                        <div className="text-center p-5 text-muted fst-italic">{historyError}</div>
                                    ) : history.length === 0 ? (
                                        <div className="text-center p-5 text-muted">Hợp đồng của phòng này chưa bắt đầu tính phí.</div>
                                    ) : (
                                        <>
                                            <div className="table-responsive">
                                                <table className="table table-hover align-middle text-center mb-0">
                                                    <thead className="table-light small text-uppercase">
                                                        <tr>
                                                            <th rowSpan="2" className="align-middle border-end">Kỳ (Tháng/Năm)</th>
                                                            <th colSpan="3" className="text-warning bg-warning bg-opacity-10 border-end border-warning border-opacity-25">Điện (kWh)</th>
                                                            <th colSpan="3" className="text-info bg-info bg-opacity-10 border-end">Nước (m³)</th>
                                                            <th rowSpan="2" className="align-middle">Hành động</th>
                                                        </tr>
                                                        <tr className="small">
                                                            <th className="bg-warning bg-opacity-10 text-muted font-normal border-start border-warning border-opacity-25">Cũ</th>
                                                            <th className="bg-warning bg-opacity-10 text-muted font-normal">Mới</th>
                                                            <th className="bg-warning bg-opacity-10 fw-bold border-end border-warning border-opacity-25">Dùng</th>
                                                            <th className="bg-info bg-opacity-10 text-muted font-normal">Cũ</th>
                                                            <th className="bg-info bg-opacity-10 text-muted font-normal">Mới</th>
                                                            <th className="bg-info bg-opacity-10 fw-bold border-end">Dùng</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="small">
                                                        {currentHistory.map((h) => (
                                                            <tr key={`${h.month}-${h.year}`}>
                                                                <td className="fw-bold border-end">Tháng {h.month}/{h.year}</td>
                                                                <td className="text-muted">{h.electricityOldIndex}</td>
                                                                <td className={h.electricityNewIndex === h.electricityOldIndex && h.electricityNewIndex === 0 ? "text-muted" : "fw-bold"}>{h.electricityNewIndex}</td>
                                                                <td className="fw-bold text-warning border-end bg-warning bg-opacity-10">{h.electricityConsumption}</td>
                                                                
                                                                <td className="text-muted">{h.waterOldIndex}</td>
                                                                <td className={h.waterNewIndex === h.waterOldIndex && h.waterNewIndex === 0 ? "text-muted" : "fw-bold"}>{h.waterNewIndex}</td>
                                                                <td className="fw-bold text-info bg-info bg-opacity-10 border-end">{h.waterConsumption}</td>
                                                                
                                                                <td>
                                                                    {h.isInvoiceGenerated ? (
                                                                        <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-2 py-1"><i className="bi bi-check-circle-fill me-1"></i> Đã tạo HĐ</span>
                                                                    ) : (
                                                                        <button 
                                                                            className="btn btn-sm btn-outline-primary fw-bold rounded-pill shadow-sm py-1 px-3"
                                                                            onClick={() => handleGenerateRowInvoice(h.month, h.year)}
                                                                            disabled={isGeneratingRow}
                                                                        >
                                                                            <i className="bi bi-file-earmark-plus me-1"></i> Tạo HĐ
                                                                        </button>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                            <div className="p-3 border-top bg-light rounded-bottom-4">
                                                <Pagination totalItems={history.length} itemsPerPage={itemsPerPage} currentPage={currentPage} onPageChange={setCurrentPage} />
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* MODAL 1: SINH HÓA ĐƠN TỰ ĐỘNG TOÀN HỆ THỐNG */}
            {showGenModal && (
                <>
                    <div className="modal-backdrop fade show" style={{ zIndex: 1040 }}></div>
                    <div className="modal fade show d-block" tabIndex="-1" style={{ zIndex: 1050 }}>
                        <div className="modal-dialog modal-dialog-centered">
                            <div className="modal-content shadow-lg border-0 rounded-4 overflow-hidden">
                                <div className="modal-header bg-primary text-white border-0 px-4 py-3">
                                    <h5 className="modal-title fw-bold"><i className="bi bi-receipt me-2"></i>Sinh Hóa Đơn Tự Động Toàn Hệ Thống</h5>
                                    <button type="button" className="btn-close btn-close-white" onClick={() => setShowGenModal(false)}></button>
                                </div>
                                <form onSubmit={handleGenerateGlobalInvoice}>
                                    <div className="modal-body p-4 bg-light">
                                        <div className="alert bg-primary bg-opacity-10 border border-primary border-opacity-25 text-primary small rounded-3 p-3 mb-4">
                                            <i className="bi bi-exclamation-circle-fill me-2"></i>
                                            Hành động này sẽ quét <strong>TOÀN BỘ</strong> các căn hộ đang thuê để tính toán và phát hành hóa đơn của tháng bạn chọn.
                                        </div>
                                        <div className="row g-3">
                                            <div className="col-6">
                                                <label className="form-label fw-bold small text-muted text-uppercase">Tháng (*)</label>
                                                <select className="form-select shadow-none border-primary-subtle" name="genMonth" value={genData.genMonth} onChange={(e) => setGenData({...genData, genMonth: e.target.value})} required>
                                                    {[...Array(12).keys()].map(m => (<option key={m + 1} value={m + 1}>Tháng {m + 1}</option>))}
                                                </select>
                                            </div>
                                            <div className="col-6">
                                                <label className="form-label fw-bold small text-muted text-uppercase">Năm (*)</label>
                                                <select className="form-select shadow-none border-primary-subtle" name="genYear" value={genData.genYear} onChange={(e) => setGenData({...genData, genYear: e.target.value})} required>
                                                    {Array.from(new Array(5), (_, index) => currentYear - 2 + index).map(y => (<option key={y} value={y}>Năm {y}</option>))}
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="modal-footer bg-white border-top px-4 py-3 d-flex justify-content-end gap-2">
                                        <button type="button" className="btn btn-white border rounded-pill px-4 fw-bold shadow-sm" onClick={() => setShowGenModal(false)}>Hủy bỏ</button>
                                        <button type="submit" className="btn btn-primary rounded-pill px-4 fw-bold shadow-sm" disabled={isGenerating}>
                                            {isGenerating ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-play-circle-fill me-2"></i>}
                                            Bắt đầu Phát hành
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* MODAL 2: NHẬP TỪ EXCEL */}
            {showExcelModal && (
                <>
                    <div className="modal-backdrop fade show" style={{ zIndex: 1040 }}></div>
                    <div className="modal fade show d-block" tabIndex="-1" style={{ zIndex: 1050 }}>
                        <div className="modal-dialog modal-dialog-centered">
                            <div className="modal-content shadow-lg border-0 rounded-4 overflow-hidden">
                                <div className="modal-header bg-success text-white border-0 px-4 py-3">
                                    <h5 className="modal-title fw-bold"><i className="bi bi-file-earmark-excel me-2"></i>Nhập Chỉ Số Từ Excel</h5>
                                    <button type="button" className="btn-close btn-close-white" onClick={() => { setShowExcelModal(false); setExcelFile(null); }}></button>
                                </div>
                                <form onSubmit={handleImportExcel}>
                                    <div className="modal-body p-4 bg-light">
                                        <div className="alert bg-success bg-opacity-10 border border-success border-opacity-25 text-dark small rounded-3 p-3 mb-4">
                                            <i className="bi bi-info-circle-fill text-success me-2"></i>
                                            File Excel phải có 4 cột theo đúng thứ tự: <br/>
                                            <strong>1: Mã Phòng (ID)</strong> | <strong>2: Chỉ Số Điện Mới</strong><br/>
                                            <strong>3: Chỉ Số Nước Mới</strong> | <strong>4: Ngày Ghi Nhận (MM/yyyy)</strong>
                                        </div>
                                        <div className="mb-2">
                                            <label className="form-label fw-bold small text-muted text-uppercase">Tệp Excel (.xlsx) (*)</label>
                                            <input type="file" className="form-control bg-white shadow-none" accept=".xlsx, .xls" onChange={(e) => setExcelFile(e.target.files[0])} required />
                                        </div>
                                    </div>
                                    <div className="modal-footer bg-white border-top px-4 py-3 d-flex justify-content-end gap-2">
                                        <button type="button" className="btn btn-white border rounded-pill px-4 fw-bold shadow-sm" onClick={() => { setShowExcelModal(false); setExcelFile(null); }}>Hủy bỏ</button>
                                        <button type="submit" className="btn btn-success rounded-pill px-4 fw-bold shadow-sm" disabled={isImporting}>
                                            {isImporting ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-upload me-2"></i>}
                                            Tải Dữ Liệu Lên
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </>
            )}

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 5px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
                .animate-fade-in { animation: fadeIn 0.3s ease-in-out; }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};

export default UtilityManagement;