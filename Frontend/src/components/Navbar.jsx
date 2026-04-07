import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import logoImg from '../assets/logo.png';

// Nhận prop isResident (mặc định là false)
const Navbar = ({ isResident = false }) => {
    const navigate = useNavigate();
    const location = useLocation();

    const [isVisible, setIsVisible] = useState(true);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [fullName, setFullName] = useState('');

    useEffect(() => {
        // --- LOGIC SCROLL ---
        const handleScroll = () => {
            if (window.scrollY < 80) {
                setIsVisible(true);
            } else {
                setIsVisible(false);
            }
        };
        window.addEventListener('scroll', handleScroll);

        const token = localStorage.getItem('token');
        if (token) {
            setIsLoggedIn(true);
            try {
                const base64Url = token.split('.')[1];
                const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
                    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                }).join(''));

                const payload = JSON.parse(jsonPayload);

                const nameFromToken = payload.unique_name || payload.name || payload.sub || 'bạn';
                setFullName(nameFromToken);

            } catch (error) {
                console.error("Lỗi giải mã Token:", error);
                setFullName('bạn');
            }
        }

        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleLogout = () => {
        if (window.confirm('Xác nhận đăng xuất khỏi hệ thống?')) {
            localStorage.removeItem('token');
            localStorage.removeItem('role');
            localStorage.removeItem('refreshToken');
            navigate('/login');
        }
    };

    const isActive = (path) => location.pathname === path ? 'fw-bold border-bottom border-2 border-white' : '';

    return (
        <nav
            className="navbar navbar-expand-lg navbar-dark fixed-top"
            style={{
                backgroundColor: 'rgba(33, 37, 41, 0.95)', // Tăng độ mờ một chút cho nền đậm hơn
                transition: 'transform 0.3s ease-in-out',
                transform: isVisible ? 'translateY(0)' : 'translateY(-100%)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.05)' // Thêm viền dưới cực mỏng, tinh tế
            }}
        >
            <div className="container">
                <Link className="navbar-brand d-flex align-items-center gap-2" to={isResident ? "/resident" : "#home"}>
                    <img
                        src={logoImg}
                        alt="Sentana Logo"
                        width="38"
                        height="38"
                        className="d-inline-block align-text-top rounded-circle bg-white p-1"
                        style={{ objectFit: 'contain' }}
                    />
                    <span className="fw-semibold fs-5 tracking-tight text-white">Sentana</span>
                </Link>

                <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                    <span className="navbar-toggler-icon"></span>
                </button>

                <div className="collapse navbar-collapse" id="navbarNav">
                    <ul className="navbar-nav mx-auto gap-4">
                        {isResident ? (
                            // MENU DÀNH CHO CƯ DÂN
                            <>
                                <li className="nav-item">
                                    <Link className={`nav-link ${isActive('/resident')}`} to="/resident">Tổng quan</Link>
                                </li>
                                <li className="nav-item">
                                    <Link className={`nav-link ${isActive('/resident/profile')}`} to="/resident/profile">Thông tin cá nhân</Link>
                                </li>
                                <li className="nav-item">
                                    <Link className={`nav-link ${isActive('/resident/my-contract')}`} to="/resident/my-contract">Hợp đồng</Link>
                                </li>
                                <li className="nav-item">
                                    <Link className={`nav-link ${isActive('/resident/dashboard')}`} to="/resident/dashboard">Hóa đơn</Link>
                                </li>
                                <li className="nav-item">
                                    <Link className={`nav-link ${isActive('/resident/maintenance')}`} to="/resident/maintenance">Báo cáo sự cố</Link>
                                </li>
                            </>
                        ) : (
                            <>
                                <li className="nav-item"><a className="nav-link fw-normal" href="#home">Trang chủ</a></li>
                                <li className="nav-item"><a className="nav-link fw-normal" href="#about">Giới thiệu</a></li>
                                <li className="nav-item"><a className="nav-link fw-normal" href="#facilities">Tiện ích</a></li>
                                <li className="nav-item"><a className="nav-link fw-normal" href="#rooms">Các loại phòng</a></li>
                                <li className="nav-item"><a className="nav-link fw-normal" href="#contact">Liên hệ</a></li>
                            </>
                        )}
                    </ul>

                    <div className="d-flex gap-2">
                        {isResident ? (
                            <button onClick={handleLogout} className="btn btn-outline-light btn-sm fw-normal">
                                Đăng xuất
                            </button>
                        ) : isLoggedIn ? (
                            <Link to="/login"
                                className="nav-link d-flex align-items-center gap-1 text-decoration-none px-3 py-1 rounded"
                                style={{
                                    fontSize: '0.95rem',
                                    fontWeight: 400,
                                    color: 'rgba(255, 255, 255, 0.85)',
                                    backgroundColor: 'transparent',
                                    transition: 'all 0.2s ease-out',
                                }}
                                onMouseOver={(e) => {
                                    e.target.style.color = '#fff';
                                    e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                                }}
                                onMouseOut={(e) => {
                                    e.target.style.color = 'rgba(255, 255, 255, 0.85)';
                                    e.target.style.backgroundColor = 'transparent';
                                }}
                            >
                                <span style={{ opacity: '0.6' }}>Xin chào,</span>
                                <span className="fw-medium text-white">{fullName}</span>
                                <i className="bi bi-chevron-right ms-1 small" style={{ opacity: '0.4' }}></i>
                            </Link>
                        ) : (
                            <Link to="/login" className="btn btn-outline-light btn-sm fw-normal px-3 rounded-2">
                                Đăng nhập
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;