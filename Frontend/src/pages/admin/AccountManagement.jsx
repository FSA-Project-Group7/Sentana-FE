import React, { useState, useEffect } from 'react';
import api from '../../utils/axiosConfig';
import Pagination from '../../components/common/Pagination'; // Import component phân trang dùng chung

const AccountManagement = () => {
    const [activeTab, setActiveTab] = useState('technician');

    // Gộp chung 1 state để chứa danh sách tài khoản (đỡ phải tạo 2 state thừa)
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(false);

    // State phục vụ phân trang
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    // Hàm gọi dữ liệu động dựa trên Tab đang active
    const fetchAccounts = async () => {
        try {
            setLoading(true);
            let response;

            // Nếu là Tab KTV thì gọi API KTV, nếu Tab Cư dân thì gọi API Cư dân
            if (activeTab === 'technician') {
                response = await api.get('/Technicians');
            } else {
                response = await api.get('/Residents/GetAllResidents');
            }

            const remoteData = response.data?.data ? response.data.data : response.data;
            setAccounts(Array.isArray(remoteData) ? remoteData : []);

            // Reset về trang 1 mỗi khi đổi Tab
            setCurrentPage(1);
        } catch (error) {
            console.error("Lỗi tải danh sách tài khoản:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAccounts();
    }, [activeTab]);

    const handleToggleStatus = async (id) => {
        // Hiện tại Backend mới chỉ có API Toggle nhanh cho KTV
        if (activeTab === 'resident') {
            alert("Tính năng Khóa/Mở nhanh tài khoản Cư dân đang được cập nhật ở Backend. Vui lòng sử dụng chức năng Sửa ở mục Quản lý Cư dân.");
            return;
        }

        try {
            await api.put(`/Technicians/toggleStatus/${id}`);
            await fetchAccounts();
        } catch (error) {
            alert("LỖI: " + (error.response?.data?.message || "Thao tác thất bại."));
        }
    };

    // ==========================================
    // TOÁN HỌC PHÂN TRANG (PAGINATION)
    // ==========================================
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
                            {/* BẢNG DỮ LIỆU DÙNG CHUNG CHO CẢ 2 TAB */}
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
                                                        {activeTab === 'technician' ? (
                                                            // Đối với KTV: Hiển thị dạng nút bấm để có thể Toggle nhanh
                                                            <button
                                                                type="button"
                                                                className={`btn btn-sm rounded-pill fw-bold text-white ${acc.status === 1 ? 'btn-success' : 'btn-danger'}`}
                                                                onClick={() => handleToggleStatus(acc.accountId)}
                                                                title="Nhấn để Khóa/Mở khóa tài khoản"
                                                                style={{ minWidth: '110px' }}
                                                            >
                                                                {acc.status === 1 ? 'Hoạt động' : 'Đã khóa'}
                                                            </button>
                                                        ) : (
                                                            // Đối với Cư Dân: Hiển thị dạng thẻ Badge (Do BE chưa có API toggle riêng)
                                                            <span className={`badge rounded-pill ${acc.status === 1 ? 'bg-success' : 'bg-danger'}`} style={{ padding: '8px 12px', minWidth: '110px' }}>
                                                                {acc.status === 1 ? 'Hoạt động' : 'Đã khóa'}
                                                            </span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* COMPONENT PHÂN TRANG */}
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