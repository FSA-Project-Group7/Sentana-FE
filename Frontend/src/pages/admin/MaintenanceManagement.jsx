import React, { useState, useEffect } from 'react';
import api from '../../utils/axiosConfig';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// 🎨 CSS SAAS ĐỒNG BỘ VỚI MÀN HÌNH CONTRACT
const customStyles = `
.modern-card { background: #ffffff; border-radius: 20px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03); border: 1px solid #f1f5f9; transition: all 0.3s ease; }
.modern-card:hover { box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.08); transform: translateY(-2px); }
.page-header { background: linear-gradient(135deg, #10b981 0%, #047857 100%); color: white; padding: 32px 40px; border-radius: 24px; margin-bottom: 32px; box-shadow: 0 20px 25px -5px rgba(4, 120, 87, 0.15); position: relative; overflow: hidden; }
.page-header::after { content: ''; position: absolute; top: -50%; right: -10%; width: 400px; height: 400px; background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 70%); border-radius: 50%; pointer-events: none; }

.btn-gradient-success { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; border: none; font-weight: 700; letter-spacing: 0.3px; border-radius: 12px; padding: 12px 24px; transition: all 0.2s; }
.btn-gradient-success:hover { background: linear-gradient(135deg, #059669 0%, #047857 100%); color: white; box-shadow: 0 8px 16px rgba(5, 150, 105, 0.25); transform: translateY(-1px); }
.form-control, .form-select { padding: 12px 16px; border-radius: 12px; border: 1px solid #e2e8f0; background-color: #f8fafc; font-weight: 500; transition: all 0.2s; }
.form-control:focus, .form-select:focus { background-color: #ffffff; border-color: #10b981; box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.1); }

.table-custom { border-collapse: separate; border-spacing: 0 12px; margin-top: -12px; width: 100%; }
.table-custom th { background: transparent; color: #64748b; font-weight: 800; text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.05em; border: none; padding: 0 24px 8px 24px; }
.table-custom td { background: #ffffff; padding: 20px 24px; vertical-align: middle; color: #334155; border-top: 1px solid #f8fafc; border-bottom: 1px solid #f8fafc; transition: all 0.2s ease; box-shadow: 0 1px 3px rgba(0,0,0,0.02); }
.table-custom td:first-child { border-left: 1px solid #f8fafc; border-top-left-radius: 16px; border-bottom-left-radius: 16px; }
.table-custom td:last-child { border-right: 1px solid #f8fafc; border-top-right-radius: 16px; border-bottom-right-radius: 16px; }
.table-custom tbody tr:hover td { background-color: #f8fafc; border-color: #e2e8f0; box-shadow: 0 4px 6px rgba(0,0,0,0.04); transform: scale(1.001); z-index: 1; position: relative; }

.status-badge { padding: 6px 14px; border-radius: 20px; font-weight: 700; font-size: 0.75rem; display: inline-flex; align-items: center; gap: 6px; letter-spacing: 0.3px; text-transform: uppercase; }
.img-preview { width: 64px; height: 64px; object-fit: cover; border-radius: 12px; border: 2px solid #e2e8f0; box-shadow: 0 2px 4px rgba(0,0,0,0.05); transition: transform 0.2s; }
.img-preview:hover { transform: scale(1.1); }
.file-name-chip { display: inline-block; background: #e2e8f0; color: #475569; padding: 4px 12px; border-radius: 12px; font-size: 0.75rem; font-weight: 600; margin-top: 8px; }
`;

