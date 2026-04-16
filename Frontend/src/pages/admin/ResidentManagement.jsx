import React, { useState, useEffect } from 'react';
import api from '../../utils/axiosConfig';
import Pagination from '../../components/common/Pagination';
import CreateAccountForm from '../../components/common/CreateAccountForm';
import { notify, confirmAction, confirmDelete } from '../../utils/notificationAlert';

const ResidentManagement = () => {
    // --- STATES CƠ BẢN ---
    const [residents, setResidents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // --- PHÂN TRANG & BỘ LỌC ---
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('');

    const [editId, setEditId] = useState(null);
    const initialFormState = {
        email: '', userName: '', fullName: '',
        phoneNumber: '', identityCard: '', country: '', city: '', address: '',
        birthDay: '', sex: ''
    };
    const [formData, setFormData] = useState(initialFormState);

    const [viewDetailResident, setViewDetailResident] = useState(null);

    const [importFile, setImportFile] = useState(null);
    const [importResult, setImportResult] = useState(null);

    // --- STATE CHO DANH SÁCH ĐÃ XÓA ---
    const [isTrashMode, setIsTrashMode] = useState(false);
    const [deletedResidents, setDeletedResidents] = useState([]);

    // Tự động reset trang khi đổi filter
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filterStatus, isTrashMode]);

    // --- UTILS ---
    const getRelationshipName = (id, nameObj) => {
        if (nameObj) return nameObj;
        switch (id) {
            case 1: return "Chủ hộ";
            case 2: return "Vợ/Chồng";
            case 3: return "Con cái";
            case 4: return "Bố/Mẹ";
            case 5: return "Anh/Chị/Em";
            default: return "Thành viên";
        }
    };

    // --- HÀM GỘP DỮ LIỆU (1 CƯ DÂN -> NHIỀU PHÒNG) ---
    const groupResidents = (flatList) => {
        const grouped = flatList.reduce((acc, curr) => {
            if (!acc[curr.accountId]) {
                acc[curr.accountId] = { ...curr, apartments: [] };
            }
            // Nếu có phòng và phòng chưa tồn tại trong mảng apartments của người này
            if (curr.apartmentCode && !acc[curr.accountId].apartments.some(a => a.apartmentId === curr.apartmentId)) {
                acc[curr.accountId].apartments.push({
                    apartmentId: curr.apartmentId,
                    apartmentCode: curr.apartmentCode,
                    relationshipId: curr.relationshipId,
                    relationshipName: getRelationshipName(curr.relationshipId, curr.relationship?.relationshipName)
                });
            }
            return acc;
        }, {});
        return Object.values(grouped);
    };

    // --- API LẤY DATA ---
    const fetchData = async () => {
        try {
            setLoading(true);
            const resData = await api.get('/Residents/GetAllResidents');
            const rList = resData.data?.data || resData.data;

            // Ép kiểu mảng phẳng thành mảng gộp
            const groupedList = groupResidents(Array.isArray(rList) ? rList : []);
            setResidents(groupedList);
        } catch (error) {
            notify.error("Không thể tải danh sách cư dân.");
            setResidents([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchDeletedData = async () => {
        try {
            setLoading(true);
            const res = await api.get('/Residents/Deleted');
            const list = res.data?.data || res.data;

            const groupedList = groupResidents(Array.isArray(list) ? list : []);
            setDeletedResidents(groupedList);
        } catch (error) {
            notify.error("Lỗi tải danh sách đã xóa.");
            setDeletedResidents([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const extractErrorMessage = (error, defaultMsg) => {
        if (error.response?.data?.errors) {
            const firstErrorKey = Object.keys(error.response.data.errors)[0];
            return error.response.data.errors[firstErrorKey][0];
        }
        return error.response?.data?.message || error.response?.data || defaultMsg;
    };

    // --- CÁC HÀM XỬ LÝ XÓA / KHÔI PHỤC ---
    const handleSoftDelete = async (id) => {
        const { isConfirmed } = await confirmDelete.fire({
            title: 'Chuyển vào Thùng rác?',
            text: "Bạn có chắc chắn muốn chuyển cư dân này vào danh sách đã xóa?"
        });
        if (!isConfirmed) return;
        try {
            const res = await api.delete(`/Residents/DeleteResident/${id}`);
            notify.success(res.data?.message || "Đã chuyển vào Danh sách đã xóa!");
            fetchData();
        } catch (error) { notify.error(extractErrorMessage(error, "Không thể xóa.")); }
    };

    const handleRestore = async (id) => {
        const { isConfirmed } = await confirmAction.fire({
            title: 'Khôi phục tài khoản?', text: 'Tài khoản này sẽ hoạt động trở lại.', confirmButtonText: '<i class="bi bi-arrow-counterclockwise me-1"></i> Khôi phục'
        });
        if (!isConfirmed) return;
        try {
            const res = await api.put(`/Residents/Restore/${id}`);
            notify.success(res.data?.message || "Đã khôi phục tài khoản thành công!");
            fetchDeletedData();
            fetchData();
        } catch (error) { notify.error(extractErrorMessage(error, "Không thể khôi phục.")); }
    };

    const handleHardDelete = async (id) => {
        const { isConfirmed } = await confirmDelete.fire({
            title: 'CẢNH BÁO ĐỎ!', html: `Hành động này sẽ <b>xóa vĩnh viễn</b> cư dân khỏi hệ thống và không thể khôi phục!<br/>Bạn chắc chắn chứ?`, icon: 'error', confirmButtonText: '<i class="bi bi-trash3 me-1"></i> Xóa vĩnh viễn'
        });
        if (!isConfirmed) return;
        try {
            const res = await api.delete(`/Residents/HardDelete/${id}`);
            notify.success(res.data?.message || "Đã xóa vĩnh viễn thành công!");
            fetchDeletedData();
        } catch (error) { notify.error(extractErrorMessage(error, "Không thể xóa vĩnh viễn.")); }
    };

    const handleToggleStatus = async (id) => {
        try {
            const res = await api.put(`/Residents/toggleStatus/${id}`);
            notify.success(res.data?.message || "Đã thay đổi trạng thái!");
            fetchData();
        } catch (error) { notify.error(extractErrorMessage(error, "Không thể đổi trạng thái.")); }
    };

    // --- CÁC HÀM FORM & MODAL ---
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleOpenModal = (resident = null) => {
        if (resident) {
            setEditId(resident.accountId);
            let birthDay = '';
            if (resident.info?.birthday) birthDay = resident.info.birthday.split('T')[0];
            else if (resident.birthDay) birthDay = resident.birthDay.split('T')[0];
            else if (resident.dayOfBirth) birthDay = resident.dayOfBirth.split('T')[0];

            let sex = '';
            if (resident.info?.sex !== null && resident.info?.sex !== undefined) sex = resident.info.sex.toString();
            else if (resident.sex !== null && resident.sex !== undefined) sex = resident.sex.toString();

            const country = resident.info?.country || resident.country || resident.Country || '';
            const city = resident.info?.city || resident.city || resident.City || '';

            setFormData({
                email: resident.email || '', userName: resident.userName || '',
                fullName: resident.fullName || '', phoneNumber: resident.phoneNumber || '',
                identityCard: resident.identityCard || '', country, city, address: resident.address || '',
                birthDay, sex
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
                    email: formData.email.trim() || null, fullName: formData.fullName,
                    phoneNumber: formData.phoneNumber.trim() || null, identityCard: formData.identityCard,
                    country: formData.country.trim() || null, city: formData.city.trim() || null,
                    address: formData.address.trim() || null, birthDay: formData.birthDay || null,
                    sex: formData.sex !== '' ? Number(formData.sex) : null
                };
                const res = await api.put(`/Residents/UpdateResident/${editId}`, updatePayload);
                notify.success(res.data?.message || "Cập nhật thành công!");
            } else {
                const res = await api.post('/Residents/CreateResident', formData);
                notify.success(res.data?.message || "Thêm Cư dân thành công!");
            }
            fetchData();
            document.getElementById('closeResModal').click();
        } catch (error) {
            notify.error(extractErrorMessage(error, "Lỗi đầu vào, vui lòng kiểm tra lại!"));
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- XỬ LÝ IMPORT EXCEL ---
    const handleFileChange = (e) => {
        setImportFile(e.target.files[0]);
        setImportResult(null);
    };

    const handleImportExcel = async (e) => {
        e.preventDefault();
        if (!importFile) return notify.warning("Vui lòng chọn file Excel!");
        setIsSubmitting(true);
        const formPayload = new FormData();
        formPayload.append('File', importFile);
        try {
            const res = await api.post('/Residents/import', formPayload, { headers: { 'Content-Type': 'multipart/form-data' } });
            setImportResult(res.data.data);
            notify.success(res.data?.message || "Import hoàn tất!");
            fetchData();
        } catch (error) { notify.error(extractErrorMessage(error, "Có lỗi xảy ra khi đọc file.")); }
        finally { setIsSubmitting(false); }
    };

    // --- LOGIC BỘ LỌC & PHÂN TRANG ---
    const activeList = isTrashMode ? deletedResidents : residents;

    const filteredList = activeList.filter(res => {
        const term = searchTerm.toLowerCase();
        const matchSearch = term ? (
            (res.fullName?.toLowerCase() || '').includes(term) ||
            (res.code?.toLowerCase() || '').includes(term) ||
            (res.phoneNumber || '').includes(term) ||
            (res.email?.toLowerCase() || '').includes(term) ||
            // Lọc luôn cả mã phòng
            res.apartments.some(a => a.apartmentCode.toLowerCase().includes(term))
        ) : true;

        const matchStatus = filterStatus ? res.status === Number(filterStatus) : true;
        return matchSearch && matchStatus;
    });

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredList.slice(indexOfFirstItem, indexOfLastItem);

    return (
        <div className="container-fluid p-0">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-start mb-4">
                <div>
                    <h2 className="fw-bold mb-0">Quản lý Cư dân</h2>
                    <div className="text-muted small mt-2">Quản lý hồ sơ và danh sách phòng ở của cư dân</div>
                </div>
                <div className="d-flex align-items-center gap-2">
                    <button className="btn btn-success" data-bs-toggle="modal" data-bs-target="#importModal" onClick={() => { setImportFile(null); setImportResult(null); }}>
                        <i className="bi bi-file-earmark-excel me-2"></i> Import Excel
                    </button>
                    <button className="btn btn-primary" onClick={() => handleOpenModal()} data-bs-toggle="modal" data-bs-target="#residentModal" style={{ minWidth: '150px' }}>
                        <i className="bi bi-person-plus-fill me-2"></i> Thêm Cư dân
                    </button>
                    <button className={`btn ${isTrashMode ? 'btn-secondary' : 'btn-outline-danger'}`} onClick={() => { if (!isTrashMode) fetchDeletedData(); setIsTrashMode(!isTrashMode); }}>
                        <i className={`bi ${isTrashMode ? 'bi-arrow-left' : 'bi-trash'} me-2`}></i> {isTrashMode ? 'Quay lại' : 'Đã xóa'}
                    </button>
                </div>
            </div>

            {/* BỘ LỌC */}
            <div className="card shadow-sm border-0 mb-4 bg-light">
                <div className="card-body py-3">
                    <div className="row g-3">
                        <div className="col-md-6">
                            <div className="input-group">
                                <span className="input-group-text bg-white border-end-0 text-muted"><i className="bi bi-search"></i></span>
                                <input
                                    type="text"
                                    className="form-control border-start-0 ps-0"
                                    placeholder="Tìm theo Mã cư dân, Tên, SĐT, Email hoặc Mã phòng..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="col-md-4">
                            <div className="input-group">
                                <span className="input-group-text bg-white text-muted"><i className="bi bi-funnel"></i></span>
                                <select className="form-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                                    <option value="">-- Mọi trạng thái tài khoản --</option>
                                    <option value="1">Hoạt động</option>
                                    <option value="0">Đã khóa</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* BẢNG DỮ LIỆU */}
            <div className="card shadow-sm border-0">
                <div className="card-body p-0">
                    {loading ? (
                        <div className="text-center p-5"><div className="spinner-border text-primary"></div></div>
                    ) : filteredList.length === 0 ? (
                        <div className="text-center p-5 text-muted">
                            <i className="bi bi-search fs-1 d-block mb-3 opacity-25"></i>
                            Không tìm thấy dữ liệu cư dân phù hợp.
                        </div>
                    ) : (
                        <>
                            <div className="table-responsive" style={{ minHeight: '400px' }}>
                                <table className="table table-hover table-bordered mb-0 align-middle text-center">
                                    <thead className="table-light">
                                        <tr>
                                            <th>STT</th>
                                            <th>Mã Cư Dân</th>
                                            <th className="text-start">Họ và Tên</th>
                                            <th>Thông tin liên hệ</th>
                                            <th>Phòng ở</th>
                                            <th>Trạng thái Tài khoản</th>
                                            <th>Hành động</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {currentItems.map((res, idx) => {
                                            const stt = indexOfFirstItem + idx + 1;
                                            return (
                                                <tr key={res.accountId} className={isTrashMode ? "bg-light" : ""}>
                                                    <td>{stt}</td>
                                                    <td className={`fw-bold ${isTrashMode ? 'text-muted' : 'text-primary'}`}>{res.code}</td>
                                                    <td className="text-start">
                                                        <div className={`fw-semibold ${isTrashMode ? 'text-decoration-line-through text-muted' : 'text-dark'}`}>{res.fullName}</div>
                                                        <div className="small text-muted">@{res.userName}</div>
                                                    </td>
                                                    <td>
                                                        <div className="small fw-medium">{res.phoneNumber || 'N/A'}</div>
                                                        <div className="small text-muted">{res.email || 'N/A'}</div>
                                                    </td>

                                                    {/* CỘT PHÒNG Ở: Hiển thị dạng Badge + N */}
                                                    <td>
                                                        {res.apartments && res.apartments.length > 0 ? (
                                                            <div className="d-flex justify-content-center align-items-center flex-wrap gap-1">
                                                                <span className="badge bg-info text-dark border px-2 py-1 rounded-pill shadow-sm">
                                                                    <i className="bi bi-door-open-fill me-1"></i> {res.apartments[0].apartmentCode}
                                                                </span>
                                                                {res.apartments.length > 1 && (
                                                                    <span
                                                                        className="badge bg-secondary bg-opacity-10 text-secondary border px-2 py-1 rounded-pill"
                                                                        title={res.apartments.slice(1).map(a => `P.${a.apartmentCode}`).join(' | ')}
                                                                        style={{ cursor: 'help' }}
                                                                    >
                                                                        +{res.apartments.length - 1} khác
                                                                    </span>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <span className="badge bg-light text-muted border px-2 py-1 rounded-pill">Chưa xếp phòng</span>
                                                        )}
                                                    </td>

                                                    <td>
                                                        {isTrashMode ? (
                                                            <span className="badge bg-secondary px-3 py-2 border"><i className="bi bi-lock-fill me-1"></i> Đã khóa (Đã xóa)</span>
                                                        ) : (
                                                            <button type="button" className={`btn btn-sm rounded-pill fw-bold text-white shadow-sm ${res.status === 1 ? 'btn-success' : 'btn-danger'}`} onClick={() => handleToggleStatus(res.accountId)} title="Nhấn để Khóa/Mở khóa tài khoản" style={{ minWidth: '110px' }}>
                                                                {res.status === 1 ? 'Hoạt động' : 'Đã khóa'}
                                                            </button>
                                                        )}
                                                    </td>
                                                    <td>
                                                        {!isTrashMode ? (
                                                            <div className="d-flex justify-content-center gap-2">
                                                                <button className="btn btn-sm btn-outline-info" onClick={() => setViewDetailResident(res)} data-bs-toggle="modal" data-bs-target="#viewDetailModal" title="Xem chi tiết hồ sơ & phòng ở">
                                                                    <i className="bi bi-eye"></i>
                                                                </button>
                                                                <button className="btn btn-sm btn-outline-warning" onClick={() => handleOpenModal(res)} data-bs-toggle="modal" data-bs-target="#residentModal" title="Sửa thông tin">
                                                                    <i className="bi bi-pencil-square"></i> Cập nhật
                                                                </button>
                                                                <button className="btn btn-sm btn-outline-danger" onClick={() => handleSoftDelete(res.accountId)} title="Chuyển vào Danh sách đã xóa">
                                                                    <i className="bi bi-trash"></i> Xóa
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <div className="d-flex justify-content-center gap-2">
                                                                <button className="btn btn-sm btn-success shadow-sm" onClick={() => handleRestore(res.accountId)} title="Khôi phục tài khoản">
                                                                    <i className="bi bi-arrow-counterclockwise me-1"></i> Khôi phục
                                                                </button>
                                                                <button className="btn btn-sm btn-danger shadow-sm" onClick={() => handleHardDelete(res.accountId)} title="Xóa vĩnh viễn">
                                                                    <i className="bi bi-x-octagon me-1"></i> Xóa cứng
                                                                </button>
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                            <Pagination totalItems={filteredList.length} itemsPerPage={itemsPerPage} currentPage={currentPage} onPageChange={setCurrentPage} />
                        </>
                    )}
                </div>
            </div>

            {/* ================================================== */}
            {/* MODAL 1: XEM CHI TIẾT CƯ DÂN & DANH SÁCH PHÒNG Ở */}
            {/* ================================================== */}
            <div className="modal fade" id="viewDetailModal" tabIndex="-1" aria-hidden="true">
                <div className="modal-dialog modal-xl modal-dialog-scrollable">
                    <div className="modal-content border-0 shadow-lg rounded-4">
                        <div className="modal-header bg-dark text-white border-0 px-4 py-3">
                            <h5 className="modal-title fw-bold">
                                <i className="bi bi-person-vcard me-2"></i> Hồ sơ Cư dân: {viewDetailResident?.fullName}
                            </h5>
                            <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div className="modal-body bg-light p-4">
                            {viewDetailResident && (
                                <div className="row g-4">
                                    {/* THÔNG TIN CÁ NHÂN */}
                                    <div className="col-lg-4">
                                        <div className="card border-0 shadow-sm rounded-4 h-100">
                                            <div className="card-header bg-white border-bottom-0 pt-4 pb-0">
                                                <h6 className="fw-bold text-primary text-uppercase mb-0">Thông tin cá nhân</h6>
                                            </div>
                                            <div className="card-body">
                                                <div className="text-center mb-4">
                                                    <img src={`https://ui-avatars.com/api/?name=${viewDetailResident.fullName}&background=random&size=100`} alt="Avatar" className="rounded-circle shadow-sm border" />
                                                    <h5 className="fw-bold mt-3 mb-1 text-dark">{viewDetailResident.fullName}</h5>
                                                    <div className="text-muted small">@{viewDetailResident.userName}</div>
                                                </div>
                                                <ul className="list-group list-group-flush small">
                                                    <li className="list-group-item px-0 d-flex justify-content-between">
                                                        <span className="text-muted">Mã định danh:</span> <span className="fw-bold">{viewDetailResident.code}</span>
                                                    </li>
                                                    <li className="list-group-item px-0 d-flex justify-content-between">
                                                        <span className="text-muted">SĐT:</span> <span className="fw-medium">{viewDetailResident.phoneNumber || 'N/A'}</span>
                                                    </li>
                                                    <li className="list-group-item px-0 d-flex justify-content-between">
                                                        <span className="text-muted">Email:</span> <span className="fw-medium">{viewDetailResident.email || 'N/A'}</span>
                                                    </li>
                                                    <li className="list-group-item px-0 d-flex justify-content-between">
                                                        <span className="text-muted">CCCD:</span> <span className="fw-medium">{viewDetailResident.identityCard || 'N/A'}</span>
                                                    </li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>

                                    {/* DANH SÁCH CĂN HỘ SỞ HỮU/THUÊ */}
                                    <div className="col-lg-8">
                                        <div className="card border-0 shadow-sm rounded-4 h-100">
                                            <div className="card-header bg-white border-bottom-0 pt-4 pb-2 d-flex justify-content-between align-items-center">
                                                <h6 className="fw-bold text-success text-uppercase mb-0">Danh sách Căn hộ & Hợp đồng</h6>
                                                <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 rounded-pill">
                                                    Tổng cộng: {viewDetailResident.apartments.length} căn
                                                </span>
                                            </div>
                                            <div className="card-body bg-light rounded-bottom-4 p-3">
                                                {viewDetailResident.apartments.length === 0 ? (
                                                    <div className="text-center text-muted p-5 bg-white rounded-4 border border-dashed">
                                                        <i className="bi bi-house-x display-4 d-block mb-3 opacity-25"></i>
                                                        Cư dân này hiện chưa đứng tên trên hợp đồng căn hộ nào.
                                                    </div>
                                                ) : (
                                                    <div className="row g-3">
                                                        {viewDetailResident.apartments.map((apt, index) => (
                                                            <div className="col-md-6" key={index}>
                                                                <div className="card border shadow-sm rounded-3 hover-shadow-sm h-100">
                                                                    <div className="card-body p-3">
                                                                        <div className="d-flex justify-content-between align-items-start mb-2">
                                                                            <h5 className="fw-bold text-info mb-0">
                                                                                <i className="bi bi-door-open-fill me-2"></i>Phòng {apt.apartmentCode}
                                                                            </h5>
                                                                        </div>
                                                                        <hr className="my-2 border-secondary opacity-25" />
                                                                        <div className="d-flex align-items-center justify-content-between small">
                                                                            <span className="text-muted">Vai trò hợp đồng:</span>
                                                                            <span className={`badge ${apt.relationshipId === 1 ? 'bg-danger' : 'bg-primary'} rounded-pill`}>
                                                                                {apt.relationshipName}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="modal-footer bg-white border-top-0 px-4 py-3">
                            <button type="button" className="btn btn-secondary rounded-pill px-4" data-bs-dismiss="modal">Đóng</button>
                        </div>
                    </div>
                </div>
            </div>

            {/* MODAL 2: THÊM / SỬA CƯ DÂN (GIỮ NGUYÊN) */}
            <div className="modal fade" id="residentModal" tabIndex="-1" aria-hidden="true">
                <div className={`modal-dialog ${editId ? 'modal-lg' : 'modal-lg modal-dialog-scrollable'}`}>
                    <div className="modal-content border-0">
                        {!editId && (
                            <CreateAccountForm type="resident" onSuccess={() => { fetchData(); document.getElementById('closeResModal').click(); }} onCancel={() => document.getElementById('closeResModal').click()} />
                        )}
                        <button type="button" id="closeResModal" data-bs-dismiss="modal" style={{ display: 'none' }} aria-hidden="true" />
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
                                            <div className="col-md-6"><label className="form-label fw-semibold">Họ và Tên (*)</label><input type="text" className="form-control" name="fullName" value={formData.fullName} onChange={handleInputChange} required /></div>
                                            <div className="col-md-6"><label className="form-label fw-semibold">Email (*)</label><input type="email" className="form-control" name="email" value={formData.email} onChange={handleInputChange} required /></div>
                                            <div className="col-md-6"><label className="form-label fw-semibold">Số CCCD</label><input type="text" className="form-control" name="identityCard" value={formData.identityCard} onChange={handleInputChange} /></div>
                                            <div className="col-md-6"><label className="form-label fw-semibold">Số điện thoại</label><input type="text" className="form-control" name="phoneNumber" value={formData.phoneNumber} onChange={handleInputChange} /></div>
                                            <div className="col-md-6"><label className="form-label fw-semibold">Ngày sinh</label><input type="date" className="form-control" name="birthDay" value={formData.birthDay} onChange={handleInputChange} max={new Date().toISOString().split('T')[0]} /></div>
                                            <div className="col-md-6">
                                                <label className="form-label fw-semibold">Giới tính</label>
                                                <select className="form-select" name="sex" value={formData.sex} onChange={handleInputChange}>
                                                    <option value="">-- Chọn giới tính --</option><option value="0">Nam</option><option value="1">Nữ</option><option value="2">Khác</option>
                                                </select>
                                            </div>
                                            <div className="col-md-4"><label className="form-label fw-semibold">Quốc gia</label><input type="text" className="form-control" name="country" value={formData.country} onChange={handleInputChange} /></div>
                                            <div className="col-md-4"><label className="form-label fw-semibold">Thành phố</label><input type="text" className="form-control" name="city" value={formData.city} onChange={handleInputChange} /></div>
                                            <div className="col-md-4"><label className="form-label fw-semibold">Địa chỉ chi tiết</label><input type="text" className="form-control" name="address" value={formData.address} onChange={handleInputChange} /></div>
                                        </div>
                                    </div>
                                    <div className="modal-footer bg-light"><button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Hủy</button><button type="submit" className="btn btn-primary" disabled={isSubmitting}>Lưu Thay Đổi</button></div>
                                </form>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* MODAL 3: IMPORT EXCEL (GIỮ NGUYÊN) */}
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
                                {importResult && (
                                    <div className="mt-4 p-3 border rounded bg-light">
                                        <h6 className="fw-bold mb-2">Kết quả xử lý:</h6>
                                        <p className="mb-1 text-primary">Tổng số dòng đã quét: <strong>{importResult.totalRows}</strong></p>
                                        <p className="mb-1 text-success">Thành công: <strong>{importResult.successCount}</strong></p>
                                        <p className="mb-2 text-danger">Thất bại: <strong>{importResult.failedCount}</strong></p>
                                        {importResult.errors && importResult.errors.length > 0 && (
                                            <div className="bg-white p-2 border border-danger rounded" style={{ maxHeight: '150px', overflowY: 'auto' }}>
                                                {importResult.errors.map((err, i) => (<div key={i} className="text-danger small mb-1">- {err}</div>))}
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

            <style>{`
                .hover-shadow-sm:hover {
                    box-shadow: 0 .125rem .25rem rgba(0,0,0,.075)!important;
                    transform: translateY(-2px);
                    transition: all 0.2s ease-in-out;
                }
                .border-dashed { border-style: dashed !important; border-width: 2px !important; }
            `}</style>
        </div>
    );
};

export default ResidentManagement;