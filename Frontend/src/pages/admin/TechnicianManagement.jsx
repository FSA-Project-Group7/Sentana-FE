import React, { useState, useEffect } from 'react';
import api from '../../utils/axiosConfig';

const TechnicianManagement = () => {
    const [technicians, setTechnicians] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editId, setEditId] = useState(null);

    // Form state bao quát toàn bộ các trường mà DTO Backend yêu cầu
    const initialFormState = {
        userName: '',
        password: '', // Chỉ bắt buộc khi thêm mới
        fullName: '',
        email: '',
        phoneNumber: '',
        identityCard: '',
        country: 'Việt Nam',
        city: '',
        address: ''
    };
    const [formData, setFormData] = useState(initialFormState);

    const fetchTechnicians = async () => {
        try {
            setLoading(true);
            const response = await api.get('/Technicians');
            const remoteData = response.data.data ? response.data.data : response.data;
            setTechnicians(Array.isArray(remoteData) ? remoteData : []);
        } catch (error) {
            console.error("Lỗi tải danh sách:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTechnicians();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Dùng chung 1 Modal cho cả Thêm mới và Sửa
    const handleOpenModal = (tech = null) => {
        if (tech) {
            setEditId(tech.accountId);
            setFormData({
                userName: tech.userName || '',
                password: '', // Không gửi lại password khi update
                fullName: tech.fullName || '',
                email: tech.email || '',
                phoneNumber: tech.phoneNumber || '',
                identityCard: tech.identityCard || '',
                country: tech.country || 'Việt Nam',
                city: tech.city || '',
                address: tech.address || ''
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
                // SỬA: Gọi đúng đường dẫn UpdateTechnician của BE
                await api.put(`/Technicians/UpdateTechnician/${editId}`, {
                    ...formData,
                    isDeleted: false // Mặc định truyền thêm isDeleted theo DTO
                });
                alert("Cập nhật thông tin thành công!");
            } else {
                // THÊM MỚI: Gọi đúng đường dẫn CreateTechnician của BE
                await api.post('/Technicians/CreateTechnician', formData);
                alert("Tạo tài khoản Kỹ thuật viên thành công!");
            }
            await fetchTechnicians();
            document.getElementById('closeTechModal').click();
        } catch (error) {
            console.error("Lỗi API chi tiết:", error.response?.data);

            let errorMessage = "Vui lòng kiểm tra lại thông tin nhập.";
            const responseData = error.response?.data;

            if (responseData) {
                // Trường hợp 1: Lỗi do Validation Regex của .NET Core tự động chặn (Nằm trong object 'errors')
                if (responseData.errors) {
                    const firstErrorKey = Object.keys(responseData.errors)[0];
                    errorMessage = responseData.errors[firstErrorKey][0];
                }
                // Trường hợp 2: Lỗi logic do code BE ném ra (Nằm trong thuộc tính 'message' của ApiResponse)
                else if (responseData.message) {
                    errorMessage = responseData.message;
                }
            }

            alert("LỖI: " + errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleToggleStatus = async (id) => {
        try {
            await api.put(`/Technicians/toggleStatus/${id}`);
            // Gọi lại API để cập nhật bảng ngay lập tức
            await fetchTechnicians();
        } catch (error) {
            alert("LỖI: " + (error.response?.data?.message || "Thao tác thất bại."));
        }
    };

    const handleToggleAvailability = async (id) => {
        try {
            const res = await api.put(`/Technicians/toggleAvailability/${id}`);
            // Không cần alert để trải nghiệm bấm mượt mà hơn, chỉ cần load lại data
            await fetchTechnicians();
        } catch (error) {
            alert("LỖI: " + (error.response?.data?.message || "Không thể đổi tình trạng."));
        }
    };

    const handleDelete = async (id, name) => {
        if (window.confirm(`Xác nhận xóa kỹ thuật viên ${name} khỏi hệ thống?`)) {
            try {
                // SỬA: Gọi đúng đường dẫn DeleteTechnician của BE
                const res = await api.delete(`/Technicians/DeleteTechnician/${id}`);
                alert(res.data.message || "Đã xóa kỹ thuật viên thành công.");
                await fetchTechnicians();
            } catch (error) {
                alert("LỖI: " + (error.response?.data?.message || "Xóa thất bại. Kỹ thuật viên có thể đang tham gia sửa chữa."));
            }
        }
    };

    return (
        <div className="container-fluid p-0">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="fw-bold mb-0">Hồ sơ Kỹ thuật viên</h2>
                    <div className="text-muted small">Quản lý tài khoản, trạng thái và thông tin liên lạc</div>
                </div>
                {/* Thêm nút Thêm Mới */}
                <button className="btn btn-primary" onClick={() => handleOpenModal()} data-bs-toggle="modal" data-bs-target="#techModal">
                    <i className="bi bi-person-plus-fill me-2"></i> Thêm Kỹ Thuật Viên
                </button>
            </div>

            <div className="card shadow-sm border-0">
                <div className="card-body p-0">
                    {loading ? (
                        <div className="text-center p-5"><div className="spinner-border text-primary"></div></div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-hover table-bordered mb-0 align-middle text-center">
                                <thead className="table-light small fw-bold text-uppercase">
                                    <tr>
                                        <th>Mã TECH</th>
                                        <th>Họ và Tên</th>
                                        <th>Liên hệ</th>
                                        <th>CCCD</th>
                                        <th>Tình trạng việc</th>
                                        <th>Tài khoản</th>
                                        <th>Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {technicians.length > 0 ? (
                                        technicians.map((t) => (
                                            <tr key={t.accountId}>
                                                <td className="fw-bold text-secondary">{t.code || 'N/A'}</td>
                                                <td className="fw-bold text-primary text-start ps-3">{t.fullName}</td>
                                                <td className="text-start">
                                                    <div><i className="bi bi-telephone-fill text-success me-1"></i> {t.phoneNumber}</div>
                                                    <div><i className="bi bi-envelope-fill text-muted me-1"></i> {t.email}</div>
                                                </td>
                                                <td>{t.identityCard}</td>
                                                <td>
                                                    <button
                                                        type="button"
                                                        className={`btn btn-sm rounded-pill fw-bold ${t.techAvailability === 1 ? 'btn-info text-dark' : 'btn-warning text-dark'}`}
                                                        onClick={() => handleToggleAvailability(t.accountId)}
                                                        title="Nhấn để đổi trạng thái nhanh"
                                                        style={{ minWidth: '90px' }}
                                                    >
                                                        {t.techAvailability === 1 ? 'Rảnh rỗi' : 'Đang bận'}
                                                    </button>
                                                </td>
                                                <td>
                                                    <button
                                                        type="button"
                                                        className={`btn btn-sm rounded-pill fw-bold text-white ${t.status === 1 ? 'btn-success' : 'btn-danger'}`}
                                                        onClick={() => handleToggleStatus(t.accountId)}
                                                        title="Nhấn để Khóa/Mở khóa tài khoản"
                                                        style={{ minWidth: '90px' }}
                                                    >
                                                        {t.status === 1 ? 'Hoạt động' : 'Đã khóa'}
                                                    </button>
                                                </td>
                                                <td>
                                                    <button className="btn btn-sm btn-outline-warning me-2 mb-1" title="Sửa thông tin" onClick={() => handleOpenModal(t)} data-bs-toggle="modal" data-bs-target="#techModal">
                                                        Sửa
                                                    </button>
                                                    <button className="btn btn-sm btn-outline-danger mb-1" title="Xóa" onClick={() => handleDelete(t.accountId, t.fullName)}>
                                                        Xóa
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr><td colSpan="7" className="p-5 text-muted">Chưa có dữ liệu kỹ thuật viên được liên kết.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* MODAL DÙNG CHUNG CHO THÊM VÀ SỬA */}
            <div className="modal fade" id="techModal" tabIndex="-1" aria-hidden="true">
                <div className="modal-dialog modal-lg modal-dialog-centered">
                    <div className="modal-content border-0">
                        <div className="modal-header text-white" style={{ backgroundColor: '#122240' }}>
                            <h5 className="modal-title fw-bold">{editId ? 'Chỉnh Sửa Hồ Sơ' : 'Thêm Kỹ Thuật Viên Mới'}</h5>
                            <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal" id="closeTechModal"></button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body p-4 text-start">
                                <div className="row g-3">
                                    <div className="col-md-6">
                                        <label className="form-label fw-bold small">Tên đăng nhập (*)</label>
                                        <input type="text" className="form-control" name="userName" value={formData.userName} onChange={handleInputChange} required disabled={!!editId} />
                                    </div>
                                    {!editId && (
                                        <div className="col-md-6">
                                            <label className="form-label fw-bold small">Mật khẩu khởi tạo (*)</label>
                                            <input type="password" className="form-control" name="password" value={formData.password} onChange={handleInputChange} required />
                                        </div>
                                    )}
                                    <div className="col-md-12">
                                        <label className="form-label fw-bold small">Họ và Tên (*)</label>
                                        <input type="text" className="form-control" name="fullName" value={formData.fullName} onChange={handleInputChange} required />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label fw-bold small">Email liên hệ (*)</label>
                                        <input type="email" className="form-control" name="email" value={formData.email} onChange={handleInputChange} required />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label fw-bold small">Số điện thoại (*)</label>
                                        <input type="text" className="form-control" name="phoneNumber" value={formData.phoneNumber} onChange={handleInputChange} required />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label fw-bold small">Số CCCD (*)</label>
                                        <input type="text" className="form-control" name="identityCard" value={formData.identityCard} onChange={handleInputChange} required />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label fw-bold small">Tỉnh / Thành phố</label>
                                        <input type="text" className="form-control" name="city" value={formData.city} onChange={handleInputChange} />
                                    </div>
                                    <div className="col-md-12">
                                        <label className="form-label fw-bold small">Địa chỉ thường trú</label>
                                        <input type="text" className="form-control" name="address" value={formData.address} onChange={handleInputChange} />
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer bg-light">
                                <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Hủy</button>
                                <button type="submit" className="btn btn-primary px-4" disabled={isSubmitting}>
                                    {isSubmitting ? 'Đang xử lý...' : 'Lưu thông tin'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TechnicianManagement;