const MaintenanceRequest = () => {
    // --- 1. STATE MANAGEMENT ---
    const [requests, setRequests] = useState([]);
    const [apartments, setApartments] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form State ĐÚNG CHUẨN BACKEND
    const [formData, setFormData] = useState({ 
        apartmentId: '', 
        categoryId: '', 
        title: '', 
        description: '', 
        file: null 
    });

    // --- 2. FETCH DATA ---
    const fetchData = async () => {
        setLoading(true);
        try {
            // Lấy lịch sử yêu cầu của user
            const reqRes = await api.get('/maintenance/my-requests');
            setRequests(reqRes.data?.data || reqRes.data?.Data || []);
            
            // Lấy danh sách hợp đồng để lọc ra Căn hộ của riêng cư dân này (Active)
            const contractRes = await api.get('/contract/view-all-contract').catch(() => ({ data: [] }));
            const allContracts = Array.isArray(contractRes.data?.data || contractRes.data?.Data) ? (contractRes.data?.data || contractRes.data?.Data) : [];
            const myAccountId = localStorage.getItem('accountId'); 
            
            const myActiveContracts = allContracts.filter(c => 
                (String(c.accountId) === String(myAccountId) || String(c.residentAccountId) === String(myAccountId)) 
                && c.status === 1
            );

            const myApts = [];
            myActiveContracts.forEach(c => {
                if (c.apartment && !myApts.find(a => a.apartmentId === c.apartment.apartmentId)) {
                    myApts.push(c.apartment);
                }
            });
            setApartments(myApts);

            // Hardcode danh mục vì hệ thống chưa có API Get Category
            setCategories([
                { categoryId: 1, categoryName: 'Sự cố Nước / Ống nước' },
                { categoryId: 2, categoryName: 'Sự cố Điện / Chập cháy' },
                { categoryId: 3, categoryName: 'Hư hỏng Nội thất' },
                { categoryId: 4, categoryName: 'Sự cố Khác' }
            ]);
        } catch (error) { toast.error("Không thể tải dữ liệu hệ thống."); }
        setLoading(false);
    };

    useEffect(() => { fetchData(); }, []);

    // --- 3. FORM LOGIC & GUARDRAILS ---
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) {
            setFormData(prev => ({ ...prev, file: null }));
            return;
        }
        if (!file.type.startsWith("image/")) { 
            toast.error("Hệ thống chỉ hỗ trợ upload file hình ảnh!"); 
            e.target.value = ''; 
            return; 
        }
        if (file.size > 5 * 1024 * 1024) { 
            toast.error("Ảnh quá lớn! Vui lòng chọn ảnh dưới 5MB."); 
            e.target.value = ''; 
            return; 
        }
        setFormData(prev => ({ ...prev, file }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Business Guard
        if (!formData.apartmentId || !formData.categoryId || !formData.title.trim() || !formData.description.trim()) {
            return toast.warning("Vui lòng điền đầy đủ các trường có dấu (*).");
        }

        setIsSubmitting(true);
        const payload = new FormData();
        payload.append("ApartmentId", formData.apartmentId);
        payload.append("CategoryId", formData.categoryId);
        payload.append("Title", formData.title);
        payload.append("Description", formData.description);
        if (formData.file) payload.append("Photo", formData.file);

        try {
            await api.post('/maintenance/requests', payload, { headers: { 'Content-Type': 'multipart/form-data' } });
            toast.success("Đã gửi yêu cầu bảo trì thành công! Ban Quản Lý sẽ sớm liên hệ.");
            
            setFormData({ apartmentId: '', categoryId: '', title: '', description: '', file: null });
            const fileInput = document.getElementById('photoUpload');
            if(fileInput) fileInput.value = '';
            
            fetchData(); 
        } catch (error) {
            toast.error(error.response?.data?.message || "Lỗi hệ thống khi gửi báo cáo.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- 4. UI HELPERS ---
    const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleString('vi-VN', {hour: '2-digit', minute:'2-digit', day: '2-digit', month: '2-digit', year: 'numeric'}) : "N/A";
    
    const getStatusBadge = (status) => {
        const s = String(status).toUpperCase();
        if (s.includes('PENDING') || s === '0') return <span className="status-badge bg-warning bg-opacity-10 text-warning border border-warning"><i className="bi bi-hourglass-split"></i> Chờ tiếp nhận</span>;
        if (s.includes('IN_PROGRESS') || s.includes('PROCESSING') || s === '1' || s === '3') return <span className="status-badge bg-primary bg-opacity-10 text-primary border border-primary"><i className="bi bi-tools"></i> Đang sửa chữa</span>;
        if (s.includes('DONE') || s.includes('FIXED') || s === '2' || s === '4') return <span className="status-badge bg-success bg-opacity-10 text-success border border-success"><i className="bi bi-check-circle-fill"></i> Đã hoàn thành</span>;
        return <span className="status-badge bg-secondary bg-opacity-10 text-secondary border border-secondary">{status}</span>;
    };

    // --- 5. RENDER UI ---
    return (
        <div className="container-fluid p-4" style={{ backgroundColor: '#f1f5f9', minHeight: '100vh' }}>
            <style>{customStyles}</style>
            <ToastContainer position="top-right" autoClose={3000} theme="colored" />

            <div className="page-header d-flex justify-content-between align-items-center flex-wrap gap-3">
                <div style={{zIndex: 2}}>
                    <h2 className="fw-bolder mb-1"><i className="bi bi-wrench-adjustable-circle me-2"></i>Trung Tâm Hỗ Trợ & Bảo Trì</h2>
                    <p className="mb-0 text-white-50 fw-medium" style={{ fontSize: '0.95rem' }}>Gửi yêu cầu sửa chữa thiết bị hư hỏng trong căn hộ của bạn.</p>
                </div>
            </div>

            <div className="row g-4">
                <div className="col-lg-4">
                    <div className="modern-card p-4 sticky-top" style={{top: '20px'}}>
                        <h5 className="fw-bold mb-4 text-dark"><i className="bi bi-send-plus-fill text-success me-2 fs-4"></i>Tạo Báo Cáo Sự Cố</h5>
                        <form onSubmit={handleSubmit}>
                            <div className="mb-3">
                                <label className="form-label fw-bold small text-muted">Căn hộ xảy ra sự cố <span className="text-danger">*</span></label>
                                <select className="form-select shadow-none" value={formData.apartmentId} onChange={e => setFormData({...formData, apartmentId: e.target.value})} required>
                                    <option value="">-- Chọn Căn hộ của bạn --</option>
                                    {apartments.map(a => <option key={a.apartmentId || a.ApartmentId} value={a.apartmentId || a.ApartmentId}>Phòng {a.apartmentCode || a.ApartmentCode}</option>)}
                                </select>
                            </div>
                            <div className="mb-3">
                                <label className="form-label fw-bold small text-muted">Loại sự cố <span className="text-danger">*</span></label>
                                <select className="form-select shadow-none" value={formData.categoryId} onChange={e => setFormData({...formData, categoryId: e.target.value})} required>
                                    <option value="">-- Chọn Danh mục --</option>
                                    {categories.map(c => <option key={c.categoryId} value={c.categoryId}>{c.categoryName}</option>)}
                                </select>
                            </div>
                            <div className="mb-3">
                                <label className="form-label fw-bold small text-muted">Tiêu đề ngắn gọn <span className="text-danger">*</span></label>
                                <input type="text" className="form-control shadow-none" placeholder="VD: Ống nước nhà vệ sinh rò rỉ" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required />
                            </div>
                            <div className="mb-4">
                                <label className="form-label fw-bold small text-muted">Mô tả chi tiết <span className="text-danger">*</span></label>
                                <textarea className="form-control shadow-none" rows="4" placeholder="Mô tả cụ thể vị trí, tình trạng hư hỏng..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} required></textarea>
                            </div>
                            <div className="mb-4">
                                <label className="form-label fw-bold small text-muted">Hình ảnh đính kèm (Tùy chọn)</label>
                                <input id="photoUpload" type="file" className="form-control shadow-none bg-white" accept="image/*" onChange={handleFileChange} />
                                {formData.file && <div className="file-name-chip mt-2"><i className="bi bi-image me-1"></i> {formData.file.name}</div>}
                            </div>
                            <button type="submit" className="btn btn-gradient-success w-100 shadow" disabled={isSubmitting}>
                                {isSubmitting ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-rocket-takeoff-fill me-2"></i>}
                                {isSubmitting ? "Hệ thống đang xử lý..." : "Gửi Báo Cáo Sự Cố"}
                            </button>
                        </form>
                    </div>
                </div>

                <div className="col-lg-8">
                    <div className="modern-card p-4 h-100">
                        <h5 className="fw-bold mb-4 text-dark"><i className="bi bi-clock-history text-primary me-2 fs-4"></i>Lịch sử Yêu cầu của bạn</h5>
                        
                        {loading ? (
                            <div className="text-center py-5"><div className="spinner-border text-success mb-3"></div></div>
                        ) : requests.length === 0 ? (
                            <div className="text-center py-5 mt-5">
                                <i className="bi bi-clipboard-check text-muted opacity-25 d-block mb-3" style={{fontSize: '5rem'}}></i>
                                <h5 className="fw-bold text-dark">Bạn chưa gửi yêu cầu nào</h5>
                                <p className="text-muted">Các báo cáo sự cố của bạn sẽ được hiển thị và theo dõi tại đây.</p>
                            </div>
                        ) : (
                            <div className="table-responsive" style={{overflowX: 'visible'}}>
                                <table className="table table-custom w-100 mb-0">
                                    <thead><tr><th className="ps-4">Thời gian & Phòng</th><th>Sự cố & Trạng thái</th><th>Hình ảnh</th></tr></thead>
                                    <tbody>
                                        {requests.map((req, idx) => (
                                            <tr key={req.id || req.RequestId || idx}>
                                                <td className="ps-4">
                                                    <div className="text-muted fw-bold small mb-1"><i className="bi bi-calendar-event me-1"></i> {formatDate(req.createdAt || req.CreateDay || req.CreatedAt)}</div>
                                                    <span className="badge bg-dark bg-opacity-10 text-dark rounded-pill px-3 py-1 mt-1"><i className="bi bi-door-open text-warning me-1"></i>P.{req.apartmentCode || req.ApartmentCode || 'N/A'}</span>
                                                </td>
                                                <td>
                                                    <div className="fw-bold text-dark fs-6 mb-1">{req.title || req.Title}</div>
                                                    <div className="small text-muted mb-2 text-truncate" style={{maxWidth: '350px'}}>{req.description || req.Description}</div>
                                                    <div className="d-flex align-items-center gap-2 mt-2">
                                                        <span className="badge bg-secondary bg-opacity-10 text-secondary border">{req.categoryName || req.Category}</span>
                                                        {getStatusBadge(req.status || req.Status)}
                                                    </div>
                                                    {(req.resolutionNote || req.ResolutionNote) && (
                                                        <div className="alert alert-success mt-3 mb-0 py-2 px-3 small border-0 fw-semibold">
                                                            <i className="bi bi-check2-all me-1"></i> Kỹ thuật viên: {req.resolutionNote || req.ResolutionNote}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="pe-4 text-end">
                                                    {(req.photoUrl || req.PhotoUrl) ? (
                                                        <a href={req.photoUrl || req.PhotoUrl} target="_blank" rel="noreferrer">
                                                            <img src={req.photoUrl || req.PhotoUrl} alt="Minh chứng" className="img-preview" title="Nhấn để xem ảnh lớn" />
                                                        </a>
                                                    ) : <span className="badge bg-light text-muted border">Không đính kèm</span>}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MaintenanceRequest;