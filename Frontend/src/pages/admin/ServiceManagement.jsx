import React, { useState, useEffect } from 'react';
import api from '../../utils/axiosConfig';

const ServiceManagement = () => {
    const [services, setServices] = useState([]);
    const [formData, setFormData] = useState({ serviceName: '', price: '', unit: '' });
    const [editId, setEditId] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchServices();
    }, []);

    const fetchServices = async () => {
        try {
            const response = await api.get('/Service');
            // Backend trả về danh sách trực tiếp hoặc bọc trong object, tùy thuộc vào ApiResponse
            setServices(response.data.data || response.data);
        } catch (error) {
            console.error("Lỗi tải danh sách dịch vụ:", error);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (editId) {
                // Khớp với [PUT] /api/Service/{id} 
                // Sử dụng UpdateServiceRequestDto: { serviceName, price, unit }
                await api.put(`/Service/${editId}`, formData);
                alert("Cập nhật dịch vụ thành công!");
            } else {
                // Khớp với [POST] /api/Service
                // Sử dụng CreateServiceRequestDto: { serviceName, price, unit }
                await api.post('/Service', formData);
                alert("Thêm dịch vụ thành công!");
            }
            setFormData({ serviceName: '', price: '', unit: '' });
            setEditId(null);
            fetchServices();
            document.getElementById('closeServiceModal').click();
        } catch (error) {
            alert(error.response?.data?.message || "Thao tác thất bại");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEdit = (service) => {
        setEditId(service.serviceId);
        setFormData({
            serviceName: service.serviceName,
            price: service.price,
            unit: service.unit
        });
    };

    const handleDelete = async (id) => {
        if (window.confirm("Bạn có chắc chắn muốn xóa dịch vụ này?")) {
            try {
                await api.delete(`/Service/${id}`);
                fetchServices();
            } catch (error) {
                alert("Không thể xóa dịch vụ đang được sử dụng.");
            }
        }
    };

    return (
        <div className="container-fluid mt-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h3>Quản Lý Dịch Vụ</h3>
                <button 
                    className="btn btn-primary" 
                    data-bs-toggle="modal" 
                    data-bs-target="#serviceModal"
                    onClick={() => { setEditId(null); setFormData({ serviceName: '', price: '', unit: '' }); }}
                >
                    + Thêm Dịch Vụ Mới
                </button>
            </div>

            <table className="table table-hover border">
                <thead className="table-light">
                    <tr>
                        <th>Tên Dịch Vụ</th>
                        <th>Đơn Giá (VNĐ)</th>
                        <th>Đơn Vị Tính</th>
                        <th>Thao Tác</th>
                    </tr>
                </thead>
                <tbody>
                    {services.map((s) => (
                        <tr key={s.serviceId}>
                            <td>{s.serviceName}</td>
                            <td>{Number(s.price).toLocaleString()}</td>
                            <td>{s.unit}</td>
                            <td>
                                <button 
                                    className="btn btn-sm btn-outline-warning me-2"
                                    data-bs-toggle="modal" data-bs-target="#serviceModal"
                                    onClick={() => handleEdit(s)}
                                >Sửa</button>
                                <button 
                                    className="btn btn-sm btn-outline-danger"
                                    onClick={() => handleDelete(s.serviceId)}
                                >Xóa</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Modal */}
            <div className="modal fade" id="serviceModal" tabIndex="-1">
                <div className="modal-dialog">
                    <div className="modal-content">
                        <form onSubmit={handleSubmit}>
                            <div className="modal-header">
                                <h5 className="modal-title">{editId ? 'Cập Nhật Dịch Vụ' : 'Thêm Dịch Vụ'}</h5>
                                <button type="button" className="btn-close" id="closeServiceModal" data-bs-dismiss="modal"></button>
                            </div>
                            <div className="modal-body">
                                <div className="mb-3">
                                    <label className="form-label">Tên dịch vụ</label>
                                    <input type="text" name="serviceName" className="form-control" 
                                        value={formData.serviceName} onChange={handleInputChange} required />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Giá tiền</label>
                                    <input type="number" name="price" className="form-control" 
                                        value={formData.price} onChange={handleInputChange} required />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Đơn vị (ví dụ: m3, kWh, tháng)</label>
                                    <input type="text" name="unit" className="form-control" 
                                        value={formData.unit} onChange={handleInputChange} required />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                                    {isSubmitting ? 'Đang lưu...' : 'Lưu'}
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