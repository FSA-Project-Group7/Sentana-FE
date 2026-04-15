import React, { useState, useEffect } from 'react';
import api from '../../utils/axiosConfig';
import { notify } from '../../utils/notificationAlert';

const AdminProfile = () => {
    // State Thông tin cá nhân (Dùng để hiển thị View)
    const [profile, setProfile] = useState({
        email: '',
        fullName: '',
        phoneNumber: '',
        birthDay: ''
    });

    // State dùng riêng cho Form trong Modal
    const [editProfile, setEditProfile] = useState({ ...profile });
    const [showEditModal, setShowEditModal] = useState(false);

    // State QR Code
    const [qrUrl, setQrUrl] = useState(null);
    const [qrFile, setQrFile] = useState(null);

    // Trạng thái Loading
    const [isLoading, setIsLoading] = useState(true);
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [isUploadingQr, setIsUploadingQr] = useState(false);

    // Fetch dữ liệu khi load trang
    const fetchProfile = async () => {
        try {
            // LƯU Ý: Đảm bảo DTO của API này bên Backend có trả về trường QrCodeUrl nhé!
            const res = await api.get('/Auth/profile'); 
            const data = res.data?.data || res.data;
            const info = data.info || data; // Đón đầu các kiểu cấu trúc DTO

            setProfile({
                email: data.email || info.email || 'Chưa cập nhật',
                fullName: info.fullName || 'Chưa cập nhật',
                phoneNumber: info.phoneNumber || 'Chưa cập nhật',
                birthDay: info.birthDay ? info.birthDay.split('T')[0] : ''
            });

            // Hứng link QR (Phòng hờ BE nhét ở ngoài hoặc nhét trong Info)
            setQrUrl(info.qrCodeUrl || data.qrCodeUrl || null);
        } catch (error) {
            notify.error("Không thể tải thông tin cá nhân");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    // Mở Modal và copy dữ liệu hiện tại vào form
    const handleOpenEditModal = () => {
        setEditProfile({ ...profile });
        setShowEditModal(true);
    };

    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setEditProfile(prev => ({ ...prev, [name]: value }));
    };

    // Gọi API Update Profile
    const submitUpdateProfile = async (e) => {
        e.preventDefault();
        setIsSavingProfile(true);
        try {
            // 1. CHUẨN HÓA DỮ LIỆU TRƯỚC KHI GỬI: Ép chuỗi rỗng thành null để C# không bị lỗi parse DateTime
            const payload = {
                ...editProfile,
                birthDay: editProfile.birthDay === '' ? null : editProfile.birthDay
            };

            const res = await api.put('/Auth/profile', payload); 
            
            // Xử lý thông báo chữ hoa/thường tùy config Backend
            notify.success(res.data?.message || res.data?.Message || "Cập nhật thông tin thành công!");
            
            // Cập nhật lại view và đóng Modal
            setProfile({ ...editProfile });
            setShowEditModal(false);
        } catch (error) {
            console.log("CHI TIẾT LỖI TỪ BE:", error.response?.data); // Log ra để debug
            
            // 2. BẮT LỖI THÔNG MINH HƠN ĐỂ HIỂN THỊ ĐÚNG NGUYÊN NHÂN
            let errorMsg = "Cập nhật thông tin thất bại.";
            if (error.response?.data) {
                // Nếu BE ném ra lỗi tự custom bằng ApiResponse
                if (error.response.data.message) errorMsg = error.response.data.message;
                else if (error.response.data.Message) errorMsg = error.response.data.Message;
                // Nếu lỗi do sai kiểu dữ liệu (.NET tự động bắt lỗi Model)
                else if (error.response.data.errors) {
                    const firstErrorKey = Object.keys(error.response.data.errors)[0];
                    errorMsg = error.response.data.errors[firstErrorKey][0];
                }
            }
            notify.error(errorMsg);
        } finally {
            setIsSavingProfile(false);
        }
    };

    // Gọi API Upload Mã QR
    const submitUploadQr = async (e) => {
        e.preventDefault();
        if (!qrFile) return notify.warning("Vui lòng chọn một ảnh mã QR!");

        setIsUploadingQr(true);
        const formData = new FormData();
        formData.append('file', qrFile);

        try {
            const res = await api.post('/Auth/upload-qr', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            notify.success(res.data?.message || "Đã lưu mã QR thành công!");
            
            // Cập nhật link QR mới lên màn hình
            setQrUrl(res.data?.qrUrl || res.data?.data?.qrUrl);
            setQrFile(null);
            document.getElementById('qrFileInput').value = '';
        } catch (error) {
            notify.error(error.response?.data?.message || "Tải mã QR thất bại.");
        } finally {
            setIsUploadingQr(false);
        }
    };

    if (isLoading) {
        return <div className="text-center p-5"><div className="spinner-border text-primary"></div></div>;
    }

    return (
        <div className="container-fluid p-0">
            <div className="mb-4">
                <h2 className="fw-bold mb-0 text-dark">Thông Tin Cá Nhân</h2>
                <div className="text-muted small mt-2">Quản lý hồ sơ và cài đặt phương thức thanh toán</div>
            </div>

            <div className="row g-4">
                {/* CỘT TRÁI: HIỂN THỊ THÔNG TIN CÁ NHÂN (VIEW MODE) */}
                <div className="col-lg-8">
                    <div className="card shadow-sm border-0 rounded-4 bg-white h-100">
                        <div className="card-header bg-white border-bottom py-3 px-4 d-flex justify-content-between align-items-center">
                            <h6 className="fw-bold mb-0 text-primary"><i className="bi bi-person-vcard me-2"></i>Hồ sơ quản trị viên</h6>
                            <button className="btn btn-sm btn-outline-primary fw-bold rounded-pill shadow-sm px-3" onClick={handleOpenEditModal}>
                                <i className="bi bi-pencil-square me-1"></i> Chỉnh sửa
                            </button>
                        </div>
                        <div className="card-body p-4">
                            <div className="d-flex align-items-center mb-5 pb-4 border-bottom">
                                <div className="rounded-circle bg-primary bg-opacity-10 text-primary d-flex align-items-center justify-content-center fw-bold shadow-sm me-4" style={{ width: '80px', height: '80px', fontSize: '32px' }}>
                                    {profile.fullName ? profile.fullName.charAt(0).toUpperCase() : 'A'}
                                </div>
                                <div>
                                    <h4 className="fw-bold text-dark mb-1">{profile.fullName}</h4>
                                    <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-3 py-1 rounded-pill">
                                        Ban Quản Lý (Admin)
                                    </span>
                                </div>
                            </div>

                            <div className="row g-4">
                                <div className="col-md-6">
                                    <p className="text-muted small mb-1 fw-semibold text-uppercase">Email liên hệ</p>
                                    <h6 className="fw-bold text-dark"><i className="bi bi-envelope-at text-secondary me-2"></i>{profile.email}</h6>
                                </div>
                                <div className="col-md-6">
                                    <p className="text-muted small mb-1 fw-semibold text-uppercase">Số điện thoại</p>
                                    <h6 className="fw-bold text-dark"><i className="bi bi-telephone text-secondary me-2"></i>{profile.phoneNumber}</h6>
                                </div>
                                <div className="col-md-6">
                                    <p className="text-muted small mb-1 fw-semibold text-uppercase">Ngày sinh</p>
                                    <h6 className="fw-bold text-dark">
                                        <i className="bi bi-calendar-event text-secondary me-2"></i>
                                        {profile.birthDay ? new Date(profile.birthDay).toLocaleDateString('vi-VN') : 'Chưa cập nhật'}
                                    </h6>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* CỘT PHẢI: QUẢN LÝ MÃ QR */}
                <div className="col-lg-4">
                    <div className="card shadow-sm border-0 rounded-4 bg-white h-100">
                        <div className="card-header bg-white border-bottom py-3 px-4">
                            <h6 className="fw-bold mb-0 text-success"><i className="bi bi-qr-code-scan me-2"></i>Mã QR Nhận Tiền</h6>
                        </div>
                        <div className="card-body p-4 text-center d-flex flex-column justify-content-between">
                            <div className="mb-4 flex-grow-1 d-flex flex-column justify-content-center align-items-center">
                                {qrUrl ? (
                                    <>
                                        <img src={qrUrl} alt="Mã QR Nhận Tiền" className="img-fluid rounded-4 shadow-sm border p-2 mb-3" style={{ maxWidth: '200px', maxHeight: '200px', objectFit: 'contain' }} />
                                        <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-3 py-2 rounded-pill">
                                            <i className="bi bi-check-circle-fill me-1"></i> QR Đang Hoạt Động
                                        </span>
                                    </>
                                ) : (
                                    <div className="p-4 bg-light rounded-4 text-muted border border-dashed h-100 d-flex flex-column justify-content-center">
                                        <i className="bi bi-qr-code display-1 opacity-25 d-block mb-3"></i>
                                        <p className="mb-0 fw-medium">Bạn chưa cài đặt mã QR.</p>
                                        <small>Cư dân sẽ không thể thanh toán hóa đơn nếu thiếu mã QR này.</small>
                                    </div>
                                )}
                            </div>

                            <form onSubmit={submitUploadQr} className="bg-light p-3 rounded-4 border">
                                <label className="form-label small fw-bold text-dark text-start w-100 mb-2">Cập nhật QR Mới</label>
                                <input 
                                    id="qrFileInput"
                                    type="file" 
                                    className="form-control mb-3 shadow-none bg-white modern-file-input" 
                                    accept="image/*" 
                                    onChange={(e) => setQrFile(e.target.files[0])} 
                                    required
                                />
                                <button type="submit" className="btn btn-success w-100 fw-bold shadow-sm rounded-pill" disabled={isUploadingQr || !qrFile}>
                                    {isUploadingQr ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-upload me-2"></i>}
                                    {qrUrl ? 'Thay đổi mã QR' : 'Tải lên mã QR'}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>

            {/* MODAL CHỈNH SỬA THÔNG TIN */}
            {showEditModal && <div className="modal-backdrop fade show" style={{ zIndex: 1040, backgroundColor: 'rgba(0,0,0,0.5)' }}></div>}
            {showEditModal && (
                <div className="modal fade show d-block" tabIndex="-1" style={{ zIndex: 1050 }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
                            <div className="modal-header bg-white border-bottom px-4 py-3">
                                <h5 className="modal-title fw-bold text-primary"><i className="bi bi-pencil-square me-2"></i>Cập Nhật Thông Tin</h5>
                                <button type="button" className="btn-close" onClick={() => setShowEditModal(false)}></button>
                            </div>
                            <form onSubmit={submitUpdateProfile}>
                                <div className="modal-body p-4 bg-light">
                                    <div className="row g-3">
                                        <div className="col-12">
                                            <label className="form-label small fw-bold text-muted text-uppercase">Họ và tên (*)</label>
                                            <input type="text" className="form-control shadow-none border-primary-subtle" name="fullName" value={editProfile.fullName} onChange={handleEditChange} required placeholder="Nhập họ và tên..." />
                                        </div>
                                        <div className="col-12">
                                            <label className="form-label small fw-bold text-muted text-uppercase">Email liên hệ (*)</label>
                                            <input type="email" className="form-control shadow-none border-primary-subtle" name="email" value={editProfile.email} onChange={handleEditChange} required placeholder="Nhập email..." />
                                        </div>
                                        <div className="col-12">
                                            <label className="form-label small fw-bold text-muted text-uppercase">Số điện thoại</label>
                                            <input type="text" className="form-control shadow-none border-primary-subtle" name="phoneNumber" value={editProfile.phoneNumber} onChange={handleEditChange} placeholder="Nhập số điện thoại..." />
                                        </div>
                                        <div className="col-12">
                                            <label className="form-label small fw-bold text-muted text-uppercase">Ngày sinh</label>
                                            <input type="date" className="form-control shadow-none border-primary-subtle" name="birthDay" value={editProfile.birthDay} onChange={handleEditChange} />
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-footer bg-white border-top px-4 py-3 d-flex justify-content-end gap-2">
                                    <button type="button" className="btn btn-white border rounded-pill px-4 fw-bold shadow-sm" onClick={() => setShowEditModal(false)}>Hủy</button>
                                    <button type="submit" className="btn btn-primary rounded-pill px-4 fw-bold shadow-sm" disabled={isSavingProfile}>
                                        {isSavingProfile ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-floppy-fill me-2"></i>}
                                        Lưu thay đổi
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .border-dashed { border-style: dashed !important; border-width: 2px !important; }
                .modern-file-input::file-selector-button {
                    background-color: #6c757d !important;
                    color: white !important;
                    border: none !important;
                    padding: 6px 12px !important;
                    border-radius: 6px !important;
                    margin: 0 12px 0 0 !important;
                    cursor: pointer;
                    font-size: 13px;
                    font-weight: 600;
                    transition: 0.3s;
                }
                .modern-file-input::file-selector-button:hover { background-color: #5c636a !important; }
            `}</style>
        </div>
    );
};

export default AdminProfile;