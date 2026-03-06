import React, { useState, useEffect } from 'react';
import api from '../../utils/axiosConfig';

const BuildingManagement = () => {
    const [buildings, setBuildings] = useState([]);
    const [loading, setLoading] = useState(true);

    const [formData, setFormData] = useState({
        buildingCode: '', buildingName: '', address: '', city: '', floorNumber: 0, apartmentNumber: 0, status: 1
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [editId, setEditId] = useState(null);

    const fetchBuildings = async () => {
        try {
            setLoading(true);
            const response = await api.get('/Buildings');
            setBuildings(response.data);
        } catch (error) {
            console.error("Lỗi khi tải danh sách:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBuildings();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: name.includes('Number') || name === 'status' ? Number(value) : value
        });
    };

    const handleOpenAdd = () => {
        setEditId(null);
        setFormData({
            buildingCode: '', buildingName: '', address: '', city: '', floorNumber: 0, apartmentNumber: 0, status: 1
        });
    };

    const handleOpenEdit = (building) => {
        setEditId(building.buildingId);
        setFormData({
            buildingCode: building.buildingCode,
            buildingName: building.buildingName,
            address: building.address,
            city: building.city,
            floorNumber: building.floorNumber,
            apartmentNumber: building.apartmentNumber,
            status: building.status
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            if (editId) {
                await api.put(`/Buildings/${editId}`, formData);
                alert("Cập nhật thông tin thành công!");
            } else {
                await api.post('/Buildings', formData);
                alert("Thêm tòa nhà thành công!");
            }

            fetchBuildings();
            document.getElementById('closeModal').click();

        } catch (error) {
            console.error("Lỗi khi lưu tòa nhà:", error);
            alert(error.response?.data?.message || "Có lỗi xảy ra, vui lòng thử lại!");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id, name) => {
        const isConfirm = window.confirm(`Bạn có chắc chắn muốn xóa tòa nhà "${name}" không?`);

        if (isConfirm) {
            try {
                await api.delete(`/Buildings/${id}`);
                alert("Đã xóa tòa nhà thành công!");

                fetchBuildings();
            } catch (error) {
                console.error("Lỗi khi xóa:", error);
                alert("Có lỗi xảy ra, không thể xóa tòa nhà này!");
            }
        }
    };

    return (
        <div className="container-fluid p-0">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="fw-bold mb-0">Quản lý Tòa nhà</h2>
                <button className="btn btn-primary" onClick={handleOpenAdd} data-bs-toggle="modal" data-bs-target="#buildingModal">
                    <i className="bi bi-plus-circle me-2"></i> Thêm Tòa nhà
                </button>
            </div>

            <div className="card shadow-sm border-0">
                <div className="card-body p-0">
                    {loading ? (
                        <div className="text-center p-5"><div className="spinner-border text-primary" role="status"></div></div>
                    ) : buildings.length === 0 ? (
                        <div className="text-center p-5 text-muted">Chưa có dữ liệu tòa nhà nào.</div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-hover table-bordered mb-0 align-middle">
                                <thead className="table-light text-center">
                                    <tr>
                                        <th>STT</th>
                                        <th>Mã Tòa</th>
                                        <th>Tên Tòa nhà</th>
                                        <th>Địa chỉ</th>
                                        <th>Quy mô</th>
                                        <th>Trạng thái</th>
                                        <th>Hành động</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {buildings.map((building, index) => (
                                        <tr key={building.buildingId} className="text-center">
                                            <td>{index + 1}</td>
                                            <td className="fw-bold text-primary">{building.buildingCode}</td>
                                            <td className="fw-semibold">{building.buildingName}</td>
                                            <td className="text-start">{building.address}, {building.city}</td>
                                            <td>{building.floorNumber} tầng, {building.apartmentNumber} căn</td>
                                            <td>
                                                <span className={`badge ${building.status === 1 ? 'bg-success' : 'bg-secondary'}`}>
                                                    {building.status === 1 ? 'Hoạt động' : 'Bảo trì'}
                                                </span>
                                            </td>
                                            <td>
                                                <button
                                                    className="btn btn-sm btn-outline-warning me-2"
                                                    onClick={() => handleOpenEdit(building)}
                                                    data-bs-toggle="modal"
                                                    data-bs-target="#buildingModal"
                                                >
                                                    Sửa
                                                </button>
                                                <button
                                                    className="btn btn-sm btn-outline-danger"
                                                    onClick={() => handleDelete(building.buildingId, building.buildingName)}
                                                >
                                                    Xóa
                                                </button>
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
                                    <div className="col-md-6">
                                        <label className="form-label fw-semibold">Mã Tòa Nhà</label>
                                        <input type="text" className="form-control" name="buildingCode" value={formData.buildingCode} onChange={handleInputChange} required placeholder="VD: S1.01" />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label fw-semibold">Tên Tòa Nhà</label>
                                        <input type="text" className="form-control" name="buildingName" value={formData.buildingName} onChange={handleInputChange} required placeholder="VD: Sentana Block A" />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label fw-semibold">Thành phố</label>
                                        <input type="text" className="form-control" name="city" value={formData.city} onChange={handleInputChange} required />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label fw-semibold">Địa chỉ chi tiết</label>
                                        <input type="text" className="form-control" name="address" value={formData.address} onChange={handleInputChange} required />
                                    </div>
                                    <div className="col-md-4">
                                        <label className="form-label fw-semibold">Số tầng</label>
                                        <input type="number" min="1" className="form-control" name="floorNumber" value={formData.floorNumber} onChange={handleInputChange} required />
                                    </div>
                                    <div className="col-md-4">
                                        <label className="form-label fw-semibold">Số căn hộ</label>
                                        <input type="number" min="1" className="form-control" name="apartmentNumber" value={formData.apartmentNumber} onChange={handleInputChange} required />
                                    </div>
                                    <div className="col-md-4">
                                        <label className="form-label fw-semibold">Trạng thái</label>
                                        <select className="form-select" name="status" value={formData.status} onChange={handleInputChange}>
                                            <option value={1}>Hoạt động</option>
                                            <option value={0}>Bảo trì</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer bg-light">
                                <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Hủy bỏ</button>
                                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                                    {isSubmitting ? 'Đang xử lý...' : (editId ? 'Lưu Thay Đổi' : 'Lưu Tòa Nhà')}
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