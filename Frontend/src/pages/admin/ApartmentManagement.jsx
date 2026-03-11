import React, { useState, useEffect } from 'react';
import api from '../../utils/axiosConfig';

const ApartmentManagement = () => {
    const [apartments, setApartments] = useState([]);
    const [buildings, setBuildings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editId, setEditId] = useState(null);

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
            const [aptRes, bldRes] = await Promise.all([
                api.get('/Apartments'),
                api.get('/Buildings')
            ]);

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
        if (window.confirm(`Bạn có chắc chắn muốn xóa căn hộ ${aptCode}?`)) {
            try {
                await api.delete(`/Apartments/${id}`);
                await fetchData();
                alert("Xóa thành công!");
            } catch (error) {
                const errorMessage = error.response?.data?.message || "Không thể xóa căn hộ lúc này.";
                alert("LỖI: " + errorMessage);
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
                                        <th>Số phòng</th>
                                        <th>Tầng</th>
                                        <th>Diện tích</th>
                                        <th>Trạng thái</th>
                                        <th>Hành động</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {apartments.map((apt, idx) => {
                                        const derivedRoomNumber = extractApartmentNumber(apt.apartmentCode);

                                        return (
                                            <tr key={apt.apartmentId}>
                                                <td>{idx + 1}</td>
                                                <td className="fw-bold text-primary">{apt.apartmentCode}</td>
                                                <td className="fw-semibold">{apt.apartmentName}</td>

                                                <td className="fw-semibold">{derivedRoomNumber}</td>

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
                                        );
                                    })}
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
                                    {/* Ẩn chọn tòa nhà và tầng khi Update */}
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

                                    {/* Ô nhập số phòng thay đổi gợi ý tùy theo chế độ Create / Update */}
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
        </div>
    );
};

export default ApartmentManagement;