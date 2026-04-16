import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/axiosConfig';
import { notify, confirmDelete, confirmAction } from '../../utils/notificationAlert';
import {
    PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    AreaChart, Area
} from 'recharts';

const AdminDashboard = () => {
    // --- 1. STATE THỐNG KÊ ---
    const [stats, setStats] = useState({
        buildings: 0,
        apartments: 0,
        residents: 0,
        unpaidInvoices: 0,
        tasks: { pending: 0, processing: 0, fixed: 0, closed: 0 },
        revenueData: []
    });
    const [loadingStats, setLoadingStats] = useState(true);

    // --- 2. STATE TIN TỨC & SLIDER ---
    const [newsList, setNewsList] = useState([]);
    const [loadingNews, setLoadingNews] = useState(true);
    const [showNewsTrash, setShowNewsTrash] = useState(false);
    const [editingNewsId, setEditingNewsId] = useState(null);
    const [newsForm, setNewsForm] = useState({ title: '', description: '' });
    const [detailNews, setDetailNews] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [startIndex, setStartIndex] = useState(0);
    const [isHoveringSlider, setIsHoveringSlider] = useState(false);

    // ==========================================
    // 📊 FETCH DATA KHỞI TẠO (ĐÃ NÂNG CẤP THUẬT TOÁN)
    // ==========================================
    const fetchStats = async () => {
        try {
            // Lấy song song các dữ liệu. TỐI ƯU: Đọc trực tiếp totalCount từ API để đếm hóa đơn
            const [bldRes, aptRes, resRes, taskRes, unpaidRes, paidRes] = await Promise.all([
                api.get('/Buildings').catch(() => ({ data: [] })),
                api.get('/Apartments').catch(() => ({ data: [] })),
                api.get('/Residents/GetAllResidents').catch(() => ({ data: [] })),
                api.get('/Maintenance/request', { params: { PageSize: 1000 } }).catch(() => ({ data: { items: [] } })),

                // Gọi API lấy trực tiếp SỐ LƯỢNG hóa đơn Chưa thanh toán (Status = 1)
                api.get('/Invoice/list', { params: { Status: 1, PageSize: 1 } }).catch(() => ({ data: { data: { totalCount: 0 } } })),

                // Gọi API lấy Hóa đơn Đã thanh toán (Status = 3) để vẽ biểu đồ doanh thu
                api.get('/Invoice/list', { params: { Status: 3, PageSize: 2000 } }).catch(() => ({ data: { data: { items: [] } } }))
            ]);

            // --- XỬ LÝ SỰ CỐ ---
            const tasks = taskRes.data?.data?.items || taskRes.data?.items || [];
            const pending = tasks.filter(t => String(t.status) === '1').length;
            const processing = tasks.filter(t => String(t.status) === '2' || String(t.status) === '3').length;
            const fixed = tasks.filter(t => String(t.status) === '4').length;
            const closed = tasks.filter(t => String(t.status) === '5' || String(t.status) === 'resolved' || String(t.status) === 'closed').length;

            // --- XỬ LÝ HÓA ĐƠN NỢ ---
            // Trích xuất chuẩn xác totalCount do Backend tính toán
            const unpaidCount = unpaidRes.data?.data?.totalCount || unpaidRes.data?.totalCount || 0;

            // --- XỬ LÝ DOANH THU 6 THÁNG GẦN NHẤT ---
            let paidInvoices = [];
            if (Array.isArray(paidRes.data?.data?.items)) paidInvoices = paidRes.data.data.items;
            else if (Array.isArray(paidRes.data?.items)) paidInvoices = paidRes.data.items;

            const last6Months = Array.from({ length: 6 }, (_, i) => {
                const d = new Date();
                d.setMonth(d.getMonth() - (5 - i));
                return {
                    monthStr: `T${d.getMonth() + 1}`,
                    monthNum: d.getMonth() + 1,
                    year: d.getFullYear(),
                    Doanh_thu: 0
                };
            });

            paidInvoices.forEach(inv => {
                const bMonth = inv.billingMonth ?? inv.BillingMonth;
                const bYear = inv.billingYear ?? inv.BillingYear;
                const money = inv.pay ?? inv.Pay ?? inv.totalMoney ?? inv.TotalMoney ?? 0;

                const match = last6Months.find(m => m.monthNum === bMonth && m.year === bYear);
                if (match) {
                    match.Doanh_thu += money;
                }
            });

            setStats({
                buildings: (bldRes.data?.data || bldRes.data || []).length,
                apartments: (aptRes.data?.data || aptRes.data || []).length,
                residents: (resRes.data?.data || resRes.data || []).length,
                unpaidInvoices: unpaidCount, // Hiển thị con số đếm chuẩn xác từ Backend
                tasks: { pending, processing, fixed, closed },
                revenueData: last6Months.map(m => ({ name: m.monthStr, Doanh_thu: m.Doanh_thu }))
            });
        } catch (error) {
            console.error("Lỗi tải thống kê Dashboard:", error);
        } finally {
            setLoadingStats(false);
        }
    };

    const fetchNews = async () => {
        setLoadingNews(true);
        try {
            const endpoint = showNewsTrash ? '/News/deleted' : '/News';
            const res = await api.get(endpoint);
            setNewsList(Array.isArray(res.data?.data) ? res.data.data : (Array.isArray(res.data) ? res.data : []));
            setStartIndex(0);
        } catch (error) { notify.error("Lỗi tải bản tin."); }
        finally { setLoadingNews(false); }
    };

    useEffect(() => { fetchStats(); }, []);
    useEffect(() => { fetchNews(); }, [showNewsTrash]);

    // ==========================================
    // 🔄 AUTO SLIDER LOGIC
    // ==========================================
    useEffect(() => {
        if (newsList.length <= 3 || isHoveringSlider) return;
        const interval = setInterval(() => {
            setStartIndex(prev => (prev + 1) % newsList.length);
        }, 5000);
        return () => clearInterval(interval);
    }, [newsList.length, isHoveringSlider]);

    const nextSlide = () => { if (newsList.length > 3) setStartIndex((prev) => (prev + 1) % newsList.length); };
    const prevSlide = () => { if (newsList.length > 3) setStartIndex((prev) => (prev === 0 ? newsList.length - 1 : prev - 1)); };

    const getVisibleNews = () => {
        if (newsList.length <= 3) return newsList;
        return [
            newsList[startIndex % newsList.length],
            newsList[(startIndex + 1) % newsList.length],
            newsList[(startIndex + 2) % newsList.length]
        ];
    };

    // --- HANDLERS TIN TỨC ---
    const handleNewsInputChange = (e) => setNewsForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    const handleOpenNewsModal = (item = null) => {
        if (item) { setEditingNewsId(item.newsId); setNewsForm({ title: item.title || '', description: item.description || '' }); }
        else { setEditingNewsId(null); setNewsForm({ title: '', description: '' }); }
    };
    const handleNewsSubmit = async (e) => {
        e.preventDefault(); setIsSubmitting(true);
        try {
            if (editingNewsId) await api.put(`/News/${editingNewsId}`, newsForm);
            else await api.post('/News', newsForm);
            notify.success(editingNewsId ? "Đã cập nhật!" : "Đã đăng bài!");
            fetchNews(); document.getElementById('closeNewsModal').click();
        } catch (error) { notify.error("Lỗi đăng tin."); } finally { setIsSubmitting(false); }
    };
    const handleSoftDeleteNews = async (id) => {
        const { isConfirmed } = await confirmDelete.fire({ title: 'Gỡ bản tin?' });
        if (isConfirmed) { await api.delete(`/News/${id}`); fetchNews(); }
    };
    const handleRestoreNews = async (id) => {
        const { isConfirmed } = await confirmAction.fire({ title: 'Khôi phục bản tin?', confirmButtonText: 'Khôi phục' });
        if (isConfirmed) { await api.put(`/News/${id}/restore`); fetchNews(); }
    };
    const handleHardDeleteNews = async (id) => {
        const { isConfirmed } = await confirmDelete.fire({ title: 'XÓA VĨNH VIỄN!' });
        if (isConfirmed) { await api.delete(`/News/${id}/hard`); fetchNews(); }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    // --- DATA CHO BIỂU ĐỒ ---
    const maintenanceChartData = [
        { name: 'Chờ phân công', value: stats.tasks.pending, color: '#dc3545' },
        { name: 'Đang xử lý', value: stats.tasks.processing, color: '#ffc107' },
        { name: 'Chờ nghiệm thu', value: stats.tasks.fixed, color: '#0dcaf0' },
        { name: 'Đã hoàn thành', value: stats.tasks.closed, color: '#198754' }
    ].filter(item => item.value > 0);

    return (
        <div className="container-fluid p-0 pb-5">
            <div className="mb-4">
                <h3 className="fw-bold mb-0 text-dark">Tổng Quan Hệ Thống</h3>
                <div className="text-muted small mt-1">Theo dõi các chỉ số và dữ liệu vận hành tòa nhà</div>
            </div>

            {/* ========================================== */}
            {/* THỐNG KÊ (5 KPI CARDS HIỆN ĐẠI)            */}
            {/* ========================================== */}
            {loadingStats ? (
                <div className="text-center p-5"><div className="spinner-border text-primary"></div></div>
            ) : (
                <div className="row row-cols-1 row-cols-md-3 row-cols-xl-5 g-4 mb-4">
                    <div className="col">
                        <div className="card h-100 border-0 shadow-sm rounded-4 position-relative overflow-hidden kpi-card">
                            <div className="card-body p-4 d-flex align-items-center justify-content-between">
                                <div>
                                    <h6 className="text-muted fw-bold mb-1 small text-uppercase">Tòa Nhà</h6>
                                    <h2 className="fw-bold mb-0 text-dark">{stats.buildings}</h2>
                                </div>
                                <div className="bg-primary bg-opacity-10 p-3 rounded-circle d-flex align-items-center justify-content-center" style={{ width: '60px', height: '60px' }}>
                                    <i className="bi bi-building text-primary fs-3"></i>
                                </div>
                            </div>
                            <div className="card-footer bg-white border-0 p-0">
                                <Link to="/admin/buildings" className="text-decoration-none d-flex align-items-center justify-content-between px-4 py-3 border-top hover-bg-light">
                                    <span className="small text-primary fw-bold">Xem chi tiết</span>
                                    <i className="bi bi-arrow-right text-primary"></i>
                                </Link>
                            </div>
                            <div className="position-absolute bottom-0 start-0 w-100 bg-primary" style={{ height: '4px' }}></div>
                        </div>
                    </div>

                    <div className="col">
                        <div className="card h-100 border-0 shadow-sm rounded-4 position-relative overflow-hidden kpi-card">
                            <div className="card-body p-4 d-flex align-items-center justify-content-between">
                                <div>
                                    <h6 className="text-muted fw-bold mb-1 small text-uppercase">Căn Hộ</h6>
                                    <h2 className="fw-bold mb-0 text-dark">{stats.apartments}</h2>
                                </div>
                                <div className="bg-success bg-opacity-10 p-3 rounded-circle d-flex align-items-center justify-content-center" style={{ width: '60px', height: '60px' }}>
                                    <i className="bi bi-door-open text-success fs-3"></i>
                                </div>
                            </div>
                            <div className="card-footer bg-white border-0 p-0">
                                <Link to="/admin/apartments" className="text-decoration-none d-flex align-items-center justify-content-between px-4 py-3 border-top hover-bg-light">
                                    <span className="small text-success fw-bold">Xem chi tiết</span>
                                    <i className="bi bi-arrow-right text-success"></i>
                                </Link>
                            </div>
                            <div className="position-absolute bottom-0 start-0 w-100 bg-success" style={{ height: '4px' }}></div>
                        </div>
                    </div>

                    <div className="col">
                        <div className="card h-100 border-0 shadow-sm rounded-4 position-relative overflow-hidden kpi-card">
                            <div className="card-body p-4 d-flex align-items-center justify-content-between">
                                <div>
                                    <h6 className="text-muted fw-bold mb-1 small text-uppercase">Cư Dân</h6>
                                    <h2 className="fw-bold mb-0 text-dark">{stats.residents}</h2>
                                </div>
                                <div className="bg-warning bg-opacity-10 p-3 rounded-circle d-flex align-items-center justify-content-center" style={{ width: '60px', height: '60px' }}>
                                    <i className="bi bi-people text-warning fs-3"></i>
                                </div>
                            </div>
                            <div className="card-footer bg-white border-0 p-0">
                                <Link to="/admin/residents" className="text-decoration-none d-flex align-items-center justify-content-between px-4 py-3 border-top hover-bg-light">
                                    <span className="small text-warning fw-bold">Xem chi tiết</span>
                                    <i className="bi bi-arrow-right text-warning"></i>
                                </Link>
                            </div>
                            <div className="position-absolute bottom-0 start-0 w-100 bg-warning" style={{ height: '4px' }}></div>
                        </div>
                    </div>

                    <div className="col">
                        <div className="card h-100 border-0 shadow-sm rounded-4 position-relative overflow-hidden kpi-card">
                            <div className="card-body p-4 d-flex align-items-center justify-content-between">
                                <div>
                                    <h6 className="text-muted fw-bold mb-1 small text-uppercase">Hóa Đơn Nợ</h6>
                                    <h2 className="fw-bold mb-0 text-danger">{stats.unpaidInvoices}</h2>
                                </div>
                                <div className="bg-danger bg-opacity-10 p-3 rounded-circle d-flex align-items-center justify-content-center" style={{ width: '60px', height: '60px' }}>
                                    <i className="bi bi-receipt text-danger fs-3"></i>
                                </div>
                            </div>
                            <div className="card-footer bg-white border-0 p-0">
                                <Link to="/admin/invoices" className="text-decoration-none d-flex align-items-center justify-content-between px-4 py-3 border-top hover-bg-light">
                                    <span className="small text-danger fw-bold">Tới trang Thu Phí</span>
                                    <i className="bi bi-arrow-right text-danger"></i>
                                </Link>
                            </div>
                            <div className="position-absolute bottom-0 start-0 w-100 bg-danger" style={{ height: '4px' }}></div>
                        </div>
                    </div>

                    <div className="col">
                        <div className="card h-100 border-0 shadow-sm rounded-4 position-relative overflow-hidden kpi-card">
                            <div className="card-body p-4 d-flex align-items-center justify-content-between">
                                <div>
                                    <h6 className="text-muted fw-bold mb-1 small text-uppercase">Sự cố tồn đọng</h6>
                                    <h2 className="fw-bold mb-0 text-info">{stats.tasks.pending + stats.tasks.processing}</h2>
                                </div>
                                <div className="bg-info bg-opacity-10 p-3 rounded-circle d-flex align-items-center justify-content-center" style={{ width: '60px', height: '60px' }}>
                                    <i className="bi bi-tools text-info fs-3"></i>
                                </div>
                            </div>
                            <div className="card-footer bg-white border-0 p-0">
                                <Link to="/admin/maintenance" className="text-decoration-none d-flex align-items-center justify-content-between px-4 py-3 border-top hover-bg-light">
                                    <span className="small text-info fw-bold">Xem chi tiết</span>
                                    <i className="bi bi-arrow-right text-info"></i>
                                </Link>
                            </div>
                            <div className="position-absolute bottom-0 start-0 w-100 bg-info" style={{ height: '4px' }}></div>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================== */}
            {/* BIỂU ĐỒ DOANH THU & SỰ CỐ                  */}
            {/* ========================================== */}
            <div className="row g-4 mb-4">
                {/* Biểu đồ Doanh Thu */}
                <div className="col-lg-8">
                    <div className="card border-0 shadow-sm rounded-4 h-100">
                        <div className="card-header bg-white border-bottom pt-4 px-4 pb-3">
                            <h6 className="fw-bold mb-0 text-dark"><i className="bi bi-graph-up-arrow text-success me-2"></i> Doanh Thu 6 Tháng Gần Nhất (VNĐ)</h6>
                        </div>
                        <div className="card-body p-4" style={{ height: '350px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={stats.revenueData} margin={{ top: 10, right: 30, left: 20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#198754" stopOpacity={0.4} />
                                            <stop offset="95%" stopColor="#198754" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e9ecef" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                    <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`} />
                                    <Tooltip
                                        formatter={(value) => [value.toLocaleString() + ' đ', 'Doanh thu']}
                                        contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                                    />
                                    <Area type="monotone" dataKey="Doanh_thu" stroke="#198754" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Biểu đồ Sự Cố */}
                <div className="col-lg-4">
                    <div className="card border-0 shadow-sm rounded-4 h-100">
                        <div className="card-header bg-white border-bottom pt-4 px-4 pb-3">
                            <h6 className="fw-bold mb-0 text-dark"><i className="bi bi-pie-chart-fill text-warning me-2"></i> Tỷ Lệ Xử Lý Sự Cố</h6>
                        </div>
                        <div className="card-body p-4 d-flex justify-content-center align-items-center" style={{ height: '350px' }}>
                            {maintenanceChartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={maintenanceChartData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value">
                                            {maintenanceChartData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="text-muted text-center"><i className="bi bi-inbox display-4 opacity-25 d-block mb-2"></i> Chưa có sự cố nào</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ========================================== */}
            {/* TỔNG QUAN BAR CHART VÀ BẢNG TIN TỨC        */}
            {/* ========================================== */}
            <div className="row g-4 mb-4">
                {/* Bảng Tin Tức */}
                <div className="col-lg-12">
                    <div className="card border-0 shadow-sm rounded-4 mb-4">
                        <div className="card-header bg-white border-0 pt-4 px-4 pb-2 d-flex justify-content-between align-items-center">
                            <h5 className="fw-bold mb-0 text-dark">
                                <i className="bi bi-newspaper text-primary me-2"></i>
                                {showNewsTrash ? 'Thùng rác: Bảng Tin' : 'Bản tin Cư Dân'}
                            </h5>
                            <div className="d-flex align-items-center gap-2">
                                {!showNewsTrash && (
                                    <button className="btn btn-primary btn-sm fw-bold rounded-pill px-3" onClick={() => handleOpenNewsModal()} data-bs-toggle="modal" data-bs-target="#newsModal">
                                        <i className="bi bi-plus-lg me-1"></i> Đăng tin
                                    </button>
                                )}
                                <button className={`btn btn-sm fw-bold rounded-pill px-3 ${showNewsTrash ? 'btn-secondary' : 'btn-outline-danger'}`} onClick={() => setShowNewsTrash(!showNewsTrash)}>
                                    <i className={`bi ${showNewsTrash ? 'bi-arrow-left' : 'bi-archive'} me-1`}></i>
                                    {showNewsTrash ? 'Quay lại' : 'Thùng rác'}
                                </button>
                            </div>
                        </div>

                        <div className="card-body p-4 position-relative" onMouseEnter={() => setIsHoveringSlider(true)} onMouseLeave={() => setIsHoveringSlider(false)}>
                            {loadingNews ? (
                                <div className="text-center p-5"><div className="spinner-border text-primary"></div></div>
                            ) : newsList.length === 0 ? (
                                <div className="text-center p-5 text-muted bg-light rounded-4 border border-dashed">Chưa có bản tin nào.</div>
                            ) : (
                                <>
                                    {newsList.length > 3 && (
                                        <button onClick={prevSlide} className="btn btn-white bg-white shadow border rounded-circle position-absolute top-50 start-0 translate-middle-y z-2 d-flex align-items-center justify-content-center hover-dark" style={{ width: '45px', height: '45px', marginLeft: '10px' }}>
                                            <i className="bi bi-chevron-left fs-5"></i>
                                        </button>
                                    )}

                                    <div className="row g-4 px-2">
                                        {getVisibleNews().map((news, index) => (
                                            <div className="col-md-4" key={`${news.newsId}-${index}`}>
                                                <div className={`card h-100 border rounded-4 hover-shadow-sm ${showNewsTrash ? 'bg-light' : 'bg-white'}`}>
                                                    <div className="card-body p-4 d-flex flex-column">
                                                        <div className="d-flex justify-content-between mb-3">
                                                            <span className="badge bg-light text-dark border"><i className="bi bi-pin-angle me-1 text-primary"></i>Tin tức</span>
                                                            <div className="dropdown">
                                                                <i className="bi bi-three-dots text-muted cursor-pointer" data-bs-toggle="dropdown"></i>
                                                                <ul className="dropdown-menu dropdown-menu-end shadow-sm border-0">
                                                                    {!showNewsTrash ? (
                                                                        <>
                                                                            <li><button className="dropdown-item small" onClick={() => handleOpenNewsModal(news)} data-bs-toggle="modal" data-bs-target="#newsModal">Sửa tin</button></li>
                                                                            <li><button className="dropdown-item small text-danger" onClick={() => handleSoftDeleteNews(news.newsId)}>Gỡ tin</button></li>
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <li><button className="dropdown-item small text-success" onClick={() => handleRestoreNews(news.newsId)}>Khôi phục</button></li>
                                                                            <li><button className="dropdown-item small text-danger" onClick={() => handleHardDeleteNews(news.newsId)}>Xóa vĩnh viễn</button></li>
                                                                        </>
                                                                    )}
                                                                </ul>
                                                            </div>
                                                        </div>
                                                        <h6 className="fw-bold mb-2 text-dark line-clamp-2" style={{ height: '2.5rem' }}>{news.title}</h6>
                                                        <p className="small text-muted mb-4 flex-grow-1 line-clamp-3">{news.description}</p>
                                                        <div className="mt-auto d-flex justify-content-between align-items-center pt-3 border-top">
                                                            <small className="text-muted fw-medium"><i className="bi bi-calendar3 me-1"></i>{formatDate(news.createdAt)}</small>
                                                            <span className="text-primary small fw-bold cursor-pointer hover-text-dark" onClick={() => setDetailNews(news)} data-bs-toggle="modal" data-bs-target="#newsDetailModal">Chi tiết <i className="bi bi-arrow-right"></i></span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {newsList.length > 3 && (
                                        <button onClick={nextSlide} className="btn btn-white bg-white shadow border rounded-circle position-absolute top-50 end-0 translate-middle-y z-2 d-flex align-items-center justify-content-center hover-dark" style={{ width: '45px', height: '45px', marginRight: '10px' }}>
                                            <i className="bi bi-chevron-right fs-5"></i>
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Các Modal (Thêm/Sửa tin, Xem chi tiết) */}
            <div className="modal fade" id="newsModal" tabIndex="-1" aria-hidden="true">
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content border-0 shadow-lg rounded-4">
                        <div className="modal-header bg-primary text-white border-0 px-4 py-3 rounded-top-4">
                            <h5 className="modal-title fw-bold">{editingNewsId ? 'Sửa Bản Tin' : 'Đăng Bản Tin Mới'}</h5>
                            <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal" id="closeNewsModal"></button>
                        </div>
                        <form onSubmit={handleNewsSubmit}>
                            <div className="modal-body p-4">
                                <div className="mb-3">
                                    <label className="form-label fw-bold small text-muted">Tiêu đề bản tin *</label>
                                    <input type="text" className="form-control bg-light border-0" name="title" value={newsForm.title} onChange={handleNewsInputChange} required />
                                </div>
                                <div className="mb-0">
                                    <label className="form-label fw-bold small text-muted">Nội dung chi tiết *</label>
                                    <textarea className="form-control bg-light border-0" name="description" rows="6" value={newsForm.description} onChange={handleNewsInputChange} required></textarea>
                                </div>
                            </div>
                            <div className="modal-footer bg-light border-0 px-4 py-3 rounded-bottom-4">
                                <button type="button" className="btn btn-white border rounded-pill px-4" data-bs-dismiss="modal">Hủy</button>
                                <button type="submit" className="btn btn-primary rounded-pill px-4 fw-bold" disabled={isSubmitting}>Lưu bản tin</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            {/* Modal Xem Chi Tiết News */}
            {detailNews && (
                <div className="modal fade" id="newsDetailModal" tabIndex="-1" aria-hidden="true">
                    <div className="modal-dialog modal-dialog-centered modal-lg">
                        <div className="modal-content border-0 shadow-lg rounded-4">
                            <div className="modal-body p-5">
                                <button type="button" className="btn-close position-absolute top-0 end-0 m-4" data-bs-dismiss="modal"></button>
                                <span className="badge bg-primary bg-opacity-10 text-primary border border-primary px-3 py-2 rounded-pill mb-3">Bản tin cư dân</span>
                                <h3 className="fw-bold text-dark mb-3">{detailNews.title}</h3>
                                <div className="text-muted small mb-4 d-flex align-items-center gap-3 border-bottom pb-4">
                                    <span><i className="bi bi-calendar3 me-1"></i> {new Date(detailNews.createdAt).toLocaleDateString('vi-VN')}</span>
                                    <span><i className="bi bi-person-circle me-1"></i> Ban Quản Lý</span>
                                </div>
                                <div className="text-dark" style={{ whiteSpace: 'pre-wrap', lineHeight: '1.8', fontSize: '15px' }}>
                                    {detailNews.description}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Styles */}
            <style>{`
                .kpi-card { transition: transform 0.3s ease, box-shadow 0.3s ease; }
                .kpi-card:hover { transform: translateY(-5px); box-shadow: 0 1rem 3rem rgba(0,0,0,.15)!important; }
                .hover-bg-light:hover { background-color: #f8f9fa !important; }
                .border-dashed { border-style: dashed !important; border-width: 2px !important; }
                
                .hover-shadow-sm:hover { transform: translateY(-2px); box-shadow: 0 .125rem .25rem rgba(0,0,0,.075)!important; border-color: #0d6efd !important; }
                .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
                .line-clamp-3 { display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
                .cursor-pointer { cursor: pointer; }
                .hover-text-dark:hover { color: #212529 !important; }
                .hover-dark:hover { background-color: #212529 !important; color: white !important; }
                .hover-dark:hover i { color: white !important; }
            `}</style>
        </div>
    );
};

export default AdminDashboard;