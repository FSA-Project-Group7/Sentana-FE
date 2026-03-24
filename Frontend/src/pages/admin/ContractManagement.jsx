import React, { useState, useEffect } from 'react';
import api from '../../utils/axiosConfig';
import Pagination from '../../components/common/Pagination';
import Select from 'react-select';

const ContractManagement = () => {
    const [contracts, setContracts] = useState([]);
    const [apartments, setApartments] = useState([]);
    const [residents, setResidents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    const initialFormState = {
        apartmentId: '',
        residentAccountId: '',
        startDay: '',
        endDay: '',
        monthlyRent: '',
        deposit: '',
        file: null
    };

    const [formData, setFormData] = useState(initialFormState);
    const [selectedContract, setSelectedContract] = useState(null);

    const fetchData = async () => {
        setLoading(true);

        try {
            const contractRes = await api.get('/contract/view-all-contract');
            const cList = contractRes.data?.data || contractRes.data;
            setContracts(Array.isArray(cList) ? cList : []);
        } catch (error) {
            setContracts([]);
        }

        try {
            const aptRes = await api.get('/Apartments');
            const aList = aptRes.data?.data || aptRes.data;
            setApartments(Array.isArray(aList) ? aList : []);
        } catch (error) {
            setApartments([]);
        }

        try {
            const resData = await api.get('/Residents/GetAllResidents');
            const rList = resData.data?.data || resData.data;
            setResidents(Array.isArray(rList) ? rList : []);
        } catch (error) {
            setResidents([]);
        }

        setLoading(false);
        setCurrentPage(1);
    };

    useEffect(() => {
        fetchData();
    }, []);

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

        const payload = new FormData();
        payload.append("ApartmentId", formData.apartmentId);
        payload.append("ResidentAccountId", formData.residentAccountId);
        payload.append("StartDay", formData.startDay);
        payload.append("EndDay", formData.endDay);
        payload.append("MonthlyRent", formData.monthlyRent || 0);
        payload.append("Deposit", formData.deposit || 0);
        payload.append("File", formData.file);

        try {
            const res = await api.post('/contract/create-contract', payload, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

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

    const handleTerminate = async (id) => {
        if (window.confirm("CẢNH BÁO: Việc chấm dứt hợp đồng sẽ làm phòng chuyển về trạng thái TRỐNG và cư dân sẽ bị mất phòng. Bạn có chắc chắn không?")) {
            try {
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

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = contracts.slice(indexOfFirstItem, indexOfLastItem);

    const formatCurrency = (amount) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

    const formatDate = (dateString) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN');
    };

    return (
        <div className="container-fluid p-0">
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
                                                        <button className="btn btn-sm btn-outline-danger" onClick={() => handleTerminate(contract.contractId)}>
                                                            Chấm dứt
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <Pagination
                                totalItems={contracts.length}
                                itemsPerPage={itemsPerPage}
                                currentPage={currentPage}
                                onPageChange={setCurrentPage}
                            />
                        </>
                    )}
                </div>
            </div>

            {/* Modal Giao Diện Đã Được Chỉnh Sửa */}
            <div className="modal fade" id="createContractModal" tabIndex="-1">
                <div className="modal-dialog modal-lg modal-dialog-centered">
                    <div className="modal-content">
                        <div className="modal-header text-white" style={{ backgroundColor: '#1b2a47' }}>
                            <h5 className="modal-title fw-bold">Tạo Hợp Đồng Thuê</h5>
                            <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal" id="closeCreateModal"></button>
                        </div>

                        <form onSubmit={handleCreateContract}>
                            <div className="modal-body p-4">
                                
                                {/* Banner Lưu ý */}
                                <div className="alert alert-info py-2 px-3 mb-4" style={{ backgroundColor: '#e8f4fd', border: 'none', color: '#5b82a1', fontSize: '0.9rem' }}>
                                    <strong>Lưu ý quan trọng:</strong> Chỉ những Phòng trống và Cư dân chưa có phòng mới được hiển thị ở đây. Khi tạo hợp đồng thành công, Cư dân sẽ tự động được gán vào phòng và phòng sẽ chuyển sang trạng thái "Đang thuê".
                                </div>

                                {/* Row 1: Cư dân & Căn hộ */}
                                <div className="row mb-3">
                                    <div className="col-md-6">
                                        <label className="form-label fw-semibold text-muted small">Cư dân thuê (*)</label>
                                        <Select
                                            placeholder="-- Chọn cư dân --"
                                            noOptionsMessage={() => "Không có cư dân nào khả dụng"}
                                            isClearable
                                            isSearchable
                                            options={activeResidents.map(r => ({
                                                value: r.accountId,
                                                label: `${r.fullName || r.userName} - CCCD: ${r.identityCard || 'N/A'}`
                                            }))}
                                            onChange={(opt) => setFormData(prev => ({ ...prev, residentAccountId: opt ? opt.value : '' }))}
                                            value={activeResidents.find(r => r.accountId === formData.residentAccountId) ? { label: `${activeResidents.find(r => r.accountId === formData.residentAccountId).fullName || activeResidents.find(r => r.accountId === formData.residentAccountId).userName} - CCCD: ${activeResidents.find(r => r.accountId === formData.residentAccountId).identityCard || 'N/A'}`, value: formData.residentAccountId } : null}
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label fw-semibold text-muted small">Chọn Căn hộ trống (*)</label>
                                        <Select
                                            placeholder="-- Chọn Căn hộ trống --"
                                            noOptionsMessage={() => "Không có phòng trống"}
                                            isClearable
                                            isSearchable
                                            options={vacantApartments.map(a => ({
                                                value: a.apartmentId,
                                                label: `${a.apartmentCode} - Phòng ${a.apartmentCode.replace(/[^0-9]/g, '')} Tòa ${a.apartmentName || 'B'}`
                                            }))}
                                            onChange={(opt) => setFormData(prev => ({ ...prev, apartmentId: opt ? opt.value : '' }))}
                                            value={vacantApartments.find(a => a.apartmentId === formData.apartmentId) ? { label: `${vacantApartments.find(a => a.apartmentId === formData.apartmentId).apartmentCode} - ${vacantApartments.find(a => a.apartmentId === formData.apartmentId).apartmentName}`, value: formData.apartmentId } : null}
                                        />
                                    </div>
                                </div>

                                {/* Row 2: Ngày bắt đầu & kết thúc */}
                                <div className="row mb-3">
                                    <div className="col-md-6">
                                        <label className="form-label fw-semibold text-muted small">Ngày bắt đầu (*)</label>
                                        <input type="date" className="form-control" name="startDay" value={formData.startDay} onChange={handleInputChange} />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label fw-semibold text-muted small">Ngày kết thúc (*)</label>
                                        <input type="date" className="form-control" name="endDay" value={formData.endDay} onChange={handleInputChange} />
                                    </div>
                                </div>

                                {/* Row 3: Giá thuê & Tiền cọc */}
                                <div className="row mb-3">
                                    <div className="col-md-6">
                                        <label className="form-label fw-semibold text-muted small">Giá thuê hàng tháng (VNĐ)</label>
                                        <input type="number" className="form-control" name="monthlyRent" value={formData.monthlyRent} onChange={handleInputChange} />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label fw-semibold text-muted small">Tiền cọc (VNĐ)</label>
                                        <input type="number" className="form-control" name="deposit" value={formData.deposit} onChange={handleInputChange} />
                                    </div>
                                </div>

                                {/* Row 4: File hợp đồng */}
                                <div className="mb-3">
                                    <label className="form-label fw-semibold text-danger small">File Hợp đồng (Bản scan/PDF) (*)</label>
                                    <input type="file" className="form-control" onChange={handleFileChange} accept=".pdf,.jpg,.png" />
                                    <div className="form-text mt-1 text-muted" style={{ fontSize: '0.8rem' }}>
                                        Vui lòng đính kèm bản mềm của hợp đồng để lưu trữ (Chỉ nhận PDF, JPG, PNG).
                                    </div>
                                </div>

                            </div>

                            <div className="modal-footer" style={{ borderTop: 'none', backgroundColor: '#f8f9fa' }}>
                                <button type="button" className="btn btn-secondary px-4" data-bs-dismiss="modal">Hủy</button>
                                <button type="submit" className="btn btn-primary px-4" disabled={isSubmitting} style={{ backgroundColor: '#4a7fb8', border: 'none' }}>
                                    {isSubmitting ? 'Đang tạo...' : 'Tạo Hợp Đồng'}
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