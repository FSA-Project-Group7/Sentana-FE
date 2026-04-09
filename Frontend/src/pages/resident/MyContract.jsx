import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/axiosConfig';

const MyContract = () => {
    const navigate = useNavigate();
    const [contracts, setContracts] = useState([]);
    const [roomInfo, setRoomInfo] = useState(null); // Thêm state lưu thông tin phòng
    const [loading, setLoading] = useState(true);
    
    // Thêm state chuyển tab
    const [activeTab, setActiveTab] = useState('room'); // 'room' hoặc 'contract'

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Gọi đồng thời 2 API
                const [contractRes, roomRes] = await Promise.all([
                    api.get('/contract/my-contract'),
                    api.get('/rooms/my-room')
                ]);

                // Xử lý Hợp đồng
                const dataC = contractRes.data?.data || contractRes.data?.Data || [];
                setContracts(Array.isArray(dataC) ? dataC : [dataC]);

                // Xử lý Thông tin phòng
                if (roomRes.data?.statusCode === 200 || roomRes.data?.data) {
                    setRoomInfo(roomRes.data.data);
                }
            } catch (error) {
                console.error("Lỗi lấy dữ liệu:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const formatMoney = (amount) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
    const formatCurrency = (amount) => (amount || 0).toLocaleString('vi-VN') + ' đ'; // Thêm hàm này cho Dịch vụ
    const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleDateString('vi-VN') : "N/A";

    if (loading) return <div className="text-center py-5 mt-5"><div className="spinner-border text-white"></div></div>;

    return (
        <div className="container pb-5 mt-4">
            {/* HEADER TỔNG */}
            <div className="row justify-content-center mb-4">
                <div className="col-lg-10 text-center">
                    <h2 className="fw-bold text-white mb-2" style={{ textShadow: '2px 2px 8px rgba(0,0,0,0.8)' }}>
                        <i className="bi bi-house-door me-2"></i>
                        Hồ Sơ Cư Trú
                    </h2>
                    <p className="text-light" style={{ textShadow: '1px 1px 4px rgba(0,0,0,0.8)' }}>Quản lý thông tin phòng và hợp đồng thuê của bạn</p>
                </div>
            </div>

            {/* THANH ĐIỀU HƯỚNG TABS */}
            <div className="row justify-content-center mb-4">
                <div className="col-lg-8">
                    <ul className="nav nav-pills justify-content-center bg-white p-2 rounded-pill shadow-sm">
                        <li className="nav-item w-50 text-center">
                            <button 
                                className={`nav-link w-100 rounded-pill fw-bold py-2 ${activeTab === 'room' ? 'active bg-success' : 'text-secondary'}`}
                                onClick={() => setActiveTab('room')}
                            >
                                <i className="bi bi-info-circle-fill me-2"></i>Thông Tin Phòng
                            </button>
                        </li>
                        <li className="nav-item w-50 text-center">
                            <button 
                                className={`nav-link w-100 rounded-pill fw-bold py-2 ${activeTab === 'contract' ? 'active bg-primary' : 'text-secondary'}`}
                                onClick={() => setActiveTab('contract')}
                            >
                                <i className="bi bi-folder2-open me-2"></i>Thông Tin Hợp Đồng
                            </button>
                        </li>
                    </ul>
                </div>
            </div>

            {/* TAB 1: THÔNG TIN PHÒNG (Bê y nguyên từ Dashboard cũ sang) */}
            {activeTab === 'room' && (
                <div className="row justify-content-center">
                    <div className="col-lg-10">
                        {!roomInfo ? (
                            <div className="bg-white rounded-4 shadow-lg p-5 text-center">
                                <i className="bi bi-house-x text-muted opacity-25 d-block mb-3" style={{ fontSize: '4rem' }}></i>
                                <h4 className="fw-bold text-dark">Chưa có dữ liệu căn hộ</h4>
                                <p className="text-muted mb-0">Hệ thống chưa tìm thấy thông tin phòng của bạn.</p>
                            </div>
                        ) : (
                            <div className="row g-4 align-items-stretch">
                                {/* CỘT TRÁI */}
                                <div className="col-lg-5">
                                    <div className="card border-0 shadow-lg rounded-4 h-100 overflow-hidden bg-white">
                                        <div className="card-header bg-transparent border-bottom pt-4 pb-3 px-4">
                                            <h5 className="fw-bold mb-0 text-dark"><i className="bi bi-info-square-fill text-success me-2"></i> Thông Tin Căn Hộ</h5>
                                        </div>
                                        <div className="card-body p-4 d-flex flex-column">
                                            <div className="text-center mb-4 p-4 bg-light rounded-4">
                                                <div className="display-4 fw-bold text-success mb-2 text-shadow-sm">P.{roomInfo.apartmentCode}</div>
                                                <span className="badge bg-success px-3 py-2 fs-6 rounded-pill shadow-sm">Đang cư trú</span>
                                            </div>
                                            <ul className="list-group list-group-flush flex-grow-1">
                                                <li className="list-group-item d-flex justify-content-between align-items-center px-2 py-3 bg-transparent border-light">
                                                    <span className="text-muted fw-medium"><i className="bi bi-building text-success me-2"></i>Tên Phòng/Tòa</span>
                                                    <span className="fw-bold text-dark">{roomInfo.apartmentName || 'N/A'}</span>
                                                </li>
                                                <li className="list-group-item d-flex justify-content-between align-items-center px-2 py-3 bg-transparent border-light">
                                                    <span className="text-muted fw-medium"><i className="bi bi-layers text-success me-2"></i>Tầng</span>
                                                    <span className="fw-bold text-dark">Tầng {roomInfo.floorNumber || 'N/A'}</span>
                                                </li>
                                                <li className="list-group-item d-flex justify-content-between align-items-center px-2 py-3 bg-transparent border-0">
                                                    <span className="text-muted fw-medium"><i className="bi bi-rulers text-success me-2"></i>Diện tích</span>
                                                    <span className="fw-bold text-dark">{roomInfo.area || 0} m²</span>
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>

                                {/* CỘT PHẢI */}
                                <div className="col-lg-7">
                                    <div className="row g-4 h-100 flex-column m-0">
                                        <div className="col-12 p-0 flex-grow-1">
                                            <div className="card border-0 shadow-lg rounded-4 h-100 overflow-hidden bg-white d-flex flex-column">
                                                <div className="card-header bg-transparent border-bottom pt-4 pb-3 px-4 d-flex justify-content-between align-items-center flex-shrink-0">
                                                    <h5 className="fw-bold mb-0 text-dark"><i className="bi bi-people-fill text-primary me-2"></i>Thành Viên</h5>
                                                    <span className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 rounded-pill px-3 py-1">{roomInfo.roommates?.length || 0} người</span>
                                                </div>
                                                <div className="card-body p-0 custom-scrollbar" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                                    {roomInfo.roommates?.map((member, index) => (
                                                        <div key={index} className="d-flex justify-content-between align-items-center px-4 py-3 border-bottom hover-bg-light transition-all">
                                                            <div className="fw-bold text-dark">{member.fullName}</div>
                                                            <span className={`badge ${member.isOwner ? 'bg-danger' : 'bg-info'} bg-opacity-10 text-${member.isOwner ? 'danger' : 'info'} border border-${member.isOwner ? 'danger' : 'info'} border-opacity-25 rounded-pill px-3`}>
                                                                {member.isOwner ? 'Chủ hộ' : 'Thành viên'}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="col-12 p-0 flex-grow-1 mt-4">
                                            <div className="card border-0 shadow-lg rounded-4 h-100 overflow-hidden bg-white d-flex flex-column">
                                                <div className="card-header bg-transparent border-bottom pt-4 pb-3 px-4 flex-shrink-0">
                                                    <h5 className="fw-bold mb-0 text-dark"><i className="bi bi-box-seam-fill text-warning me-2"></i>Dịch Vụ Đang Sử Dụng</h5>
                                                </div>
                                                <div className="card-body p-0 custom-scrollbar" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                                    <table className="table table-hover mb-0 align-middle">
                                                        <tbody>
                                                            {roomInfo.services?.map((svc, index) => (
                                                                <tr key={index}>
                                                                    <td className="ps-4 py-3 text-dark fw-medium border-light">{svc.serviceName}</td>
                                                                    <td className="text-end pe-4 fw-bold text-danger py-3 border-light">{formatCurrency(svc.price || svc.serviceFee)}</td>
                                                                </tr>
                                                            ))}
                                                            {(!roomInfo.services || roomInfo.services.length === 0) && (
                                                                <tr><td colSpan="2" className="text-center py-4 text-muted">Chưa đăng ký dịch vụ nào.</td></tr>
                                                            )}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* TAB 2: THÔNG TIN HỢP ĐỒNG (Bê y nguyên từ file cũ) */}
            {activeTab === 'contract' && (
                <div className="row justify-content-center">
                    <div className="col-lg-10">
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
                                        <div className="d-flex gap-2">
                                            <button 
                                                className="btn btn-primary btn-sm rounded-pill px-4 fw-bold"
                                                onClick={() => navigate(`/resident/my-contract/${contract.contractId}`)}
                                            >
                                                <i className="bi bi-eye me-2"></i>Xem chi tiết
                                            </button>
                                            {contract.fileUrl && (
                                                <a href={contract.fileUrl} target="_blank" rel="noreferrer" className="btn btn-outline-primary btn-sm rounded-pill px-4 fw-bold">
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
            )}
            
            <style>{`
                .text-shadow-sm { text-shadow: 1px 1px 2px rgba(0,0,0,0.1); }
                .transition-all { transition: all 0.2s ease-in-out; }
                .hover-bg-light:hover { background-color: #f8f9fa !important; }
                .custom-scrollbar::-webkit-scrollbar { width: 5px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
            `}</style>
        </div>
    );
};

export default MyContract;