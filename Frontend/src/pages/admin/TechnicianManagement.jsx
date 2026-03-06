import React, { useState, useEffect } from 'react';
import api from '../../utils/axiosConfig';

const TechnicianManagement = () => {
    const [technicians, setTechnicians] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editId, setEditId] = useState(null);

    // Form state chỉ giữ lại các trường có thể cập nhật cho Technician
    const [formData, setFormData] = useState({
        fullName: '',
        phoneNumber: '',
        techAvailability: 1 // 1: Sẵn sàng, 0: Bận
    });

    const fetchTechnicians = async () => {
        try {
            setLoading(true);
            const response = await api.get('/Technicians');
            // Truy xuất đúng mảng dữ liệu từ ApiResponse
            const remoteData = response.data.data || [];
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
        setFormData(prev => ({
            ...prev,
            [name]: name === 'techAvailability' ? Number(value) : value
        }));
    };

    const handleOpenEditModal = (tech) => {
        // Sử dụng accountId làm định danh duy nhất
        setEditId(tech.accountId);
        setFormData({
            fullName: tech.fullName || '',
            phoneNumber: tech.phoneNumber || '',
            techAvailability: tech.techAvailability ?? 1
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            // PUT /api/Technicians/{id} - Cập nhật hồ sơ kỹ thuật viên
            await api.put(`/Technicians/${editId}`, formData);
            alert("Cập nhật thông tin thành công!");
            await fetchTechnicians();
            document.getElementById('closeTechModal').click();
        } catch (error) {
            console.error("Lỗi cập nhật:", error.response?.data);
            alert(error.response?.data?.message || "Không thể cập nhật thông tin.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id, name) => {
        if (window.confirm(`Xác nhận xóa kỹ thuật viên ${name}? Thao tác này có thể ảnh hưởng đến lịch trực.`)) {
            try {
                // DELETE /api/Technicians/{id}
                await api.delete(`/Technicians/${id}`);
                alert("Đã xóa kỹ thuật viên.");
                await fetchTechnicians();
            } catch (error) {
                alert("Xóa thất bại. Kỹ thuật viên có thể đang tham gia sửa chữa.");
            }
        }
    };

    return (
        <div className="container-fluid p-0">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="fw-bold mb-0">Hồ sơ Kỹ thuật viên</h2>
                <div className="text-muted small">Quản lý trạng thái và thông tin liên lạc</div>
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
                                        <th>STT</th>
                                        <th>Họ và Tên</th>
                                        <th>Số điện thoại</th>
                                        <th>Email tài khoản</th>
                                        <th>Trạng thái</th>
                                        <th>Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {technicians.length > 0 ? (
                                        technicians.map((t, idx) => (
                                            <tr key={t.accountId || idx}>
                                                <td>{idx + 1}</td>
                                                <td className="fw-bold text-primary text-start ps-4">{t.fullName}</td>
                                                <td>{t.phoneNumber}</td>
                                                <td className="text-muted">{t.email}</td>
                                                <td>
                                                    <span className={`badge rounded-pill ${t.techAvailability === 1 ? 'bg-success' : 'bg-danger'}`}>
                                                        {t.techAvailability === 1 ? 'Sẵn sàng' : 'Bận'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <button
                                                        className="btn btn-sm btn-outline-warning me-2"
                                                        onClick={() => handleOpenEditModal(t)}
                                                        data-bs-toggle="modal"
                                                        data-bs-target="#editTechModal"
                                                    >
                                                        Sửa
                                                    </button>
                                                    <button
                                                        className="btn btn-sm btn-outline-danger"
                                                        onClick={() => handleDelete(t.accountId, t.fullName)}
                                                    >
                                                        Xóa
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr><td colSpan="6" className="p-5 text-muted">Chưa có dữ liệu kỹ thuật viên được liên kết.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal chỉnh sửa duy nhất */}
            <div className="modal fade" id="editTechModal" tabIndex="-1" aria-hidden="true">
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content border-0">
                        <div className="modal-header bg-dark text-white">
                            <h5 className="modal-title fw-bold">Chỉnh Sửa Hồ Sơ</h5>
                            <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal" id="closeTechModal"></button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body p-4 text-start">
                                <div className="mb-3">
                                    <label className="form-label fw-bold small">Họ và Tên</label>
                                    <input type="text" className="form-control" name="fullName" value={formData.fullName} onChange={handleInputChange} required />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label fw-bold small">Số điện thoại</label>
                                    <input type="text" className="form-control" name="phoneNumber" value={formData.phoneNumber} onChange={handleInputChange} required />
                                </div>
                                <div className="mb-0">
                                    <label className="form-label fw-bold small">Trạng thái làm việc</label>
                                    <select className="form-select" name="techAvailability" value={formData.techAvailability} onChange={handleInputChange}>
                                        <option value={1}>Sẵn sàng trực</option>
                                        <option value={0}>Đang bận công tác</option>
                                    </select>
                                </div>
                            </div>
                            <div className="modal-footer bg-light">
                                <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Hủy</button>
                                <button type="submit" className="btn btn-primary px-4" disabled={isSubmitting}>
                                    {isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
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