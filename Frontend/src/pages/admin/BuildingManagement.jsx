import React, { useState, useEffect } from 'react';
import api from '../../utils/axiosConfig';

const BuildingManagement = () => {
    const [buildings, setBuildings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showTrash, setShowTrash] = useState(false);

    const [formData, setFormData] = useState({
        buildingCode: '', buildingName: '', address: '', city: 'Hà Nội', floorNumber: 0, apartmentNumber: 0, status: 1
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editId, setEditId] = useState(null);

    const suggestBuildingInfo = () => {
        const existingCodes = buildings.map(b => b.buildingCode);
        let nextChar = 'A';
        for (let i = 0; i < 26; i++) {
            let char = String.fromCharCode(65 + i);
            if (!existingCodes.includes(`SEN-${char}`)) {
                nextChar = char;
                break;
            }
        }
        return {
            code: `SEN-${nextChar}`,
            name: `Chung cư SENTANA Tòa ${nextChar}`
        };
    };

const fetchBuildings = async () => {
    try {
        setLoading(true);
        const endpoint = showTrash ? '/Buildings/deleted' : '/Buildings';
        const response = await api.get(endpoint);
        const actualData = response.data?.data || response.data;
        if (Array.isArray(actualData)) {
            setBuildings(actualData);
        } else {
            console.error("Dữ liệu trả về không phải là mảng:", actualData);
            setBuildings([]);
        }
    } catch (error) {
        console.error("Lỗi khi tải danh sách:", error);
        setBuildings([]);
    } finally {
        setLoading(false);
    }
    };


    useEffect(() => {
        fetchBuildings();
    }, [showTrash]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: name.includes('Number') || name === 'status' ? Number(value) : value
        });
    };

    const handleOpenAdd = () => {
        setEditId(null);
        const suggestion = suggestBuildingInfo();
        setFormData({
            buildingCode: suggestion.code,
            buildingName: suggestion.name,
            address: '',
            city: 'Hà Nội',
            floorNumber: 0,
            apartmentNumber: 0,
            status: 1
        });
    };

    const handleOpenEdit = (building) => {
        setEditId(building.buildingId);
        const statusValue = (building.status === 1 || building.status === 'Active') ? 1 : 0;
        setFormData({
            buildingCode: building.buildingCode,
            buildingName: building.buildingName,
            address: building.address,
            city: building.city,
            floorNumber: building.floorNumber,
            apartmentNumber: building.apartmentNumber,
            status: statusValue
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (editId) {
                const updatePayload = { ...formData, apartmentNumber: formData.floorNumber * 10 };
                await api.put(`/Buildings/${editId}`, updatePayload);
                alert("Cập nhật thông tin thành công!");
            } else {
                const createPayload = {
                    BuildingCode: formData.buildingCode,
                    BuildingName: formData.buildingName,
                    ApartmentNumber: 1,
                    FloorNumber: formData.floorNumber,
                    City: formData.city,
                    Address: formData.address
                };
                const response = await api.post('/Buildings', createPayload);
                if (response.data?.success) {
                alert("Thêm tòa nhà thành công!");
                }
            }
            fetchBuildings();
            document.getElementById('closeModal').click();
        } catch (error) {
            alert("LỖI: " + (error.response?.data?.message || "Có lỗi xảy ra, vui lòng thử lại!"));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id, name) => {
        if (window.confirm(`Xác nhận đưa tòa nhà "${name}" vào thùng rác?`)) {
            try {
                await api.delete(`/Buildings/${id}`);
                alert("Đã đưa vào thùng rác.");
                fetchBuildings();
            } catch (error) { alert("LỖI: " + error.response?.data?.message); }
        }
    };

    const handleRestore = async (id) => {
        try {
            await api.put(`/Buildings/${id}/restore`);
            alert("Đã khôi phục tòa nhà thành công!");
            fetchBuildings();
        } catch (error) { alert("LỖI: " + error.response?.data?.message); }
    };

    const handleHardDelete = async (id, name) => {
        if (window.confirm(`CẢNH BÁO: Bạn sắp XÓA VĨNH VIỄN tòa nhà "${name}". Hành động này không thể hoàn tác. Xác nhận?`)) {
            try {
                await api.delete(`/Buildings/${id}/hard`);
                alert("Đã xóa vĩnh viễn thành công!");
                fetchBuildings();
            } catch (error) {
                alert("LỖI: " + (error.response?.data?.message || "Không thể xóa."));
            }
        }
    };

    return (
        <div className="container-fluid p-0">
            <div className="d-flex justify-content-between align-items-start mb-4">
                <div>
                    <h2 className="fw-bold mb-0">{showTrash ? 'Danh sách đã xóa: Tòa nhà' : 'Quản lý Tòa nhà'}</h2>
                    {showTrash && <div className="text-danger small mt-2">Các dữ liệu bị ngưng hoạt động đang được lưu trữ tại đây</div>}
                </div>

                <div className="d-flex align-items-center">
                    {!showTrash && (
                        <button className="btn btn-primary me-3" onClick={handleOpenAdd} data-bs-toggle="modal" data-bs-target="#buildingModal" style={{ minWidth: '160px' }}>
                            <i className="bi bi-plus-circle me-2"></i> Thêm Tòa nhà
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
                        <div className="text-center p-5"><div className="spinner-border text-primary" role="status"></div></div>
                    ) : buildings.length === 0 ? (
                        <div className="text-center p-5 text-muted">{showTrash ? 'Không có dữ liệu nào bị xóa.' : 'Chưa có dữ liệu tòa nhà nào.'}</div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-hover table-bordered mb-0 align-middle text-center">
                                <thead className="table-light">
                                    <tr>
                                        <th>STT</th>
                                        <th>Mã Tòa</th>
                                        <th className="text-start">Tên Tòa nhà</th>
                                        <th className="text-start">Địa chỉ</th>
                                        <th>Quy mô</th>
                                        <th>{showTrash ? 'Trạng thái xóa' : 'Trạng thái'}</th>
                                        <th>Hành động</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {buildings.map((building, index) => (
                                        <tr key={building.buildingId}>
                                            <td>{index + 1}</td>
                                            <td className={`fw-bold ${showTrash ? 'text-muted' : 'text-primary'}`}>{building.buildingCode}</td>
                                            <td className={`fw-semibold text-start ${showTrash ? 'text-muted text-decoration-line-through' : ''}`}>{building.buildingName}</td>
                                            <td className="text-start text-muted">{building.address}, {building.city}</td>
                                            <td>{building.floorNumber} tầng, <span className="text-success fw-bold">{building.apartmentNumber}</span> căn</td>
                                            <td>
                                                {showTrash ? (
                                                    <span className="badge bg-danger">Đã xóa</span>
                                                ) : (
                                                    <span className={`badge ${(building.status === 1 || building.status === 'Active') ? 'bg-success' : 'bg-secondary'}`}>
                                                        {(building.status === 1 || building.status === 'Active') ? 'Hoạt động' : 'Bảo trì'}
                                                    </span>
                                                )}
                                            </td>
                                            <td>
                                                {showTrash ? (
                                                    <>
                                                        <button className="btn btn-sm btn-outline-success me-2" onClick={() => handleRestore(building.buildingId)} title="Khôi phục">
                                                            <i className="bi bi-arrow-counterclockwise"></i> Khôi phục
                                                        </button>
                                                        <button className="btn btn-sm btn-danger" onClick={() => handleHardDelete(building.buildingId, building.buildingName)} title="Xóa vĩnh viễn">
                                                            <i className="bi bi-trash3"></i> Xóa hẳn
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        {/* ĐÃ ĐỔI TÊN THÀNH CẬP NHẬT Ở ĐÂY */}
                                                        <button className="btn btn-sm btn-outline-warning me-2" onClick={() => handleOpenEdit(building)} data-bs-toggle="modal" data-bs-target="#buildingModal">
                                                            <i className="bi bi-pencil-square me-1"></i> Cập nhật
                                                        </button>
                                                        <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(building.buildingId, building.buildingName)}>
                                                            <i className="bi bi-x-circle me-1"></i> Xóa
                                                        </button>
                                                    </>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            <div className="modal fade" id="buildingModal" tabIndex="-1" aria-hidden="true">
                <div className="modal-dialog modal-lg">
                    <div className="modal-content">
                        <div className="modal-header text-white" style={{ backgroundColor: '#122240' }}>
                            <h5 className="modal-title fw-bold">{editId ? 'Cập Nhật Tòa Nhà' : 'Thêm Tòa Nhà Mới'}</h5>
                            <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal" id="closeModal" aria-label="Close"></button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="row g-3">
                                    {editId ? (
                                        <div className="col-12">
                                            <div className="alert alert-info py-2 mb-0">
                                                Đang chỉnh sửa: <strong className="text-primary">{formData.buildingName} ({formData.buildingCode})</strong>
                                                <br /><small className="text-muted">Bạn có thể đổi tên, nhưng hãy cẩn thận để không trùng lặp.</small>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="col-12">
                                            <div className="alert alert-success py-2 mb-0">
                                                <i className="bi bi-magic me-2"></i>Hệ thống đã tự động gợi ý tên Tòa nhà tiếp theo. Bạn hoàn toàn có thể chỉnh sửa lại nếu muốn!
                                            </div>
                                        </div>
                                    )}

                                    <div className="col-md-6">
                                        <label className="form-label fw-semibold">Mã Tòa Nhà (*)</label>
                                        <input type="text" className="form-control border-primary" name="buildingCode" value={formData.buildingCode} onChange={handleInputChange} required />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label fw-semibold">Tên Tòa Nhà (*)</label>
                                        <input type="text" className="form-control border-primary" name="buildingName" value={formData.buildingName} onChange={handleInputChange} required />
                                    </div>

                                    <div className="col-md-4">
                                        <label className="form-label fw-semibold">Thành phố (*)</label>
                                        <input type="text" className="form-control" name="city" value={formData.city} onChange={handleInputChange} required />
                                    </div>
                                    <div className="col-md-8">
                                        <label className="form-label fw-semibold">Địa chỉ chi tiết (*)</label>
                                        <input type="text" className="form-control" name="address" value={formData.address} onChange={handleInputChange} required />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label fw-semibold">Số tầng (*)</label>
                                        <input type="number" min="1" className="form-control border-primary" name="floorNumber" value={formData.floorNumber} onChange={handleInputChange} required />
                                    </div>
                                    {editId && (
                                        <div className="col-md-6">
                                            <label className="form-label fw-semibold">Trạng thái</label>
                                            <select className="form-select border-warning" name="status" value={formData.status} onChange={handleInputChange}>
                                                <option value={1}>Hoạt động</option>
                                                <option value={0}>Bảo trì</option>
                                            </select>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="modal-footer bg-light">
                                <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Hủy bỏ</button>
                                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                                    {isSubmitting ? 'Đang xử lý...' : (editId ? 'Lưu Thay Đổi' : 'Tạo Tòa Nhà Mới')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BuildingManagement;