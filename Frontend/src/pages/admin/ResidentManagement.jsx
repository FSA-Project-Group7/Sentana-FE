import React, { useState, useEffect } from 'react';
import api from '../../utils/axiosConfig';

const ResidentManagement = () => {
    const [residents, setResidents] = useState([]);
    const [apartments, setApartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editId, setEditId] = useState(null);

    // Form cho việc Thêm/Sửa thông tin cá nhân Cư dân
    const initialFormState = {
        userName: '',
        password: '', // Chỉ bắt buộc khi tạo mới
        fullName: '',
        email: '',
        phoneNumber: '',
        identityCard: '',
        country: 'Việt Nam',
        city: 'Hà Nội',
        address: ''
    };
    const [formData, setFormData] = useState(initialFormState);

    // Form cho việc Gán phòng (Assign Room)
    const initialAssignState = {
        residentId: '',
        apartmentId: '',
        relationshipId: 1 // Mặc định 1: Chủ hộ
    };
    const [assignData, setAssignData] = useState(initialAssignState);
    const [selectedResidentName, setSelectedResidentName] = useState("");

    // Hàm lấy dữ liệu Cư dân và Danh sách phòng (để xổ xuống chọn khi Gán)
    const fetchData = async () => {
        try {
            setLoading(true);
            const [resRes, aptRes] = await Promise.all([
                api.get('/Residents'),
                api.get('/Apartments')
            ]);

            // Xử lý an toàn dữ liệu trả về từ ApiResponse của BE
            const resList = resRes.data.data ? resRes.data.data : resRes.data;
            const aptList = aptRes.data.data ? aptRes.data.data : aptRes.data;

            setResidents(Array.isArray(resList) ? resList : []);
            setApartments(Array.isArray(aptList) ? aptList : []);
        } catch (error) {
            console.error("Lỗi khi tải dữ liệu:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Xử lý thay đổi input cho Form Thêm/Sửa Cư dân
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Xử lý thay đổi input cho Form Gán phòng
    const handleAssignChange = (e) => {
        const { name, value } = e.target;
        setAssignData(prev => ({ ...prev, [name]: Number(value) }));
    };

    // Mở Modal Thêm / Sửa thông tin Cư dân
    const handleOpenModal = (resident = null) => {
        if (resident) {
            setEditId(resident.accountId);
            setFormData({
                userName: resident.userName || '',
                password: '', // Khi sửa thường không trả về password
                fullName: resident.fullName || '',
                email: resident.email || '',
                phoneNumber: resident.phoneNumber || '',
                identityCard: resident.identityCard || '',
                country: resident.country || 'Việt Nam',
                city: resident.city || '',
                address: resident.address || ''
            });
        } else {
            setEditId(null);
            setFormData(initialFormState);
        }
    };

    // Mở Modal Gán Phòng
    const handleOpenAssignModal = (resident) => {
        setSelectedResidentName(resident.fullName || resident.userName);
        setAssignData({
            residentId: resident.accountId,
            apartmentId: '',
            relationshipId: 1
        });
    };

    // Submit API: Thêm hoặc Sửa Cư Dân
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (editId) {
                // Sửa cư dân
                await api.put(`/Residents/${editId}`, formData);
                alert("Cập nhật thông tin cư dân thành công!");
            } else {
                // Thêm cư dân mới
                await api.post('/Residents', formData);
                alert("Tạo tài khoản cư dân thành công!");
            }
            await fetchData();
            document.getElementById('closeResidentModal').click();
        } catch (error) {
            const errorMessage = error.response?.data?.message || "Thao tác thất bại. Vui lòng kiểm tra lại.";
            alert("LỖI: " + errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Submit API: Gán Cư dân vào Phòng
    const handleAssignSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await api.post('/Residents/assign-room', assignData);
            alert("Đã gán cư dân vào phòng thành công!");
            await fetchData(); // Load lại để thấy danh sách phòng hiển thị
            document.getElementById('closeAssignModal').click();
        } catch (error) {
            const errorMessage = error.response?.data?.message || "Lỗi khi gán phòng.";
            alert("LỖI: " + errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="container-fluid p-0">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="fw-bold mb-0">Quản lý Cư Dân</h2>
                <button className="btn btn-primary" onClick={() => handleOpenModal()} data-bs-toggle="modal" data-bs-target="#residentModal">
                    <i className="bi bi-person-plus-fill me-2"></i> Thêm Cư Dân
                </button>
            </div>

            <div className="card shadow-sm border-0">
                <div className="card-body p-0">
                    {loading ? (
                        <div className="text-center p-5"><div className="spinner-border text-primary"></div></div>
                    ) : residents.length === 0 ? (
                        <div className="text-center p-5 text-muted">Chưa có dữ liệu cư dân nào trong hệ thống.</div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-hover table-bordered mb-0 align-middle text-center">
                                <thead className="table-light">
                                    <tr>
                                        <th>STT</th>
                                        <th>Mã Cư Dân</th>
                                        <th>Họ & Tên</th>
                                        <th>SĐT / Email</th>
                                        <th>CCCD</th>
                                        <th>Căn hộ đang ở</th>
                                        <th>Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {residents.map((res, idx) => (
                                        <tr key={res.accountId}>
                                            <td>{idx + 1}</td>
                                            <td className="fw-bold text-primary">{res.code || 'N/A'}</td>
                                            <td className="fw-semibold text-start">{res.fullName || res.userName}</td>
                                            <td className="text-start">
                                                <div><i className="bi bi-telephone-fill text-success me-1"></i> {res.phoneNumber}</div>
                                                <div><i className="bi bi-envelope-fill text-secondary me-1"></i> {res.email}</div>
                                            </td>
                                            <td>{res.identityCard}</td>
                                            <td className="text-start">
                                                {/* Hiển thị các phòng cư dân đang ở nếu có */}
                                                {res.apartments && res.apartments.length > 0 ? (
                                                    res.apartments.map((apt, i) => (
                                                        <span key={i} className="badge bg-info text-dark me-1 mb-1 border border-secondary">
                                                            {apt.apartmentCode}
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span className="text-muted fst-italic">Chưa có phòng</span>
                                                )}
                                            </td>
                                            <td>
                                                <button className="btn btn-sm btn-outline-warning me-2 mb-1" title="Sửa thông tin" onClick={() => handleOpenModal(res)} data-bs-toggle="modal" data-bs-target="#residentModal">
                                                    Sửa
                                                </button>
                                                <button className="btn btn-sm btn-outline-success mb-1" title="Gán vào căn hộ" onClick={() => handleOpenAssignModal(res)} data-bs-toggle="modal" data-bs-target="#assignRoomModal">
                                                    Gán Phòng
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

            {/* MODAL 1: THÊM / SỬA CƯ DÂN */}
            <div className="modal fade" id="residentModal" tabIndex="-1" aria-hidden="true">
                <div className="modal-dialog modal-lg">
                    <div className="modal-content">
                        <div className="modal-header text-white" style={{ backgroundColor: '#122240' }}>
                            <h5 className="modal-title fw-bold">{editId ? 'Cập Nhật Cư Dân' : 'Thêm Cư Dân Mới'}</h5>
                            <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal" id="closeResidentModal"></button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="row g-3">
                                    <div className="col-md-6">
                                        <label className="form-label fw-semibold">Tên Đăng Nhập (*)</label>
                                        <input type="text" className="form-control" name="userName" value={formData.userName} onChange={handleInputChange} required disabled={!!editId} />
                                    </div>
                                    {!editId && (
                                        <div className="col-md-6">
                                            <label className="form-label fw-semibold">Mật khẩu (*)</label>
                                            <input type="password" className="form-control" name="password" value={formData.password} onChange={handleInputChange} required />
                                        </div>
                                    )}
                                    <div className="col-md-12">
                                        <label className="form-label fw-semibold">Họ và Tên (*)</label>
                                        <input type="text" className="form-control" name="fullName" value={formData.fullName} onChange={handleInputChange} required />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label fw-semibold">Email (*)</label>
                                        <input type="email" className="form-control" name="email" value={formData.email} onChange={handleInputChange} required />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label fw-semibold">Số điện thoại (*)</label>
                                        <input type="text" className="form-control" name="phoneNumber" value={formData.phoneNumber} onChange={handleInputChange} required />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label fw-semibold">Số CCCD (*)</label>
                                        <input type="text" className="form-control" name="identityCard" value={formData.identityCard} onChange={handleInputChange} required />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label fw-semibold">Tỉnh/Thành phố</label>
                                        <input type="text" className="form-control" name="city" value={formData.city} onChange={handleInputChange} />
                                    </div>
                                    <div className="col-md-12">
                                        <label className="form-label fw-semibold">Địa chỉ thường trú</label>
                                        <input type="text" className="form-control" name="address" value={formData.address} onChange={handleInputChange} />
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer bg-light">
                                <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Hủy</button>
                                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                                    {isSubmitting ? 'Đang lưu...' : 'Lưu Thay Đổi'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            {/* MODAL 2: GÁN PHÒNG (ASSIGN ROOM) */}
            <div className="modal fade" id="assignRoomModal" tabIndex="-1" aria-hidden="true">
                <div className="modal-dialog">
                    <div className="modal-content">
                        <div className="modal-header bg-success text-white">
                            <h5 className="modal-title fw-bold">Gán Căn Hộ Cho Cư Dân</h5>
                            <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal" id="closeAssignModal"></button>
                        </div>
                        <form onSubmit={handleAssignSubmit}>
                            <div className="modal-body">
                                <p>Đang thao tác cho cư dân: <strong className="text-primary">{selectedResidentName}</strong></p>

                                <div className="mb-3">
                                    <label className="form-label fw-semibold">Chọn Căn Hộ</label>
                                    <select className="form-select border-success" name="apartmentId" value={assignData.apartmentId} onChange={handleAssignChange} required>
                                        <option value="" disabled>-- Vui lòng chọn --</option>
                                        {apartments.map(apt => (
                                            <option key={apt.apartmentId} value={apt.apartmentId}>
                                                {apt.apartmentName} ({apt.apartmentCode}) - {apt.area} m²
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="mb-3">
                                    <label className="form-label fw-semibold">Vai trò / Quan hệ</label>
                                    <select className="form-select" name="relationshipId" value={assignData.relationshipId} onChange={handleAssignChange} required>
                                        <option value={1}>Chủ hộ</option>
                                        <option value={2}>Vợ / Chồng</option>
                                        <option value={3}>Con cái</option>
                                        <option value={4}>Khách thuê</option>
                                        <option value={5}>Khác</option>
                                    </select>
                                    <small className="text-muted mt-1 d-block">(*) Hệ thống cần thông tin này để thiết lập quyền lợi tiện ích cho cư dân.</small>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Hủy</button>
                                <button type="submit" className="btn btn-success" disabled={isSubmitting}>
                                    {isSubmitting ? 'Đang xử lý...' : 'Xác nhận Gán Phòng'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default ResidentManagement;