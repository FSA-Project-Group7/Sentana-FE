import React, { useState, useEffect } from 'react';
import api from '../../utils/axiosConfig';
import { toast } from 'react-toastify'; 

const customStyles = `
.modern-card { background: #ffffff; border-radius: 20px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); border: 1px solid #f1f5f9; transition: all 0.3s ease; }
.page-header { background: linear-gradient(135deg, #10b981 0%, #047857 100%); color: white; padding: 32px 40px; border-radius: 24px; margin-bottom: 32px; }
.btn-gradient-success { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; border: none; font-weight: 700; border-radius: 12px; padding: 12px 24px; }
.table-custom td { background: #ffffff; padding: 20px 24px; vertical-align: middle; border-bottom: 1px solid #f8fafc; }
.status-badge { padding: 6px 14px; border-radius: 20px; font-weight: 700; font-size: 0.75rem; text-transform: uppercase; }
`;

const MaintenanceRequest = () => {
    const [requests, setRequests] = useState([]);
    const [apartments, setApartments] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({ 
        apartmentId: '', 
        categoryId: '', 
        title: '', 
        description: '', 
        file: null 
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const reqRes = await api.get('/maintenance/my-requests');
            setRequests(reqRes.data?.data || reqRes.data?.Data || []);
            
            const aptRes = await api.get('/maintenance/my-apartments');
            const rawApts = aptRes.data?.data || aptRes.data?.Data || [];
            setApartments(Array.isArray(rawApts) ? rawApts : []);

            setCategories([
                { categoryId: 1, categoryName: 'Sự cố Nước / Ống nước' },
                { categoryId: 2, categoryName: 'Sự cố Điện / Chập cháy' },
                { categoryId: 3, categoryName: 'Hư hỏng Nội thất' },
                { categoryId: 4, categoryName: 'Sự cố Khác' }
            ]);
        } catch (error) { 
            console.error("Lỗi fetch:", error);
            toast.error("Không thể tải dữ liệu phòng."); 
        }
        setLoading(false);
    };

    useEffect(() => { fetchData(); }, []);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file && file.size > 5 * 1024 * 1024) { 
            toast.error("Ảnh quá lớn (>5MB)"); 
            e.target.value = '';
            return; 
        }
        setFormData(prev => ({ ...prev, file }));
    };

   const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.apartmentId || !formData.categoryId || !formData.title.trim() || !formData.description.trim()) {
            return toast.warning("Vui lòng điền đủ tất cả các trường có dấu (*)");
        }

        setIsSubmitting(true);
        const payload = new FormData();
        
        payload.append("ApartmentId", formData.apartmentId);
        payload.append("CategoryId", formData.categoryId);
        payload.append("Title", formData.title.trim());
        payload.append("Description", formData.description.trim());
        
        if (formData.file) {
            payload.append("Photo", formData.file);
        }

        try {
            // FIX QUAN TRỌNG NHẤT: Bắt buộc ép Axios phải gửi dạng form-data 
            // để máy chủ có thể "bóc tách" được Title và Description
            const response = await api.post('/maintenance/requests', payload, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            
            toast.success(response.data?.message || response.data?.Message || "Gửi báo cáo thành công!");
            
            // Clear Form
            setFormData({ apartmentId: '', categoryId: '', title: '', description: '', file: null });
            const fileInput = document.getElementById('photoUpload');
            if(fileInput) fileInput.value = '';
            fetchData(); 
        } catch (error) {
            console.error("Log lỗi BE:", error.response?.data);
            
            const errData = error.response?.data;
            let errorMsg = "Có lỗi xảy ra khi lưu vào Database.";
            
            if (errData?.errors) {
                const validationErrors = Object.values(errData.errors).flat().join(" | ");
                errorMsg = `Lỗi dữ liệu: ${validationErrors}`;
            } else if (errData?.message || errData?.Message) {
                errorMsg = errData.message || errData.Message;
            }
            
            toast.error(errorMsg);
        } finally {
            setIsSubmitting(false);
        }
    };

    const getStatusBadge = (status) => {
        const s = String(status).toUpperCase();
        if (s.includes('PENDING')) return <span className="badge bg-warning text-dark">Chờ xử lý</span>;
        if (s.includes('FIXED') || s.includes('DONE')) return <span className="badge bg-success">Đã xong</span>;
        return <span className="badge bg-info">Đang sửa</span>;
    };

    return (
        <div className="container-fluid p-4" style={{ backgroundColor: '#f1f5f9', minHeight: '100vh' }}>
            <style>{customStyles}</style>

            <div className="page-header shadow-sm">
                <h2 className="fw-bolder mb-1"><i className="bi bi-wrench-adjustable-circle me-2"></i>Hỗ Trợ & Bảo Trì</h2>
                <p className="mb-0 text-white-50">Khai báo sự cố kỹ thuật tại căn hộ của bạn.</p>
            </div>

            <div className="row g-4">
                <div className="col-lg-4">
                    <div className="modern-card p-4">
                        <h5 className="fw-bold mb-4"><i className="bi bi-send-plus-fill text-success me-2"></i>Tạo Báo Cáo</h5>
                        <form onSubmit={handleSubmit}>
                            <div className="mb-3">
                                <label className="form-label fw-bold small">Căn hộ của bạn *</label>
                                <select className="form-select" value={formData.apartmentId} onChange={e => setFormData({...formData, apartmentId: e.target.value})} required>
                                    <option value="">-- Chọn Căn hộ --</option>
                                    {apartments.map((a, idx) => (
                                        <option key={a.apartmentId || a.ApartmentId || idx} value={a.apartmentId || a.ApartmentId}>
                                            Phòng {a.apartmentCode || a.ApartmentCode}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="mb-3">
                                <label className="form-label fw-bold small">Loại sự cố *</label>
                                <select className="form-select" value={formData.categoryId} onChange={e => setFormData({...formData, categoryId: e.target.value})} required>
                                    <option value="">-- Chọn Danh mục --</option>
                                    {categories.map(c => <option key={c.categoryId} value={c.categoryId}>{c.categoryName}</option>)}
                                </select>
                            </div>
                            <div className="mb-3">
                                <label className="form-label fw-bold small">Tiêu đề *</label>
                                <input type="text" className="form-control" placeholder="Tên sự cố..." value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required />
                            </div>
                            <div className="mb-3">
                                <label className="form-label fw-bold small">Mô tả *</label>
                                <textarea className="form-control" rows="3" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} required></textarea>
                            </div>
                            <div className="mb-4">
                                <label className="form-label fw-bold small text-muted">Hình ảnh đính kèm (Tùy chọn)</label>
                                <input id="photoUpload" type="file" className="form-control shadow-none bg-white" accept="image/*" onChange={handleFileChange} />
                            </div>
                            <button type="submit" className="btn btn-gradient-success w-100 shadow" disabled={isSubmitting}>
                                {isSubmitting ? "Đang gửi..." : "Gửi Báo Cáo"}
                            </button>
                        </form>
                    </div>
                </div>

                <div className="col-lg-8">
                    <div className="modern-card p-4">
                        <h5 className="fw-bold mb-4"><i className="bi bi-clock-history text-primary me-2"></i>Lịch sử yêu cầu</h5>
                        <div className="table-responsive">
                            <table className="table table-hover align-middle">
                                <thead>
                                    <tr className="table-light">
                                        <th>Phòng</th>
                                        <th>Sự cố</th>
                                        <th>Trạng thái</th>
                                        <th>Ghi chú xử lý</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {requests.map((req, idx) => (
                                        <tr key={idx}>
                                            <td className="fw-bold">P.{req.apartmentCode || req.ApartmentCode}</td>
                                            <td>
                                                <div className="fw-bold">{req.title || req.Title}</div>
                                                <small className="text-muted">{req.categoryName || req.CategoryName}</small>
                                            </td>
                                            <td>{getStatusBadge(req.status || req.Status)}</td>
                                            <td className="small text-muted">{req.resolutionNote || req.ResolutionNote || "Chưa có phản hồi"}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MaintenanceRequest;