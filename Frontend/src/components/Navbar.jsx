import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import logoImg from '../assets/logo.png';

// Nhận prop isResident (mặc định là false)
const Navbar = ({ isResident = false }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY < 80) {
                setIsVisible(true);
            } else {
                setIsVisible(false);
            }
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleLogout = () => {
        if (window.confirm('Xác nhận đăng xuất khỏi hệ thống?')) {
            localStorage.removeItem('token');
            localStorage.removeItem('role');
            navigate('/login');
        }
    };

    const isActive = (path) => location.pathname === path ? 'fw-bold border-bottom border-2 border-white' : '';

    return (
        <nav
            className="navbar navbar-expand-lg navbar-dark fixed-top"
            style={{
                backgroundColor: 'rgba(33, 37, 41, 0.9)',
                transition: 'transform 0.3s ease-in-out',
                transform: isVisible ? 'translateY(0)' : 'translateY(-100%)',
            }}
        >
            <div className="container">
                <Link className="navbar-brand d-flex align-items-center gap-2" to={isResident ? "/resident" : "#home"}>
                    <img
                        src={logoImg}
                        alt="Sentana Logo"
                        width="40"
                        height="40"
                        className="d-inline-block align-text-top rounded-circle bg-white p-1"
                        style={{ objectFit: 'contain' }}
                    />
                    <span className="fw-bold">Sentana</span>
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
                                    <Link className={`nav-link ${isActive('/resident/dashboard')}`} to="/resident/dashboard">Hóa đơn</Link>
                                </li>
                                <li className="nav-item">
                                    <Link className="nav-link" to="#!">Báo cáo sự cố</Link>
                                </li>
                            </>
                        ) : (
                            <>
                                <li className="nav-item"><a className="nav-link" href="#home">Trang chủ</a></li>
                                <li className="nav-item"><a className="nav-link" href="#about">Giới thiệu</a></li>
                                <li className="nav-item"><a className="nav-link" href="#facilities">Tiện ích</a></li>
                                <li className="nav-item"><a className="nav-link" href="#rooms">Các loại phòng</a></li>
                                <li className="nav-item"><a className="nav-link" href="#contact">Liên hệ</a></li>
                            </>
                        )}
                    </ul>

                    <div className="d-flex gap-2">
                        {isResident ? (
                            <button onClick={handleLogout} className="btn btn-outline-light">
                                Đăng xuất
                            </button>
                        ) : (
                            <Link to="/login" className="btn btn-outline-light">
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