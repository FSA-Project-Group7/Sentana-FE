import React, { useState, useEffect } from 'react';
import api from '../../utils/axiosConfig';

const MyContract = () => {
    const [contracts, setContracts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchContracts = async () => {
            try {
                const res = await api.get('/contract/my-contract');
                // Nhận mảng dữ liệu từ API
                const data = res.data?.data || res.data?.Data || [];
                setContracts(Array.isArray(data) ? data : [data]);
            } catch (error) {
                console.error("Lỗi lấy hợp đồng:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchContracts();
    }, []);

    const formatMoney = (amount) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
    const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleDateString('vi-VN') : "N/A";

    if (loading) return <div className="text-center py-5 mt-5"><div className="spinner-border text-primary"></div></div>;

    if (contracts.length === 0) return (
        <div className="container py-5 text-center mt-4">
            <i className="bi bi-file-earmark-x text-muted opacity-25 d-block mb-3" style={{ fontSize: '4rem' }}></i>
            <h4 className="fw-bold text-dark">Chưa có hợp đồng</h4>
            <p className="text-muted">Bạn chưa có hợp đồng nào được lưu trữ trên hệ thống.</p>
        </div>
    );

    return (
        <div className="container py-4">
            <h3 className="fw-bold mb-4 text-primary"><i className="bi bi-folder2-open me-2"></i>Hồ Sơ Hợp Đồng</h3>
            
            {contracts.map((contract, index) => (
                <div key={contract.contractId || index} className={`card border-0 shadow-sm rounded-4 mb-4 ${contract.status === 1 ? 'border-start border-primary border-5' : 'bg-light'}`}>
                    <div className="card-header bg-white p-4 border-bottom-0 d-flex justify-content-between align-items-center rounded-top-4">
                        <div>
                            <h5 className="fw-bold mb-1 text-dark">
                                Hợp Đồng: {contract.contractCode} 
                                {contract.status === 1 
                                    ? <span className="badge bg-success ms-3 align-middle px-3 py-2 rounded-pill small">Đang hiệu lực</span>
                                    : <span className="badge bg-secondary ms-3 align-middle px-3 py-2 rounded-pill small">Đã thanh lý / Hết hạn</span>
                                }
                            </h5>
                            <p className="mb-0 text-muted small">Căn hộ: <strong className="text-dark">Phòng {contract.apartmentCode}</strong></p>
                        </div>
                        {contract.fileUrl && (
                            <a href={contract.fileUrl} target="_blank" rel="noreferrer" className="btn btn-outline-primary btn-sm rounded-pill px-4 fw-bold">
                                <i className="bi bi-download me-2"></i>Tải PDF
                            </a>
                        )}
                    </div>

                    <div className="card-body p-4 pt-0">
                        <div className="row g-4 mt-1">
                            {/* Khối Thông Tin Gốc */}
                            <div className={contract.status === 0 ? "col-md-7" : "col-md-12"}>
                                <div className="bg-white p-3 rounded-3 border">
                                    <div className="row mb-2">
                                        <div className="col-5 text-muted small">Thời hạn:</div>
                                        <div className="col-7 fw-semibold small">{formatDate(contract.startDay)} <i className="bi bi-arrow-right mx-1 text-muted"></i> {formatDate(contract.endDay)}</div>
                                    </div>
                                    <div className="row mb-2">
                                        <div className="col-5 text-muted small">Tiền thuê hàng tháng:</div>
                                        <div className="col-7 fw-bold text-dark small">{formatMoney(contract.monthlyRent)}</div>
                                    </div>
                                    <div className="row mb-0">
                                        <div className="col-5 text-muted small">Tiền đặt cọc gốc:</div>
                                        <div className="col-7 fw-bold text-primary small">{formatMoney(contract.deposit)}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Khối Báo Cáo Thanh Lý (Chỉ hiện khi hợp đồng đã Terminated) */}
                            {contract.status === 0 && (
                                <div className="col-md-5">
                                    <div className="bg-danger bg-opacity-10 p-3 rounded-3 border border-danger border-opacity-25 h-100">
                                        <h6 className="fw-bold text-danger mb-3 small text-uppercase"><i className="bi bi-calculator me-1"></i> Đối soát Thanh lý</h6>
                                        <div className="d-flex justify-content-between mb-1 small"><span className="text-muted">Phí phát sinh/phạt:</span> <strong className="text-danger">- {formatMoney(contract.additionalCost)}</strong></div>
                                        {contract.terminationReason && (
                                            <div className="mb-2 text-danger small fst-italic ps-2 border-start border-danger">Lý do: {contract.terminationReason}</div>
                                        )}
                                        <hr className="my-2 border-danger opacity-25"/>
                                        <div className="d-flex justify-content-between align-items-center">
                                            <span className="text-dark fw-bold small">Tiền hoàn trả (Refund):</span> 
                                            {/* HIỂN THỊ CHÍNH XÁC SỐ TIỀN REFUND */}
                                            <strong className="text-success fs-5">{formatMoney(contract.refundAmount)}</strong>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default MyContract;