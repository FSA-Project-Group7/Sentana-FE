import React, { useState, useEffect } from 'react';
import api from '../../utils/axiosConfig';
import Pagination from '../../components/common/Pagination';

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



    useEffect(() => {
        const fetchApartments = async () => {
            try {
                const res = await api.get('/Apartments');
                const data = res.data.data ? res.data.data : res.data;
                setApartments(Array.isArray(data) ? data : []);
            } catch (error) {
                console.error("Lỗi tải danh sách căn hộ:", error);
            }
        };
        fetchApartments();
    }, []);



    useEffect(() => {
        if (!selectedApartmentId) {
            setHistory([]);
            return;
        }

        const fetchHistory = async () => {
            setLoadingHistory(true);
            try {

                const res = await api.get(`/Utility/history/apartment/${selectedApartmentId}`);
                const historyData = res.data.data ? res.data.data : res.data;
                setHistory(Array.isArray(historyData) ? historyData : []);
                setCurrentPage(1);
            } catch (error) {
                console.error("Lỗi tải lịch sử:", error);
                setHistory([]);
            } finally {
                setLoadingHistory(false);
            }
        };

        fetchHistory();
    }, [selectedApartmentId]);


    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!selectedApartmentId) return alert("Vui lòng chọn một căn hộ trước khi ghi chỉ số!");
        if (!formData.electricIndex && !formData.waterIndex) return alert("Vui lòng nhập ít nhất một chỉ số (Điện hoặc Nước)!");

        setIsSubmitting(true);
        let messages = [];

        const formattedDate = `${formData.year}-${String(formData.month).padStart(2, '0')}-01T00:00:00`;


        if (formData.electricIndex) {
            try {
                await api.post('/Utility/electric/input', {
                    apartmentId: Number(selectedApartmentId),
                    registrationDate: formattedDate,
                    newIndex: Number(formData.electricIndex)
                });
                messages.push("✅ ĐIỆN: Ghi nhận thành công!");
                setFormData(prev => ({ ...prev, electricIndex: '' }));
            } catch (error) {
                const msg = error.response?.data?.message || "Lỗi không xác định";
                messages.push(`❌ ĐIỆN: ${msg}`);
            }
        }


        if (formData.waterIndex) {
            try {
                await api.post('/Utility/water/input', {
                    apartmentId: Number(selectedApartmentId),
                    registrationDate: formattedDate,
                    newIndex: Number(formData.waterIndex)
                });
                messages.push("✅ NƯỚC: Ghi nhận thành công!");
                setFormData(prev => ({ ...prev, waterIndex: '' }));
            } catch (error) {
                const msg = error.response?.data?.message || "Lỗi không xác định";
                messages.push(`❌ NƯỚC: ${msg}`);
            }
        }


        alert(messages.join("\n"));


        try {
            const res = await api.get(`/Utility/history/apartment/${selectedApartmentId}`);
            setHistory(res.data.data ? res.data.data : res.data);
        } catch (error) { console.error("Lỗi reload bảng", error); }

        setIsSubmitting(false);
    };


    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentHistory = history.slice(indexOfFirstItem, indexOfLastItem);


    const yearOptions = Array.from(new Array(5), (val, index) => currentYear - index);

    return (
        <div className="container-fluid p-0">
            <div className="mb-4">
                <h2 className="fw-bold mb-0">Quản lý Điện Nước</h2>
                <div className="text-muted small mt-2">Ghi nhận chỉ số và theo dõi lịch sử tiêu thụ của từng căn hộ</div>
            </div>

            <div className="row g-4">
                {/* CỘT TRÁI: FORM NHẬP LIỆU */}
                <div className="col-md-4">
                    <div className="card shadow-sm border-0 h-100">
                        <div className="card-header bg-white fw-bold text-primary pt-3 border-bottom-0">
                            <i className="bi bi-speedometer2 me-2"></i> Nhập Chỉ Số Mới
                        </div>
                        <div className="card-body">
                            <form onSubmit={handleSubmit}>
                                {/* Chọn Căn hộ */}
                                <div className="mb-3">
                                    <label className="form-label fw-semibold">Chọn Căn hộ (*)</label>
                                    <select
                                        className="form-select border-primary"
                                        value={selectedApartmentId}
                                        onChange={(e) => setSelectedApartmentId(e.target.value)}
                                        required
                                    >
                                        <option value="">-- Vui lòng chọn --</option>
                                        {apartments.map(apt => (
                                            <option key={apt.apartmentId} value={apt.apartmentId}>
                                                {apt.apartmentCode} - {apt.apartmentName}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Chọn Tháng & Năm */}
                                <div className="row mb-3 g-2">
                                    <div className="col-6">
                                        <label className="form-label fw-semibold">Tháng (*)</label>
                                        <select className="form-select" name="month" value={formData.month} onChange={handleInputChange}>
                                            {[...Array(12)].map((_, i) => (
                                                <option key={i + 1} value={i + 1}>Tháng {i + 1}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="col-6">
                                        <label className="form-label fw-semibold">Năm (*)</label>
                                        <select className="form-select" name="year" value={formData.year} onChange={handleInputChange}>
                                            {yearOptions.map(y => (
                                                <option key={y} value={y}>Năm {y}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <hr className="text-muted" />

                                {/* Nhập Chỉ số Điện */}
                                <div className="mb-3">
                                    <label className="form-label fw-semibold text-warning d-flex justify-content-between">
                                        <span><i className="bi bi-lightning-charge-fill"></i> Chỉ số Điện mới</span>
                                    </label>
                                    <div className="input-group">
                                        <input
                                            type="number"
                                            min="0"
                                            className="form-control"
                                            name="electricIndex"
                                            value={formData.electricIndex}
                                            onChange={handleInputChange}
                                            placeholder="VD: 3450"
                                        />
                                        <span className="input-group-text bg-light">kWh</span>
                                    </div>
                                </div>

                                {/* Nhập Chỉ số Nước */}
                                <div className="mb-4">
                                    <label className="form-label fw-semibold text-info d-flex justify-content-between">
                                        <span><i className="bi bi-droplet-fill"></i> Chỉ số Nước mới</span>
                                    </label>
                                    <div className="input-group">
                                        <input
                                            type="number"
                                            min="0"
                                            className="form-control"
                                            name="waterIndex"
                                            value={formData.waterIndex}
                                            onChange={handleInputChange}
                                            placeholder="VD: 120"
                                        />
                                        <span className="input-group-text bg-light">m³</span>
                                    </div>
                                </div>

                                <button type="submit" className="btn btn-primary w-100 fw-bold" disabled={isSubmitting || !selectedApartmentId}>
                                    {isSubmitting ? 'Đang xử lý...' : 'Lưu Chỉ Số'}
                                </button>

                                <div className="text-muted small mt-3 fst-italic">
                                    * Hệ thống sẽ tự động tìm chỉ số cũ của tháng trước để nội suy mức tiêu thụ, chỉ cần nhập số mới trên đồng hồ.
                                </div>
                            </form>
                        </div>
                    </div>
                </div>

                {/* CỘT PHẢI: BẢNG LỊCH SỬ */}
                <div className="col-md-8">
                    <div className="card shadow-sm border-0 h-100">
                        <div className="card-header bg-white fw-bold pt-3 border-bottom-0 d-flex justify-content-between align-items-center">
                            <span><i className="bi bi-clock-history me-2"></i> Lịch sử tiêu thụ</span>
                            {selectedApartmentId && <span className="badge bg-success">Đã chọn căn hộ</span>}
                        </div>
                        <div className="card-body p-0">
                            {!selectedApartmentId ? (
                                <div className="text-center p-5 text-muted">
                                    <i className="bi bi-arrow-left-circle fs-3 mb-2 d-block"></i>
                                    Vui lòng chọn một căn hộ bên trái để xem lịch sử.
                                </div>
                            ) : loadingHistory ? (
                                <div className="text-center p-5"><div className="spinner-border text-primary"></div></div>
                            ) : history.length === 0 ? (
                                <div className="text-center p-5 text-muted">Căn hộ này chưa có dữ liệu điện nước nào.</div>
                            ) : (
                                <>
                                    <div className="table-responsive">
                                        <table className="table table-hover table-bordered mb-0 align-middle text-center">
                                            <thead className="table-light">
                                                <tr>
                                                    <th rowSpan="2" className="align-middle">Kỳ (Tháng/Năm)</th>
                                                    <th colSpan="3" className="text-warning bg-warning bg-opacity-10">ĐIỆN (kWh)</th>
                                                    <th colSpan="3" className="text-info bg-info bg-opacity-10">NƯỚC (m³)</th>
                                                </tr>
                                                <tr>
                                                    <th className="bg-warning bg-opacity-10 small">Số Cũ</th>
                                                    <th className="bg-warning bg-opacity-10 small">Số Mới</th>
                                                    <th className="bg-warning bg-opacity-10 fw-bold">Tiêu Thụ</th>
                                                    <th className="bg-info bg-opacity-10 small">Số Cũ</th>
                                                    <th className="bg-info bg-opacity-10 small">Số Mới</th>
                                                    <th className="bg-info bg-opacity-10 fw-bold">Tiêu Thụ</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {currentHistory.map((h, idx) => (
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
                                    <Pagination
                                        totalItems={history.length}
                                        itemsPerPage={itemsPerPage}
                                        currentPage={currentPage}
                                        onPageChange={setCurrentPage}
                                    />
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