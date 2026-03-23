import React, { useState, useEffect } from 'react';
import api from '../../utils/axiosConfig';
import Pagination from '../../components/common/Pagination';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';

const confirmModal = Swal.mixin({
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#6c757d',
    cancelButtonText: 'Hủy bỏ',
    reverseButtons: true
});

const ApartmentManagement = () => {
    const [apartments, setApartments] = useState([]);
    const [buildings, setBuildings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editId, setEditId] = useState(null);
    const [showTrash, setShowTrash] = useState(false);

    // === PHÂN TRANG ===
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    // === STATE CHO BỘ LỌC (FILTERS) ===
    const [searchTerm, setSearchTerm] = useState('');
    const [filterBuilding, setFilterBuilding] = useState('');
    const [filterStatus, setFilterStatus] = useState('');

    // Mỗi khi thay đổi bộ lọc, tự động reset về trang 1
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filterBuilding, filterStatus]);

    // === STATE CHO QUẢN LÝ DỊCH VỤ ===
    const [showServiceModal, setShowServiceModal] = useState(false);
    const [selectedApartment, setSelectedApartment] = useState(null);
    const [allServices, setAllServices] = useState([]);
    const [roomServices, setRoomServices] = useState([]);
    const [assignForm, setAssignForm] = useState({ serviceId: '', price: '' });
    const [editingPrices, setEditingPrices] = useState({});

    // === STATE CHO MODAL XEM CHI TIẾT (EYE ICON) ===
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [aptDetail, setAptDetail] = useState(null);

    const getRelationshipName = (id, nameObj) => {
        if (nameObj) return nameObj;
        switch (id) {
            case 1: return "Chủ hộ";
            case 2: return "Vợ/Chồng";
            case 3: return "Con cái";
            case 4: return "Bố/Mẹ";
            case 5: return "Anh/Chị/Em";
            default: return "Thành viên";
        }
    };

    const handleViewDetail = async (apt) => {
        setAptDetail({ ...apt, isLoading: true, residents: [], services: [], contract: null });
        setShowDetailModal(true);

        try {
            const [srvRes, resRes, ctrRes] = await Promise.all([
                api.get(`/Service/room/${apt.apartmentId}`).catch(() => ({ data: [] })),
                api.get('/Residents/GetAllResidents').catch(() => ({ data: [] })),
                api.get('/contract/view-all-contract').catch(() => ({ data: [] }))
            ]);

            const servicesData = srvRes.data?.data || srvRes.data || [];
            const allResidents = resRes.data?.data || resRes.data || [];
            const allContracts = ctrRes.data?.data || ctrRes.data || [];

            const roomResidents = allResidents.filter(r => r.apartmentId === apt.apartmentId || r.apartmentCode === apt.apartmentCode);
            const activeContract = allContracts.find(c => c.apartmentId === apt.apartmentId && c.status === 1);

            setAptDetail({
                ...apt,
                isLoading: false,
                services: Array.isArray(servicesData) ? servicesData : [],
                residents: Array.isArray(roomResidents) ? roomResidents : [],
                contract: activeContract || null
            });
        } catch (error) {
            toast.error("Không thể tải chi tiết phòng lúc này.");
            setAptDetail(prev => ({ ...prev, isLoading: false }));
        }
    };

    const fetchServicesForRoom = async (apartmentId) => {
        try {
            const res = await api.get(`/Service/room/${apartmentId}`);
            const dataList = res.data?.data || res.data || [];
            setRoomServices(Array.isArray(dataList) ? dataList : []);
        } catch (error) {
            setRoomServices([]);
        }
    };

    const handleOpenServiceModal = async (apartment) => {
        setSelectedApartment(apartment);
        setShowServiceModal(true);
        setAssignForm({ serviceId: '', price: '' });
        setEditingPrices({});

        try {
            const resAll = await api.get('/Service');
            const activeServices = (resAll.data?.data || resAll.data || []).filter(s => s.status === 1 || s.Status === 1);
            setAllServices(activeServices);
            await fetchServicesForRoom(apartment.apartmentId);
        } catch (error) {
            console.error(error);
        }
    };

    const handleAssignService = async (e) => {
        e.preventDefault();
        if (!assignForm.serviceId) return toast.warning("Vui lòng chọn dịch vụ!");

        try {
            const payload = { apartmentId: selectedApartment.apartmentId, serviceId: Number(assignForm.serviceId) };
            await api.post('/Service/room', payload);

            if (assignForm.price) {
                await api.put('/Service/room/price', {
                    apartmentId: selectedApartment.apartmentId,
                    serviceId: Number(assignForm.serviceId),
                    actualPrice: Number(assignForm.price)
                });
            }

            toast.success("Gán dịch vụ thành công!");
            setAssignForm({ serviceId: '', price: '' });
            fetchServicesForRoom(selectedApartment.apartmentId);
        } catch (error) {
            toast.error("LỖI: " + (error.response?.data?.message || "Không thể gán dịch vụ."));
        }
    };

    const handleUpdateServicePrice = async (serviceId) => {
        const newPrice = editingPrices[serviceId];
        if (newPrice === undefined || newPrice === '') return toast.warning("Vui lòng nhập giá mới!");

        try {
            await api.put('/Service/room/price', {
                apartmentId: selectedApartment.apartmentId,
                serviceId: serviceId,
                actualPrice: Number(newPrice)
            });
            toast.success("Cập nhật giá thành công!");
            fetchServicesForRoom(selectedApartment.apartmentId);
        } catch (error) {
            toast.error("LỖI: " + (error.response?.data?.message || "Không thể cập nhật giá."));
        }
    };

    const handleRemoveService = async (serviceId) => {
        const { isConfirmed } = await confirmModal.fire({
            title: 'Gỡ Dịch Vụ?',
            text: "Bạn có chắc chắn muốn gỡ dịch vụ này khỏi phòng?",
            icon: 'warning',
            confirmButtonText: 'Đồng ý gỡ'
        });

        if (!isConfirmed) return;

        try {
            await api.delete('/Service/room', {
                data: { apartmentId: selectedApartment.apartmentId, serviceId: serviceId }
            });
            toast.success("Đã gỡ dịch vụ khỏi phòng!");
            fetchServicesForRoom(selectedApartment.apartmentId);
        } catch (error) {
            toast.error("LỖI: " + (error.response?.data?.message || "Không thể gỡ dịch vụ."));
        }
    };

    const initialFormState = { buildingId: '', apartmentNumber: '', floorNumber: '', area: '', status: 1 };
    const [formData, setFormData] = useState(initialFormState);

    const extractApartmentNumber = (code) => {
        if (!code) return '';
        return code.split('-').pop();
    };

    const fetchData = async () => {
        try {
            setLoading(true);
            const aptEndpoint = showTrash ? '/Apartments/deleted' : '/Apartments';

            const [aptRes, bldRes] = await Promise.all([
                api.get(aptEndpoint),
                api.get('/Buildings')
            ]);

            const aptList = aptRes.data.data ? aptRes.data.data : aptRes.data;
            const bldList = bldRes.data.data ? bldRes.data.data : bldRes.data;

            setApartments(Array.isArray(aptList) ? aptList : []);
            setBuildings(Array.isArray(bldList) ? bldList : []);
        } catch (error) {
            toast.error("Không thể tải dữ liệu.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // Reset filter khi chuyển đổi giữa tab Danh sách và Thùng rác
        setSearchTerm('');
        setFilterBuilding('');
        setFilterStatus('');
        setCurrentPage(1);
    }, [showTrash]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleOpenModal = (apartment = null) => {
        if (apartment) {
            setEditId(apartment.apartmentId);
            setFormData({
                buildingId: apartment.buildingId || '',
                apartmentNumber: extractApartmentNumber(apartment.apartmentCode),
                floorNumber: apartment.floorNumber || '',
                area: apartment.area || '',
                status: apartment.status || 1
            });
        } else {
            setEditId(null);
            setFormData(initialFormState);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            if (editId) {
                const updatePayload = {
                    apartmentNumber: Number(formData.apartmentNumber),
                    area: Number(formData.area),
                    status: Number(formData.status)
                };
                await api.put(`/Apartments/${editId}`, updatePayload);
                toast.success("Cập nhật thông tin phòng thành công!");
            } else {
                const createPayload = {
                    buildingId: Number(formData.buildingId),
                    floorNumber: Number(formData.floorNumber),
                    apartmentNumber: Number(formData.apartmentNumber),
                    area: Number(formData.area),
                    status: Number(formData.status)
                };
                await api.post('/Apartments', createPayload);
                toast.success("Thêm căn hộ mới thành công!");
            }

            await fetchData();
            document.getElementById('closeAptModal').click();
        } catch (error) {
            const errorMessage = error.response?.data?.message || "Thao tác thất bại. Vui lòng kiểm tra lại thông tin nhập.";
            toast.error("LỖI: " + errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id, aptCode) => {
        const { isConfirmed } = await confirmModal.fire({
            title: 'Xóa Căn Hộ?',
            text: `Bạn có chắc chắn muốn đưa căn hộ ${aptCode} vào danh sách đã xóa?`,
            icon: 'warning',
            confirmButtonText: 'Đồng ý xóa'
        });

        if (isConfirmed) {
            try {
                await api.delete(`/Apartments/${id}`);
                await fetchData();
                toast.success("Đã đưa vào danh sách đã xóa.");
            } catch (error) {
                toast.error("LỖI: " + (error.response?.data?.message || "Không thể xóa căn hộ lúc này."));
            }
        }
    };

    const handleRestore = async (id) => {
        try {
            await api.put(`/Apartments/${id}/restore`);
            toast.success("Đã khôi phục căn hộ thành công!");
            await fetchData();
        } catch (error) {
            toast.error("LỖI: " + (error.response?.data?.message || "Không thể khôi phục."));
        }
    };

    const handleHardDelete = async (id, aptCode) => {
        const { isConfirmed } = await confirmModal.fire({
            title: 'CẢNH BÁO!',
            html: `Bạn sắp <b>XÓA VĨNH VIỄN</b> căn hộ <b class="text-danger">${aptCode}</b>.<br/>Hành động này không thể hoàn tác. Xác nhận?`,
            icon: 'error',
            confirmButtonText: 'Xóa vĩnh viễn!'
        });

        if (isConfirmed) {
            try {
                await api.delete(`/Apartments/${id}/hard`);
                toast.success("Đã xóa vĩnh viễn thành công!");
                await fetchData();
            } catch (error) {
                toast.error("LỖI: " + (error.response?.data?.message || "Không thể xóa."));
            }
        }
    };

    const getStatusBadge = (status, hasTenant) => {
        switch (status) {
            case 1: return <span className="badge bg-success">Trống</span>;
            case 2: return <span className="badge bg-warning text-dark">Đang thuê</span>;
            case 3:
                if (hasTenant) {
                    return (
                        <span className="badge bg-secondary d-inline-flex align-items-center">
                            Bảo trì
                            <span className="bg-danger rounded-circle ms-2 shadow-sm" style={{ width: '8px', height: '8px' }} title="Phòng đang có người thuê"></span>
                        </span>
                    );
                }
                return <span className="badge bg-secondary">Bảo trì</span>;
            default: return <span className="badge bg-secondary">Không xác định</span>;
        }
    };

    const formatMoney = (amount) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);

    const filteredApartments = apartments.filter(apt => {
        const matchBuilding = filterBuilding ? (() => {
            const selectedBld = buildings.find(b => b.buildingId === Number(filterBuilding));
            return selectedBld && apt.apartmentCode?.startsWith(selectedBld.buildingCode);
        })() : true;

        const matchStatus = filterStatus ? apt.status === Number(filterStatus) : true;
        const matchSearch = searchTerm
            ? (apt.apartmentCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                apt.apartmentName?.toLowerCase().includes(searchTerm.toLowerCase()))
            : true;

        return matchBuilding && matchStatus && matchSearch;
    });

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentApartments = filteredApartments.slice(indexOfFirstItem, indexOfLastItem);

    return (
        <div className="container-fluid p-0">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-start mb-4">
                <div>
                    <h2 className="fw-bold mb-0">{showTrash ? 'Danh sách đã xóa: Căn hộ' : 'Quản lý Căn hộ'}</h2>
                    {showTrash && <div className="text-danger small mt-2">Các dữ liệu bị ngưng hoạt động đang được lưu trữ tại đây</div>}
                </div>

                <div className="d-flex align-items-center">
                    {!showTrash && (
                        <button className="btn btn-primary me-3" onClick={() => handleOpenModal()} data-bs-toggle="modal" data-bs-target="#apartmentModal" style={{ minWidth: '160px' }}>
                            <i className="bi bi-plus-circle me-2"></i> Thêm Căn hộ
                        </button>
                    )}

                    <button className={`btn ${showTrash ? 'btn-outline-secondary' : 'btn-outline-danger'}`} onClick={() => setShowTrash(!showTrash)}>
                        <i className={`bi ${showTrash ? 'bi-arrow-left-circle' : 'bi-archive'} me-2`}></i>
                        {showTrash ? 'Quay lại Danh sách' : 'Danh sách đã xóa'}
                    </button>
                </div>
            </div>

            {/* === THANH CÔNG CỤ BỘ LỌC (MỚI) === */}
            <div className="card shadow-sm border-0 mb-4 bg-light">
                <div className="card-body py-3">
                    <div className="row g-3">
                        <div className="col-md-5">
                            <div className="input-group">
                                <span className="input-group-text bg-white border-end-0 text-muted"><i className="bi bi-search"></i></span>
                                <input
                                    type="text"
                                    className="form-control border-start-0 ps-0"
                                    placeholder="Tìm theo Mã phòng hoặc Tên phòng..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="col-md-4">
                            <div className="input-group">
                                <span className="input-group-text bg-white text-muted"><i className="bi bi-building"></i></span>
                                <select className="form-select" value={filterBuilding} onChange={e => setFilterBuilding(e.target.value)}>
                                    <option value="">-- Tất cả tòa nhà --</option>
                                    {buildings.map(b => (
                                        <option key={b.buildingId} value={b.buildingId}>{b.buildingCode} - {b.buildingName}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="col-md-3">
                            <div className="input-group">
                                <span className="input-group-text bg-white text-muted"><i className="bi bi-funnel"></i></span>
                                <select className="form-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                                    <option value="">-- Mọi trạng thái --</option>
                                    <option value="1">Phòng Trống</option>
                                    <option value="2">Đang Thuê</option>
                                    <option value="3">Đang Bảo Trì</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bảng dữ liệu Căn Hộ */}
            <div className="card shadow-sm border-0">
                <div className="card-body p-0">
                    {loading ? (
                        <div className="text-center p-5"><div className="spinner-border text-primary"></div></div>
                    ) : filteredApartments.length === 0 ? (
                        <div className="text-center p-5 text-muted">
                            <i className="bi bi-search fs-1 d-block mb-2"></i>
                            Không tìm thấy căn hộ nào phù hợp với điều kiện lọc.
                        </div>
                    ) : (
                        <>
                            <div className="table-responsive">
                                <table className="table table-hover table-bordered mb-0 align-middle text-center">
                                    <thead className="table-light">
                                        <tr>
                                            <th>STT</th>
                                            <th>Mã Căn</th>
                                            <th className="text-start">Tên Căn Hộ</th>
                                            <th>Số phòng</th>
                                            <th>Tầng</th>
                                            <th>Diện tích</th>
                                            <th>{showTrash ? 'Trạng thái xóa' : 'Trạng thái'}</th>
                                            <th>Hành động</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {currentApartments.map((apt, idx) => {
                                            const derivedRoomNumber = extractApartmentNumber(apt.apartmentCode);
                                            const stt = indexOfFirstItem + idx + 1;

                                            return (
                                                <tr key={apt.apartmentId}>
                                                    <td>{stt}</td>
                                                    <td className={`fw-bold ${showTrash ? 'text-muted' : 'text-primary'}`}>{apt.apartmentCode}</td>
                                                    <td className={`fw-semibold text-start ${showTrash ? 'text-muted text-decoration-line-through' : ''}`}>{apt.apartmentName}</td>
                                                    <td className="fw-semibold">{derivedRoomNumber}</td>
                                                    <td>{apt.floorNumber}</td>
                                                    <td>{apt.area} m²</td>
                                                    <td>{getStatusBadge(apt.status, apt.hasTenant)}</td>
                                                    <td>
                                                        {showTrash ? (
                                                            <>
                                                                <button className="btn btn-sm btn-outline-success me-2" onClick={() => handleRestore(apt.apartmentId)} title="Khôi phục">
                                                                    <i className="bi bi-arrow-counterclockwise"></i> Khôi phục
                                                                </button>
                                                                <button className="btn btn-sm btn-danger" onClick={() => handleHardDelete(apt.apartmentId, apt.apartmentCode)} title="Xóa vĩnh viễn">
                                                                    <i className="bi bi-trash3"></i> Xóa hẳn
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <button className="btn btn-sm btn-outline-primary me-1" onClick={() => handleViewDetail(apt)} title="Xem tổng quan Căn hộ">
                                                                    <i className="bi bi-eye"></i>
                                                                </button>
                                                                <button className="btn btn-sm btn-outline-info me-1" onClick={() => handleOpenServiceModal(apt)} title="Quản lý dịch vụ">
                                                                    <i className="bi bi-box-seam"></i> Dịch vụ
                                                                </button>
                                                                <button className="btn btn-sm btn-outline-warning me-1" onClick={() => handleOpenModal(apt)} data-bs-toggle="modal" data-bs-target="#apartmentModal" title="Cập nhật">
                                                                    <i className="bi bi-pencil-square"></i> Cập nhật
                                                                </button>
                                                                <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(apt.apartmentId, apt.apartmentCode)} title="Xóa mềm">
                                                                    <i className="bi bi-trash"></i>
                                                                </button>
                                                            </>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                            <Pagination totalItems={filteredApartments.length} itemsPerPage={itemsPerPage} currentPage={currentPage} onPageChange={setCurrentPage} />
                        </>
                    )}
                </div>
            </div>

            {/* MODAL XEM CHI TIẾT CĂN HỘ */}
            {showDetailModal && aptDetail && (
                <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1050 }}>
                    <div className="modal-dialog modal-xl modal-dialog-scrollable">
                        <div className="modal-content border-0 shadow-lg">
                            <div className="modal-header bg-dark text-white border-0">
                                <h5 className="modal-title fw-bold">
                                    <i className="bi bi-building me-2"></i>Chi Tiết Căn Hộ: {aptDetail.apartmentCode}
                                </h5>
                                <button type="button" className="btn-close btn-close-white" onClick={() => setShowDetailModal(false)}></button>
                            </div>
                            <div className="modal-body bg-light">
                                {aptDetail.isLoading ? (
                                    <div className="text-center p-5"><div className="spinner-border text-primary"></div><p className="mt-2 text-muted">Đang tổng hợp dữ liệu...</p></div>
                                ) : (
                                    <div className="row g-4">
                                        <div className="col-lg-5">
                                            <div className="card shadow-sm border-0 mb-4">
                                                <div className="card-header bg-white fw-bold text-primary border-bottom-0 pt-3 pb-0">
                                                    <i className="bi bi-info-circle me-2"></i>Thông tin cơ bản
                                                </div>
                                                <div className="card-body">
                                                    <ul className="list-group list-group-flush">
                                                        <li className="list-group-item px-0 d-flex justify-content-between">
                                                            <span className="text-muted">Tên Căn Hộ:</span> <span className="fw-semibold">{aptDetail.apartmentName}</span>
                                                        </li>
                                                        <li className="list-group-item px-0 d-flex justify-content-between">
                                                            <span className="text-muted">Tòa / Tầng:</span> <span className="fw-semibold">Tòa {aptDetail.buildingId} / Tầng {aptDetail.floorNumber}</span>
                                                        </li>
                                                        <li className="list-group-item px-0 d-flex justify-content-between">
                                                            <span className="text-muted">Diện tích:</span> <span className="fw-semibold text-info">{aptDetail.area} m²</span>
                                                        </li>
                                                        <li className="list-group-item px-0 d-flex justify-content-between">
                                                            <span className="text-muted">Trạng thái:</span> {getStatusBadge(aptDetail.status, aptDetail.hasTenant)}
                                                        </li>
                                                    </ul>
                                                </div>
                                            </div>

                                            <div className="card shadow-sm border-0 border-top border-warning border-3">
                                                <div className="card-header bg-white fw-bold text-warning border-bottom-0 pt-3 pb-0">
                                                    <i className="bi bi-file-earmark-text me-2"></i>Hợp đồng hiện tại
                                                </div>
                                                <div className="card-body">
                                                    {aptDetail.contract ? (
                                                        <ul className="list-group list-group-flush small">
                                                            <li className="list-group-item px-0 d-flex justify-content-between">
                                                                <span className="text-muted">Mã HĐ:</span> <span className="fw-bold text-dark">{aptDetail.contract.contractCode}</span>
                                                            </li>
                                                            <li className="list-group-item px-0 d-flex justify-content-between">
                                                                <span className="text-muted">Thời hạn:</span>
                                                                <span className="fw-semibold">
                                                                    {new Date(aptDetail.contract.startDay).toLocaleDateString('vi-VN')} - <span className="text-danger">{new Date(aptDetail.contract.endDay).toLocaleDateString('vi-VN')}</span>
                                                                </span>
                                                            </li>
                                                            <li className="list-group-item px-0 d-flex justify-content-between">
                                                                <span className="text-muted">Giá thuê:</span> <span className="fw-bold text-success">{formatMoney(aptDetail.contract.monthlyRent)}</span>
                                                            </li>
                                                            <li className="list-group-item px-0 d-flex justify-content-between">
                                                                <span className="text-muted">Tiền cọc:</span> <span className="fw-semibold">{formatMoney(aptDetail.contract.deposit)}</span>
                                                            </li>
                                                        </ul>
                                                    ) : (
                                                        <div className="text-center py-3 text-muted fst-italic">
                                                            <i className="bi bi-folder-x fs-3 d-block mb-2 text-light"></i>
                                                            Phòng chưa có hợp đồng nào.
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="col-lg-7">
                                            <div className="card shadow-sm border-0 mb-4 border-top border-success border-3">
                                                <div className="card-header bg-white fw-bold text-success border-bottom-0 pt-3 pb-0">
                                                    <i className="bi bi-people me-2"></i>Cư dân đang ở ({aptDetail.residents.length})
                                                </div>
                                                <div className="card-body p-0 mt-2">
                                                    {aptDetail.residents.length > 0 ? (
                                                        <div className="table-responsive">
                                                            <table className="table table-hover align-middle mb-0 text-center small">
                                                                <thead className="table-light text-muted">
                                                                    <tr>
                                                                        <th className="text-start ps-3">Họ Tên</th>
                                                                        <th>SĐT</th>
                                                                        <th>CCCD</th>
                                                                        <th>Quan hệ</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {aptDetail.residents.map(r => (
                                                                        <tr key={r.accountId}>
                                                                            <td className="text-start ps-3 fw-semibold text-dark">{r.fullName || r.userName}</td>
                                                                            <td>{r.phoneNumber || 'N/A'}</td>
                                                                            <td>{r.identityCard || 'N/A'}</td>
                                                                            <td>
                                                                                <span className={`badge ${r.relationshipId === 1 ? 'bg-danger' : 'bg-info text-dark'}`}>
                                                                                    {getRelationshipName(r.relationshipId, r.relationship?.relationshipName)}
                                                                                </span>
                                                                            </td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    ) : (
                                                        <div className="text-center py-4 text-muted fst-italic">Không có dữ liệu cư dân.</div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="card shadow-sm border-0 border-top border-info border-3">
                                                <div className="card-header bg-white fw-bold text-info border-bottom-0 pt-3 pb-0">
                                                    <i className="bi bi-box-seam me-2"></i>Dịch vụ đăng ký ({aptDetail.services.length})
                                                </div>
                                                <div className="card-body mt-2">
                                                    {aptDetail.services.length > 0 ? (
                                                        <div className="d-flex flex-wrap gap-2">
                                                            {aptDetail.services.map(s => (
                                                                <span key={s.serviceId} className="badge bg-light text-dark border border-secondary p-2">
                                                                    <i className="bi bi-check-circle-fill text-success me-1"></i>
                                                                    {s.serviceName}
                                                                    <span className="text-danger ms-1">({formatMoney(s.actualPrice ?? s.defaultPrice)})</span>
                                                                </span>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <div className="text-muted fst-italic">Chưa đăng ký dịch vụ nào.</div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="modal-footer border-0 bg-white">
                                <button type="button" className="btn btn-secondary px-4" onClick={() => setShowDetailModal(false)}>Đóng</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Thêm/Sửa Căn hộ */}
            <div className="modal fade" id="apartmentModal" tabIndex="-1" aria-hidden="true">
                <div className="modal-dialog modal-lg">
                    <div className="modal-content">
                        <div className="modal-header text-white" style={{ backgroundColor: '#122240' }}>
                            <h5 className="modal-title fw-bold">{editId ? 'Cập Nhật Căn Hộ' : 'Thêm Căn Hộ Mới'}</h5>
                            <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal" id="closeAptModal"></button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="row g-3">
                                    {!editId && (
                                        <>
                                            <div className="col-md-6">
                                                <label className="form-label fw-semibold">Thuộc Tòa Nhà (Bắt buộc)</label>
                                                <select className="form-select" name="buildingId" value={formData.buildingId} onChange={handleInputChange} required>
                                                    <option value="" disabled>-- Chọn Tòa Nhà --</option>
                                                    {buildings.map(b => (
                                                        <option key={b.buildingId} value={b.buildingId}>{b.buildingCode} - {b.buildingName}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label fw-semibold">Tầng (VD: 7)</label>
                                                <input type="number" min="1" className="form-control" name="floorNumber" value={formData.floorNumber} onChange={handleInputChange} required />
                                            </div>
                                        </>
                                    )}

                                    <div className={!editId ? "col-md-4" : "col-md-6"}>
                                        <label className="form-label fw-semibold text-primary">
                                            {editId ? "Số Căn Hộ (VD: 709)" : "Số phòng trên tầng (VD: 9)"}
                                        </label>
                                        <input type="number" min="1" className="form-control border-primary" name="apartmentNumber" value={formData.apartmentNumber} onChange={handleInputChange} required />
                                    </div>

                                    <div className={!editId ? "col-md-4" : "col-md-6"}>
                                        <label className="form-label fw-semibold">Diện tích (m²)</label>
                                        <input type="number" min="1" step="0.1" className="form-control" name="area" value={formData.area} onChange={handleInputChange} required />
                                    </div>

                                    <div className={!editId ? "col-md-4" : "col-md-12"}>
                                        <label className="form-label fw-semibold">Trạng thái</label>
                                        <select className="form-select" name="status" value={formData.status} onChange={handleInputChange}>
                                            <option value={1}>Trống</option>
                                            <option value={2}>Đang thuê</option>
                                            <option value={3}>Bảo trì</option>
                                        </select>
                                    </div>
                                    {!editId && (
                                        <div className="col-12 mt-3">
                                            <small className="text-muted fst-italic">* Lưu ý: Mã căn hộ sẽ được tạo tự động.</small>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="modal-footer bg-light">
                                <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Hủy</button>
                                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>{isSubmitting ? 'Đang xử lý...' : 'Lưu Thay Đổi'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            {/* Modal Quản lý Dịch vụ Phòng */}
            {showServiceModal && selectedApartment && (
                <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-lg modal-dialog-scrollable">
                        <div className="modal-content border-0">
                            <div className="modal-header bg-info text-white">
                                <h5 className="modal-title fw-bold"><i className="bi bi-box-seam me-2"></i> Quản lý Dịch vụ - {selectedApartment.apartmentCode}</h5>
                                <button type="button" className="btn-close btn-close-white" onClick={() => setShowServiceModal(false)}></button>
                            </div>
                            <div className="modal-body bg-light">
                                {selectedApartment.status === 1 ? (
                                    <div className="alert alert-warning">Phòng đang trống! Bạn chỉ có thể gán dịch vụ cho những phòng Đã có cư dân thuê.</div>
                                ) : (
                                    <div className="card shadow-sm border-0 mb-4">
                                        <div className="card-header bg-white fw-bold text-primary">Gán Dịch Vụ Mới</div>
                                        <div className="card-body">
                                            <form className="row g-3 align-items-end" onSubmit={handleAssignService}>
                                                <div className="col-md-5">
                                                    <label className="form-label small fw-semibold">Chọn Dịch vụ (*)</label>
                                                    <select className="form-select" value={assignForm.serviceId} onChange={e => setAssignForm({ ...assignForm, serviceId: e.target.value })} required>
                                                        <option value="">-- Chọn dịch vụ --</option>
                                                        {allServices.filter(s => !roomServices.some(rs => rs.serviceId === s.serviceId)).map(s => (
                                                            <option key={s.serviceId} value={s.serviceId}>{s.serviceName} (Mặc định: {s.serviceFee?.toLocaleString()} đ)</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="col-md-4">
                                                    <label className="form-label small fw-semibold">Giá áp dụng (Tùy chỉnh)</label>
                                                    <input type="number" className="form-control" placeholder="Để trống = Giá mặc định" value={assignForm.price} onChange={e => setAssignForm({ ...assignForm, price: e.target.value })} />
                                                </div>
                                                <div className="col-md-3">
                                                    <button type="submit" className="btn btn-primary w-100 fw-bold"><i className="bi bi-plus-circle me-1"></i> Gán ngay</button>
                                                </div>
                                            </form>
                                        </div>
                                    </div>
                                )}

                                <h6 className="fw-bold text-secondary mb-3">Dịch vụ đang sử dụng</h6>
                                {roomServices.length === 0 ? (
                                    <div className="alert alert-secondary text-center small">Chưa đăng ký dịch vụ nào.</div>
                                ) : (
                                    <div className="table-responsive bg-white rounded shadow-sm">
                                        <table className="table table-hover align-middle mb-0 text-center">
                                            <thead className="table-light text-muted small">
                                                <tr>
                                                    <th className="text-start">Tên Dịch Vụ</th>
                                                    <th>Giá Mặc Định</th>
                                                    <th>Giá Đang Áp Dụng</th>
                                                    <th>Thao Tác</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {roomServices.map(rs => {
                                                    const originalService = allServices.find(s => s.serviceId === rs.serviceId);
                                                    const defaultPrice = originalService ? originalService.serviceFee : 0;
                                                    const currentPrice = rs.actualPrice ? rs.actualPrice : defaultPrice;
                                                    return (
                                                        <tr key={rs.serviceId}>
                                                            <td className="text-start fw-semibold text-primary">{rs.serviceName}</td>
                                                            <td className="text-muted small fw-semibold">{defaultPrice?.toLocaleString()} đ</td>
                                                            <td>
                                                                <input type="number" className="form-control form-control-sm text-center text-danger fw-bold w-75 mx-auto" defaultValue={currentPrice} onChange={e => setEditingPrices({ ...editingPrices, [rs.serviceId]: e.target.value })} />
                                                            </td>
                                                            <td>
                                                                <button className="btn btn-sm btn-outline-success me-1" onClick={() => handleUpdateServicePrice(rs.serviceId)}><i className="bi bi-check-lg me-1"></i> Lưu</button>
                                                                <button className="btn btn-sm btn-outline-danger" onClick={() => handleRemoveService(rs.serviceId)}><i className="bi bi-trash me-1"></i> Gỡ</button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                            <div className="modal-footer bg-white">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowServiceModal(false)}>Đóng</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ApartmentManagement;