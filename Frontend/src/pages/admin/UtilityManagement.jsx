import React, { useState, useEffect } from 'react';
import api from '../../utils/axiosConfig';
import Pagination from '../../components/common/Pagination';
// --- UTILS ---
import { notify, confirmAction } from '../../utils/notificationAlert';

const UtilityManagement = () => {
    const [apartments, setApartments] = useState([]);
    const [selectedApartmentId, setSelectedApartmentId] = useState('');
    const [history, setHistory] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    const [formData, setFormData] = useState({
        month: currentMonth,
        year: currentYear,
        electricIndex: '',
        waterIndex: ''
    });

    // --- FETCH DANH SÁCH CĂN HỘ ---
    useEffect(() => {
        const fetchApartments = async () => {
            try {
                const res = await api.get('/Apartments');
                const data = res.data?.data || res.data;
                setApartments(Array.isArray(data) ? data : []);
            } catch (error) {
                notify.error("Lỗi tải danh sách căn hộ");
            }
        };
        fetchApartments();
    }, []);

    // --- FETCH LỊCH SỬ TIÊU THỤ ---
    const fetchHistory = async () => {
        if (!selectedApartmentId) {
            setHistory([]);
            return;
        }
        setLoadingHistory(true);
        try {
            const res = await api.get(`/Utility/history/apartment/${selectedApartmentId}`);
            const historyData = res.data?.data || res.data;
            setHistory(Array.isArray(historyData) ? historyData : []);
            setCurrentPage(1);
        } catch (error) {
            notify.error("Không thể tải lịch sử tiêu thụ");
            setHistory([]);
        } finally {
            setLoadingHistory(false);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, [selectedApartmentId]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // --- XỬ LÝ LƯU CHỈ SỐ (KÈM LOGIC GỘP KỲ - MERGE BILLING LOGIC) ---
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!selectedApartmentId) return notify.warning("Vui lòng chọn một căn hộ!");
        if (!formData.electricIndex && !formData.waterIndex)
            return notify.warning("Vui lòng nhập ít nhất một chỉ số (Điện hoặc Nước)!");

        setIsSubmitting(true);
        const formattedDate = `${formData.year}-${String(formData.month).padStart(2, '0')}-01T00:00:00`;

        let successCount = 0;
        let errors = [];

        // Hàm xử lý chung cho Điện và Nước (Reusable Utility Processor)
        const processUtility = async (type, value, endpoint) => {
            let payload = {
                apartmentId: Number(selectedApartmentId),
                registrationDate: formattedDate,
                newIndex: Number(value),
                isMerge: false // Mặc định không gộp (Default false)
            };

            try {
                await api.post(endpoint, payload);
                successCount++;
                setFormData(prev => ({ ...prev, [type === 'Điện' ? 'electricIndex' : 'waterIndex']: '' }));
            } catch (error) {
                const errorMsg = error.response?.data?.message || `Lỗi lưu số ${type.toLowerCase()}`;
                
                // Kiểm tra cờ yêu cầu gộp từ Backend (Check for Merge Flag)
                if (errorMsg.startsWith("REQUIRE_MERGE|")) {
                    const confirmText = errorMsg.split("|")[1];
                    const { isConfirmed } = await confirmAction.fire({
                        title: 'Xác nhận gộp kỳ thanh toán',
                        text: confirmText,
                        confirmButtonText: '<i class="bi bi-check-circle me-1"></i> Đồng ý gộp'
                    });

                    // Nếu đồng ý, đính kèm cờ và thử lại (Retry with Merge Flag)
                    if (isConfirmed) {
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

        if (formData.electricIndex) {
            await processUtility('Điện', formData.electricIndex, '/Utility/electric/input');
        }

        if (formData.waterIndex) {
            await processUtility('Nước', formData.waterIndex, '/Utility/water/input');
        }

        if (successCount > 0) notify.success(`Đã lưu thành công ${successCount} chỉ số!`);
        if (errors.length > 0) errors.forEach(err => notify.error(err));

        await fetchHistory();
        setIsSubmitting(false);
    };

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentHistory = history.slice(indexOfFirstItem, indexOfLastItem);
    const yearOptions = Array.from(new Array(5), (_, index) => currentYear - index);

    return (
        <div className="container-fluid p-0">
            <div className="mb-4">
                <h2 className="fw-bold mb-0 text-dark">Quản lý Điện Nước</h2>
                <div className="text-muted small mt-2">Ghi nhận chỉ số và theo dõi mức tiêu thụ hàng tháng</div>
            </div>

            <div className="row g-4">
                {/* CỘT TRÁI: FORM NHẬP LIỆU */}
                <div className="col-md-4">
                    <div className="card shadow-sm border-0">
                        <div className="card-header bg-white fw-bold text-primary py-3 border-bottom">
                            <i className="bi bi-pencil-square me-2"></i>Ghi chỉ số mới
                        </div>
                        <div className="card-body">
                            <form onSubmit={handleSubmit}>
                                <div className="mb-3">
                                    <label className="form-label small fw-bold text-muted text-uppercase">Căn hộ (*)</label>
                                    <select
                                        className="form-select border-primary-subtle"
                                        value={selectedApartmentId}
                                        onChange={(e) => setSelectedApartmentId(e.target.value)}
                                        required
                                    >
                                        <option value="">-- Chọn căn hộ --</option>
                                        {apartments.filter(apt => apt.status === 2).map(apt => (
                                            <option key={apt.apartmentId} value={apt.apartmentId}>
                                                {apt.apartmentCode} - {apt.apartmentName}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="row mb-3 g-2">
                                    <div className="col-6">
                                        <label className="form-label small fw-bold text-muted text-uppercase">Tháng</label>
                                        <select className="form-select" name="month" value={formData.month} onChange={handleInputChange}>
                                            {[...Array(12)].map((_, i) => (
                                                <option key={i + 1} value={i + 1}>Tháng {i + 1}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="col-6">
                                        <label className="form-label small fw-bold text-muted text-uppercase">Năm</label>
                                        <select className="form-select" name="year" value={formData.year} onChange={handleInputChange}>
                                            {yearOptions.map(y => (
                                                <option key={y} value={y}>Năm {y}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <hr className="my-4 opacity-50" />

                                <div className="mb-3">
                                    <label className="form-label fw-bold text-warning small text-uppercase">
                                        <i className="bi bi-lightning-charge-fill me-1"></i>Chỉ số Điện mới
                                    </label>
                                    <div className="input-group">
                                        <input
                                            type="number" min="0" className="form-control" name="electricIndex"
                                            value={formData.electricIndex} onChange={handleInputChange} placeholder="Nhập số kWh"
                                        />
                                        <span className="input-group-text bg-light text-muted small">kWh</span>
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <label className="form-label fw-bold text-info small text-uppercase">
                                        <i className="bi bi-droplet-fill me-1"></i>Chỉ số Nước mới
                                    </label>
                                    <div className="input-group">
                                        <input
                                            type="number" min="0" className="form-control" name="waterIndex"
                                            value={formData.waterIndex} onChange={handleInputChange} placeholder="Nhập số m³"
                                        />
                                        <span className="input-group-text bg-light text-muted small">m³</span>
                                    </div>
                                </div>

                                <button type="submit" className="btn btn-primary w-100 fw-bold py-2 shadow-sm" disabled={isSubmitting || !selectedApartmentId}>
                                    {isSubmitting ? (
                                        <span className="spinner-border spinner-border-sm me-2"></span>
                                    ) : <i className="bi bi-cloud-arrow-up-fill me-2"></i>}
                                    Lưu Chỉ Số
                                </button>

                                <div className="alert alert-secondary mt-3 mb-0 py-2 small border-0">
                                    <i className="bi bi-info-circle-fill me-2"></i>
                                    Nhập chỉ số mới nhất hiển thị trên đồng hồ thực tế.
                                </div>
                            </form>
                        </div>
                    </div>
                </div>

                {/* CỘT PHẢI: BẢNG LỊCH SỬ */}
                <div className="col-md-8">
                    <div className="card shadow-sm border-0">
                        <div className="card-header bg-white fw-bold py-3 border-bottom d-flex justify-content-between align-items-center">
                            <span><i className="bi bi-clock-history me-2"></i>Lịch sử tiêu thụ</span>
                            {selectedApartmentId && (
                                <span className="badge bg-success-subtle text-success border border-success-subtle">
                                    Căn hộ {apartments.find(a => a.apartmentId === Number(selectedApartmentId))?.apartmentCode}
                                </span>
                            )}
                        </div>
                        <div className="card-body p-0">
                            {!selectedApartmentId ? (
                                <div className="text-center p-5 text-muted">
                                    <i className="bi bi-hand-index-thumb display-6 d-block mb-3 opacity-25"></i>
                                    Chọn căn hộ để tra cứu lịch sử ghi số.
                                </div>
                            ) : loadingHistory ? (
                                <div className="text-center p-5"><div className="spinner-border text-primary"></div></div>
                            ) : history.length === 0 ? (
                                <div className="text-center p-5 text-muted">Chưa có dữ liệu lịch sử cho căn hộ này.</div>
                            ) : (
                                <>
                                    <div className="table-responsive">
                                        <table className="table table-hover table-bordered mb-0 align-middle text-center">
                                            <thead className="table-light small text-uppercase">
                                                <tr>
                                                    <th rowSpan="2" className="align-middle">Tháng/Năm</th>
                                                    <th colSpan="3" className="text-warning bg-warning bg-opacity-10">Điện (kWh)</th>
                                                    <th colSpan="3" className="text-info bg-info bg-opacity-10">Nước (m³)</th>
                                                </tr>
                                                <tr className="small">
                                                    <th className="bg-warning bg-opacity-10 font-normal">Cũ</th>
                                                    <th className="bg-warning bg-opacity-10 font-normal">Mới</th>
                                                    <th className="bg-warning bg-opacity-10 fw-bold">Dùng</th>
                                                    <th className="bg-info bg-opacity-10 font-normal">Cũ</th>
                                                    <th className="bg-info bg-opacity-10 font-normal">Mới</th>
                                                    <th className="bg-info bg-opacity-10 fw-bold">Dùng</th>
                                                </tr>
                                            </thead>
                                            <tbody className="small">
                                                {currentHistory.map((h) => (
                                                    <tr key={`${h.month}-${h.year}`}>
                                                        <td className="fw-bold">{h.month}/{h.year}</td>
                                                        <td className="text-muted">{h.electricityOldIndex ?? '-'}</td>
                                                        <td>{h.electricityNewIndex ?? '-'}</td>
                                                        <td className="fw-bold text-warning">{h.electricityConsumption ?? '-'}</td>
                                                        <td className="text-muted">{h.waterOldIndex ?? '-'}</td>
                                                        <td>{h.waterNewIndex ?? '-'}</td>
                                                        <td className="fw-bold text-info">{h.waterConsumption ?? '-'}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="p-3 border-top">
                                        <Pagination
                                            totalItems={history.length}
                                            itemsPerPage={itemsPerPage}
                                            currentPage={currentPage}
                                            onPageChange={setCurrentPage}
                                        />
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UtilityManagement;