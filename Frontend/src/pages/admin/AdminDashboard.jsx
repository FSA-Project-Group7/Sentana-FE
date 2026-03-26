import React, { useState, useEffect } from 'react';
import api from '../../utils/axiosConfig';
import { notify } from '../../utils/notificationAlert';

const AdminDashboard = () => {
    const [stats, setStats] = useState({ buildings: 0, apartments: 0, residents: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                // --- FETCH DATA IN PARALLEL ---
                const [buildingsRes, apartmentsRes, residentsRes] = await Promise.all([
                    api.get('/Buildings'),
                    api.get('/Apartments'),
                    api.get('/Residents/GetAllResidents')
                ]);

                // --- EXTRACT DATA SAFELY ---
                const extractArrayData = (res) => Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : [];

                setStats({
                    buildings: extractArrayData(buildingsRes).length,
                    apartments: extractArrayData(apartmentsRes).length,
                    residents: extractArrayData(residentsRes).length
                });
            } catch (error) {
                notify.error("Không thể tải dữ liệu tổng quan hệ thống.");
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '50vh' }}>
                <div className="spinner-border text-primary" role="status"></div>
            </div>
        );
    }

    return (
        <div className="container-fluid p-0">
            <h2 className="mb-4 fw-bold">Tổng quan hệ thống</h2>

            <div className="row g-4">
                <div className="col-md-4">
                    <div className="card text-white bg-primary h-100 shadow-sm border-0">
                        <div className="card-body d-flex flex-column justify-content-center align-items-center py-4">
                            <i className="bi bi-building fs-1 mb-2 opacity-75"></i>
                            <h5 className="card-title text-uppercase opacity-75">Tổng Tòa Nhà</h5>
                            <h2 className="display-4 fw-bold mb-0">{stats.buildings}</h2>
                        </div>
                    </div>
                </div>

                <div className="col-md-4">
                    <div className="card text-white bg-success h-100 shadow-sm border-0">
                        <div className="card-body d-flex flex-column justify-content-center align-items-center py-4">
                            <i className="bi bi-door-open fs-1 mb-2 opacity-75"></i>
                            <h5 className="card-title text-uppercase opacity-75">Tổng Căn Hộ</h5>
                            <h2 className="display-4 fw-bold mb-0">{stats.apartments}</h2>
                        </div>
                    </div>
                </div>

                <div className="col-md-4">
                    <div className="card text-dark bg-warning h-100 shadow-sm border-0">
                        <div className="card-body d-flex flex-column justify-content-center align-items-center py-4">
                            <i className="bi bi-people fs-1 mb-2 opacity-75"></i>
                            <h5 className="card-title text-uppercase opacity-75">Tổng Cư Dân</h5>
                            <h2 className="display-4 fw-bold mb-0">{stats.residents}</h2>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;