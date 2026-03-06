import React, { useState, useEffect } from 'react';
import api from '../../utils/axiosConfig';
import styles from '../../styles/AccountManagement.module.css';

const AccountManagement = () => {
    const [technicians, setTechnicians] = useState([]);
    const [residents, setResidents] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchAccounts = async () => {
        try {
            setLoading(true);
            const response = await api.get('/Accounts');
            // Truy cập vào response.data.data theo cấu trúc thực tế của BE
            const allAccounts = response.data.data || [];

            // Lọc dựa trên Role (Khớp với logic Actors của hệ thống)
            setTechnicians(allAccounts.filter(acc => acc.Role === 'Technician' || acc.role === 'Technician'));
            setResidents(allAccounts.filter(acc => acc.Role === 'Resident' || acc.role === 'Resident'));
        } catch (error) {
            console.error("Lỗi lấy dữ liệu tài khoản:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAccounts();
    }, []);

    const renderTable = (data, title) => (
        <div className={styles.section}>
            <div className={styles.tableHeader}>
                <h5>{title}</h5>
                <span className="badge bg-secondary">{data.length} thành viên</span>
            </div>
            <div className="table-responsive">
                <table className={`table table-hover mb-0 align-middle ${styles.tableCustom}`}>
                    <thead>
                        <tr>
                            <th className="ps-4">Tên đăng nhập (UserName)</th>
                            <th>Email</th>
                            <th>Họ và Tên (FullName)</th>
                            <th>Số điện thoại</th>
                            <th>Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.length > 0 ? data.map((acc, index) => (
                            <tr key={acc.AccountId || index}>
                                {/* Sử dụng PascalCase để khớp với DTO của Backend */}
                                <td className="ps-4 fw-bold text-dark">{acc.UserName}</td>
                                <td>{acc.Email}</td>
                                <td>{acc.FullName || '---'}</td>
                                <td>{acc.PhoneNumber || '---'}</td>
                                <td>
                                    <button className="btn btn-sm btn-outline-primary me-2">Sửa</button>
                                    <button className="btn btn-sm btn-outline-danger">Xóa</button>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="5" className="text-center py-4 text-muted small">
                                    Không tìm thấy dữ liệu tài khoản cho nhóm này.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );

    return (
        <div className={styles.container}>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h3 className="fw-bold">Quản lý tài khoản hệ thống</h3>
                <button className="btn btn-success shadow-sm" style={{ backgroundColor: '#5dc69b', border: 'none' }}>
                    + Tạo tài khoản mới
                </button>
            </div>

            {loading ? (
                <div className="text-center py-5">
                    <div className="spinner-border text-success"></div>
                    <p className="mt-2 text-muted">Đang tải dữ liệu từ máy chủ...</p>
                </div>
            ) : (
                <>
                    {/* Bảng 1: Kỹ thuật viên (Tech) */}
                    {renderTable(technicians, "Tài khoản Kỹ thuật viên")}

                    {/* Bảng 2: Cư dân (Resident) */}
                    {renderTable(residents, "Tài khoản Cư dân")}
                </>
            )}
        </div>
    );
};

export default AccountManagement;