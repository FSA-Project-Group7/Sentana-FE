import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
// import Navbar from '../components/Navbar'; // Đã thay bằng Smart Header nội bộ cho Landing Page
import About from '../components/About';
import Contact from '../components/Contact';
import Sidebar from '../components/Sidebar';
import Facilities from '../components/Facilities';
import Rooms from '../components/Rooms';
import bannerImg from '../assets/banner.jpg';

const customHomeStyles = `
/* Style cho Navbar trong suốt của riêng Trang chủ */
.home-navbar {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    z-index: 100;
    padding: 1.5rem 3rem;
    background: linear-gradient(rgba(15, 23, 42, 0.8), transparent);
    color: white;
}
/* Style cho Thẻ Bản tin */
.news-card {
    background: white;
    color: #1e293b;
    border-radius: 16px;
    padding: 2rem;
    height: 100%;
    transition: transform 0.3s ease;
    border: 1px solid #e2e8f0;
    text-align: left;
}
.news-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1);
}
.news-tag {
    font-size: 0.75rem;
    font-weight: 700;
    padding: 0.4rem 1rem;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    display: inline-block;
    margin-bottom: 1.5rem;
}
`;

const Home = () => {
    const navigate = useNavigate();
    const [activeSection, setActiveSection] = useState('home');

    // States quản lý trạng thái Đăng nhập trên Trang chủ
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userRole, setUserRole] = useState('');
    const [userName, setUserName] = useState('');

    // Kiểm tra LocalStorage khi load trang
    useEffect(() => {
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('role');
        const userStr = localStorage.getItem('user');

        if (token) {
            setIsLoggedIn(true);
            setUserRole(role);
            try {
                const userObj = userStr ? JSON.parse(userStr) : null;
                setUserName(userObj?.info?.fullName || userObj?.fullName || userObj?.userName || 'Cư dân');
            } catch {
                setUserName('Cư dân');
            }
        }
    }, []);

    // Scroll Spy: Dùng IntersectionObserver siêu mượt
    useEffect(() => {
        // Đã bổ sung thêm 'news' vào danh sách theo dõi
        const sections = ['home', 'news', 'about', 'facilities', 'rooms', 'contact'];

        const observerOptions = {
            root: null,
            rootMargin: '-40% 0px -60% 0px',
            threshold: 0
        };

        const observerCallback = (entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    setActiveSection(entry.target.id);
                }
            });
        };

        const observer = new IntersectionObserver(observerCallback, observerOptions);

        sections.forEach(sectionId => {
            const element = document.getElementById(sectionId);
            if (element) observer.observe(element);
        });

        return () => observer.disconnect();
    }, []);

    // Xử lý nút Click (Vào Dashboard / Đăng nhập)
    const handleCtaClick = () => {
        if (isLoggedIn) {
            if (userRole === 'Resident') navigate('/resident/dashboard');
            else navigate('/admin/dashboard');
        } else {
            navigate('/login');
        }
    };

    // Xử lý Đăng xuất trực tiếp tại Landing Page
    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('role');
        setIsLoggedIn(false);
        setUserName('');
        setUserRole('');
        toast.info("Đã đăng xuất thành công!", { theme: "colored" });
    };

    return (
        <div style={{ backgroundColor: '#f8f9fa' }}>
            <style>{customHomeStyles}</style>

            {/* SMART NAVBAR CHO TRANG CHỦ CÔNG CỘNG */}
            <nav className="home-navbar d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center" style={{ cursor: 'pointer' }} onClick={() => window.scrollTo(0, 0)}>
                    <div className="bg-white rounded-circle d-flex justify-content-center align-items-center me-2" style={{ width: '40px', height: '40px' }}>
                        <i className="bi bi-buildings-fill fs-5 text-primary"></i>
                    </div>
                    <span className="fw-bolder fs-4">Sentana</span>
                </div>

                <div className="d-flex align-items-center gap-3">
                    {isLoggedIn ? (
                        <>
                            <span className="fw-semibold me-3 d-none d-md-block text-white">Xin chào, {userName} 👋</span>
                            <button onClick={handleCtaClick} className="btn btn-light fw-bold rounded-pill px-4 shadow-sm">
                                Vào Dashboard
                            </button>
                            <button onClick={handleLogout} className="btn btn-outline-light fw-bold rounded-pill px-4">
                                Đăng xuất
                            </button>
                        </>
                    ) : (
                        <Link to="/login" className="btn btn-light fw-bold rounded-pill px-5 shadow-sm">
                            Đăng nhập
                        </Link>
                    )}
                </div>
            </nav>

            {/* HERO BANNER SECTION */}
            <section
                id="home"
                className="d-flex align-items-center justify-content-center text-white position-relative"
                style={{
                    height: '100vh',
                    backgroundImage: `url(${bannerImg})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundColor: 'rgba(15, 23, 42, 0.7)',
                    backgroundBlendMode: 'overlay'
                }}
            >
                <div className="text-center" style={{ zIndex: 2 }}>
                    <span className="badge bg-primary bg-opacity-75 px-3 py-2 mb-3 rounded-pill text-uppercase tracking-wide">
                        Khu dân cư cao cấp
                    </span>
                    <h1 className="display-3 fw-bolder mb-3 text-shadow">SENTANA APARTMENT</h1>
                    <p className="lead fw-medium mb-5" style={{ opacity: 0.9 }}>
                        Hệ thống quản lý tòa nhà thông minh, minh bạch và tiện lợi nhất.
                    </p>

                </div>
            </section>

            {/* BẢN TIN SENTANA (Tích hợp từ ảnh) */}
            <section id="news" className="container mt-5 pt-5 text-center">
                <h2 className="display-5 fw-bolder mb-3 text-dark">Bản tin SENTANA</h2>
                <p className="lead mb-5 text-muted">Cập nhật những thông báo mới nhất từ Ban quản lý tòa nhà</p>

                <div className="row g-4 justify-content-center mt-2">
                    <div className="col-md-4">
                        <div className="news-card shadow-sm">
                            <div className="news-tag text-secondary">Bảo trì</div>
                            <h5 className="fw-bold mb-3">Bảo trì định kỳ thang máy tòa A</h5>
                            <p className="text-muted mb-5">Từ 22h00 - 04h00 sáng mai sẽ tiến hành bảo trì thang máy số 1 và số 2.</p>
                            <hr className="text-muted opacity-25" />
                            <small className="text-muted fw-semibold"><i className="bi bi-calendar3 me-2"></i>17/03/2026</small>
                        </div>
                    </div>
                    <div className="col-md-4">
                        <div className="news-card shadow-sm">
                            <div className="news-tag text-secondary">Tài chính</div>
                            <h5 className="fw-bold mb-3">Phát hành hóa đơn dịch vụ tháng 03/2026</h5>
                            <p className="text-muted mb-5">Hóa đơn tháng 3 đã được cập nhật. Quý cư dân vui lòng kiểm tra và thanh toán.</p>
                            <hr className="text-muted opacity-25" />
                            <small className="text-muted fw-semibold"><i className="bi bi-calendar3 me-2"></i>15/03/2026</small>
                        </div>
                    </div>
                    <div className="col-md-4">
                        <div className="news-card shadow-sm">
                            <div className="news-tag text-secondary">Thông báo</div>
                            <h5 className="fw-bold mb-3">Đăng ký bãi đỗ xe ô tô tháng tới</h5>
                            <p className="text-muted mb-5">BQL bắt đầu tiếp nhận form đăng ký gia hạn bãi đỗ xe ô tô dưới tầng hầm B2.</p>
                            <hr className="text-muted opacity-25" />
                            <small className="text-muted fw-semibold"><i className="bi bi-calendar3 me-2"></i>10/03/2026</small>
                        </div>
                    </div>
                </div>
            </section>

            {/* MAIN CONTENT VỚI SIDEBAR (Giữ nguyên code cũ của bạn) */}
            <div className="container-fluid px-3 px-xl-5 mt-5 pt-5" style={{ maxWidth: '1920px' }}>
                <div className="d-flex flex-wrap flex-lg-nowrap justify-content-between gap-4">

                    <div style={{ width: 'calc(100% - 320px)', minWidth: 0 }}>
                        {/* Đảm bảo các Component con này có thẻ bao ngoài chứa id tương ứng (VD: <div id="about">) */}
                        <About />
                        <Facilities />
                        <Rooms />
                        <Contact />
                    </div>

                    <div className="d-none d-lg-block position-relative" style={{ width: '220px', flexShrink: 0 }}>
                        <div className="sticky-top" style={{ top: '100px' }}>
                            <Sidebar activeSection={activeSection} />
                        </div>
                    </div>

                </div>
            </div>

            {/* FOOTER */}
            <footer className="text-white pt-5 pb-4 mt-5 shadow-lg" style={{ backgroundColor: '#0f172a' }}>
                <div className="container-fluid px-3 px-xl-5" style={{ maxWidth: '1920px' }}>
                    <div className="row text-md-start text-center">

                        <div className="col-md-4 col-lg-4 mb-4 pe-lg-5">
                            <h5 className="text-uppercase fw-bold mb-4 d-flex align-items-center justify-content-md-start justify-content-center gap-2">
                                <span className="bg-white text-primary rounded-circle d-flex align-items-center justify-content-center fw-bolder shadow-sm" style={{ width: '40px', height: '40px', fontSize: '1.2rem' }}>S</span>
                                SENTANA
                            </h5>
                            <p className="text-light" style={{ fontSize: '0.95rem', lineHeight: '1.8', opacity: '0.8' }}>
                                Hệ thống quản lý chung cư thông minh, mang đến trải nghiệm sống hiện đại, minh bạch và tiện nghi nhất cho cộng đồng cư dân. Ứng dụng công nghệ 4.0 vào vận hành tòa nhà.
                            </p>
                        </div>

                        <div className="col-md-4 col-lg-3 mb-4 mx-auto">
                            <h5 className="text-uppercase fw-bold mb-4 text-primary">Liên kết nhanh</h5>
                            <ul className="list-unstyled" style={{ fontSize: '0.95rem', lineHeight: '2' }}>
                                <li><a href="#about" className="text-light text-decoration-none" style={{ opacity: '0.8', transition: '0.2s' }}>Giới thiệu tổng quan</a></li>
                                <li><a href="#facilities" className="text-light text-decoration-none" style={{ opacity: '0.8', transition: '0.2s' }}>Hệ thống tiện ích</a></li>
                                <li><a href="#rooms" className="text-light text-decoration-none" style={{ opacity: '0.8', transition: '0.2s' }}>Mặt bằng các loại phòng</a></li>
                                <li><a href="#contact" className="text-light text-decoration-none" style={{ opacity: '0.8', transition: '0.2s' }}>Liên hệ Ban quản lý</a></li>
                            </ul>
                        </div>

                        <div className="col-md-4 col-lg-3 mb-4">
                            <h5 className="text-uppercase fw-bold mb-4 text-primary">Thông tin dự án</h5>
                            <p className="text-light mb-2" style={{ fontSize: '0.95rem', opacity: '0.8' }}>
                                <i className="bi bi-laptop me-2"></i><strong>Hệ thống:</strong> Quản lý Chung cư
                            </p>
                            <p className="text-light mb-2" style={{ fontSize: '0.95rem', opacity: '0.8' }}>
                                <i className="bi bi-code-slash me-2"></i><strong>Stack:</strong> ReactJS, ASP.NET Core
                            </p>
                            <p className="text-light mb-2" style={{ fontSize: '0.95rem', opacity: '0.8' }}>
                                <i className="bi bi-people-fill me-2"></i><strong>Đội ngũ:</strong> Group_07 FSA
                            </p>
                        </div>
                    </div>

                    <hr className="mb-4 mt-2" style={{ borderColor: 'rgba(255,255,255,0.1)' }} />

                    <div className="text-center text-light" style={{ fontSize: '0.85rem', opacity: '0.6' }}>
                        <p className="mb-0">© 2026 Bản quyền thuộc về Dự án Sentana. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Home;