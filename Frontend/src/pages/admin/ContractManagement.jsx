import React, { useState, useEffect } from 'react';
import api from '../../utils/axiosConfig';
import Pagination from '../../components/common/Pagination';
import Select from 'react-select';

const ContractManagement = () => {
    const [contracts, setContracts] = useState([]);
    const [apartments, setApartments] = useState([]);
    const [residents, setResidents] = useState([]);
    const [systemServices, setSystemServices] = useState([]); // State lưu danh sách dịch vụ
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    // Hardcode danh sách relationship theo database của bạn (1 là Chủ hộ - BE đã fix cứng)
    const relationships = [
        { id: 2, name: 'Vợ/Chồng' },
        { id: 3, name: 'Con cái' },
        { id: 4, name: 'Anh/Chị/Em' },
        { id: 5, name: 'Bạn cùng phòng' },
        { id: 6, name: 'Khác' }
    ];

    const initialFormState = {
        apartmentId: '',
        residentAccountId: '',
        startDay: '',
        endDay: '',
        monthlyRent: '',
        deposit: '',
        file: null,
        additionalResidents: [], // Mảng hứng dữ liệu thành viên thêm vào
        selectedServices: []     // Mảng hứng dữ liệu dịch vụ thêm vào
    };

    const [formData, setFormData] = useState(initialFormState);

    // State cho việc chấm dứt hợp đồng
    const [terminationDate, setTerminationDate] = useState('');
    const [additionalCost, setAdditionalCost] = useState(0);
    const [terminateResult, setTerminateResult] = useState(null);
    const [selectedTerminateId, setSelectedTerminateId] = useState(null);

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

        try {
            // Đảm bảo endpoint này tồn tại ở BE của bạn
            const srvRes = await api.get('/Service/GetAllServices');
            const sList = srvRes.data?.data || srvRes.data;
            setSystemServices(Array.isArray(sList) ? sList : []);
        } catch (error) {
            setSystemServices([]);
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

    // --- CÁC HÀM XỬ LÝ DẤU (+) CHO CƯ DÂN PHỤ ---
    const addResidentRow = () => {
        setFormData(prev => ({
            ...prev,
            additionalResidents: [...prev.additionalResidents, { accountId: '', relationshipId: '' }]
        }));
    };
    const removeResidentRow = (index) => {
        setFormData(prev => ({
            ...prev,
            additionalResidents: prev.additionalResidents.filter((_, i) => i !== index)
        }));
    };
    const handleAdditionalResidentChange = (index, field, value) => {
        const newArr = [...formData.additionalResidents];
        newArr[index][field] = value;
        setFormData({ ...formData, additionalResidents: newArr });
    };

    // --- CÁC HÀM XỬ LÝ DẤU (+) CHO DỊCH VỤ ---
    const addServiceRow = () => {
        setFormData(prev => ({
            ...prev,
            selectedServices: [...prev.selectedServices, { serviceId: '', actualPrice: '' }]
        }));
    };
    const removeServiceRow = (index) => {
        setFormData(prev => ({
            ...prev,
            selectedServices: prev.selectedServices.filter((_, i) => i !== index)
        }));
    };
    const handleServiceChange = (index, field, value) => {
        const newArr = [...formData.selectedServices];
        newArr[index][field] = value;
        setFormData({ ...formData, selectedServices: newArr });
    };

    // --- GỬI REQUEST TẠO HỢP ĐỒNG ---
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

        // Map mảng cư dân phụ vào FormData
        formData.additionalResidents.forEach((res, index) => {
            if (res.accountId && res.relationshipId) {
                payload.append(`AdditionalResidents[${index}].AccountId`, res.accountId);
                payload.append(`AdditionalResidents[${index}].RelationshipId`, res.relationshipId);
            }
        });

        // Map mảng dịch vụ vào FormData
        formData.selectedServices.forEach((srv, index) => {
            if (srv.serviceId) {
                payload.append(`Services[${index}].ServiceId`, srv.serviceId);
                if (srv.actualPrice) {
                    payload.append(`Services[${index}].ActualPrice`, srv.actualPrice);
                }
            }
        });

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

    // --- XỬ LÝ CHẤM DỨT HỢP ĐỒNG ---
    const handleTerminate = async () => {
        try {
            const res = await api.put(`/contract/${selectedTerminateId}/terminate`, {
                terminationDate,
                additionalCost: Number(additionalCost)
            });

            setTerminateResult(res.data?.data || res.data); 
            fetchData();
        } catch (error) {
            const errorMsg = error.response?.data?.message || "Không thể chấm dứt hợp đồng.";
            alert("LỖI: " + errorMsg);
        }
    };

    // Lọc data cho Dropdown
    const vacantApartments = apartments.filter(a => a.status === 1);
    const activeResidents = residents.filter(r => r.status === 1 && !r.apartmentCode);

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = contracts.slice(indexOfFirstItem, indexOfLastItem);

    const formatCurrency = (amount) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    const formatDate = (dateString) => {
        if (!dateString) return "";
        return new Date(dateString).toLocaleDateString('vi-VN');
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
                                                        <button
                                                            className="btn btn-sm btn-outline-danger"
                                                            data-bs-toggle="modal"
                                                            data-bs-target="#terminateModal"
                                                            onClick={() => {
                                                                setSelectedTerminateId(contract.contractId);
                                                                setTerminateResult(null);
                                                                setTerminationDate('');
                                                                setAdditionalCost(0);
                                                            }}
                                                        >
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

            {/* --- MODAL TẠO HỢP ĐỒNG --- */}
            <div className="modal fade" id="createContractModal" tabIndex="-1">
                <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
                    <div className="modal-content">
                        <div className="modal-header text-white" style={{ backgroundColor: '#1b2a47' }}>
                            <h5 className="modal-title fw-bold">Tạo Hợp Đồng Thuê</h5>
                            <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal" id="closeCreateModal"></button>
                        </div>

                        <div className="modal-body p-4 bg-light">
                            <form onSubmit={handleCreateContract} id="contractForm">
                                <div className="alert alert-info py-2 px-3 mb-4" style={{ backgroundColor: '#e8f4fd', border: 'none', color: '#5b82a1', fontSize: '0.9rem' }}>
                                    <strong>Lưu ý:</strong> Chủ hợp đồng mặc định sẽ được gán chức danh "Chủ Hộ". Có thể thêm các thành viên khác và dịch vụ ngay bên dưới.
                                </div>

                                <div className="card shadow-sm border-0 mb-4">
                                    <div className="card-header bg-white fw-bold">1. Thông tin Hợp đồng & Chủ hộ</div>
                                    <div className="card-body">
                                        <div className="row mb-3">
                                            <div className="col-md-6">
                                                <label className="form-label fw-semibold text-muted small">Cư dân (Chủ Hợp Đồng) (*)</label>
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
                                                <label className="form-label fw-semibold text-muted small">Căn hộ (*)</label>
                                                <Select
                                                    placeholder="-- Chọn Căn hộ trống --"
                                                    noOptionsMessage={() => "Không có phòng trống"}
                                                    isClearable
                                                    isSearchable
                                                    options={vacantApartments.map(a => ({
                                                        value: a.apartmentId,
                                                        label: `${a.apartmentCode} - Tòa ${a.apartmentName || 'B'}`
                                                    }))}
                                                    onChange={(opt) => setFormData(prev => ({ ...prev, apartmentId: opt ? opt.value : '' }))}
                                                    value={vacantApartments.find(a => a.apartmentId === formData.apartmentId) ? { label: `${vacantApartments.find(a => a.apartmentId === formData.apartmentId).apartmentCode} - ${vacantApartments.find(a => a.apartmentId === formData.apartmentId).apartmentName}`, value: formData.apartmentId } : null}
                                                />
                                            </div>
                                        </div>

                                        <div className="row mb-3">
                                            <div className="col-md-3">
                                                <label className="form-label fw-semibold text-muted small">Ngày bắt đầu (*)</label>
                                                <input type="date" className="form-control" name="startDay" value={formData.startDay} onChange={handleInputChange} required />
                                            </div>
                                            <div className="col-md-3">
                                                <label className="form-label fw-semibold text-muted small">Ngày kết thúc (*)</label>
                                                <input type="date" className="form-control" name="endDay" value={formData.endDay} onChange={handleInputChange} required />
                                            </div>
                                            <div className="col-md-3">
                                                <label className="form-label fw-semibold text-muted small">Giá thuê (VNĐ)</label>
                                                <input type="number" className="form-control" name="monthlyRent" value={formData.monthlyRent} onChange={handleInputChange} />
                                            </div>
                                            <div className="col-md-3">
                                                <label className="form-label fw-semibold text-muted small">Tiền cọc (VNĐ)</label>
                                                <input type="number" className="form-control" name="deposit" value={formData.deposit} onChange={handleInputChange} />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="form-label fw-semibold text-danger small">File Hợp đồng (Bản scan/PDF) (*)</label>
                                            <input type="file" className="form-control" onChange={handleFileChange} accept=".pdf" required />
                                        </div>
                                    </div>
                                </div>

                                {/* --- SECTION 2: THÊM CƯ DÂN PHỤ --- */}
                                <div className="card shadow-sm border-0 mb-4">
                                    <div className="card-header bg-white fw-bold d-flex justify-content-between align-items-center">
                                        <span>2. Thêm Thành Viên Ở Cùng</span>
                                        <button type="button" className="btn btn-sm btn-outline-primary" onClick={addResidentRow}>
                                            <i className="bi bi-person-plus-fill"></i> Thêm người
                                        </button>
                                    </div>
                                    <div className="card-body">
                                        {formData.additionalResidents.length === 0 ? (
                                            <div className="text-muted small fst-italic">Không có thành viên phụ.</div>
                                        ) : (
                                            formData.additionalResidents.map((res, index) => (
                                                <div className="row mb-2 align-items-end" key={index}>
                                                    <div className="col-md-6">
                                                        <label className="form-label small">Chọn Cư dân phụ</label>
                                                        <select
                                                            className="form-select"
                                                            value={res.accountId}
                                                            onChange={(e) => handleAdditionalResidentChange(index, 'accountId', e.target.value)}
                                                        >
                                                            <option value="">-- Chọn --</option>
                                                            {/* Loại trừ chủ hộ ra khỏi list */}
                                                            {activeResidents.filter(r => r.accountId !== formData.residentAccountId).map(r => (
                                                                <option key={r.accountId} value={r.accountId}>
                                                                    {r.fullName || r.userName} - CCCD: {r.identityCard}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div className="col-md-4">
                                                        <label className="form-label small">Mối quan hệ</label>
                                                        <select
                                                            className="form-select"
                                                            value={res.relationshipId}
                                                            onChange={(e) => handleAdditionalResidentChange(index, 'relationshipId', e.target.value)}
                                                        >
                                                            <option value="">-- Chọn --</option>
                                                            {relationships.map(rel => (
                                                                <option key={rel.id} value={rel.id}>{rel.name}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div className="col-md-2">
                                                        <button type="button" className="btn btn-outline-danger w-100" onClick={() => removeResidentRow(index)}>
                                                            <i className="bi bi-trash"></i> Xóa
                                                        </button>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>

                                {/* --- SECTION 3: THÊM DỊCH VỤ --- */}
                                <div className="card shadow-sm border-0">
                                    <div className="card-header bg-white fw-bold d-flex justify-content-between align-items-center">
                                        <span>3. Đăng ký Dịch Vụ Cố Định</span>
                                        <button type="button" className="btn btn-sm btn-outline-success" onClick={addServiceRow}>
                                            <i className="bi bi-plus-circle"></i> Thêm dịch vụ
                                        </button>
                                    </div>
                                    <div className="card-body">
                                        {formData.selectedServices.length === 0 ? (
                                            <div className="text-muted small fst-italic">Phòng chưa đăng ký dịch vụ cố định nào.</div>
                                        ) : (
                                            formData.selectedServices.map((srv, index) => (
                                                <div className="row mb-2 align-items-end" key={index}>
                                                    <div className="col-md-6">
                                                        <label className="form-label small">Dịch vụ</label>
                                                        <select
                                                            className="form-select"
                                                            value={srv.serviceId}
                                                            onChange={(e) => handleServiceChange(index, 'serviceId', e.target.value)}
                                                        >
                                                            <option value="">-- Chọn dịch vụ --</option>
                                                            {systemServices.map(s => (
                                                                <option key={s.serviceId} value={s.serviceId}>
                                                                    {s.serviceName} - {formatCurrency(s.serviceFee)}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div className="col-md-4">
                                                        <label className="form-label small">Giá tùy chỉnh (Tùy chọn)</label>
                                                        <input
                                                            type="number"
                                                            className="form-control"
                                                            placeholder="Để trống lấy giá gốc"
                                                            value={srv.actualPrice}
                                                            onChange={(e) => handleServiceChange(index, 'actualPrice', e.target.value)}
                                                        />
                                                    </div>
                                                    <div className="col-md-2">
                                                        <button type="button" className="btn btn-outline-danger w-100" onClick={() => removeServiceRow(index)}>
                                                            <i className="bi bi-trash"></i> Xóa
                                                        </button>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </form>
                        </div>

                        <div className="modal-footer" style={{ borderTop: 'none', backgroundColor: '#f8f9fa' }}>
                            <button type="button" className="btn btn-secondary px-4" data-bs-dismiss="modal">Hủy</button>
                            <button type="submit" form="contractForm" className="btn btn-primary px-4" disabled={isSubmitting} style={{ backgroundColor: '#4a7fb8', border: 'none' }}>
                                {isSubmitting ? 'Đang tạo...' : 'Xác Nhận Tạo Hợp Đồng'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- MODAL CHẤM DỨT HỢP ĐỒNG --- */}
            <div className="modal fade" id="terminateModal">
                <div className="modal-dialog">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title fw-bold">Chấm dứt hợp đồng</h5>
                            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div className="modal-body">
                            <label className="form-label small fw-semibold">Ngày chấm dứt:</label>
                            <input
                                type="date"
                                className="form-control mb-3"
                                value={terminationDate}
                                onChange={e => setTerminationDate(e.target.value)}
                            />

                            <label className="form-label small fw-semibold">Chi phí phát sinh thêm:</label>
                            <input
                                type="number"
                                className="form-control mb-3"
                                value={additionalCost}
                                onChange={e => setAdditionalCost(e.target.value)}
                            />

                            {terminateResult && (
                                <div className="p-3 bg-light rounded border mt-3">
                                    <h6 className="fw-bold mb-3 border-bottom pb-2">Kết quả đối soát:</h6>
                                    <p className="mb-1"><strong>Tổng Hóa đơn:</strong> {formatCurrency(terminateResult.totalInvoice)}</p>
                                    <p className="mb-1"><strong>Đã trả:</strong> {formatCurrency(terminateResult.totalPaid)}</p>
                                    <p className="mb-1"><strong>Phí phát sinh:</strong> {formatCurrency(terminateResult.additionalCost)}</p>

                                    {terminateResult.refundAmount < 0 && (
                                        <p className="text-danger mb-1 mt-2"><strong>Khách CẦN TRẢ THÊM:</strong> {formatCurrency(Math.abs(terminateResult.refundAmount))}</p>
                                    )}
                                    {terminateResult.refundAmount > 0 && (
                                        <p className="text-success mb-1 mt-2"><strong>BQL TRẢ LẠI KHÁCH:</strong> {formatCurrency(terminateResult.refundAmount)}</p>
                                    )}
                                    {terminateResult.refundAmount === 0 && (
                                        <p className="text-primary mt-2"><strong>Đã thanh toán vừa đủ.</strong></p>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Đóng</button>
                            <button
                                className="btn btn-danger"
                                onClick={handleTerminate}
                                disabled={!terminationDate}
                            >
                                Tính toán & Xác nhận
                            </button>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default ContractManagement;