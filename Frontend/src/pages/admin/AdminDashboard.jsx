import React, { useState, useEffect } from 'react';
import api from '../../utils/axiosConfig';

const AdminDashboard = () => {
    const [stats, setStats] = useState({ buildings: 0, apartments: 0, residents: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [buildingsRes, apartmentsRes] = await Promise.all([
                    api.get('/Buildings'),
                    api.get('/Apartments')
                ]);

                setStats({
                    buildings: buildingsRes.data.length,
                    apartments: apartmentsRes.data.length,
                    residents: 0 
                });
            } catch (error) {
                console.error("Lỗi lấy dữ liệu thống kê:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    if (loading) {
        return <div className="text-center mt-5"><div className="spinner-border text-primary" role="status"></div></div>;
    }

    return (
        <div>
            <h2 className="mb-4 fw-bold">Tổng quan hệ thống</h2>

            <div className="row g-4">
                <div className="col-md-4">
                    <div className="card text-white bg-primary h-100 shadow-sm border-0">
                        <div className="card-body d-flex flex-column justify-content-center align-items-center py-4">
                            <h5 className="card-title text-uppercase opacity-75">Tổng Tòa Nhà</h5>
                            <h2 className="display-4 fw-bold mb-0">{stats.buildings}</h2>
                        </div>
                    </div>
                </div>

                <div className="col-md-4">
                    <div className="card text-white bg-success h-100 shadow-sm border-0">
                        <div className="card-body d-flex flex-column justify-content-center align-items-center py-4">
                            <h5 className="card-title text-uppercase opacity-75">Tổng Căn Hộ</h5>
                            <h2 className="display-4 fw-bold mb-0">{stats.apartments}</h2>
                        </div>
                    </div>
                </div>

                <div className="col-md-4">
                    <div className="card text-dark bg-warning h-100 shadow-sm border-0">
                        <div className="card-body d-flex flex-column justify-content-center align-items-center py-4">
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