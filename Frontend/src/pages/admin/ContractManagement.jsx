import React, { useState, useEffect } from 'react';
import api from '../../utils/axiosConfig';
import Pagination from '../../components/common/Pagination';
import Select from 'react-select';

const ContractManagement = () => {
    // --- STATES ---
    const [contracts, setContracts] = useState([]);
    const [apartments, setApartments] = useState([]);
    const [residents, setResidents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    // Form Tạo mới Hợp đồng
    const initialFormState = {
        apartmentId: '', residentAccountId: '', startDay: '', endDay: '', monthlyRent: '', deposit: '', file: null
    };
    const [formData, setFormData] = useState(initialFormState);
    const [selectedContract, setSelectedContract] = useState(null);

    // --- FETCH DATA ---
    const fetchData = async () => {
        setLoading(true);

        // 1. Lấy danh sách Hợp đồng
        try {
            const contractRes = await api.get('/Contract');
            const cList = contractRes.data?.data || contractRes.data;
            setContracts(Array.isArray(cList) ? cList : []);
        } catch (error) {
            console.error("Lỗi khi tải Hợp đồng:", error);
            setContracts([]); // Nếu Hợp đồng lỗi, chỉ mảng hợp đồng bị rỗng
        }

        // 2. Lấy danh sách Phòng
        try {
            const aptRes = await api.get('/Apartments');
            const aList = aptRes.data?.data || aptRes.data;
            setApartments(Array.isArray(aList) ? aList : []);
        } catch (error) {
            console.error("Lỗi khi tải Phòng:", error);
            setApartments([]);
        }

        // 3. Lấy danh sách Cư dân
        try {
            const resData = await api.get('/Residents/GetAllResidents');
            const rList = resData.data?.data || resData.data;
            setResidents(Array.isArray(rList) ? rList : []);
        } catch (error) {
            console.error("Lỗi khi tải Cư dân:", error);
            setResidents([]);
        }

        setLoading(false);
        setCurrentPage(1);
    };

    useEffect(() => {
        fetchData();
    }, []);

    // --- XỬ LÝ FORM TẠO MỚI ---
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        setFormData(prev => ({ ...prev, file: e.target.files[0] }));
    };

    const handleOpenCreateModal = () => {
        setFormData(initialFormState);
    };

    const handleCreateContract = async (e) => {
        e.preventDefault();
        if (!formData.apartmentId || !formData.residentAccountId || !formData.startDay || !formData.endDay || !formData.file) {
            return alert("Vui lòng điền đầy đủ các trường bắt buộc và tải lên file hợp đồng!");
        }

        setIsSubmitting(true);
        // API Backend yêu cầu Content-Type là multipart/form-data
        const payload = new FormData();
        payload.append("ApartmentId", formData.apartmentId);
        payload.append("ResidentAccountId", formData.residentAccountId);
        payload.append("StartDay", formData.startDay);
        payload.append("EndDay", formData.endDay);
        payload.append("MonthlyRent", formData.monthlyRent || 0);
        payload.append("Deposit", formData.deposit || 0);
        payload.append("File", formData.file);

        try {
            const res = await api.post('/Contract', payload, { headers: { 'Content-Type': 'multipart/form-data' } });
            alert(res.data?.message || "Tạo hợp đồng thành công!");
            document.getElementById('closeCreateModal').click();
            fetchData();
        } catch (error) {
            const errorMsg = error.response?.data?.message || "Lỗi khi tạo hợp đồng. Vui lòng kiểm tra lại.";
            alert("LỖI: " + errorMsg);
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- CHẤM DỨT HỢP ĐỒNG (TERMINATE) ---
    const handleTerminate = async (id) => {
        if (window.confirm("CẢNH BÁO: Việc chấm dứt hợp đồng sẽ làm phòng chuyển về trạng thái TRỐNG và cư dân sẽ bị mất phòng. Bạn có chắc chắn không?")) {
            try {
                // Backend nhận body rỗng cho hàm Terminate
                const res = await api.post(`/Contract/${id}/terminate`, {});
                alert(res.data?.message || "Đã chấm dứt hợp đồng!");
                fetchData();
            } catch (error) {
                const errorMsg = error.response?.data?.message || "Không thể chấm dứt hợp đồng.";
                alert("LỖI: " + errorMsg);
            }
        }
    };

    const vacantApartments = apartments.filter(a => a.status === 1);
    const activeResidents = residents.filter(r => r.status === 1 && !r.apartmentCode);

    // --- PHÂN TRANG ---
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = contracts.slice(indexOfFirstItem, indexOfLastItem);

    // Helper format tiền và ngày tháng
    const formatCurrency = (amount) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    const formatDate = (dateString) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN');
    };

    return (
        <div className="container-fluid p-0">
            {/* HEADER */}
            <div className="d-flex justify-content-between align-items-start mb-4">
                <div>
                    <h2 className="fw-bold mb-0">Quản lý Hợp Đồng</h2>
                    <div className="text-muted small mt-2">Quản lý hợp đồng thuê phòng của cư dân</div>
                </div>
                <div className="d-flex align-items-center">
                    <button className="btn btn-primary" onClick={handleOpenCreateModal} data-bs-toggle="modal" data-bs-target="#createContractModal">
                        <i className="bi bi-file-earmark-plus me-2"></i> Tạo Hợp Đồng
                    </button>
                </div>
            </div>

            {/* BẢNG DỮ LIỆU */}
            <div className="card shadow-sm border-0">
                <div className="card-body p-0">
                    {loading ? (
                        <div className="text-center p-5"><div className="spinner-border text-primary"></div></div>
                    ) : contracts.length === 0 ? (
                        <div className="text-center p-5 text-muted">Chưa có dữ liệu Hợp đồng nào.</div>
                    ) : (
                        <>
                            <div className="table-responsive">
                                <table className="table table-hover table-bordered mb-0 align-middle text-center">
                                    <thead className="table-light">
                                        <tr>
                                            <th>Mã HĐ</th>
                                            <th className="text-start">Người Thuê</th>
                                            <th>Căn Hộ</th>
                                            <th>Thời Hạn</th>
                                            <th>Tài Chính</th>
                                            <th>File HĐ</th>
                                            <th>Trạng Thái</th>
                                            <th>Hành Động</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {currentItems.map((contract) => (
                                            <tr key={contract.contractId}>
                                                <td className="fw-bold text-primary">{contract.contractCode}</td>
                                                <td className="text-start">
                                                    <div className="fw-semibold">{contract.account?.info?.fullName || "N/A"}</div>
                                                    <div className="small text-muted">{contract.account?.info?.phoneNumber || contract.account?.email}</div>
                                                </td>
                                                <td>
                                                    <span className="badge bg-info text-dark border">
                                                        <i className="bi bi-door-open-fill me-1"></i> {contract.apartment?.apartmentCode}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="small"><strong>Từ:</strong> {formatDate(contract.startDay)}</div>
                                                    <div className="small text-danger"><strong>Đến:</strong> {formatDate(contract.endDay)}</div>
                                                </td>
                                                <td>
                                                    <div className="small">Thuê: {formatCurrency(contract.monthlyRent)}</div>
                                                    <div className="small text-muted">Cọc: {formatCurrency(contract.deposit)}</div>
                                                </td>
                                                <td>
                                                    {contract.currentVersion?.file ? (
                                                        <a href={contract.currentVersion.file} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline-success">
                                                            <i className="bi bi-download"></i> Xem/Tải
                                                        </a>
                                                    ) : (
                                                        <span className="small text-muted">N/A</span>
                                                    )}
                                                </td>
                                                <td>
                                                    {contract.status === 1 ? (
                                                        <span className="badge bg-success">Có hiệu lực</span>
                                                    ) : (
                                                        <span className="badge bg-secondary">Đã chấm dứt</span>
                                                    )}
                                                </td>
                                                <td>
                                                    {contract.status === 1 && (
                                                        <div className="d-flex justify-content-center gap-2">
                                                            <button
                                                                className="btn btn-sm btn-outline-danger"
                                                                onClick={() => handleTerminate(contract.contractId)}
                                                                title="Chấm dứt hợp đồng"
                                                            >
                                                                <i className="bi bi-x-circle me-1"></i> Chấm dứt
                                                            </button>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <Pagination totalItems={contracts.length} itemsPerPage={itemsPerPage} currentPage={currentPage} onPageChange={setCurrentPage} />
                        </>
                    )}
                </div>
            </div>

            {/* MODAL TẠO HỢP ĐỒNG MỚI */}
            <div className="modal fade" id="createContractModal" tabIndex="-1" aria-hidden="true">
                <div className="modal-dialog modal-lg">
                    <div className="modal-content">
                        <div className="modal-header text-white" style={{ backgroundColor: '#122240' }}>
                            <h5 className="modal-title fw-bold">Tạo Hợp Đồng Thuê Phòng</h5>
                            <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal" id="closeCreateModal"></button>
                        </div>
                        <form onSubmit={handleCreateContract}>
                            <div className="modal-body">
                                <div className="alert alert-info small mb-4">
                                    <i className="bi bi-info-circle-fill me-2"></i>
                                    <strong>Lưu ý quan trọng:</strong> Chỉ những <strong>Phòng trống</strong> và <strong>Cư dân chưa có phòng</strong> mới được hiển thị ở đây. Khi tạo hợp đồng thành công, Cư dân sẽ tự động được gán vào phòng và phòng sẽ chuyển sang trạng thái "Đang thuê".
                                </div>
                                <div className="row g-3">
                                    <div className="col-md-6">
                                        <label className="form-label fw-semibold">Cư dân thuê (*)</label>
                                        <Select
                                            placeholder="-- Tìm cư dân --"
                                            noOptionsMessage={() => "Không có cư dân nào khả dụng"}
                                            isClearable={true}
                                            isSearchable={true}
                                            options={activeResidents.map(r => ({
                                                value: r.accountId,
                                                label: `${r.fullName || r.userName} - CCCD: ${r.identityCard || 'N/A'}`
                                            }))}
                                            onChange={(selectedOption) => setFormData(prev => ({ ...prev, residentAccountId: selectedOption ? selectedOption.value : '' }))}
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label fw-semibold">Chọn Căn hộ trống (*)</label>
                                        <Select
                                            placeholder="-- Tìm phòng trống --"
                                            noOptionsMessage={() => "Không có phòng trống"}
                                            isClearable={true}
                                            isSearchable={true}
                                            options={vacantApartments.map(apt => ({
                                                value: apt.apartmentId,
                                                label: `${apt.apartmentCode} - ${apt.apartmentName}`
                                            }))}
                                            onChange={(selectedOption) => setFormData(prev => ({ ...prev, apartmentId: selectedOption ? selectedOption.value : '' }))}
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label fw-semibold">Ngày bắt đầu (*)</label>
                                        <input type="date" className="form-control" name="startDay" value={formData.startDay} onChange={handleInputChange} required />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label fw-semibold">Ngày kết thúc (*)</label>
                                        <input type="date" className="form-control" name="endDay" value={formData.endDay} onChange={handleInputChange} required />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label fw-semibold">Giá thuê hàng tháng (VNĐ)</label>
                                        <input type="number" className="form-control" name="monthlyRent" value={formData.monthlyRent} onChange={handleInputChange} min="0" />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label fw-semibold">Tiền cọc (VNĐ)</label>
                                        <input type="number" className="form-control" name="deposit" value={formData.deposit} onChange={handleInputChange} min="0" />
                                    </div>
                                    <div className="col-12">
                                        <label className="form-label fw-semibold text-danger">File Hợp đồng (Bản scan/PDF) (*)</label>
                                        <input type="file" className="form-control border-danger" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileChange} required />
                                        <div className="small text-muted mt-1">Vui lòng đính kèm bản mềm của hợp đồng để lưu trữ (Chỉ nhận PDF, JPG, PNG).</div>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer bg-light">
                                <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Hủy</button>
                                <button type="submit" className="btn btn-primary" disabled={isSubmitting || !formData.apartmentId || !formData.residentAccountId}>
                                    <i className="bi bi-save me-1"></i> Tạo Hợp Đồng
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default ContractManagement;