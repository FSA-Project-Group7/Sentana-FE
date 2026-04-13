import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/axiosConfig';

const MyContract = () => {
    const navigate = useNavigate();
    const [contracts, setContracts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const contractRes = await api.get('/contract/my-contract');
                const dataC = contractRes.data?.data || contractRes.data?.Data || [];
                setContracts(Array.isArray(dataC) ? dataC : [dataC]);
            } catch (error) {
                console.error("Lỗi lấy dữ liệu:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const formatMoney = (amount) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
    const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleDateString('vi-VN') : "N/A";

    if (loading) return <div className="text-center py-5 mt-5"><div className="spinner-border text-white"></div></div>;

    return (
        <div className="container pb-5 mt-4">
            {/* HEADER */}
            <div className="row justify-content-center mb-5">
                <div className="col-lg-8 text-center">
                    <h2 className="fw-bold text-white mb-2" style={{ textShadow: '2px 2px 8px rgba(0,0,0,0.8)' }}>
                        <i className="bi bi-file-earmark-text me-2"></i>
                        Thông Tin Hợp Đồng
                    </h2>
                    <p className="text-light" style={{ textShadow: '1px 1px 4px rgba(0,0,0,0.8)' }}>Quản lý thông tin hợp đồng thuê của bạn</p>
                </div>
            </div>

            {/* THÔNG TIN HỢP ĐỒNG */}
            <div className="row justify-content-center">
                <div className="col-lg-8">
                    {contracts.length === 0 ? (
                        <div className="bg-white rounded-4 shadow-lg p-5 text-center">
                            <i className="bi bi-file-earmark-x text-muted opacity-25 d-block mb-3" style={{ fontSize: '4rem' }}></i>
                            <h4 className="fw-bold text-dark">Chưa có hợp đồng</h4>
                            <p className="text-muted mb-0">Bạn chưa có hợp đồng nào được lưu trữ trên hệ thống.</p>
                        </div>
                    ) : (
                        contracts.map((contract, index) => (
                            <div key={contract.contractId || index} className={`card border-0 shadow-lg rounded-4 mb-4 ${contract.status === 1 ? 'border-start border-primary border-5' : 'bg-light'}`}>
                                <div className="card-header bg-white p-4 border-bottom-0 d-flex justify-content-between align-items-center rounded-top-4">
                                    <div className="d-flex align-items-center gap-3">
                                        <div>
                                            <h5 className="fw-bold mb-1 text-dark">
                                                Hợp Đồng: {contract.contractCode}
                                            </h5>
                                            <p className="mb-0 text-muted small">Căn hộ: <strong className="text-dark">Phòng {contract.apartmentCode}</strong></p>
                                        </div>
                                        {contract.status === 1 
                                            ? <span className="badge bg-success px-3 py-2 rounded-pill">Đang hiệu lực</span>
                                            : <span className="badge bg-secondary px-3 py-2 rounded-pill">Đã thanh lý / Hết hạn</span>
                                        }
                                    </div>
                                    <div className="d-flex gap-2 align-items-center">
                                        <button 
                                            className="btn btn-primary btn-sm rounded-pill px-4 fw-bold"
                                            onClick={() => navigate(`/resident/my-contract/${contract.contractId}`)}
                                        >
                                            <i className="bi bi-eye me-2"></i>Xem chi tiết
                                        </button>
                                        {(contract.fileUrl || contract.FileUrl) && (
                                            <a href={contract.fileUrl || contract.FileUrl} target="_blank" rel="noreferrer" className="btn btn-outline-primary btn-sm rounded-pill px-4 fw-bold">
                                                <i className="bi bi-download me-2"></i>Tải PDF
                                            </a>
                                        )}
                                    </div>
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

                                        {/* Khối Báo Cáo Thanh Lý */}
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
                                                        <strong className="text-success fs-5">{formatMoney(contract.refundAmount)}</strong>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default MyContract;