import React, { useState, useEffect, useRef } from 'react';
import api from '../../utils/axiosConfig';
import Pagination from '../../components/common/Pagination';
import CreateAccountForm from '../../components/common/CreateAccountForm';

const ResidentManagement = () => {
    const [residents, setResidents] = useState([]);
    const [apartments, setApartments] = useState([]); 
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    
    const [editId, setEditId] = useState(null);
    const initialFormState = {
        email: '', userName: '', password: '', fullName: '',
        phoneNumber: '', identityCard: '', country: 'Việt Nam', city: 'Hà Nội', address: ''
    };
    const [formData, setFormData] = useState(initialFormState);

    
    const [selectedResident, setSelectedResident] = useState(null);
    const [selectedApartmentId, setSelectedApartmentId] = useState('');

    
    const [importFile, setImportFile] = useState(null);
    const [importResult, setImportResult] = useState(null);

    
    const fetchData = async () => {
        try {
            setLoading(true);
            const [resData, aptData] = await Promise.all([
                api.get('/Residents/GetAllResidents'),
                api.get('/Apartments') 
            ]);

            const rList = resData.data.data ? resData.data.data : resData.data;
            const aList = aptData.data.data ? aptData.data.data : aptData.data;

            setResidents(Array.isArray(rList) ? rList : []);
            setApartments(Array.isArray(aList) ? aList : []);

            
            setCurrentPage(1);
        } catch (error) {
            console.error("Lỗi khi tải dữ liệu:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    
    const handleOpenModal = (resident = null) => {
        if (resident) {
            setEditId(resident.accountId);
            setFormData({
                email: resident.email || '',
                userName: resident.userName || '',
                password: '', 
                fullName: resident.fullName || '',
                phoneNumber: resident.phoneNumber || '',
                identityCard: resident.identityCard || '',
                country: resident.country || 'Việt Nam',
                city: resident.city || 'Hà Nội',
                address: resident.address || ''
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
                    email: formData.email, fullName: formData.fullName,
                    phoneNumber: formData.phoneNumber, identityCard: formData.identityCard,
                    country: formData.country, city: formData.city, address: formData.address
                };
                const res = await api.put(`/Residents/UpdateResident/${editId}`, updatePayload);
                alert(res.data?.message || "Cập nhật thành công!");
            } else {
                const res = await api.post('/Residents/CreateResident', formData);
                alert(res.data?.message || "Thêm Cư dân thành công!");
            }
            fetchData();
            document.getElementById('closeResModal').click();
        } catch (error) {
            let errorMessage = "Lỗi đầu vào, vui lòng kiểm tra lại!";

            
            if (error.response?.data?.errors) {
                const firstErrorKey = Object.keys(error.response.data.errors)[0];
                errorMessage = error.response.data.errors[firstErrorKey][0];
            } else if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            }

            alert("LỖI: " + errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    
    const handleOpenAssignModal = (resident) => {
        setSelectedResident(resident);
        setSelectedApartmentId('');
    };

    const handleAssignRoom = async () => {
        if (!selectedApartmentId) return alert("Vui lòng chọn một căn hộ!");
        setIsSubmitting(true);
        try {
            const payload = { accountId: selectedResident.accountId, apartmentId: Number(selectedApartmentId), relationshipId: null };
            const res = await api.post('/Residents/assign', payload);
            alert(res.data?.message || "Đã gán phòng thành công!");
            document.getElementById('closeAssignModal').click();
            fetchData();
        } catch (error) {
            alert("LỖI: " + (error.response?.data?.message || "Không thể gán phòng."));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRemoveRoom = async () => {
        if (!selectedApartmentId) return alert("Vui lòng chọn căn hộ muốn gỡ!");
        if (window.confirm(`CẢNH BÁO: Gỡ cư dân sẽ làm vô hiệu hóa Hợp đồng, chuyển phòng thành Trống và khóa tài khoản Cư dân. Bạn có chắc chắn?`)) {
            setIsSubmitting(true);
            try {
                const payload = { accountId: selectedResident.accountId, apartmentId: Number(selectedApartmentId), relationshipId: null };
                const res = await api.post('/Residents/remove', payload);
                alert(res.data?.message || "Đã gỡ cư dân khỏi phòng!");
                document.getElementById('closeAssignModal').click();
                fetchData();
            } catch (error) {
                alert("LỖI: " + (error.response?.data?.message || "Không thể gỡ."));
            } finally {
                setIsSubmitting(false);
            }
        }
    };

    
    const handleFileChange = (e) => {
        setImportFile(e.target.files[0]);
        setImportResult(null);
    };

    const handleImportExcel = async (e) => {
        e.preventDefault();
        if (!importFile) return alert("Vui lòng chọn file Excel!");

        setIsSubmitting(true);
        const formPayload = new FormData();
        formPayload.append('File', importFile);

        try {
            const res = await api.post('/Residents/import', formPayload, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setImportResult(res.data.data);
            alert(res.data?.message || "Import hoàn tất!");
            fetchData();
        } catch (error) {
            alert("LỖI IMPORT: " + (error.response?.data?.message || "Có lỗi xảy ra khi đọc file."));
        } finally {
            setIsSubmitting(false);
        }
    };

    
    
    
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    
    const currentResidents = residents.slice(indexOfFirstItem, indexOfLastItem);

    return (
        <div className="container-fluid p-0">
            {/* TIÊU ĐỀ & NÚT */}
            <div className="d-flex justify-content-between align-items-start mb-4">
                <div>
                    <h2 className="fw-bold mb-0">Quản lý Cư dân</h2>
                    <div className="text-muted small mt-2">Quản lý hồ sơ và điều phối phòng ở cho cư dân</div>
                </div>
                <div className="d-flex align-items-center">
                    <button className="btn btn-success me-3" data-bs-toggle="modal" data-bs-target="#importModal" onClick={() => { setImportFile(null); setImportResult(null); }}>
                        <i className="bi bi-file-earmark-excel me-2"></i> Import Excel
                    </button>
                    <button className="btn btn-primary" onClick={() => handleOpenModal()} data-bs-toggle="modal" data-bs-target="#residentModal" style={{ minWidth: '150px' }}>
                        <i className="bi bi-person-plus-fill me-2"></i> Thêm Cư dân
                    </button>
                </div>
            </div>

            {/* BẢNG DỮ LIỆU */}
            <div className="card shadow-sm border-0">
                <div className="card-body p-0">
                    {loading ? (
                        <div className="text-center p-5"><div className="spinner-border text-primary"></div></div>
                    ) : residents.length === 0 ? (
                        <div className="text-center p-5 text-muted">Chưa có dữ liệu Cư dân nào.</div>
                    ) : (
                        <>
                            <div className="table-responsive">
                                <table className="table table-hover table-bordered mb-0 align-middle text-center">
                                    <thead className="table-light">
                                        <tr>
                                            <th>STT</th>
                                            <th>Mã Cư Dân</th>
                                            <th className="text-start">Họ và Tên</th>
                                            <th>Thông tin liên hệ</th>
                                            <th>CCCD</th>
                                            <th>Trạng thái Hệ thống</th>
                                            <th>Hành động</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {/* Render mảng currentResidents thay vì residents */}
                                        {currentResidents.map((res, idx) => {
                                            
                                            const stt = indexOfFirstItem + idx + 1;

                                            return (
                                                <tr key={res.accountId}>
                                                    <td>{stt}</td>
                                                    <td className="fw-bold text-primary">{res.code}</td>
                                                    <td className="text-start">
                                                        <div className="fw-semibold">{res.fullName}</div>
                                                        <div className="small text-muted">@{res.userName}</div>
                                                    </td>
                                                    <td>
                                                        <div className="small">{res.phoneNumber}</div>
                                                        <div className="small text-muted">{res.email}</div>
                                                    </td>
                                                    <td>{res.identityCard}</td>
                                                    <td>
                                                        <span className={`badge rounded-pill ${res.status === 1 ? 'bg-success' : 'bg-secondary'}`}>
                                                            {res.status === 1 ? 'Đang hoạt động' : 'Vô hiệu hóa'}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <button className="btn btn-sm btn-outline-info me-2" onClick={() => handleOpenAssignModal(res)} data-bs-toggle="modal" data-bs-target="#assignModal" title="Xử lý phòng ở">
                                                            <i className="bi bi-house-door me-1"></i> Xử lý Phòng
                                                        </button>
                                                        <button className="btn btn-sm btn-outline-warning" onClick={() => handleOpenModal(res)} data-bs-toggle="modal" data-bs-target="#residentModal">
                                                            <i className="bi bi-pencil-square me-1"></i> Sửa
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* NHÚNG COMPONENT PHÂN TRANG VÀO ĐÂY */}
                            <Pagination
                                totalItems={residents.length}
                                itemsPerPage={itemsPerPage}
                                currentPage={currentPage}
                                onPageChange={setCurrentPage}
                            />
                        </>
                    )}
                </div>
            </div>

            {/* 1. MODAL THÊM / SỬA CƯ DÂN */}
            <div className="modal fade" id="residentModal" tabIndex="-1" aria-hidden="true">
                <div className={`modal-dialog ${editId ? 'modal-lg' : 'modal-lg modal-dialog-scrollable'}`}>
                    <div className="modal-content border-0">

                        {/* ── CREATE MODE: dùng CreateAccountForm thông minh ── */}
                        {!editId && (
                            <CreateAccountForm
                                type="resident"
                                onSuccess={() => {
                                    fetchData();
                                    document.getElementById('closeResModal').click();
                                }}
                                onCancel={() => document.getElementById('closeResModal').click()}
                            />
                        )}

                        {/* Nút đóng ẩn dùng để đóng modal từ JS */}
                        <button
                            type="button"
                            id="closeResModal"
                            data-bs-dismiss="modal"
                            style={{ display: 'none' }}
                            aria-hidden="true"
                        />

                        {/* ── EDIT MODE: form cập nhật đơn giản ── */}
                        {!!editId && (
                            <>
                                <div className="modal-header text-white" style={{ backgroundColor: '#122240' }}>
                                    <h5 className="modal-title fw-bold">Cập Nhật Hồ Sơ Cư Dân</h5>
                                    <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                                </div>
                                <form onSubmit={handleSubmit}>
                                    <div className="modal-body">
                                        <div className="row g-3">
                                            <div className="col-12"><h6 className="fw-bold text-primary mb-0 border-bottom pb-2">Thông tin cá nhân</h6></div>
                                            <div className="col-md-6">
                                                <label className="form-label fw-semibold">Họ và Tên (*)</label>
                                                <input type="text" className="form-control" name="fullName" value={formData.fullName} onChange={handleInputChange} required />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label fw-semibold">Email (*)</label>
                                                <input type="email" className="form-control" name="email" value={formData.email} onChange={handleInputChange} required />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label fw-semibold">Số CCCD</label>
                                                <input type="text" className="form-control" name="identityCard" value={formData.identityCard} onChange={handleInputChange} />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label fw-semibold">Số điện thoại</label>
                                                <input type="text" className="form-control" name="phoneNumber" value={formData.phoneNumber} onChange={handleInputChange} />
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
                                                <label className="form-label fw-semibold">Địa chỉ chi tiết</label>
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

            {/* 2. MODAL GÁN / GỠ PHÒNG */}
            <div className="modal fade" id="assignModal" tabIndex="-1" aria-hidden="true">
                <div className="modal-dialog">
                    <div className="modal-content">
                        <div className="modal-header bg-info text-white">
                            <h5 className="modal-title fw-bold">Xử lý Phòng Ở</h5>
                            <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal" id="closeAssignModal"></button>
                        </div>
                        <div className="modal-body">
                            {selectedResident && (
                                <div className="alert alert-secondary mb-3">
                                    Đang xử lý cho: <strong>{selectedResident.fullName}</strong> ({selectedResident.code})
                                </div>
                            )}
                            <label className="form-label fw-semibold">Chọn Căn Hộ Mục Tiêu</label>
                            <select className="form-select border-info mb-3" value={selectedApartmentId} onChange={(e) => setSelectedApartmentId(e.target.value)}>
                                <option value="">-- Chọn một căn hộ --</option>
                                {apartments.map(apt => (
                                    <option key={apt.apartmentId} value={apt.apartmentId}>
                                        {apt.apartmentCode} - {apt.apartmentName} (Tầng {apt.floorNumber})
                                    </option>
                                ))}
                            </select>

                            <div className="text-muted small mb-3">
                                <i className="bi bi-info-circle text-primary"></i> <strong>Gán Cư Dân:</strong> Sẽ đưa cư dân vào phòng này. Nếu phòng đang Trống, sẽ tự động chuyển sang Đang Thuê.<br /><br />
                                <i className="bi bi-exclamation-triangle text-danger"></i> <strong>Gỡ Cư Dân:</strong> (Chỉ dùng khi trả phòng/hết hợp đồng). Hệ thống sẽ Vô hiệu hóa hợp đồng, chuyển phòng về Trống và Khóa tài khoản cư dân.
                            </div>
                        </div>
                        <div className="modal-footer bg-light d-flex justify-content-between">
                            <button type="button" className="btn btn-outline-danger" onClick={handleRemoveRoom} disabled={isSubmitting || !selectedApartmentId}>
                                <i className="bi bi-box-arrow-right"></i> Gỡ Cư Dân
                            </button>
                            <button type="button" className="btn btn-info text-white fw-bold" onClick={handleAssignRoom} disabled={isSubmitting || !selectedApartmentId}>
                                <i className="bi bi-house-add"></i> Gán Cư Dân Vào Phòng
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. MODAL IMPORT EXCEL */}
            <div className="modal fade" id="importModal" tabIndex="-1" aria-hidden="true">
                <div className="modal-dialog modal-lg">
                    <div className="modal-content">
                        <div className="modal-header bg-success text-white">
                            <h5 className="modal-title fw-bold">Nhập Danh Sách Từ Excel</h5>
                            <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <form onSubmit={handleImportExcel}>
                            <div className="modal-body">
                                <div className="mb-3">
                                    <label className="form-label fw-semibold">Chọn file Excel (.xlsx)</label>
                                    <input type="file" className="form-control border-success" accept=".xlsx" onChange={handleFileChange} required />
                                </div>
                                <div className="alert alert-warning small">
                                    <strong>Cấu trúc file bắt buộc (Từ cột A đến I):</strong><br />
                                    Email | UserName | FullName | Phone | CCCD | Country | City | Address | ApartmentCode (Mã phòng: Tùy chọn)
                                </div>

                                {/* Báo cáo kết quả Import */}
                                {importResult && (
                                    <div className="mt-4 p-3 border rounded bg-light">
                                        <h6 className="fw-bold mb-2">Kết quả xử lý:</h6>
                                        <p className="mb-1 text-primary">Tổng số dòng đã quét: <strong>{importResult.totalRows}</strong></p>
                                        <p className="mb-1 text-success">Thành công: <strong>{importResult.successCount}</strong></p>
                                        <p className="mb-2 text-danger">Thất bại: <strong>{importResult.failedCount}</strong></p>

                                        {importResult.errors && importResult.errors.length > 0 && (
                                            <div className="bg-white p-2 border border-danger rounded" style={{ maxHeight: '150px', overflowY: 'auto' }}>
                                                {importResult.errors.map((err, i) => (
                                                    <div key={i} className="text-danger small mb-1">- {err}</div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                            <div className="modal-footer bg-light">
                                <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Đóng</button>
                                <button type="submit" className="btn btn-success" disabled={isSubmitting || !importFile}>
                                    {isSubmitting ? 'Đang đọc file...' : 'Tiến Hành Import'}
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