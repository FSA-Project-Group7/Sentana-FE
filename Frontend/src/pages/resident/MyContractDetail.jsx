import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/axiosConfig';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './MyContractDetail.css';

const MyContractDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    
    const [contract, setContract] = useState(null);
    const [depositSettlement, setDepositSettlement] = useState(null);
    const [roommates, setRoommates] = useState([]);
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchContractDetail();
    }, [id]);

    const fetchContractDetail = async () => {
        setLoading(true);
        try {
            // Fetch contract detail
            const contractRes = await api.get(`/contract/view-contract/${id}`);
            const contractData = contractRes.data?.data || contractRes.data?.Data || contractRes.data;
            setContract(contractData);

            // Fetch deposit settlement if contract is terminated
            if (contractData.status === 0) {
                try {
                    const settlementRes = await api.get(`/contract/${id}/deposit-settlement`);
                    setDepositSettlement(settlementRes.data);
                } catch (error) {
                    console.log("Deposit settlement not available");
                }
            }

            // Fetch roommates
            if (contractData.additionalResidents && contractData.additionalResidents.length > 0) {
                const roommatePromises = contractData.additionalResidents.map(async (resident) => {
                    try {
                        const res = await api.get(`/Residents/GetResidentById/${resident.accountId}`);
                        return {
                            ...resident,
                            info: res.data?.data || res.data?.Data || res.data
                        };
                    } catch (error) {
                        return resident;
                    }
                });
                const roommatesData = await Promise.all(roommatePromises);
                setRoommates(roommatesData);
            }

            // Fetch services
            if (contractData.selectedServices && contractData.selectedServices.length > 0) {
                const servicePromises = contractData.selectedServices.map(async (service) => {
                    try {
                        const res = await api.get(`/Service/${service.serviceId}`);
                        return {
                            ...service,
                            info: res.data?.data || res.data?.Data || res.data
                        };
                    } catch (error) {
                        return service;
                    }
                });
                const servicesData = await Promise.all(servicePromises);
                setServices(servicesData);
            }

        } catch (error) {
            toast.error("Không thể tải thông tin hợp đồng!");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const formatMoney = (amount) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
    const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleDateString('vi-VN') : "N/A";

    const getRelationshipName = (relationshipId) => {
        const relationships = {
            1: 'Chủ hộ',
            2: 'Vợ/Chồng',
            3: 'Con cái',
            4: 'Anh/Chị/Em',
            5: 'Bạn cùng phòng',
            6: 'Khác'
        };
        return relationships[relationshipId] || 'Không xác định';
    };

    const getStatusBadge = (status) => {
        if (status === 1) {
            return <span className="badge bg-success px-3 py-2 rounded-pill">Đang hiệu lực</span>;
        } else if (status === 0) {
            return <span className="badge bg-secondary px-3 py-2 rounded-pill">Đã thanh lý</span>;
        } else if (status === -1) {
            return <span className="badge bg-warning text-dark px-3 py-2 rounded-pill">Đã hủy</span>;
        }
        return <span className="badge bg-secondary px-3 py-2 rounded-pill">Không xác định</span>;
    };

    const getSettlementStatusBadge = (settlementStatus) => {
        if (settlementStatus === 1) {
            return <span className="badge bg-warning text-dark px-3 py-2">Chờ kiểm tra phòng</span>;
        } else if (settlementStatus === 2) {
            return <span className="badge bg-danger px-3 py-2">Chờ thu/chi tiền</span>;
        } else if (settlementStatus === 3) {
            return <span className="badge bg-success px-3 py-2">Đã hoàn tất</span>;
        }
        return null;
    };

    if (loading) {
        return (
            <div className="container py-5 text-center">
                <div className="spinner-border text-primary" style={{ width: '3rem', height: '3rem' }}></div>
                <p className="mt-3 text-muted">Đang tải thông tin hợp đồng...</p>
            </div>
        );
    }

    if (!contract) {
        return (
            <div className="container py-5 text-center">
                <i className="bi bi-exclamation-triangle text-warning" style={{ fontSize: '4rem' }}></i>
                <h4 className="mt-3">Không tìm thấy hợp đồng</h4>
                <button className="btn btn-primary mt-3" onClick={() => navigate('/resident/my-contract')}>
                    Quay lại danh sách
                </button>
            </div>
        );
    }

    return (
        <div className="container py-4 my-contract-detail">
            <ToastContainer position="top-right" autoClose={3000} />
            
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <button className="btn btn-outline-secondary btn-sm mb-2" onClick={() => navigate('/resident/my-contract')}>
                        <i className="bi bi-arrow-left me-2"></i>Quay lại
                    </button>
                    <h3 className="fw-bold text-primary mb-0">
                        <i className="bi bi-file-earmark-text me-2"></i>
                        Chi Tiết Hợp Đồng
                    </h3>
                </div>
                {contract.file && (
                    <a href={contract.file} target="_blank" rel="noreferrer" className="btn btn-primary">
                        <i className="bi bi-download me-2"></i>Tải PDF
                    </a>
                )}
            </div>

            {/* Contract Info Card */}
            <div className="card border-0 shadow-sm rounded-4 mb-4">
                <div className="card-header bg-gradient-primary text-white p-4 rounded-top-4">
                    <div className="d-flex justify-content-between align-items-center">
                        <div>
                            <h5 className="fw-bold mb-1">{contract.contractCode}</h5>
                            <p className="mb-0 opacity-75">Căn hộ: {contract.apartmentName}</p>
                        </div>
                        {getStatusBadge(contract.status)}
                    </div>
                </div>
                <div className="card-body p-4">
                    <div className="row g-4">
                        <div className="col-md-6">
                            <div className="info-item">
                                <i className="bi bi-calendar-range text-primary me-2"></i>
                                <span className="text-muted">Thời hạn:</span>
                                <strong className="ms-2">{formatDate(contract.startDay)} - {formatDate(contract.endDay)}</strong>
                            </div>
                        </div>
                        <div className="col-md-6">
                            <div className="info-item">
                                <i className="bi bi-cash-coin text-success me-2"></i>
                                <span className="text-muted">Tiền thuê/tháng:</span>
                                <strong className="ms-2 text-success">{formatMoney(contract.monthlyRent)}</strong>
                            </div>
                        </div>
                        <div className="col-md-6">
                            <div className="info-item">
                                <i className="bi bi-piggy-bank text-info me-2"></i>
                                <span className="text-muted">Tiền cọc:</span>
                                <strong className="ms-2 text-info">{formatMoney(contract.deposit)}</strong>
                            </div>
                        </div>
                        <div className="col-md-6">
                            <div className="info-item">
                                <i className="bi bi-calendar-check text-secondary me-2"></i>
                                <span className="text-muted">Ngày tạo:</span>
                                <strong className="ms-2">{formatDate(contract.createdAt)}</strong>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Deposit Settlement (Only for terminated contracts) */}
            {contract.status === 0 && depositSettlement && (
                <div className="card border-0 shadow-sm rounded-4 mb-4">
                    <div className="card-header bg-light p-4 border-bottom">
                        <div className="d-flex justify-content-between align-items-center">
                            <h5 className="fw-bold mb-0 text-dark">
                                <i className="bi bi-calculator me-2 text-danger"></i>
                                Quyết Toán Hợp Đồng
                            </h5>
                            {getSettlementStatusBadge(depositSettlement.settlementStatus)}
                        </div>
                    </div>
                    <div className="card-body p-4">
                        <div className="row g-3">
                            <div className="col-md-6">
                                <div className="settlement-item">
                                    <span className="text-muted">Tiền cọc gốc:</span>
                                    <strong className="text-primary">{formatMoney(depositSettlement.deposit)}</strong>
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className="settlement-item">
                                    <span className="text-muted">Phí phát sinh:</span>
                                    <strong className="text-danger">{formatMoney(depositSettlement.additionalCost)}</strong>
                                </div>
                            </div>
                            <div className="col-12">
                                <hr className="my-2" />
                            </div>
                            <div className="col-12">
                                <div className="settlement-item-total">
                                    <span className="text-dark fw-bold fs-5">Số tiền hoàn trả:</span>
                                    <strong className={`fs-4 ${depositSettlement.refundAmount >= 0 ? 'text-success' : 'text-danger'}`}>
                                        {formatMoney(depositSettlement.refundAmount)}
                                    </strong>
                                </div>
                            </div>
                            {depositSettlement.terminationReason && (
                                <div className="col-12">
                                    <div className="alert alert-warning border-0 mb-0">
                                        <strong>Lý do thanh lý:</strong>
                                        <p className="mb-0 mt-2">{depositSettlement.terminationReason}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Roommates Section */}
            <div className="card border-0 shadow-sm rounded-4 mb-4">
                <div className="card-header bg-light p-4 border-bottom">
                    <h5 className="fw-bold mb-0 text-dark">
                        <i className="bi bi-people me-2 text-primary"></i>
                        Thành Viên Cùng Ở ({roommates.length + 1})
                    </h5>
                </div>
                <div className="card-body p-4">
                    {/* Main Tenant */}
                    <div className="roommate-item border-start border-primary border-4 bg-light p-3 rounded mb-3">
                        <div className="d-flex align-items-center">
                            <div className="avatar-circle bg-primary text-white me-3">
                                <i className="bi bi-person-fill"></i>
                            </div>
                            <div className="flex-grow-1">
                                <h6 className="fw-bold mb-1">{contract.tenantName}</h6>
                                <span className="badge bg-primary">Chủ hộ</span>
                            </div>
                        </div>
                    </div>

                    {/* Additional Residents */}
                    {roommates.length > 0 ? (
                        roommates.map((roommate, index) => (
                            <div key={index} className="roommate-item border-start border-secondary border-3 bg-light p-3 rounded mb-3">
                                <div className="d-flex align-items-center">
                                    <div className="avatar-circle bg-secondary text-white me-3">
                                        <i className="bi bi-person"></i>
                                    </div>
                                    <div className="flex-grow-1">
                                        <h6 className="fw-bold mb-1">
                                            {roommate.info?.fullName || roommate.info?.FullName || `Thành viên ${index + 1}`}
                                        </h6>
                                        <span className="badge bg-secondary">
                                            {getRelationshipName(roommate.relationshipId)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center text-muted py-3">
                            <i className="bi bi-person-x opacity-50" style={{ fontSize: '2rem' }}></i>
                            <p className="mb-0 mt-2">Không có thành viên khác</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Services Section */}
            <div className="card border-0 shadow-sm rounded-4 mb-4">
                <div className="card-header bg-light p-4 border-bottom">
                    <h5 className="fw-bold mb-0 text-dark">
                        <i className="bi bi-gear me-2 text-success"></i>
                        Dịch Vụ Đăng Ký ({services.length})
                    </h5>
                </div>
                <div className="card-body p-4">
                    {services.length > 0 ? (
                        <div className="table-responsive">
                            <table className="table table-hover align-middle">
                                <thead className="table-light">
                                    <tr>
                                        <th className="border-0">Dịch vụ</th>
                                        <th className="border-0">Đơn vị</th>
                                        <th className="border-0 text-end">Giá áp dụng</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {services.map((service, index) => (
                                        <tr key={index}>
                                            <td>
                                                <div className="d-flex align-items-center">
                                                    <div className="service-icon bg-success bg-opacity-10 text-success rounded-circle p-2 me-3">
                                                        <i className="bi bi-check-circle-fill"></i>
                                                    </div>
                                                    <strong>{service.info?.serviceName || service.info?.ServiceName || 'Dịch vụ'}</strong>
                                                </div>
                                            </td>
                                            <td className="text-muted">
                                                {service.info?.unit || service.info?.Unit || 'N/A'}
                                            </td>
                                            <td className="text-end">
                                                <strong className="text-success">{formatMoney(service.actualPrice)}</strong>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center text-muted py-4">
                            <i className="bi bi-inbox opacity-50" style={{ fontSize: '2rem' }}></i>
                            <p className="mb-0 mt-2">Không có dịch vụ nào được đăng ký</p>
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
};

export default MyContractDetail;
