import React, { useState, useEffect } from 'react';
import api from '../../utils/axiosConfig';
import Pagination from '../../components/common/Pagination';

const ApartmentManagement = () => {
    const [apartments, setApartments] = useState([]);
    const [buildings, setBuildings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editId, setEditId] = useState(null);
    const [showTrash, setShowTrash] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [showServiceModal, setShowServiceModal] = useState(false);
    const [selectedApartment, setSelectedApartment] = useState(null);
    const [allServices, setAllServices] = useState([]);
    const [roomServices, setRoomServices] = useState([]);
    const [assignForm, setAssignForm] = useState({ serviceId: '', price: '' });
    const [editingPrices, setEditingPrices] = useState({});

    const fetchServicesForRoom = async (apartmentId) => {
        try {
            const res = await api.get(`/Service/room/${apartmentId}`);
            const dataList = res.data?.data || res.data || [];
            setRoomServices(Array.isArray(dataList) ? dataList : []);
        } catch (error) {
            console.error("Lỗi lấy dịch vụ phòng:", error);
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
            console.error("Lỗi:", error);
        }
    };

    const handleAssignService = async (e) => {
        e.preventDefault();
        if (!assignForm.serviceId) return alert("Vui lòng chọn dịch vụ!");

        try {
            const payload = {
                apartmentId: selectedApartment.apartmentId,
                serviceId: Number(assignForm.serviceId)
            };

            await api.post('/Service/room', payload);

            if (assignForm.price) {
                await api.put('/Service/room/price', {
                    apartmentId: selectedApartment.apartmentId,
                    serviceId: Number(assignForm.serviceId),
                    actualPrice: Number(assignForm.price)
                });
            }

            alert("Gán dịch vụ thành công!");
            setAssignForm({ serviceId: '', price: '' });
            fetchServicesForRoom(selectedApartment.apartmentId);
        } catch (error) {
            alert("LỖI: " + (error.response?.data?.message || "Không thể gán dịch vụ."));
        }
    };

    const handleUpdateServicePrice = async (serviceId) => {
        const newPrice = editingPrices[serviceId];
        if (newPrice === undefined || newPrice === '') return alert("Vui lòng nhập giá mới!");

        try {
            await api.put('/Service/room/price', {
                apartmentId: selectedApartment.apartmentId,
                serviceId: serviceId,
                actualPrice: Number(newPrice)
            });
            alert("Cập nhật giá thành công!");
            fetchServicesForRoom(selectedApartment.apartmentId);
        } catch (error) {
            alert("LỖI: " + (error.response?.data?.message || "Không thể cập nhật giá."));
        }
    };

    const handleRemoveService = async (serviceId) => {
        if (!window.confirm("Bạn có chắc chắn muốn gỡ dịch vụ này khỏi phòng?")) return;
        try {
            await api.delete('/Service/room', {
                data: {
                    apartmentId: selectedApartment.apartmentId,
                    serviceId: serviceId
                }
            });
            fetchServicesForRoom(selectedApartment.apartmentId);
        } catch (error) {
            alert("LỖI: " + (error.response?.data?.message || "Không thể gỡ dịch vụ."));
        }
    };

    const initialFormState = {
        buildingId: '',
        apartmentNumber: '',
        floorNumber: '',
        area: '',
        status: 1
    };
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


            setCurrentPage(1);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {
        fetchData();
    }, [showTrash]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
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
                alert("Cập nhật thông tin phòng thành công!");
            } else {
                const createPayload = {
                    buildingId: Number(formData.buildingId),
                    floorNumber: Number(formData.floorNumber),
                    apartmentNumber: Number(formData.apartmentNumber),
                    area: Number(formData.area),
                    status: Number(formData.status)
                };
                await api.post('/Apartments', createPayload);
                alert("Thêm căn hộ mới thành công!");
            }

            await fetchData();
            document.getElementById('closeAptModal').click();
        } catch (error) {
            console.error("API Error:", error.response?.data);
            const errorMessage = error.response?.data?.message || "Thao tác thất bại. Vui lòng kiểm tra lại thông tin nhập.";
            alert("LỖI: " + errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id, aptCode) => {
        if (window.confirm(`Xác nhận đưa căn hộ ${aptCode} vào danh sách đã xóa?`)) {
            try {
                await api.delete(`/Apartments/${id}`);
                await fetchData();
                alert("Đã đưa vào danh sách đã xóa.");
            } catch (error) {
                const errorMessage = error.response?.data?.message || "Không thể xóa căn hộ lúc này.";
                alert("LỖI: " + errorMessage);
            }
        }
    };


    const handleRestore = async (id) => {
        try {
            await api.put(`/Apartments/${id}/restore`);
            alert("Đã khôi phục căn hộ thành công!");
            await fetchData();
        } catch (error) {
            alert("LỖI: " + (error.response?.data?.message || "Không thể khôi phục."));
        }
    };


    const handleHardDelete = async (id, aptCode) => {
        if (window.confirm(`CẢNH BÁO: Bạn sắp XÓA VĨNH VIỄN căn hộ ${aptCode}. Hành động này không thể hoàn tác. Xác nhận?`)) {
            try {
                await api.delete(`/Apartments/${id}/hard`);
                alert("Đã xóa vĩnh viễn thành công!");
                await fetchData();
            } catch (error) {
                alert("LỖI: " + (error.response?.data?.message || "Không thể xóa."));
            }
        }
    };

    const getStatusBadge = (status, hasTenant) => {
        switch (status) {
            case 1:
                return <span className="badge bg-success">Trống</span>;
            case 2:
                return <span className="badge bg-warning text-dark">Đang thuê</span>;
            case 3:
                if (hasTenant) {
                    return (
                        <span className="badge bg-secondary d-inline-flex align-items-center">
                            Bảo trì
                            <span
                                className="bg-danger rounded-circle ms-2 shadow-sm"
                                style={{ width: '8px', height: '8px' }}
                                title="Phòng đang có người thuê"
                            ></span>
                        </span>
                    );
                }
                return <span className="badge bg-secondary">Bảo trì</span>;
            default:
                return <span className="badge bg-secondary">Không xác định</span>;
        }
    };

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;

    const currentApartments = apartments.slice(indexOfFirstItem, indexOfLastItem);

    return (
        <div className="container-fluid p-0">
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

            <div className="card shadow-sm border-0">
                <div className="card-body p-0">
                    {loading ? (
                        <div className="text-center p-5"><div className="spinner-border text-primary"></div></div>
                    ) : apartments.length === 0 ? (
                        <div className="text-center p-5 text-muted">{showTrash ? 'Không có căn hộ nào bị xóa.' : 'Chưa có dữ liệu căn hộ nào.'}</div>
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
                                                    <td>
                                                        {getStatusBadge(apt.status, apt.hasTenant)}
                                                    </td>
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
                                                                <button
                                                                    className="btn btn-sm btn-outline-info me-1"
                                                                    onClick={() => handleOpenServiceModal(apt)}
                                                                    title="Quản lý dịch vụ"
                                                                >
                                                                    <i className="bi bi-box-seam me-1"></i> Dịch vụ
                                                                </button>
                                                                <button className="btn btn-sm btn-outline-warning me-2" onClick={() => handleOpenModal(apt)} data-bs-toggle="modal" data-bs-target="#apartmentModal">
                                                                    <i className="bi bi-pencil-square me-1"></i> Cập nhật
                                                                </button>
                                                                <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(apt.apartmentId, apt.apartmentCode)}>
                                                                    <i className="bi bi-x-circle me-1"></i> Xóa
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


                            <Pagination
                                totalItems={apartments.length}
                                itemsPerPage={itemsPerPage}
                                currentPage={currentPage}
                                onPageChange={setCurrentPage}
                            />
                        </>
                    )}
                </div>
            </div>

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
                                            <small className="text-muted fst-italic">
                                                * Lưu ý: Mã căn hộ và Tên căn hộ sẽ được hệ thống tự động khởi tạo dựa vào Tòa nhà, Tầng và Số phòng bạn nhập.
                                            </small>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="modal-footer bg-light">
                                <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Hủy</button>
                                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                                    {isSubmitting ? 'Đang xử lý...' : 'Lưu Thay Đổi'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
            {/* === MODAL QUẢN LÝ DỊCH VỤ CỦA PHÒNG === */}
            {showServiceModal && selectedApartment && (
                <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-lg modal-dialog-scrollable">
                        <div className="modal-content border-0">
                            <div className="modal-header bg-info text-white">
                                <h5 className="modal-title fw-bold">
                                    <i className="bi bi-box-seam me-2"></i>
                                    Quản lý Dịch vụ - Phòng {selectedApartment.apartmentCode}
                                </h5>
                                <button type="button" className="btn-close btn-close-white" onClick={() => setShowServiceModal(false)}></button>
                            </div>
                            <div className="modal-body bg-light">

                                {/* 1. KIỂM TRA PHÒNG TRỐNG VÀ FORM GÁN DỊCH VỤ MỚI */}
                                {selectedApartment.status === 1 ? (
                                    <div className="alert alert-warning border-warning shadow-sm">
                                        <h6 className="fw-bold text-danger mb-1">
                                            <i className="bi bi-exclamation-triangle-fill me-2"></i> Phòng đang trống!
                                        </h6>
                                        <span className="small">Bạn chỉ có thể gán các dịch vụ (như Gửi xe, Gym...) cho những phòng <strong>Đã có cư dân thuê</strong> (Trạng thái: Đang thuê). Vui lòng làm hợp đồng cho phòng này trước!</span>
                                    </div>
                                ) : (
                                    <div className="card shadow-sm border-0 mb-4">
                                        <div className="card-header bg-white fw-bold text-primary">Gán Dịch Vụ Mới</div>
                                        <div className="card-body">
                                            <form className="row g-3 align-items-end" onSubmit={handleAssignService}>
                                                <div className="col-md-5">
                                                    <label className="form-label small fw-semibold">Chọn Dịch vụ (*)</label>
                                                    <select
                                                        className="form-select"
                                                        value={assignForm.serviceId}
                                                        onChange={e => setAssignForm({ ...assignForm, serviceId: e.target.value })}
                                                        required
                                                    >
                                                        <option value="">-- Chọn dịch vụ --</option>
                                                        {allServices
                                                            // Lọc bỏ những dịch vụ phòng này đã đăng ký rồi
                                                            .filter(s => !roomServices.some(rs => rs.serviceId === s.serviceId))
                                                            .map(s => (
                                                                <option key={s.serviceId} value={s.serviceId}>
                                                                    {s.serviceName} (Mặc định: {s.serviceFee?.toLocaleString()} đ)
                                                                </option>
                                                            ))}
                                                    </select>
                                                </div>
                                                <div className="col-md-4">
                                                    <label className="form-label small fw-semibold">Giá áp dụng (Tùy chỉnh)</label>
                                                    <input
                                                        type="number"
                                                        className="form-control"
                                                        placeholder="Để trống = Giá mặc định"
                                                        value={assignForm.price}
                                                        onChange={e => setAssignForm({ ...assignForm, price: e.target.value })}
                                                    />
                                                </div>
                                                <div className="col-md-3">
                                                    <button type="submit" className="btn btn-primary w-100 fw-bold">
                                                        <i className="bi bi-plus-circle me-1"></i> Gán ngay
                                                    </button>
                                                </div>
                                            </form>
                                        </div>
                                    </div>
                                )}

                                {/* 2. DANH SÁCH DỊCH VỤ ĐANG SỬ DỤNG */}
                                <h6 className="fw-bold text-secondary mb-3">Dịch vụ đang sử dụng</h6>
                                {roomServices.length === 0 ? (
                                    <div className="alert alert-secondary text-center small">Phòng này chưa đăng ký dịch vụ nào.</div>
                                ) : (
                                    <div className="table-responsive bg-white rounded shadow-sm">
                                        <table className="table table-hover align-middle mb-0 text-center">
                                            <thead className="table-light text-muted small">
                                                <tr>
                                                    <th className="text-start">Tên Dịch Vụ</th>
                                                    <th>Giá Mặc Định</th>
                                                    <th>Giá Đang Áp Dụng (Riêng)</th>
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

                                                            <td className="text-muted small fw-semibold">
                                                                {defaultPrice?.toLocaleString()} đ
                                                            </td>

                                                            <td>
                                                                <div className="d-flex justify-content-center">
                                                                    <input
                                                                        type="number"
                                                                        className="form-control form-control-sm text-center text-danger fw-bold w-75"
                                                                        defaultValue={currentPrice}
                                                                        onChange={e => setEditingPrices({ ...editingPrices, [rs.serviceId]: e.target.value })}
                                                                    />
                                                                </div>
                                                            </td>

                                                            <td>
                                                                <button
                                                                    className="btn btn-sm btn-outline-success me-1"
                                                                    title="Lưu Giá Mới"
                                                                    onClick={() => handleUpdateServicePrice(rs.serviceId)}
                                                                >
                                                                    <i className="bi bi-check-lg me-1"></i> Lưu
                                                                </button>
                                                                <button
                                                                    className="btn btn-sm btn-outline-danger"
                                                                    title="Gỡ dịch vụ"
                                                                    onClick={() => handleRemoveService(rs.serviceId)}
                                                                >
                                                                    <i className="bi bi-trash me-1"></i> Gỡ
                                                                </button>
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