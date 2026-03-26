import React, { useState, useEffect } from 'react';
import api from '../../utils/axiosConfig';
import Pagination from '../../components/common/Pagination';
import { notify, confirmAction } from '../../utils/notificationAlert';

const AccountManagement = () => {
    const [activeTab, setActiveTab] = useState('technician');
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(false);

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    const fetchAccounts = async () => {
        try {
            setLoading(true);
            // Chuẩn hóa Endpoint dựa trên Tab hiện tại
            const endpoint = activeTab === 'technician' ? '/Technicians' : '/Residents/GetAllResidents';
            const response = await api.get(endpoint);
            const remoteData = response.data?.data || response.data;
            setAccounts(Array.isArray(remoteData) ? remoteData : []);

            // Reset pagination khi đổi tab
            setCurrentPage(1);
        } catch (error) {
            notify.error("Không thể tải danh sách tài khoản.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAccounts();
    }, [activeTab]);

    const handleToggleStatus = async (acc) => {
        const actionText = acc.status === 1 ? 'khóa' : 'mở khóa';

        // --- XÁC NHẬN THAO TÁC (Dùng SweetAlert2) ---
        const { isConfirmed } = await confirmAction.fire({
            title: `Xác nhận ${actionText}?`,
            text: `Bạn có chắc chắn muốn ${actionText} tài khoản của "${acc.userName}"?`
        });

        if (!isConfirmed) return;

        try {
            const endpoint = activeTab === 'technician'
                ? `/Technicians/toggleStatus/${acc.accountId}`
                : `/Residents/toggleStatus/${acc.accountId}`;

            const res = await api.put(endpoint);

            notify.success(res.data?.message || `Đã ${actionText} tài khoản thành công!`);
            await fetchAccounts();
        } catch (error) {
            notify.error(error.response?.data?.message || "Thao tác thất bại.");
        }
    };

    // --- PAGINATION LOGIC ---
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentAccounts = accounts.slice(indexOfFirstItem, indexOfLastItem);

    return (
        <div className="container-fluid p-0">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="fw-bold mb-0">Tài khoản Hệ thống</h2>
                    <div className="text-muted small">Quản lý quyền truy cập và bảo mật của các nhóm người dùng</div>
                </div>
            </div>

            <div className="card shadow-sm border-0">
                {/* MENU TABS */}
                <div className="card-header bg-white border-bottom-0 pt-3 pb-0">
                    <ul className="nav nav-tabs" style={{ borderBottom: '2px solid #dee2e6' }}>
                        <li className="nav-item">
                            <button
                                className={`nav-link fw-bold ${activeTab === 'technician' ? 'active text-primary border-bottom-0' : 'text-muted'}`}
                                onClick={() => setActiveTab('technician')}
                                style={activeTab === 'technician' ? { borderTop: '3px solid #0d6efd', backgroundColor: '#f8f9fa' } : {}}
                            >
                                <i className="bi bi-tools me-2"></i> Kỹ thuật viên
                            </button>
                        </li>
                        <li className="nav-item">
                            <button
                                className={`nav-link fw-bold ${activeTab === 'resident' ? 'active text-primary border-bottom-0' : 'text-muted'}`}
                                onClick={() => setActiveTab('resident')}
                                style={activeTab === 'resident' ? { borderTop: '3px solid #0d6efd', backgroundColor: '#f8f9fa' } : {}}
                            >
                                <i className="bi bi-people-fill me-2"></i> Cư dân
                            </button>
                        </li>
                    </ul>
                </div>

                <div className="card-body p-0">
                    {loading ? (
                        <div className="text-center p-5"><div className="spinner-border text-primary"></div></div>
                    ) : accounts.length === 0 ? (
                        <div className="text-center p-5 text-muted">
                            Chưa có tài khoản {activeTab === 'technician' ? 'Kỹ thuật viên' : 'Cư dân'} nào.
                        </div>
                    ) : (
                        <>
                            {/* DATA TABLE */}
                            <div className="table-responsive">
                                <table className="table table-hover mb-0 align-middle text-center">
                                    <thead className="table-light text-muted small text-uppercase">
                                        <tr>
                                            <th>STT</th>
                                            <th className="text-start">Tên đăng nhập</th>
                                            <th className="text-start">Email khôi phục</th>
                                            <th>Phân quyền</th>
                                            <th>Trạng thái truy cập</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {currentAccounts.map((acc, index) => {
                                            const stt = indexOfFirstItem + index + 1;
                                            return (
                                                <tr key={acc.accountId}>
                                                    <td className="text-muted">{stt}</td>
                                                    <td className="text-start fw-bold text-dark">{acc.userName}</td>
                                                    <td className="text-start">{acc.email}</td>
                                                    <td>
                                                        <span className={`badge rounded-pill ${activeTab === 'technician' ? 'bg-secondary' : 'bg-info text-dark'}`}>
                                                            {activeTab === 'technician' ? 'Kỹ thuật viên' : 'Cư dân'}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <button
                                                            type="button"
                                                            className={`btn btn-sm rounded-pill fw-bold text-white ${acc.status === 1 ? 'btn-success' : 'btn-danger'}`}
                                                            onClick={() => handleToggleStatus(acc)}
                                                            title="Nhấn để Khóa/Mở khóa tài khoản"
                                                            style={{ minWidth: '110px' }}
                                                        >
                                                            {acc.status === 1 ? 'Hoạt động' : 'Đã khóa'}
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            <Pagination
                                totalItems={accounts.length}
                                itemsPerPage={itemsPerPage}
                                currentPage={currentPage}
                                onPageChange={setCurrentPage}
                            />
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AccountManagement;