import React, { useState, useEffect } from 'react';
import api from '../../utils/axiosConfig';
import CreateAccountForm from '../../components/common/CreateAccountForm';
// --- IMPORT UTILS THÔNG BÁO ---
import { notify, confirmAction, confirmDelete } from '../../utils/notificationAlert';

const TechnicianManagement = () => {
    const [technicians, setTechnicians] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editId, setEditId] = useState(null);
    const [showTrash, setShowTrash] = useState(false);

    const initialFormState = {
        email: '', userName: '', password: '', fullName: '',
        phoneNumber: '', identityCard: '', country: '', city: '', address: '',
        birthDay: '', sex: ''
    };
    const [formData, setFormData] = useState(initialFormState);

    const fetchTechnicians = async () => {
        try {
            setLoading(true);
            const endpoint = showTrash ? '/Technicians/Deleted' : '/Technicians';
            const response = await api.get(endpoint);
            const dataList = response.data.data ? response.data.data : response.data;
            setTechnicians(Array.isArray(dataList) ? dataList : []);
        } catch (error) {
            notify.error("Lỗi khi tải dữ liệu kỹ thuật viên");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTechnicians();
    }, [showTrash]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleOpenModal = (tech = null) => {
        if (tech) {
            setEditId(tech.accountId);
            let birthDay = '';
            if (tech.info?.birthday) birthDay = tech.info.birthday.split('T')[0];
            else if (tech.birthDay) birthDay = tech.birthDay.split('T')[0];
            else if (tech.dayOfBirth) birthDay = tech.dayOfBirth.split('T')[0];
            else if (tech.BirthDay) birthDay = tech.BirthDay.split('T')[0];

            let sex = '';
            if (tech.info?.sex !== null && tech.info?.sex !== undefined) sex = tech.info.sex.toString();
            else if (tech.sex !== null && tech.sex !== undefined) sex = tech.sex.toString();

            const country = tech.info?.country || tech.country || tech.Country || '';
            const city = tech.info?.city || tech.city || tech.City || '';

            setFormData({
                email: tech.email || '',
                userName: tech.userName || '',
                password: '',
                fullName: tech.fullName || '',
                phoneNumber: tech.phoneNumber || '',
                identityCard: tech.identityCard || '',
                country: country,
                city: city,
                address: tech.address || '',
                birthDay: birthDay,
                sex: sex
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
                    email: formData.email.trim() || null,
                    fullName: formData.fullName,
                    phoneNumber: formData.phoneNumber.trim() || null,
                    identityCard: formData.identityCard,
                    country: formData.country.trim() || null,
                    city: formData.city.trim() || null,
                    address: formData.address.trim() || null,
                    birthDay: formData.birthDay || null,
                    sex: formData.sex !== '' ? Number(formData.sex) : null
                };
                const res = await api.put(`/Technicians/UpdateTechnician/${editId}`, updatePayload);
                notify.success(res.data?.message || "Cập nhật thành công!");
            }
            fetchTechnicians();
            document.getElementById('closeTechModal').click();
        } catch (error) {
            notify.error("LỖI: " + (error.response?.data?.message || "Lỗi đầu vào!"));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleToggleStatus = async (id) => {
        try {
            const res = await api.put(`/Technicians/toggleStatus/${id}`);
            notify.success(res.data?.message || "Đã thay đổi trạng thái!");
            fetchTechnicians();
        } catch (error) {
            notify.error("LỖI: " + (error.response?.data?.message || "Không thể thực hiện"));
        }
    };

    const handleToggleAvailability = async (id) => {
        try {
            const res = await api.put(`/Technicians/toggleAvailability/${id}`);
            notify.success(res.data?.message || "Đã thay đổi tình trạng!");
            fetchTechnicians();
        } catch (error) {
            notify.error("LỖI: " + (error.response?.data?.message || "Không thể thực hiện"));
        }
    };

    const handleDelete = async (id, name) => {
        const { isConfirmed } = await confirmDelete.fire({
            title: 'Xác nhận xóa?',
            text: `Đưa KTV "${name}" vào danh sách đã xóa?`
        });

        if (isConfirmed) {
            try {
                const res = await api.delete(`/Technicians/DeleteTechnician/${id}`);
                notify.success(res.data?.message || "Đã xóa thành công.");
                fetchTechnicians();
            } catch (error) {
                notify.error("LỖI: " + (error.response?.data?.message || "Không thể xóa"));
            }
        }
    };

    const handleRestore = async (id) => {
        try {
            const res = await api.put(`/Technicians/Restore/${id}`);
            notify.success(res.data?.message || "Khôi phục thành công!");
            fetchTechnicians();
        } catch (error) {
            notify.error("LỖI: " + (error.response?.data?.message || "Không thể khôi phục"));
        }
    };

    const handleHardDelete = async (id, name) => {
        const { isConfirmed } = await confirmDelete.fire({
            title: 'XÓA VĨNH VIỄN!',
            text: `Bạn sắp xóa vĩnh viễn KTV "${name}". Hành động này không thể hoàn tác!`
        });

        if (isConfirmed) {
            try {
                const res = await api.delete(`/Technicians/HardDelete/${id}`);
                notify.success(res.data?.message || "Đã xóa vĩnh viễn.");
                fetchTechnicians();
            } catch (error) {
                notify.error("LỖI: " + (error.response?.data?.message || "Không thể xóa"));
            }
        }
    };

    return (
        <div className="container-fluid p-0">
            <div className="d-flex justify-content-between align-items-start mb-4">
                <div>
                    <h2 className="fw-bold mb-0">{showTrash ? 'Danh sách đã xóa: Kỹ thuật viên' : 'Quản lý Kỹ thuật viên'}</h2>
                </div>
                <div className="d-flex align-items-center">
                    {!showTrash && (
                        <button className="btn btn-primary me-3" onClick={() => handleOpenModal()} data-bs-toggle="modal" data-bs-target="#techModal" style={{ minWidth: '160px' }}>
                            <i className="bi bi-person-plus-fill me-2"></i> Thêm KTV
                        </button>
                    )}
                    <button className={`btn ${showTrash ? 'btn-outline-secondary' : 'btn-outline-danger'}`} onClick={() => setShowTrash(!showTrash)}>
                        <i className={`bi ${showTrash ? 'bi-arrow-left-circle' : 'bi-archive'} me-2`}></i>
                        {showTrash ? 'Quay lại Danh sách' : 'Danh sách đã xóa'}
                    </button>
                </div>
            </div>

            <div className="card shadow-sm border-0">
                <div className="card-body p-0">
                    {loading ? (
                        <div className="text-center p-5"><div className="spinner-border text-primary"></div></div>
                    ) : technicians.length === 0 ? (
                        <div className="text-center p-5 text-muted">{showTrash ? 'Không có tài khoản nào bị xóa.' : 'Chưa có dữ liệu.'}</div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-hover table-bordered mb-0 align-middle text-center">
                                <thead className="table-light">
                                    <tr>
                                        <th>STT</th>
                                        <th>Mã NV</th>
                                        <th className="text-start">Họ và Tên</th>
                                        <th>Liên hệ</th>
                                        <th>Trạng thái Hệ thống</th>
                                        <th>Tình trạng CV</th>
                                        <th>Hành động</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {technicians.map((tech, idx) => (
                                        <tr key={tech.accountId}>
                                            <td>{idx + 1}</td>
                                            <td className={`fw-bold ${showTrash ? 'text-muted' : 'text-primary'}`}>{tech.code}</td>
                                            <td className="text-start">
                                                <div className={`fw-semibold ${showTrash ? 'text-muted text-decoration-line-through' : ''}`}>{tech.fullName}</div>
                                                <div className="small text-muted">@{tech.userName}</div>
                                            </td>
                                            <td>
                                                <div className="small">{tech.phoneNumber}</div>
                                                <div className="small text-muted">{tech.email}</div>
                                            </td>
                                            <td>
                                                {showTrash ? <span className="badge bg-danger">Đã xóa</span> : (
                                                    <span
                                                        className={`badge rounded-pill ${tech.status === 1 ? 'bg-success' : 'bg-secondary'}`}
                                                        style={{ cursor: 'pointer' }}
                                                        onClick={() => handleToggleStatus(tech.accountId)}
                                                    >
                                                        {tech.status === 1 ? 'Đang hoạt động' : 'Đã khóa'}
                                                    </span>
                                                )}
                                            </td>
                                            <td>
                                                {!showTrash && (
                                                    <span
                                                        className={`badge ${tech.techAvailability === 1 ? 'bg-info text-dark' : 'bg-warning text-dark'}`}
                                                        style={{ cursor: 'pointer' }}
                                                        onClick={() => handleToggleAvailability(tech.accountId)}
                                                    >
                                                        {tech.techAvailability === 1 ? 'Rảnh rỗi' : 'Đang bận'}
                                                    </span>
                                                )}
                                            </td>
                                            <td>
                                                {showTrash ? (
                                                    <>
                                                        <button className="btn btn-sm btn-outline-success me-2" onClick={() => handleRestore(tech.accountId)}>Khôi phục</button>
                                                        <button className="btn btn-sm btn-danger" onClick={() => handleHardDelete(tech.accountId, tech.fullName)}>Xóa hẳn</button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button className="btn btn-sm btn-outline-warning me-2" onClick={() => handleOpenModal(tech)} data-bs-toggle="modal" data-bs-target="#techModal">Sửa</button>
                                                        <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(tech.accountId, tech.fullName)}>Xóa</button>
                                                    </>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            <div className="modal fade" id="techModal" tabIndex="-1" aria-hidden="true">
                <div className={`modal-dialog ${editId ? 'modal-lg' : 'modal-lg modal-dialog-scrollable'}`}>
                    <div className="modal-content border-0">
                        {!editId && (
                            <CreateAccountForm
                                type="technician"
                                onSuccess={() => {
                                    fetchTechnicians();
                                    document.getElementById('closeTechModal').click();
                                }}
                                onCancel={() => document.getElementById('closeTechModal').click()}
                            />
                        )}
                        <button type="button" id="closeTechModal" data-bs-dismiss="modal" style={{ display: 'none' }} aria-hidden="true" />
                        {!!editId && (
                            <>
                                <div className="modal-header text-white" style={{ backgroundColor: '#122240' }}>
                                    <h5 className="modal-title fw-bold">Cập Nhật Kỹ Thuật Viên</h5>
                                    <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                                </div>
                                <form onSubmit={handleSubmit}>
                                    <div className="modal-body">
                                        <div className="row g-3">
                                            <div className="col-12 mt-2"><h6 className="fw-bold text-primary mb-0 border-bottom pb-2">Thông tin cá nhân</h6></div>
                                            <div className="col-md-6">
                                                <label className="form-label fw-semibold">Họ và Tên (*)</label>
                                                <input type="text" className="form-control" name="fullName" value={formData.fullName} onChange={handleInputChange} required />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label fw-semibold">Số CCCD (*)</label>
                                                <input type="text" className="form-control" name="identityCard" value={formData.identityCard} onChange={handleInputChange} required />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label fw-semibold">Số điện thoại (*)</label>
                                                <input type="text" className="form-control" name="phoneNumber" value={formData.phoneNumber} onChange={handleInputChange} required />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label fw-semibold">Email (*)</label>
                                                <input type="email" className="form-control" name="email" value={formData.email} onChange={handleInputChange} required />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label fw-semibold">Ngày sinh</label>
                                                <input type="date" className="form-control" name="birthDay" value={formData.birthDay} onChange={handleInputChange} />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label fw-semibold">Giới tính</label>
                                                <select className="form-select" name="sex" value={formData.sex} onChange={handleInputChange}>
                                                    <option value="">-- Chọn --</option>
                                                    <option value="0">Nam</option>
                                                    <option value="1">Nữ</option>
                                                    <option value="2">Khác</option>
                                                </select>
                                            </div>
                                            <div className="col-md-4">
                                                <label className="form-label fw-semibold">Quốc gia</label>
                                                <input type="text" className="form-control" name="country" value={formData.country} onChange={handleInputChange} />
                                            </div>
                                            <div className="col-md-4">
                                                <label className="form-label fw-semibold">Thành phố</label>
                                                <input type="text" className="form-control" name="city" value={formData.city} onChange={handleInputChange} />
                                            </div>
                                            <div className="col-md-4">
                                                <label className="form-label fw-semibold">Địa chỉ</label>
                                                <input type="text" className="form-control" name="address" value={formData.address} onChange={handleInputChange} />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="modal-footer bg-light">
                                        <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Hủy</button>
                                        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>Lưu Thay Đổi</button>
                                    </div>
                                </form>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TechnicianManagement;