import React, { useState, useEffect } from 'react';
import api from '../../utils/axiosConfig';

const ApartmentManagement = () => {
    const [apartments, setApartments] = useState([]);
    const [buildings, setBuildings] = useState([]); // State for buildings dropdown
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editId, setEditId] = useState(null);

    // Form state maps strictly to CreateApartmentDto requirements
    const initialFormState = {
        buildingId: '',
        apartmentCode: '',
        apartmentName: '',
        apartmentNumber: 0,
        floorNumber: 0,
        area: 0,
        status: 1
    };
    const [formData, setFormData] = useState(initialFormState);

    const fetchData = async () => {
        try {
            setLoading(true);

            // Fetch both apartments and buildings concurrently
            const [aptRes, bldRes] = await Promise.all([
                api.get('/Apartments'),
                api.get('/Buildings')
            ]);

            // Extract data safely to prevent crashes
            const aptList = aptRes.data.data ? aptRes.data.data : aptRes.data;
            const bldList = bldRes.data.data ? bldRes.data.data : bldRes.data;

            setApartments(Array.isArray(aptList) ? aptList : []);
            setBuildings(Array.isArray(bldList) ? bldList : []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        const numberFields = ['buildingId', 'apartmentNumber', 'floorNumber', 'area', 'status'];

        // Ensure numeric types for strict C# backend validation
        setFormData(prev => ({
            ...prev,
            [name]: numberFields.includes(name) ? Number(value) : value
        }));
    };

    const handleOpenModal = (apartment = null) => {
        if (apartment) {
            setEditId(apartment.apartmentId);
            setFormData({
                buildingId: apartment.buildingId || '',
                apartmentCode: apartment.apartmentCode || '',
                apartmentName: apartment.apartmentName || '',
                apartmentNumber: apartment.apartmentNumber || 0,
                floorNumber: apartment.floorNumber || 0,
                area: apartment.area || 0,
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
                // 1. Update general information (Name, Code, Area, etc.) via PUT
                await api.put(`/Apartments/${editId}`, formData);

                // 2. Update status specifically via PATCH since backend separates this logic
                await api.patch(`/Apartments/${editId}/status`, formData.status, {
                    headers: { 'Content-Type': 'application/json' }
                });

                alert("Cập nhật thành công!");
            } else {
                // Create new apartment via POST
                await api.post('/Apartments', formData);
                alert("Thêm căn hộ thành công!");
            }

            await fetchData();
            document.getElementById('closeAptModal').click();
        } catch (error) {
            console.error("API Error:", error.response?.data);
            alert(error.response?.data?.message || "Thao tác thất bại. Vui lòng kiểm tra lại thông tin nhập.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id, aptCode) => {
        if (window.confirm(`Bạn có chắc chắn muốn xóa căn hộ ${aptCode}?`)) {
            try {
                await api.delete(`/Apartments/${id}`);
                await fetchData();
            } catch (error) {
                alert("Không thể xóa căn hộ lúc này.");
            }
        }
    };

    return (
        <div className="container-fluid p-0">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="fw-bold mb-0">Quản lý Căn hộ</h2>
                <button className="btn btn-primary" onClick={() => handleOpenModal()} data-bs-toggle="modal" data-bs-target="#apartmentModal">
                    <i className="bi bi-plus-circle me-2"></i> Thêm Căn hộ
                </button>
            </div>

            <div className="card shadow-sm border-0">
                <div className="card-body p-0">
                    {loading ? (
                        <div className="text-center p-5"><div className="spinner-border text-primary"></div></div>
                    ) : apartments.length === 0 ? (
                        <div className="text-center p-5 text-muted">Chưa có dữ liệu căn hộ nào.</div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-hover table-bordered mb-0 align-middle text-center">
                                <thead className="table-light">
                                    <tr>
                                        <th>STT</th>
                                        <th>Mã Căn</th>
                                        <th>Tên Căn Hộ</th>
                                        <th>Tầng</th>
                                        <th>Diện tích</th>
                                        <th>Trạng thái</th>
                                        <th>Hành động</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {apartments.map((apt, idx) => (
                                        <tr key={apt.apartmentId}>
                                            <td>{idx + 1}</td>
                                            <td className="fw-bold text-primary">{apt.apartmentCode}</td>
                                            <td className="fw-semibold">{apt.apartmentName}</td>
                                            <td>{apt.floorNumber}</td>
                                            <td>{apt.area} m²</td>
                                            <td>
                                                <span className={`badge ${apt.status === 1 ? 'bg-success' : apt.status === 2 ? 'bg-warning text-dark' : 'bg-secondary'}`}>
                                                    {apt.status === 1 ? 'Trống' : apt.status === 2 ? 'Đang thuê' : 'Bảo trì'}
                                                </span>
                                            </td>
                                            <td>
                                                <button className="btn btn-sm btn-outline-warning me-2" onClick={() => handleOpenModal(apt)} data-bs-toggle="modal" data-bs-target="#apartmentModal">Sửa</button>
                                                <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(apt.apartmentId, apt.apartmentCode)}>Xóa</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
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
                                    {/* Re-added Building dropdown for POST request */}
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
                                        <label className="form-label fw-semibold">Mã Căn Hộ (VD: 12A05)</label>
                                        <input type="text" className="form-control" name="apartmentCode" value={formData.apartmentCode} onChange={handleInputChange} required />
                                    </div>
                                    <div className="col-md-12">
                                        <label className="form-label fw-semibold">Tên Căn Hộ</label>
                                        <input type="text" className="form-control" name="apartmentName" value={formData.apartmentName} onChange={handleInputChange} required placeholder="VD: Căn hộ cao cấp..." />
                                    </div>
                                    {/* Re-added ApartmentNumber for POST request */}
                                    <div className="col-md-3">
                                        <label className="form-label fw-semibold">Số phòng</label>
                                        <input type="number" min="1" className="form-control" name="apartmentNumber" value={formData.apartmentNumber} onChange={handleInputChange} required />
                                    </div>
                                    <div className="col-md-3">
                                        <label className="form-label fw-semibold">Tầng</label>
                                        <input type="number" min="1" className="form-control" name="floorNumber" value={formData.floorNumber} onChange={handleInputChange} required />
                                    </div>
                                    <div className="col-md-3">
                                        <label className="form-label fw-semibold">Diện tích (m²)</label>
                                        <input type="number" min="1" step="0.1" className="form-control" name="area" value={formData.area} onChange={handleInputChange} required />
                                    </div>
                                    <div className="col-md-3">
                                        <label className="form-label fw-semibold">Trạng thái</label>
                                        <select className="form-select" name="status" value={formData.status} onChange={handleInputChange}>
                                            <option value={1}>Trống</option>
                                            <option value={2}>Đang thuê</option>
                                            <option value={3}>Bảo trì</option>
                                        </select>
                                    </div>
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
        </div>
    );
};

export default ApartmentManagement;