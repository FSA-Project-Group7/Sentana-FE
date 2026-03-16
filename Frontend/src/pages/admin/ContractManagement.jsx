import React, { useState, useEffect } from 'react';
import api from '../../utils/axiosConfig';
import Pagination from '../../components/common/Pagination';

const ContractManagement = () => {
    // --- 1. STATES ---
    const [contracts, setContracts] = useState([]);
    const [apartments, setApartments] = useState([]);
    const [residents, setResidents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Phân trang
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    // Quản lý các Modal
    const [activeModal, setActiveModal] = useState(null); // 'create_edit', 'extend', 'terminate', 'detail'
    const [selectedContract, setSelectedContract] = useState(null);
    const [detailData, setDetailData] = useState(null);

    // Form Data
    const [formData, setFormData] = useState({
        apartmentId: '', accountId: '', startDay: '', endDay: '', monthlyRent: '', deposit: '',
        newEndDate: '', terminationDate: '', additionalCost: 0
    });

    // --- 2. FETCH DATA ---
    const fetchData = async () => {
        try {
            setLoading(true);
            const [aptRes, resRes, contractRes] = await Promise.all([
                api.get('/Apartments'),
                api.get('/Residents/GetAllResidents'),
                // LƯU Ý: BE của bạn cần bổ sung API lấy toàn bộ danh sách hợp đồng này!
                api.get('/Contract').catch(() => ({ data: [] }))
            ]);

            const aList = aptRes.data.data || aptRes.data;
            const rList = resRes.data.data || resRes.data;
            const cList = contractRes.data.data || contractRes.data || [];

            setApartments(Array.isArray(aList) ? aList : []);
            setResidents(Array.isArray(rList) ? rList : []);
            setContracts(Array.isArray(cList) ? cList : []);
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

    // --- 3. MỞ CÁC MODAL ---
    const openModal = async (type, contract = null) => {
        setActiveModal(type);
        setSelectedContract(contract);

        if (type === 'create_edit') {
            if (contract) {
                // Đang Edit
                setFormData({
                    ...formData,
                    apartmentId: contract.apartmentId || '',
                    accountId: contract.accountId || '',
                    startDay: contract.startDay || '',
                    endDay: contract.endDay || '',
                    monthlyRent: contract.monthlyRent || '',
                    deposit: contract.deposit || ''
                });
            } else {
                // Tạo mới
                setFormData({
                    ...formData,
                    apartmentId: '', accountId: '', startDay: '', endDay: '', monthlyRent: '', deposit: ''
                });
            }
        } else if (type === 'extend') {
            setFormData({ ...formData, newEndDate: contract.endDay || '' });
        } else if (type === 'terminate') {
            const today = new Date().toISOString().split('T')[0];
            setFormData({ ...formData, terminationDate: today, additionalCost: 0 });
        } else if (type === 'detail') {
            // Gọi API lấy chi tiết hợp đồng
            try {
                const res = await api.get(`/Contract/${contract.contractId}`);
                setDetailData(res.data.data || res.data);
            } catch (error) {
                alert("Không thể tải chi tiết hợp đồng.");
            }
        }
    };

    const closeModal = () => {
        setActiveModal(null);
        setSelectedContract(null);
        setDetailData(null);
    };

    // --- 4. XỬ LÝ SUBMIT CÁC NGHIỆP VỤ ---

    // 4.1. Tạo / Sửa Hợp đồng
    const handleCreateEdit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const payload = {
                apartmentId: Number(formData.apartmentId),
                accountId: Number(formData.accountId),
                startDay: formData.startDay, // Format YYYY-MM-DD
                endDay: formData.endDay,
                monthlyRent: Number(formData.monthlyRent),
                deposit: Number(formData.deposit)
            };

            if (selectedContract) {
                const res = await api.put(`/Contract/${selectedContract.contractId}`, payload);
                alert(res.data?.message || "Cập nhật thành công!");
            } else {
                const res = await api.post('/Contract', payload);
                alert(res.data?.message || "Tạo hợp đồng thành công!");
            }
            fetchData();
            closeModal();
        } catch (error) {
            alert("LỖI: " + (error.response?.data?.message || "Không thể lưu hợp đồng."));
        } finally { setIsSubmitting(false); }
    };

    // 4.2. Gia hạn Hợp đồng
    const handleExtend = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const res = await api.put(`/Contract/${selectedContract.contractId}/extend`, {
                newEndDate: formData.newEndDate
            });
            alert(res.data?.message || "Gia hạn thành công!");
            fetchData();
            closeModal();
        } catch (error) {
            alert("LỖI: " + (error.response?.data?.message || "Không thể gia hạn."));
        } finally { setIsSubmitting(false); }
    };

    // 4.3. Thanh lý (Terminate) Hợp đồng
    const handleTerminate = async (e) => {
        e.preventDefault();
        if (window.confirm("Cảnh báo: Hành động này sẽ chấm dứt hợp đồng và giải phóng phòng. Bạn có chắc chắn?")) {
            setIsSubmitting(true);
            try {
                const res = await api.post(`/Contract/${selectedContract.contractId}/terminate`, {
                    terminationDate: formData.terminationDate,
                    additionalCost: Number(formData.additionalCost)
                });

                // Hiển thị báo cáo thanh lý từ BE trả về
                const data = res.data.data;
                alert(`${res.data?.message}\nTiền cọc: ${data.deposit} đ\nKhấu trừ: ${data.additionalCost} đ\nCần hoàn trả: ${data.refundAmount} đ`);

                fetchData();
                closeModal();
            } catch (error) {
                alert("LỖI: " + (error.response?.data?.message || "Không thể thanh lý."));
            } finally { setIsSubmitting(false); }
        }
    };

    // --- 5. TOÁN HỌC PHÂN TRANG ---
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentContracts = contracts.slice(indexOfFirstItem, indexOfLastItem);

    return (
        <div className="container-fluid p-0">
            {/* TIÊU ĐỀ & NÚT */}
            <div className="d-flex justify-content-between align-items-start mb-4">
                <div>
                    <h2 className="fw-bold mb-0">Quản lý Hợp Đồng</h2>
                    <div className="text-muted small mt-2">Ký mới, gia hạn và thanh lý hợp đồng thuê căn hộ</div>
                </div>
                <button className="btn btn-primary" onClick={() => openModal('create_edit')}>
                    <i className="bi bi-file-earmark-plus-fill me-2"></i> Ký Hợp Đồng Mới
                </button>
            </div>

            {/* BẢNG DỮ LIỆU */}
            <div className="card shadow-sm border-0">
                <div className="card-body p-0">
                    {loading ? (
                        <div className="text-center p-5"><div className="spinner-border text-primary"></div></div>
                    ) : contracts.length === 0 ? (
                        <div className="text-center p-5 text-muted">
                            <p>Chưa có dữ liệu hợp đồng.</p>
                            <small className="text-danger"><i>*Lưu ý: Cần bổ sung API Get All Contracts ở Backend để hiển thị danh sách.</i></small>
                        </div>
                    ) : (
                        <>
                            <div className="table-responsive">
                                <table className="table table-hover table-bordered mb-0 align-middle text-center">
                                    <thead className="table-light text-muted small">
                                        <tr>
                                            <th>STT</th>
                                            <th>Mã Hợp Đồng</th>
                                            <th>Căn hộ</th>
                                            <th>Người thuê (ID)</th>
                                            <th>Ngày hiệu lực</th>
                                            <th>Tình trạng</th>
                                            <th>Thao tác</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {currentContracts.map((c, idx) => (
                                            <tr key={c.contractId}>
                                                <td>{indexOfFirstItem + idx + 1}</td>
                                                <td className="fw-bold text-primary">{c.contractCode}</td>
                                                <td className="fw-semibold">{c.apartmentName || `Phòng ID: ${c.apartmentId}`}</td>
                                                <td>{c.tenantName || `User ID: ${c.accountId}`}</td>
                                                <td>
                                                    <div className="small text-success">Từ: {c.startDay}</div>
                                                    <div className="small text-danger">Đến: {c.endDay}</div>
                                                </td>
                                                <td>
                                                    <span className={`badge ${c.status === 1 ? 'bg-success' : 'bg-secondary'}`}>
                                                        {c.status === 1 ? 'Đang hiệu lực' : 'Đã thanh lý'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <button className="btn btn-sm btn-outline-info me-1" onClick={() => openModal('detail', c)} title="Xem chi tiết">
                                                        <i className="bi bi-eye"></i>
                                                    </button>
                                                    {c.status === 1 && (
                                                        <>
                                                            <button className="btn btn-sm btn-outline-warning me-1" onClick={() => openModal('create_edit', c)} title="Sửa">
                                                                <i className="bi bi-pencil"></i>
                                                            </button>
                                                            <button className="btn btn-sm btn-outline-primary me-1" onClick={() => openModal('extend', c)} title="Gia hạn">
                                                                <i className="bi bi-calendar-plus"></i>
                                                            </button>
                                                            <button className="btn btn-sm btn-outline-danger" onClick={() => openModal('terminate', c)} title="Thanh lý">
                                                                <i className="bi bi-x-octagon"></i>
                                                            </button>
                                                        </>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <Pagination totalItems={contracts.length} itemsPerPage={itemsPerPage} currentPage={currentPage} onPageChange={setCurrentPage} />
                        </>
                    )}
                </div>
            </div>

            {/* MÀN MỜ NỀN KHI MỞ MODAL CUSTOM */}
            {activeModal && <div className="modal-backdrop fade show"></div>}

            {/* --- MODAL 1: TẠO / SỬA HỢP ĐỒNG --- */}
            {activeModal === 'create_edit' && (
                <div className="modal fade show d-block" tabIndex="-1">
                    <div className="modal-dialog modal-lg">
                        <div className="modal-content">
                            <div className="modal-header bg-primary text-white">
                                <h5 className="modal-title fw-bold">{selectedContract ? 'Cập Nhật Hợp Đồng' : 'Ký Hợp Đồng Mới'}</h5>
                                <button type="button" className="btn-close btn-close-white" onClick={closeModal}></button>
                            </div>
                            <form onSubmit={handleCreateEdit}>
                                <div className="modal-body row g-3">
                                    <div className="col-md-6">
                                        <label className="form-label fw-semibold">Chọn Căn hộ (*)</label>
                                        <select className="form-select" name="apartmentId" value={formData.apartmentId} onChange={handleInputChange} required>
                                            <option value="">-- Chọn phòng --</option>
                                            {/* Gợi ý: Lọc các phòng có status = 1 (Vacant) để tạo mới */}
                                            {apartments.filter(a => a.status === 1 || a.apartmentId === formData.apartmentId).map(apt => (
                                                <option key={apt.apartmentId} value={apt.apartmentId}>{apt.apartmentCode} - {apt.apartmentName}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label fw-semibold">Người Thuê / Cư dân (*)</label>
                                        <select className="form-select" name="accountId" value={formData.accountId} onChange={handleInputChange} required>
                                            <option value="">-- Chọn Cư dân --</option>
                                            {residents.map(res => (
                                                <option key={res.accountId} value={res.accountId}>{res.fullName} ({res.code})</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label fw-semibold">Ngày Bắt Đầu (*)</label>
                                        <input type="date" className="form-control" name="startDay" value={formData.startDay} onChange={handleInputChange} required />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label fw-semibold">Ngày Kết Thúc (*)</label>
                                        <input type="date" className="form-control" name="endDay" value={formData.endDay} onChange={handleInputChange} required />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label fw-semibold text-danger">Tiền Thuê Hàng Tháng (VNĐ) (*)</label>
                                        <input type="number" min="0" className="form-control" name="monthlyRent" value={formData.monthlyRent} onChange={handleInputChange} required />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label fw-semibold text-success">Tiền Đặt Cọc (VNĐ) (*)</label>
                                        <input type="number" min="0" className="form-control" name="deposit" value={formData.deposit} onChange={handleInputChange} required />
                                    </div>
                                </div>
                                <div className="modal-footer bg-light">
                                    <button type="button" className="btn btn-secondary" onClick={closeModal}>Hủy</button>
                                    <button type="submit" className="btn btn-primary" disabled={isSubmitting}>Lưu Hợp Đồng</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* --- MODAL 2: GIA HẠN HỢP ĐỒNG --- */}
            {activeModal === 'extend' && (
                <div className="modal fade show d-block" tabIndex="-1">
                    <div className="modal-dialog">
                        <div className="modal-content border-primary">
                            <div className="modal-header bg-primary text-white">
                                <h5 className="modal-title fw-bold">Gia Hạn Hợp Đồng</h5>
                                <button type="button" className="btn-close btn-close-white" onClick={closeModal}></button>
                            </div>
                            <form onSubmit={handleExtend}>
                                <div className="modal-body">
                                    <div className="alert alert-info">
                                        Đang gia hạn hợp đồng: <strong>{selectedContract.contractCode}</strong><br />
                                        Ngày kết thúc cũ: <strong>{selectedContract.endDay}</strong>
                                    </div>
                                    <label className="form-label fw-semibold">Ngày Kết Thúc Mới (*)</label>
                                    <input type="date" className="form-control" name="newEndDate" value={formData.newEndDate} onChange={handleInputChange} required />
                                    <small className="text-muted d-block mt-2">* Ngày mới phải lớn hơn ngày kết thúc hiện tại.</small>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={closeModal}>Hủy</button>
                                    <button type="submit" className="btn btn-primary" disabled={isSubmitting}>Xác nhận Gia hạn</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* --- MODAL 3: THANH LÝ HỢP ĐỒNG --- */}
            {activeModal === 'terminate' && (
                <div className="modal fade show d-block" tabIndex="-1">
                    <div className="modal-dialog">
                        <div className="modal-content border-danger">
                            <div className="modal-header bg-danger text-white">
                                <h5 className="modal-title fw-bold">Thanh Lý Hợp Đồng</h5>
                                <button type="button" className="btn-close btn-close-white" onClick={closeModal}></button>
                            </div>
                            <form onSubmit={handleTerminate}>
                                <div className="modal-body">
                                    <div className="alert alert-warning">
                                        Thanh lý hợp đồng <strong>{selectedContract.contractCode}</strong> sẽ giải phóng căn hộ về trạng thái Trống.
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label fw-semibold">Ngày Thanh Lý (*)</label>
                                        <input type="date" className="form-control" name="terminationDate" value={formData.terminationDate} onChange={handleInputChange} required />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label fw-semibold text-danger">Khấu trừ tiền cọc (Sửa chữa, bồi thường...) (VNĐ)</label>
                                        <input type="number" min="0" className="form-control border-danger" name="additionalCost" value={formData.additionalCost} onChange={handleInputChange} required />
                                        <small className="text-muted mt-1 d-block">
                                            Hệ thống sẽ tự tính: <b>Hoàn Trả = Tiền Cọc - Khấu Trừ</b>
                                        </small>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={closeModal}>Hủy</button>
                                    <button type="submit" className="btn btn-danger" disabled={isSubmitting}>Xác nhận Thanh Lý</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* --- MODAL 4: XEM CHI TIẾT --- */}
            {activeModal === 'detail' && (
                <div className="modal fade show d-block" tabIndex="-1">
                    <div className="modal-dialog modal-lg">
                        <div className="modal-content">
                            <div className="modal-header bg-info text-white">
                                <h5 className="modal-title fw-bold">Chi Tiết Hợp Đồng</h5>
                                <button type="button" className="btn-close btn-close-white" onClick={closeModal}></button>
                            </div>
                            <div className="modal-body">
                                {!detailData ? (
                                    <div className="text-center p-4"><div className="spinner-border text-info"></div></div>
                                ) : (
                                    <div className="row g-3">
                                        <div className="col-md-6"><p className="mb-1 text-muted">Mã HĐ:</p> <h6 className="fw-bold">{detailData.contractCode}</h6></div>
                                        <div className="col-md-6"><p className="mb-1 text-muted">Trạng thái:</p> <h6>{detailData.status === 1 ? <span className="badge bg-success">Đang hiệu lực</span> : <span className="badge bg-secondary">Đã thanh lý</span>}</h6></div>
                                        <hr className="my-2" />
                                        <div className="col-md-6"><p className="mb-1 text-muted">Căn hộ:</p> <h6>{detailData.apartmentName} (ID: {detailData.apartmentId})</h6></div>
                                        <div className="col-md-6"><p className="mb-1 text-muted">Người thuê:</p> <h6>{detailData.tenantName} (ID: {detailData.accountId})</h6></div>
                                        <div className="col-md-6"><p className="mb-1 text-muted">Ngày bắt đầu:</p> <h6 className="text-success">{detailData.startDay}</h6></div>
                                        <div className="col-md-6"><p className="mb-1 text-muted">Ngày kết thúc:</p> <h6 className="text-danger">{detailData.endDay}</h6></div>
                                        <hr className="my-2" />
                                        <div className="col-md-4"><p className="mb-1 text-muted">Tiền thuê/tháng:</p> <h6>{detailData.monthlyRent?.toLocaleString()} đ</h6></div>
                                        <div className="col-md-4"><p className="mb-1 text-muted">Tiền cọc:</p> <h6>{detailData.deposit?.toLocaleString()} đ</h6></div>
                                        {detailData.status !== 1 && (
                                            <>
                                                <div className="col-md-4"><p className="mb-1 text-muted text-danger">Bị khấu trừ:</p> <h6 className="text-danger">{detailData.additionalCost?.toLocaleString()} đ</h6></div>
                                                <div className="col-md-4"><p className="mb-1 text-muted text-success">Đã hoàn trả:</p> <h6 className="text-success">{detailData.refundAmount?.toLocaleString()} đ</h6></div>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                            <div className="modal-footer bg-light">
                                <button type="button" className="btn btn-secondary" onClick={closeModal}>Đóng</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ContractManagement;