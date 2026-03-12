import React, { useState, useEffect } from 'react';
import api from '../../utils/axiosConfig';

const ServiceManagement = () => {
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);

    
    const [showForm, setShowForm] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [currentId, setCurrentId] = useState(null);
    const [formData, setFormData] = useState({
        serviceName: '',
        description: '',
        serviceFee: '',
        status: 1 
    });

    
    const fetchServices = async () => {
        try {
            setLoading(true);
            const response = await api.get('/Service');
            const data = response.data.data || response.data || [];
            setServices(data);
        } catch (error) {
            console.error("Lỗi lấy dữ liệu dịch vụ:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchServices();
    }, []);

    const handleDelete = async (id) => {
        
        if (!id) {
            alert("Không tìm thấy ID dịch vụ hợp lệ!");
            return;
        }

        if (window.confirm("Bạn có chắc chắn muốn xóa (vô hiệu hóa) dịch vụ này không?")) {
            try {
                await api.delete(`/Service/${id}`);
                alert("Xóa dịch vụ thành công!");
                fetchServices(); 
            } catch (error) {
                console.error("Lỗi xóa dịch vụ:", error);

                
                const errorMessage = error.response?.data?.message || "Đã xảy ra lỗi hệ thống!";

                if (errorMessage === "Service is already inactive.") {
                    alert("Dịch vụ này đã ngừng hoạt động từ trước rồi!");
                } else {
                    alert(`Lỗi: ${errorMessage}`);
                }
            }
        }
    };

    
    const handleShowAdd = () => {
        setIsEdit(false);
        setFormData({ serviceName: '', description: '', serviceFee: '', status: 1 });
        setShowForm(true);
    };

    const handleShowEdit = (svc) => {
        setIsEdit(true);
        setCurrentId(svc.serviceId || svc.ServiceId);
        setFormData({
            serviceName: svc.serviceName || svc.ServiceName || '',
            description: svc.description || svc.Description || '',
            serviceFee: svc.serviceFee ?? svc.ServiceFee ?? '',
            status: svc.status ?? svc.Status ?? 1
        });
        setShowForm(true);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;

        
        let parsedValue = value;
        if (name === 'status') {
            parsedValue = parseInt(value, 10);
        } else if (name === 'serviceFee') {
            
            parsedValue = value ? Number(value) : '';
        }

        setFormData({ ...formData, [name]: parsedValue });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (isEdit) {
                
                await api.put(`/Service/${currentId}`, formData);
                alert("Cập nhật thành công!");
            } else {
                await api.post('/Service', formData);
                alert("Thêm mới thành công!");
            }
            setShowForm(false);
            fetchServices();
        } catch (error) {
            console.error("Lỗi lưu dịch vụ:", error);
            alert("Đã xảy ra lỗi khi lưu. Vui lòng kiểm tra lại!");
        }
    };

    
    const formatCurrency = (amount) => {
        if (!amount && amount !== 0) return '---';
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    const formatDate = (dateString) => {
        if (!dateString) return '---';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Invalid Date';
        return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    const renderStatus = (status) => {
        if (status === 1 || status === 'Active') return <span className="badge bg-success">Hoạt động</span>;
        return <span className="badge bg-secondary">Ngừng hoạt động</span>;
    };

    return (
        <div className="container mt-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h3 className="fw-bold">Quản lý Dịch vụ</h3>
                {!showForm && (
                    <button className="btn btn-success" onClick={handleShowAdd}>
                        + Thêm dịch vụ
                    </button>
                )}
            </div>

            {/* --- KHU VỰC HIỂN THỊ FORM THÊM/SỬA --- */}
            {showForm && (
                <div className="card mb-4 shadow-sm border-0">
                    <div className="card-header bg-white fw-bold text-primary">
                        {isEdit ? 'Chỉnh sửa dịch vụ' : 'Thêm dịch vụ mới'}
                    </div>
                    <div className="card-body">
                        <form onSubmit={handleSubmit}>
                            <div className="row mb-3">
                                <div className="col-md-6">
                                    <label className="form-label">Tên dịch vụ</label>
                                    <input type="text" className="form-control" name="serviceName" value={formData.serviceName} onChange={handleInputChange} required />
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label">Phí dịch vụ (VNĐ)</label>
                                    <input type="number" className="form-control" name="serviceFee" value={formData.serviceFee} onChange={handleInputChange} required />
                                </div>
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Mô tả</label>
                                <textarea className="form-control" name="description" rows="2" value={formData.description} onChange={handleInputChange}></textarea>
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Trạng thái</label>
                                <select className="form-select" name="status" value={formData.status} onChange={handleInputChange}>
                                    <option value={1}>Hoạt động</option>
                                    <option value={0}>Ngừng hoạt động</option>
                                </select>
                            </div>
                            <div className="text-end">
                                <button type="button" className="btn btn-secondary me-2" onClick={() => setShowForm(false)}>Hủy</button>
                                <button type="submit" className="btn btn-primary">Lưu thông tin</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* --- KHU VỰC BẢNG HIỂN THỊ (Ẩn đi khi đang load) --- */}
            {loading ? (
                <div className="text-center">Đang tải dữ liệu...</div>
            ) : (
                <div className="table-responsive">
                    <table className="table table-hover align-middle">
                        <thead className="table-light">
                            <tr>
                                <th>ID</th>
                                <th>Tên dịch vụ</th>
                                <th>Mô tả</th>
                                <th>Phí dịch vụ</th>
                                <th>Trạng thái</th>
                                <th>Ngày tạo</th>
                                <th>Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {services.length > 0 ? services.map((svc) => (
                                <tr key={svc.serviceId || svc.ServiceId}>
                                    <td className="fw-bold">{svc.serviceId || svc.ServiceId}</td>
                                    <td>{svc.serviceName || svc.ServiceName || '---'}</td>
                                    <td>{svc.description || svc.Description || '---'}</td>
                                    <td className="text-danger fw-semibold">
                                        {formatCurrency(svc.serviceFee ?? svc.ServiceFee)}
                                    </td>
                                    <td>{renderStatus(svc.status ?? svc.Status)}</td>
                                    <td>{formatDate(svc.createdAt || svc.CreatedAt)}</td>
                                    <td>
                                        <button
                                            className="btn btn-sm btn-outline-primary me-2"
                                            onClick={() => handleShowEdit(svc)}
                                        >
                                            Sửa
                                        </button>
                                        <button
                                            className="btn btn-sm btn-outline-danger"
                                            onClick={() => handleDelete(svc.serviceId || svc.ServiceId)}
                                        >
                                            Xóa
                                        </button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="7" className="text-center text-muted py-4">
                                        Chưa có dịch vụ nào trong hệ thống.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default ServiceManagement;