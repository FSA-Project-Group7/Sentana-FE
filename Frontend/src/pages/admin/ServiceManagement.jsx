import React, { useState, useEffect } from 'react';
import api from '../../utils/axiosConfig';

const ServiceManagement = () => {
    // TABS
    const [activeTab, setActiveTab] = useState('active'); // 'active' hoặc 'deleted'

    // DATA STATES
    const [services, setServices] = useState([]);
    const [deletedServices, setDeletedServices] = useState([]);
    const [loading, setLoading] = useState(false);

    // FORM STATES
    const initialForm = { serviceName: '', description: '', serviceFee: '' };
    const [formData, setFormData] = useState(initialForm);
    const [editingId, setEditingId] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // FETCH DATA
    const fetchServices = async () => {
        setLoading(true);
        try {
            if (activeTab === 'active') {
                const res = await api.get('/Service');
                setServices(res.data || []);
            } else {
                const res = await api.get('/Service/deleted');
                setDeletedServices(res.data || []);
            }
        } catch (error) {
            console.error("Lỗi:", error);
            activeTab === 'active' ? setServices([]) : setDeletedServices([]);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchServices();
    }, [activeTab]);

    const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    // SUBMIT FORM (CREATE / UPDATE)
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const payload = {
                serviceName: formData.serviceName,
                description: formData.description,
                serviceFee: Number(formData.serviceFee),
                status: 1
            };

            if (editingId) {
                await api.put(`/Service/${editingId}`, payload);
                alert("Cập nhật thành công!");
            } else {
                await api.post('/Service', payload);
                alert("Thêm mới thành công!");
            }

            document.getElementById('closeServiceModal').click();
            fetchServices();
        } catch (error) {
            alert("Lỗi: " + (error.response?.data?.message || "Có lỗi xảy ra"));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditClick = (srv) => {
        setEditingId(srv.serviceId);
        setFormData({ serviceName: srv.serviceName, description: srv.description, serviceFee: srv.serviceFee });
    };

    const handleOpenCreate = () => {
        setEditingId(null);
        setFormData(initialForm);
    };

    // NGHIỆP VỤ XÓA / KHÔI PHỤC
    const handleSoftDelete = async (id) => {
        if (!window.confirm("CẢNH BÁO: Xóa dịch vụ này sẽ TỰ ĐỘNG GỠ nó khỏi toàn bộ các căn hộ đang sử dụng. Bạn có chắc chắn?")) return;
        try {
            await api.delete(`/Service/${id}`);
            alert("Đã ngừng cung cấp dịch vụ!");
            fetchServices();
        } catch (error) {
            alert("Lỗi: " + (error.response?.data?.message || "Không thể xóa"));
        }
    };

    const handleRestore = async (id) => {
        try {
            await api.put(`/Service/${id}/restore`);
            alert("Đã khôi phục dịch vụ!");
            fetchServices();
        } catch (error) {
            alert("Lỗi: " + (error.response?.data?.message || "Không thể khôi phục"));
        }
    };

    const handleHardDelete = async (id) => {
        if (!window.confirm("CẢNH BÁO NGUY HIỂM: Hành động này sẽ xóa vĩnh viễn dữ liệu và không thể hoàn tác. Tiếp tục?")) return;
        try {
            const res = await api.delete(`/Service/${id}/hard`);
            alert(res.data?.message || "Xóa vĩnh viễn thành công!");
            fetchServices();
        } catch (error) {
            alert("KHÔNG THỂ XÓA: " + (error.response?.data?.message || "Có lỗi xảy ra"));
        }
    };

    return (
        <div className="container-fluid p-0">
            {/* Header & Tabs */}
            <div className="d-flex justify-content-between align-items-end mb-4 border-bottom pb-3">
                <div>
                    <h2 className="fw-bold mb-3 text-primary">Quản lý Dịch vụ Tòa nhà</h2>
                    <ul className="nav nav-pills">
                        <li className="nav-item me-2">
                            <button className={`nav-link fw-semibold ${activeTab === 'active' ? 'active bg-primary' : 'bg-light text-dark'}`} onClick={() => setActiveTab('active')}>
                                <i className="bi bi-list-check me-2"></i>Đang hoạt động
                            </button>
                        </li>
                        <li className="nav-item">
                            <button className={`nav-link fw-semibold ${activeTab === 'deleted' ? 'active bg-danger' : 'bg-light text-dark'}`} onClick={() => setActiveTab('deleted')}>
                                <i className="bi bi-trash3-fill me-2"></i>Đã ngừng cấp
                            </button>
                        </li>
                    </ul>
                </div>
                {activeTab === 'active' && (
                    <button className="btn btn-primary fw-bold" onClick={handleOpenCreate} data-bs-toggle="modal" data-bs-target="#serviceModal">
                        <i className="bi bi-plus-lg me-2"></i>Thêm Dịch Vụ Mới
                    </button>
                )}
            </div>

            {/* Bảng Dữ Liệu */}
            <div className="card shadow-sm border-0">
                <div className="card-body p-0">
                    {loading ? (
                        <div className="text-center p-5"><div className="spinner-border text-primary"></div></div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-hover align-middle text-center mb-0">
                                <thead className="table-light text-muted">
                                    <tr>
                                        <th>ID</th>
                                        <th className="text-start">Tên Dịch Vụ</th>
                                        <th className="text-start">Mô Tả</th>
                                        <th>Đơn Giá (Mặc định)</th>
                                        <th>Trạng Thái</th>
                                        <th>Hành Động</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(activeTab === 'active' ? services : deletedServices).map((srv) => (
                                        <tr key={srv.serviceId}>
                                            <td className="fw-bold text-muted">#{srv.serviceId}</td>
                                            <td className="text-start fw-semibold text-primary">{srv.serviceName}</td>
                                            <td className="text-start small text-muted" style={{ maxWidth: '300px' }}>{srv.description}</td>
                                            <td className="fw-bold text-danger">{srv.serviceFee?.toLocaleString()} đ</td>
                                            <td>
                                                {activeTab === 'active' ? (
                                                    <span className="badge bg-success">Đang cấp</span>
                                                ) : (
                                                    <span className="badge bg-secondary">Ngừng cấp</span>
                                                )}
                                            </td>
                                            <td>
                                                {activeTab === 'active' ? (
                                                    <>
                                                        <button className="btn btn-sm btn-outline-info me-2 fw-semibold" onClick={() => handleEditClick(srv)} data-bs-toggle="modal" data-bs-target="#serviceModal">
                                                            <i className="bi bi-pencil-square me-1"></i>Sửa
                                                        </button>
                                                        <button className="btn btn-sm btn-outline-danger fw-semibold" onClick={() => handleSoftDelete(srv.serviceId)}>
                                                            <i className="bi bi-trash me-1"></i>Ngừng cấp
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button className="btn btn-sm btn-outline-success me-2 fw-semibold" onClick={() => handleRestore(srv.serviceId)}>
                                                            <i className="bi bi-arrow-counterclockwise me-1"></i>Khôi phục
                                                        </button>
                                                        <button className="btn btn-sm btn-danger fw-semibold" onClick={() => handleHardDelete(srv.serviceId)}>
                                                            <i className="bi bi-x-circle me-1"></i>Xóa cứng
                                                        </button>
                                                    </>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {(activeTab === 'active' ? services : deletedServices).length === 0 && (
                                        <tr><td colSpan="6" className="text-center py-4 text-muted">Chưa có dữ liệu.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal Thêm/Sửa */}
            <div className="modal fade" id="serviceModal" tabIndex="-1">
                <div className="modal-dialog">
                    <div className="modal-content">
                        <div className="modal-header bg-primary text-white">
                            <h5 className="modal-title fw-bold">{editingId ? 'Cập Nhật Dịch Vụ' : 'Thêm Dịch Vụ Mới'}</h5>
                            <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal" id="closeServiceModal"></button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="mb-3">
                                    <label className="form-label fw-semibold">Tên dịch vụ (*)</label>
                                    <input type="text" className="form-control" name="serviceName" value={formData.serviceName} onChange={handleInputChange} required />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label fw-semibold">Mô tả</label>
                                    <textarea className="form-control" name="description" rows="3" value={formData.description} onChange={handleInputChange}></textarea>
                                </div>
                                <div className="mb-3">
                                    <label className="form-label fw-semibold">Phí dịch vụ mặc định (VNĐ) (*)</label>
                                    <input type="number" className="form-control" name="serviceFee" value={formData.serviceFee} onChange={handleInputChange} min="0" required />
                                </div>
                            </div>
                            <div className="modal-footer bg-light">
                                <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Hủy</button>
                                <button type="submit" className="btn btn-primary fw-bold" disabled={isSubmitting}>
                                    {isSubmitting ? 'Đang lưu...' : (editingId ? 'Lưu thay đổi' : 'Tạo mới')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ServiceManagement;