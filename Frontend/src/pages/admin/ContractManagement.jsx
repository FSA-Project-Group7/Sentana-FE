import React, { useState, useEffect } from 'react';
import api from '../../utils/axiosConfig';
import Pagination from '../../components/common/Pagination';
import Select from 'react-select';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ContractManagement = () => {
    const [contracts, setContracts] = useState([]);
    const [apartments, setApartments] = useState([]);
    const [residents, setResidents] = useState([]);
    const [systemServices, setSystemServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [deletedContracts, setDeletedContracts] = useState([]);
    const [loadingDeleted, setLoadingDeleted] = useState(false);

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

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
        additionalResidents: [],
        selectedServices: []
    };

    const [formData, setFormData] = useState(initialFormState);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editContractId, setEditContractId] = useState(null);

    const [terminationDate, setTerminationDate] = useState('');
    const [additionalCost, setAdditionalCost] = useState(0);
    const [terminateResult, setTerminateResult] = useState(null);
    const [selectedTerminateId, setSelectedTerminateId] = useState(null);

    const [extendContractId, setExtendContractId] = useState(null);
    const [extendNewEndDate, setExtendNewEndDate] = useState('');

    const fetchData = async () => {
        setLoading(true);
        try {
            const contractRes = await api.get('/contract/view-all-contract');
            const cList = contractRes.data?.data || contractRes.data?.Data || contractRes.data;
            setContracts(Array.isArray(cList) ? cList : []);
        } catch (error) {
            console.error(error);
            setContracts([]);
        }

        try {
            const aptRes = await api.get('/Apartments');
            const aList = aptRes.data?.data || aptRes.data?.Data || aptRes.data;
            setApartments(Array.isArray(aList) ? aList : []);
        } catch (error) {
            console.error(error);
            setApartments([]);
        }

        try {
            const resData = await api.get('/Residents/GetAllResidents');
            const rList = resData.data?.data || resData.data?.Data || resData.data;
            setResidents(Array.isArray(rList) ? rList : []);
        } catch (error) {
            console.error(error);
            setResidents([]);
        }

        try {
            const srvRes = await api.get('/Service');
            const sList = srvRes.data?.data || srvRes.data?.Data || srvRes.data;
            setSystemServices(Array.isArray(sList) ? sList : []);
        } catch (error) {
            console.error(error);
            setSystemServices([]);
        }
        setLoading(false);
        setCurrentPage(1);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const fetchDeletedContracts = async () => {
        setLoadingDeleted(true);
        try {
            const res = await api.get('/contract/deleted-contracts');
            setDeletedContracts(res.data?.data || res.data?.Data || res.data || []);
        } catch (error) {
            toast.error(error.response?.data?.message || "Không thể tải danh sách hợp đồng đã xóa!", { containerId: 'contractToast' });
            setDeletedContracts([]);
        } finally {
            setLoadingDeleted(false);
        }
    };

    const handleSoftDelete = async (id) => {
        if (!id) return toast.error("Không tìm thấy ID hợp đồng!", { containerId: 'contractToast' });
        if(!window.confirm("Bạn muốn xóa hợp đồng này? (Có thể khôi phục trong thùng rác)")) return;
        try {
            const res = await api.delete(`/contract/${id}/soft-delete`);
            toast.success(res.data?.message || res.data?.Message || "Đã chuyển hợp đồng vào thùng rác!", { containerId: 'contractToast' });
            fetchData();
        } catch (error) {
            console.error("Lỗi xóa mềm:", error);
            toast.error(error.response?.data?.message || error.response?.data?.Message || "Lỗi khi xóa hợp đồng!", { containerId: 'contractToast' });
        }
    };

    const handleRestoreContract = async (id) => {
        if (!id) return;
        try {
            const res = await api.put(`/contract/${id}/restore`);
            toast.success(res.data?.message || res.data?.Message || "Khôi phục hợp đồng thành công!", { containerId: 'contractToast' });
            fetchDeletedContracts(); 
            fetchData(); 
        } catch (error) {
            console.error("Lỗi khôi phục:", error);
            toast.error(error.response?.data?.message || error.response?.data?.Message || "Lỗi khi khôi phục hợp đồng!", { containerId: 'contractToast' });
        }
    };

    const handleHardDeleteContract = async (id) => {
        if (!id) return;
        if (!window.confirm("CẢNH BÁO: Hành động này sẽ xóa VĨNH VIỄN hợp đồng khỏi cơ sở dữ liệu. Bạn có chắc chắn không?")) return;
        try {
            const res = await api.delete(`/contract/${id}/hard-delete`);
            toast.success(res.data?.message || res.data?.Message || "Đã xóa cứng hợp đồng thành công!", { containerId: 'contractToast' });
            fetchDeletedContracts(); 
        } catch (error) {
            console.error("Lỗi xóa cứng:", error);
            toast.error(error.response?.data?.message || error.response?.data?.Message || "Lỗi khi xóa vĩnh viễn hợp đồng!", { containerId: 'contractToast' });
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        setFormData(prev => ({ ...prev, file: e.target.files[0] }));
    };

    const handleOpenCreateModal = () => {
        setIsEditMode(false);
        setEditContractId(null);
        setFormData(initialFormState);
    };

    const handleOpenEditModal = async (contract) => {
        setIsEditMode(true);
        const currentContractId = contract.contractId || contract.ContractId;
        setEditContractId(currentContractId);
        
        const aptId = contract.apartmentId ?? contract.ApartmentId ?? '';
        const resId = contract.accountId ?? contract.AccountId ?? contract.account?.accountId ?? contract.Account?.AccountId ?? '';

        const safeStartDate = contract.startDay ? String(contract.startDay).substring(0, 10) : '';
        const safeEndDate = contract.endDay ? String(contract.endDay).substring(0, 10) : '';

        setFormData({
            apartmentId: aptId,
            residentAccountId: resId,
            startDay: safeStartDate,
            endDay: safeEndDate,
            monthlyRent: contract.monthlyRent ?? contract.MonthlyRent ?? '',
            deposit: contract.deposit ?? contract.Deposit ?? '',
            file: null,
            additionalResidents: [], 
            selectedServices: []     
        });

        try {
            const res = await api.get(`/contract/view-contract/${currentContractId}`);
            const detail = res.data?.data || res.data?.Data || res.data || {};

            const residentsData = detail.additionalResidents || detail.AdditionalResidents || [];
            const servicesData = detail.selectedServices || detail.SelectedServices || [];

            const mappedResidents = residentsData.map(r => ({
                accountId: String(r.accountId || r.AccountId || ''),
                relationshipId: String(r.relationshipId || r.RelationshipId || '')
            }));

            const mappedServices = servicesData.map(s => ({
                serviceId: String(s.serviceId || s.ServiceId || ''),
                actualPrice: String(s.actualPrice || s.ActualPrice || '')
            }));

            setFormData(prev => ({
                ...prev,
                additionalResidents: mappedResidents,
                selectedServices: mappedServices
            }));
            
        } catch (error) {
            console.error("Lỗi khi lấy chi tiết hợp đồng:", error);
            toast.error("Không thể tải danh sách thành viên phụ.", { containerId: 'contractToast' });
        }
    };

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

    const handleSubmitContract = async (e) => {
        e.preventDefault();

        if (!formData.apartmentId || !formData.residentAccountId || !formData.startDay || !formData.endDay) {
            return toast.warning("Vui lòng điền đầy đủ các trường thông tin cơ bản!", { containerId: 'contractToast' });
        }
        if (!isEditMode && !formData.file) {
            return toast.warning("Vui lòng tải lên file Hợp đồng khi tạo mới!", { containerId: 'contractToast' });
        }

        setIsSubmitting(true);
        const payload = new FormData();
        payload.append("ApartmentId", formData.apartmentId);
        payload.append("ResidentAccountId", formData.residentAccountId);
        payload.append("StartDay", formData.startDay);
        payload.append("EndDay", formData.endDay);
        payload.append("MonthlyRent", formData.monthlyRent || 0);
        payload.append("Deposit", formData.deposit || 0);
        
        if (formData.file) {
            payload.append("File", formData.file);
        }

        formData.additionalResidents.forEach((res, index) => {
            if (res.accountId && res.relationshipId) {
                payload.append(`AdditionalResidents[${index}].AccountId`, res.accountId);
                payload.append(`AdditionalResidents[${index}].RelationshipId`, res.relationshipId);
            }
        });

        formData.selectedServices.forEach((srv, index) => {
            if (srv.serviceId) {
                payload.append(`Services[${index}].ServiceId`, srv.serviceId);
                if (srv.actualPrice) {
                    payload.append(`Services[${index}].ActualPrice`, srv.actualPrice);
                }
            }
        });

        try {
            const url = isEditMode ? `/contract/${editContractId}/update-contract` : '/contract/create-contract';
            const method = isEditMode ? 'put' : 'post';

            const res = await api[method](url, payload, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            toast.success(res.data?.message || (isEditMode ? "Cập nhật thành công!" : "Tạo hợp đồng thành công!"), { containerId: 'contractToast' });
            document.getElementById('closeCreateModal').click();
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.message || "Lỗi xử lý Hợp đồng. Vui lòng kiểm tra lại.", { containerId: 'contractToast' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleTerminate = async () => {
        try {
            const res = await api.put(`/contract/${selectedTerminateId}/terminate`, {
                terminationDate,
                additionalCost: Number(additionalCost)
            });

            setTerminateResult(res.data?.data || res.data?.Data || res.data);
            toast.success("Chấm dứt hợp đồng thành công!", { containerId: 'contractToast' });
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.message || "Không thể chấm dứt hợp đồng.", { containerId: 'contractToast' });
        }
    };

    const handleExtendContract = async (e) => {
        e.preventDefault();
        if (!extendNewEndDate) {
            return toast.warning("Vui lòng chọn ngày kết thúc mới!", { containerId: 'contractToast' });
        }
        try {
            const res = await api.put(`/contract/${extendContractId}/extend`, { 
                newEndDate: extendNewEndDate 
            });
            toast.success(res.data?.message || "Gia hạn hợp đồng thành công!", { containerId: 'contractToast' });
            document.getElementById('closeExtendModal').click();
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.message || "Lỗi gia hạn hợp đồng.", { containerId: 'contractToast' });
        }
    };

    // LỌC CĂN HỘ: Chỉ hiện phòng Trống (Vacant) hoặc phòng đang được Edit
    const availableApartments = apartments.filter(a => {
        const st = a.status ?? a.Status;
        const isVacant = st === 1 || String(st).toLowerCase() === 'vacant';
        const isCurrentEdit = isEditMode && Number(a.apartmentId ?? a.ApartmentId) === Number(formData.apartmentId);
        return isVacant || isCurrentEdit;
    });

    // LỌC CƯ DÂN: Bỏ giới hạn có phòng, cho phép tất cả cư dân Active tạo hợp đồng (Giải pháp 1)
    const availableResidents = residents.filter(r => {
        const st = r.status ?? r.Status;
        if (st !== undefined && st !== null) {
            return st === 1 || String(st).toLowerCase() === 'active';
        }
        return true; 
    });

    const selectedResidentIds = [
        Number(formData.residentAccountId),
        ...formData.additionalResidents.map(r => Number(r.accountId))
    ].filter(id => id !== 0 && !isNaN(id));

    const selectedResident = availableResidents.find(r => Number(r.accountId ?? r.AccountId) === Number(formData.residentAccountId));
    const selectedApartment = availableApartments.find(a => Number(a.apartmentId ?? a.ApartmentId) === Number(formData.apartmentId));

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
            <ToastContainer enableMultiContainer containerId="contractToast" position="top-right" autoClose={3000} limit={1} theme="colored" />

            <div className="d-flex justify-content-between align-items-start mb-4">
                <div>
                    <h2 className="fw-bold mb-0">Quản lý Hợp Đồng</h2>
                    <div className="text-muted small mt-2">Quản lý hợp đồng thuê phòng của cư dân</div>
                </div>
                <div className="d-flex align-items-center gap-2">
                    <button className="btn btn-outline-secondary" onClick={fetchDeletedContracts} data-bs-toggle="modal" data-bs-target="#trashModal">
                        <i className="bi bi-trash3-fill me-2"></i> Đã Xóa
                    </button>

                    <button className="btn btn-primary" onClick={handleOpenCreateModal} data-bs-toggle="modal" data-bs-target="#contractFormModal">
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
                                            <th>Trạng Thái</th>
                                            <th>Hành Động</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {currentItems.map((contract) => (
                                            <tr key={contract.contractId}>
                                                <td className="fw-bold text-primary">{contract.contractCode}</td>
                                                <td className="text-start">
                                                    <div className="fw-semibold">{contract.account?.info?.fullName || contract.account?.fullName || contract.account?.userName || "N/A"}</div>
                                                    <div className="small text-muted">{contract.account?.info?.phoneNumber || contract.account?.phoneNumber || contract.account?.email || "N/A"}</div>
                                                </td>
                                                <td>
                                                    <span className="badge bg-info text-dark border">
                                                        <i className="bi bi-door-open-fill me-1"></i> {contract.apartment?.apartmentCode || "N/A"}
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
                                                    {contract.status === 1 ? (
                                                        <span className="badge bg-success">Có hiệu lực</span>
                                                    ) : (
                                                        <span className="badge bg-secondary">Đã chấm dứt</span>
                                                    )}
                                                </td>
                                                <td>
                                                    {contract.status === 1 && (
                                                        <>
                                                            <button
                                                                className="btn btn-sm btn-outline-info me-2 mb-1"
                                                                data-bs-toggle="modal"
                                                                data-bs-target="#extendModal"
                                                                onClick={() => {
                                                                    setExtendContractId(contract.contractId);
                                                                    setExtendNewEndDate(contract.endDay ? String(contract.endDay).substring(0, 10) : '');
                                                                }}
                                                                title="Gia hạn"
                                                            >
                                                                <i className="bi bi-calendar-plus"></i>
                                                            </button>

                                                            <button
                                                                className="btn btn-sm btn-outline-primary me-2 mb-1"
                                                                data-bs-toggle="modal"
                                                                data-bs-target="#contractFormModal"
                                                                onClick={() => handleOpenEditModal(contract)}
                                                                title="Sửa"
                                                            >
                                                                <i className="bi bi-pencil-square"></i>
                                                            </button>

                                                            <button
                                                                className="btn btn-sm btn-outline-warning me-2 mb-1"
                                                                data-bs-toggle="modal"
                                                                data-bs-target="#terminateModal"
                                                                onClick={() => {
                                                                    setSelectedTerminateId(contract.contractId);
                                                                    setTerminateResult(null);
                                                                    setTerminationDate('');
                                                                    setAdditionalCost(0);
                                                                }}
                                                                title="Chấm dứt"
                                                            >
                                                                <i className="bi bi-x-circle"></i>
                                                            </button>
                                                        </>
                                                    )}

                                                    <button
                                                        className="btn btn-sm btn-outline-danger mb-1"
                                                        onClick={() => handleSoftDelete(contract.contractId || contract.ContractId)}
                                                        title="Xóa"
                                                    >
                                                        <i className="bi bi-trash"></i>
                                                    </button>
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

            {/* --- MODAL FORM HỢP ĐỒNG (CREATE & EDIT) --- */}
            <div className="modal fade" id="contractFormModal" tabIndex="-1">
                <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
                    <form className="modal-content" onSubmit={handleSubmitContract} id="contractForm">
                        <div className="modal-header text-white" style={{ backgroundColor: '#1b2a47' }}>
                            <h5 className="modal-title fw-bold">
                                {isEditMode ? 'Cập Nhật Hợp Đồng Thuê' : 'Tạo Hợp Đồng Thuê Mới'}
                            </h5>
                            <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal" id="closeCreateModal"></button>
                        </div>

                        <div className="modal-body p-4 bg-light">
                            <div className="alert alert-info py-2 px-3 mb-4" style={{ backgroundColor: '#e8f4fd', border: 'none', color: '#5b82a1', fontSize: '0.9rem' }}>
                                {isEditMode ? (
                                    <span><strong>Chế độ Sửa:</strong> Bạn có thể cập nhật thời hạn, giá thuê và cọc. Những người đã thêm sẽ được hiển thị bên dưới.</span>
                                ) : (
                                    <span><strong>Lưu ý:</strong> Chủ hợp đồng mặc định sẽ được gán chức danh "Chủ Hộ". Có thể thêm các thành viên khác và dịch vụ.</span>
                                )}
                            </div>

                            <div className="card shadow-sm border-0 mb-4">
                                <div className="card-header bg-white fw-bold">1. Thông tin Hợp đồng & Chủ hộ</div>
                                <div className="card-body">
                                    <div className="row mb-3">
                                        <div className="col-md-6">
                                            <label htmlFor="residentAccountId" className="form-label fw-semibold text-muted small">Cư dân (Chủ Hợp Đồng) (*)</label>
                                            <Select
                                                inputId="residentAccountId"
                                                name="residentAccountId"
                                                placeholder="-- Chọn cư dân --"
                                                noOptionsMessage={() => "Không có cư dân nào khả dụng"}
                                                isClearable
                                                isSearchable
                                                options={availableResidents.filter(r => !selectedResidentIds.includes(Number(r.accountId ?? r.AccountId)) || Number(r.accountId ?? r.AccountId) === Number(formData.residentAccountId)).map(r => ({
                                                    value: r.accountId ?? r.AccountId,
                                                    label: `${r.fullName || r.FullName || r.userName || r.UserName} - CCCD: ${r.identityCard || r.IdentityCard || 'N/A'}`
                                                }))}
                                                onChange={(opt) => setFormData(prev => ({ ...prev, residentAccountId: opt ? opt.value : '' }))}
                                                value={selectedResident ? { 
                                                    label: `${selectedResident.fullName || selectedResident.FullName || selectedResident.userName || selectedResident.UserName || 'N/A'} - CCCD: ${selectedResident.identityCard || selectedResident.IdentityCard || 'N/A'}`, 
                                                    value: formData.residentAccountId 
                                                } : null}
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <label htmlFor="apartmentId" className="form-label fw-semibold text-muted small">Căn hộ (*)</label>
                                            <Select
                                                inputId="apartmentId"
                                                name="apartmentId"
                                                placeholder="-- Chọn Căn hộ --"
                                                noOptionsMessage={() => "Không có phòng khả dụng"}
                                                isClearable
                                                isSearchable
                                                options={availableApartments.map(a => ({
                                                    value: a.apartmentId ?? a.ApartmentId,
                                                    label: `${a.apartmentCode ?? a.ApartmentCode} - Tòa ${a.apartmentName || a.ApartmentName || 'B'}`
                                                }))}
                                                onChange={(opt) => setFormData(prev => ({ ...prev, apartmentId: opt ? opt.value : '' }))}
                                                value={selectedApartment ? { 
                                                    label: `${selectedApartment.apartmentCode || selectedApartment.ApartmentCode} - Tòa ${selectedApartment.apartmentName || selectedApartment.ApartmentName || 'B'}`, 
                                                    value: formData.apartmentId 
                                                } : null}
                                            />
                                        </div>
                                    </div>

                                    <div className="row mb-3">
                                        <div className="col-md-3">
                                            <label htmlFor="startDay" className="form-label fw-semibold text-muted small">Ngày bắt đầu (*)</label>
                                            <input id="startDay" type="date" className="form-control" name="startDay" value={formData.startDay} onChange={handleInputChange} required />
                                        </div>
                                        <div className="col-md-3">
                                            <label htmlFor="endDay" className="form-label fw-semibold text-muted small">Ngày kết thúc (*)</label>
                                            <input id="endDay" type="date" className="form-control" name="endDay" value={formData.endDay} onChange={handleInputChange} required />
                                        </div>
                                        <div className="col-md-3">
                                            <label htmlFor="monthlyRent" className="form-label fw-semibold text-muted small">Giá thuê (VNĐ)</label>
                                            <input id="monthlyRent" type="number" className="form-control" name="monthlyRent" value={formData.monthlyRent} onChange={handleInputChange} />
                                        </div>
                                        <div className="col-md-3">
                                            <label htmlFor="deposit" className="form-label fw-semibold text-muted small">Tiền cọc (VNĐ)</label>
                                            <input id="deposit" type="number" className="form-control" name="deposit" value={formData.deposit} onChange={handleInputChange} />
                                        </div>
                                    </div>

                                    <div className="mb-3">
                                        <label htmlFor="file" className="form-label fw-semibold text-danger small">
                                            File Hợp đồng (Bản scan/PDF) {!isEditMode && "(*)"}
                                        </label>
                                        <input id="file" name="file" type="file" className="form-control" onChange={handleFileChange} accept=".pdf" required={!isEditMode} />
                                    </div>
                                </div>
                            </div>

                            <div className="card shadow-sm border-0 mb-4">
                                <div className="card-header bg-white fw-bold d-flex justify-content-between align-items-center">
                                    <span>2. Cư dân phụ đi kèm</span>
                                    <button type="button" className="btn btn-sm btn-outline-primary" onClick={addResidentRow}>
                                        <i className="bi bi-person-plus-fill"></i> Thêm người
                                    </button>
                                </div>
                                <div className="card-body">
                                    {formData.additionalResidents.length === 0 ? (
                                        <div className="text-muted small fst-italic">Không có thành viên phụ đính kèm.</div>
                                    ) : (
                                        formData.additionalResidents.map((res, index) => (
                                            <div className="row mb-2 align-items-end" key={index}>
                                                <div className="col-md-6">
                                                    <label htmlFor={`res-acc-${index}`} className="form-label small">Chọn Cư dân phụ</label>
                                                    <select id={`res-acc-${index}`} name={`res-acc-${index}`} className="form-select" value={res.accountId} onChange={(e) => handleAdditionalResidentChange(index, 'accountId', e.target.value)}>
                                                        <option value="">-- Chọn --</option>
                                                        {availableResidents
                                                            .filter(r => !selectedResidentIds.includes(Number(r.accountId ?? r.AccountId)) || Number(r.accountId ?? r.AccountId) === Number(res.accountId))
                                                            .map(r => (
                                                            <option key={r.accountId || r.AccountId} value={r.accountId || r.AccountId}>
                                                                {r.fullName || r.FullName || r.userName || r.UserName || 'Chưa cập nhật tên'} - CCCD: {r.identityCard || r.IdentityCard || 'N/A'}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="col-md-4">
                                                    <label htmlFor={`res-rel-${index}`} className="form-label small">Mối quan hệ</label>
                                                    <select id={`res-rel-${index}`} name={`res-rel-${index}`} className="form-select" value={res.relationshipId} onChange={(e) => handleAdditionalResidentChange(index, 'relationshipId', e.target.value)}>
                                                        <option value="">-- Chọn --</option>
                                                        {relationships.map(rel => (
                                                            <option key={rel.id} value={rel.id}>{rel.name}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="col-md-2">
                                                    <button type="button" className="btn btn-outline-danger w-100" onClick={() => removeResidentRow(index)}>Xóa</button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            <div className="card shadow-sm border-0">
                                <div className="card-header bg-white fw-bold d-flex justify-content-between align-items-center">
                                    <span>3. Dịch Vụ Cố Định đính kèm</span>
                                    <button type="button" className="btn btn-sm btn-outline-success" onClick={addServiceRow}>
                                        <i className="bi bi-plus-circle"></i> Thêm dịch vụ
                                    </button>
                                </div>
                                <div className="card-body">
                                    {formData.selectedServices.length === 0 ? (
                                        <div className="text-muted small fst-italic">Không có dịch vụ đính kèm.</div>
                                    ) : (
                                        formData.selectedServices.map((srv, index) => (
                                            <div className="row mb-2 align-items-end" key={index}>
                                                <div className="col-md-6">
                                                    <label htmlFor={`srv-${index}`} className="form-label small">Dịch vụ</label>
                                                    <select id={`srv-${index}`} name={`srv-${index}`} className="form-select" value={srv.serviceId} onChange={(e) => handleServiceChange(index, 'serviceId', e.target.value)}>
                                                        <option value="">-- Chọn dịch vụ --</option>
                                                        {systemServices.map(s => (
                                                            <option key={s.serviceId ?? s.ServiceId} value={s.serviceId ?? s.ServiceId}>
                                                                {s.serviceName ?? s.ServiceName} - {formatCurrency(s.serviceFee ?? s.ServiceFee)}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="col-md-4">
                                                    <label htmlFor={`srv-price-${index}`} className="form-label small">Giá tùy chỉnh (Tùy chọn)</label>
                                                    <input id={`srv-price-${index}`} name={`srv-price-${index}`} type="number" className="form-control" placeholder="Để trống lấy giá gốc" value={srv.actualPrice} onChange={(e) => handleServiceChange(index, 'actualPrice', e.target.value)} />
                                                </div>
                                                <div className="col-md-2">
                                                    <button type="button" className="btn btn-outline-danger w-100" onClick={() => removeServiceRow(index)}>Xóa</button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="modal-footer" style={{ borderTop: 'none', backgroundColor: '#f8f9fa' }}>
                            <button type="button" className="btn btn-secondary px-4" data-bs-dismiss="modal">Hủy</button>
                            <button type="submit" className="btn btn-primary px-4" disabled={isSubmitting} style={{ backgroundColor: '#4a7fb8', border: 'none' }}>
                                {isSubmitting ? 'Đang xử lý...' : (isEditMode ? 'Lưu Thay Đổi' : 'Xác Nhận Tạo Mới')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* --- MODAL GIA HẠN HỢP ĐỒNG --- */}
            <div className="modal fade" id="extendModal">
                <div className="modal-dialog">
                    <form className="modal-content" onSubmit={handleExtendContract}>
                        <div className="modal-header bg-info text-white">
                            <h5 className="modal-title fw-bold"><i className="bi bi-calendar-plus me-2"></i>Gia Hạn Hợp Đồng</h5>
                            <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal" id="closeExtendModal"></button>
                        </div>
                        <div className="modal-body">
                            <label htmlFor="extendNewEndDate" className="form-label small fw-semibold">Chọn Ngày Kết Thúc Mới:</label>
                            <input 
                                id="extendNewEndDate" 
                                type="date" 
                                className="form-control mb-3" 
                                value={extendNewEndDate} 
                                onChange={e => setExtendNewEndDate(e.target.value)} 
                                required 
                            />
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Hủy</button>
                            <button type="submit" className="btn btn-info text-white">Xác nhận Gia Hạn</button>
                        </div>
                    </form>
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
                            <label htmlFor="terminationDate" className="form-label small fw-semibold">Ngày chấm dứt:</label>
                            <input id="terminationDate" name="terminationDate" type="date" className="form-control mb-3" value={terminationDate} onChange={e => setTerminationDate(e.target.value)} />
                            
                            <label htmlFor="additionalCost" className="form-label small fw-semibold">Chi phí phát sinh thêm:</label>
                            <input id="additionalCost" name="additionalCost" type="number" className="form-control mb-3" value={additionalCost} onChange={e => setAdditionalCost(e.target.value)} />

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
                            <button className="btn btn-danger" onClick={handleTerminate} disabled={!terminationDate}>Xác nhận</button>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- MODAL THÙNG RÁC (DANH SÁCH ĐÃ XÓA) --- */}
            <div className="modal fade" id="trashModal" tabIndex="-1">
                <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
                    <div className="modal-content">
                        <div className="modal-header bg-secondary text-white">
                            <h5 className="modal-title fw-bold"><i className="bi bi-trash3-fill me-2"></i>Thùng rác Hợp đồng</h5>
                            <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div className="modal-body p-0">
                            {loadingDeleted ? (
                                <div className="text-center p-4"><div className="spinner-border text-secondary"></div></div>
                            ) : deletedContracts.length === 0 ? (
                                <div className="text-center p-4 text-muted">Thùng rác trống.</div>
                            ) : (
                                <table className="table table-hover table-bordered mb-0 align-middle text-center">
                                    <thead className="table-light">
                                        <tr>
                                            <th>Mã HĐ</th>
                                            <th>Người Thuê</th>
                                            <th>Căn Hộ</th>
                                            <th>Ngày Xóa</th>
                                            <th>Hành Động</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {deletedContracts.map(contract => (
                                            <tr key={contract.contractId}>
                                                <td className="text-muted text-decoration-line-through">{contract.contractCode}</td>
                                                <td>{contract.account?.info?.fullName || contract.account?.fullName || contract.account?.email || "N/A"}</td>
                                                <td>{contract.apartment?.apartmentCode || "N/A"}</td>
                                                <td>{contract.updatedAt ? formatDate(contract.updatedAt) : 'N/A'}</td>
                                                <td>
                                                    <button className="btn btn-sm btn-outline-success me-2" onClick={() => handleRestoreContract(contract.contractId)} title="Khôi phục">
                                                        <i className="bi bi-arrow-counterclockwise"></i> Khôi phục
                                                    </button>
                                                    <button className="btn btn-sm btn-danger" onClick={() => handleHardDeleteContract(contract.contractId)} title="Xóa cứng">
                                                        <i className="bi bi-x-octagon-fill"></i> Xóa cứng
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default ContractManagement;