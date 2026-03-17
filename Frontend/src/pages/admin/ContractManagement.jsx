import React, { useState, useEffect } from 'react';
import api from '../../utils/axiosConfig';
import Pagination from '../../components/common/Pagination';

const ContractManagement = () => {

    const [contracts, setContracts] = useState([]);
    const [apartments, setApartments] = useState([]);
    const [residents, setResidents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);


    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);


    const [activeModal, setActiveModal] = useState(null);
    const [selectedContract, setSelectedContract] = useState(null);
    const [detailData, setDetailData] = useState(null);


    const [formData, setFormData] = useState({
        apartmentId: '', accountId: '', startDay: '', endDay: '', monthlyRent: '', deposit: '',
        newEndDate: '', terminationDate: '', additionalCost: 0
    });


    const fetchData = async () => {
        setLoading(true);
        try {

            const results = await Promise.allSettled([
                api.get('/Apartments'),
                api.get('/Residents/GetAllResidents'),
                api.get('/Contract')
            ]);

            const aptRes = results[0];
            const resRes = results[1];
            const contractRes = results[2];


            if (aptRes.status === 'fulfilled') {
                const aList = aptRes.value.data?.data || aptRes.value.data;
                setApartments(Array.isArray(aList) ? aList : []);
            }


            if (resRes.status === 'fulfilled') {
                const rList = resRes.value.data?.data || resRes.value.data;
                setResidents(Array.isArray(rList) ? rList : []);
            }


            if (contractRes.status === 'fulfilled') {
                const cList = contractRes.value.data?.data || contractRes.value.data;
                setContracts(Array.isArray(cList) ? cList : []);
            } else {
                console.error("API Hợp đồng đang lỗi:", contractRes.reason);
            }

        } catch (error) {
            console.error("Lỗi hệ thống khi fetch:", error);
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


    const openModal = async (type, contract = null) => {
        setActiveModal(type);
        setSelectedContract(contract);

        if (type === 'create_edit') {
            if (contract) {
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
            try {
                const res = await api.get(`/Contract/${contract.contractId}`);
                setDetailData(res.data?.data || res.data);
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




    const handleCreateEdit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const payload = {
                apartmentId: Number(formData.apartmentId),
                accountId: Number(formData.accountId),
                startDay: formData.startDay,
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

            const errorMsg = error.response?.data?.message || "Không thể lưu hợp đồng do lỗi máy chủ.";
            alert("LỖI TỪ HỆ THỐNG: " + errorMsg);
            console.error(error.response?.data);
        } finally { setIsSubmitting(false); }
    };


    const handleExtend = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const payload = { newEndDate: formData.newEndDate };
            const res = await api.put(`/Contract/${selectedContract.contractId}/extend`, payload);
            alert(res.data?.message || "Gia hạn thành công!");
            fetchData();
            closeModal();
        } catch (error) {
            alert("LỖI: " + (error.response?.data?.message || "Không thể gia hạn."));
        } finally { setIsSubmitting(false); }
    };


    const handleTerminate = async (e) => {
        e.preventDefault();
        if (window.confirm("Cảnh báo: Hành động này sẽ chấm dứt hợp đồng và giải phóng phòng. Bạn có chắc chắn?")) {
            setIsSubmitting(true);
            try {
                const payload = {
                    terminationDate: formData.terminationDate,
                    additionalCost: Number(formData.additionalCost)
                };
                const res = await api.post(`/Contract/${selectedContract.contractId}/terminate`, payload);

                const data = res.data?.data;
                alert(`${res.data?.message}\nTiền hoàn trả: ${data?.refund?.toLocaleString()} đ`);

                fetchData();
                closeModal();
            } catch (error) {
                alert("LỖI: " + (error.response?.data?.message || "Không thể thanh lý."));
            } finally { setIsSubmitting(false); }
        }
    };

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentContracts = contracts.slice(indexOfFirstItem, indexOfLastItem);

    const availableApartments = apartments.filter(a => a.status === 1 || a.apartmentId === formData.apartmentId);

    return (
        <div className="container-fluid p-0">
            <div className="d-flex justify-content-between align-items-start mb-4">
                <div>
                    <h2 className="fw-bold mb-0">Quản lý Hợp Đồng</h2>
                    <div className="text-muted small mt-2">Ký mới, gia hạn và thanh lý hợp đồng thuê căn hộ</div>
                </div>
                <button className="btn btn-primary" onClick={() => openModal('create_edit')}>
                    <i className="bi bi-file-earmark-plus-fill me-2"></i> Ký Hợp Đồng Mới
                </button>
            </div>

            <div className="card shadow-sm border-0">
                <div className="card-body p-0">
                    {loading ? (
                        <div className="text-center p-5"><div className="spinner-border text-primary"></div></div>
                    ) : contracts.length === 0 ? (
                        <div className="text-center p-5 text-muted">Chưa có dữ liệu hợp đồng nào.</div>
                    ) : (
                        <>
                            <div className="table-responsive">
                                <table className="table table-hover table-bordered mb-0 align-middle text-center">
                                    <thead className="table-light text-muted small">
                                        <tr>
                                            <th>STT</th>
                                            <th>Mã HĐ</th>
                                            <th>Phòng ID</th>
                                            <th>Cư dân ID</th>
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
                                                <td className="fw-semibold">{c.apartmentId}</td>
                                                <td>{c.accountId}</td>
                                                <td>
                                                    <div className="small text-success fw-bold">Từ: {c.startDay || c.startDate || 'Đang cập nhật'}</div>
                                                    <div className="small text-danger fw-bold">Đến: {c.endDay || c.endDate || 'Đang cập nhật'}</div>
                                                </td>
                                                <td>
                                                    <span className={`badge ${c.status === 1 ? 'bg-success' : 'bg-secondary'}`}>
                                                        {c.status === 1 ? 'Đang hiệu lực' : 'Đã thanh lý'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <button className="btn btn-sm btn-outline-info me-1 mb-1" onClick={() => openModal('detail', c)}>
                                                        <i className="bi bi-eye me-1"></i> Chi tiết
                                                    </button>
                                                    {c.status === 1 && (
                                                        <>
                                                            <button className="btn btn-sm btn-outline-warning me-1 mb-1" onClick={() => openModal('create_edit', c)}>
                                                                <i className="bi bi-pencil me-1"></i> Sửa
                                                            </button>
                                                            <button className="btn btn-sm btn-outline-primary me-1 mb-1" onClick={() => openModal('extend', c)}>
                                                                <i className="bi bi-calendar-plus me-1"></i> Gia hạn
                                                            </button>
                                                            <button className="btn btn-sm btn-outline-danger mb-1" onClick={() => openModal('terminate', c)}>
                                                                <i className="bi bi-x-octagon me-1"></i> Thanh lý
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

            {/* Backdrop Modal */}
            {activeModal && <div className="modal-backdrop fade show"></div>}

            {/* MODAL 1: TẠO/SỬA */}
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
                                        <select className="form-select" name="apartmentId" value={formData.apartmentId} onChange={handleInputChange} required disabled={!!selectedContract}>
                                            <option value="">-- Chọn phòng --</option>
                                            {/* Cảnh báo nếu không có phòng trống */}
                                            {availableApartments.length === 0 && <option value="" disabled>⚠️ Không có phòng nào đang Trống!</option>}

                                            {availableApartments.map(apt => (
                                                <option key={apt.apartmentId} value={apt.apartmentId}>{apt.apartmentCode} - {apt.apartmentName}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label fw-semibold">Cư dân (*)</label>
                                        <select className="form-select" name="accountId" value={formData.accountId} onChange={handleInputChange} required disabled={!!selectedContract}>
                                            <option value="">-- Chọn Cư dân --</option>
                                            {residents.length === 0 && <option value="" disabled>⚠️ Không có dữ liệu cư dân!</option>}

                                            {residents.map(res => (
                                                <option key={res.accountId} value={res.accountId}>{res.fullName || res.userName} ({res.code})</option>
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
                                        <label className="form-label fw-semibold text-danger">Tiền Thuê (VNĐ) (*)</label>
                                        <input type="number" min="0" className="form-control" name="monthlyRent" value={formData.monthlyRent} onChange={handleInputChange} required />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label fw-semibold text-success">Tiền Cọc (VNĐ) (*)</label>
                                        <input type="number" min="0" className="form-control" name="deposit" value={formData.deposit} onChange={handleInputChange} required />
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={closeModal}>Hủy</button>
                                    <button type="submit" className="btn btn-primary" disabled={isSubmitting}>Lưu Hợp Đồng</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL 2: GIA HẠN */}
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
                                    <div className="alert alert-info">Mã HĐ: <strong>{selectedContract.contractCode}</strong><br />Ngày KT cũ: <strong>{selectedContract.endDay}</strong></div>
                                    <label className="form-label fw-semibold">Ngày Kết Thúc Mới (*)</label>
                                    <input type="date" className="form-control" name="newEndDate" value={formData.newEndDate} onChange={handleInputChange} required />
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={closeModal}>Hủy</button>
                                    <button type="submit" className="btn btn-primary" disabled={isSubmitting}>Xác nhận</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL 3: THANH LÝ */}
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
                                    <div className="mb-3">
                                        <label className="form-label fw-semibold">Ngày Thanh Lý (*)</label>
                                        <input type="date" className="form-control" name="terminationDate" value={formData.terminationDate} onChange={handleInputChange} required />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label fw-semibold text-danger">Khấu trừ (VNĐ)</label>
                                        <input type="number" min="0" className="form-control" name="additionalCost" value={formData.additionalCost} onChange={handleInputChange} required />
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={closeModal}>Hủy</button>
                                    <button type="submit" className="btn btn-danger" disabled={isSubmitting}>Thanh Lý</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL 4: CHI TIẾT */}
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
                                        <div className="col-md-6"><p className="mb-1 text-muted">Căn hộ:</p> <h6>{detailData.apartmentName || `ID: ${detailData.apartmentId}`}</h6></div>
                                        <div className="col-md-6"><p className="mb-1 text-muted">Người thuê:</p> <h6>{detailData.tenantName || `ID: ${detailData.accountId}`}</h6></div>
                                        <div className="col-md-6"><p className="mb-1 text-muted">Ngày HĐ:</p> <h6>{detailData.startDay} - {detailData.endDay}</h6></div>
                                        <hr className="my-2" />
                                        <div className="col-md-4"><p className="mb-1 text-muted">Tiền thuê/tháng:</p> <h6>{detailData.monthlyRent?.toLocaleString()} đ</h6></div>
                                        <div className="col-md-4"><p className="mb-1 text-muted">Tiền cọc:</p> <h6>{detailData.deposit?.toLocaleString()} đ</h6></div>
                                        {detailData.status !== 1 && (
                                            <div className="col-md-4"><p className="mb-1 text-muted text-success">Đã hoàn trả:</p> <h6 className="text-success">{detailData.refundAmount?.toLocaleString()} đ</h6></div>
                                        )}
                                    </div>
                                )}
                            </div>
                            <div className="modal-footer">
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