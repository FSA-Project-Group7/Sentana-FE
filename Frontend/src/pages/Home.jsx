import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import About from '../components/About';
import Contact from '../components/Contact';
import Sidebar from '../components/Sidebar';
import Facilities from '../components/Facilities';
import Rooms from '../components/Rooms';
import bannerImg from '../assets/banner.jpg';

const Home = () => {

    const [activeSection, setActiveSection] = useState('about');

    useEffect(() => {
        const handleScroll = () => {

            const sections = ['about', 'facilities', 'rooms', 'contact'];
            let currentSection = 'about';

            for (let section of sections) {
                const element = document.getElementById(section);
                if (element) {
                    const rect = element.getBoundingClientRect();
                    // Nếu phần tử cuộn lên cách đỉnh màn hình 150px thì active
                    if (rect.top <= 150) {
                        currentSection = section;
                    }
                }
            }
            setActiveSection(currentSection);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div style={{ backgroundColor: '#f8f9fa' }}>

            <Navbar />

            {/* --- BANNER TÌM KIẾM --- */}
            <section
                id="home"
                className="d-flex align-items-center justify-content-center text-white"
                style={{
                    height: '100vh',
                    backgroundImage: `url(${bannerImg})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    backgroundBlendMode: 'overlay'
                }}
            >
                <div className="text-center">
                    <h1 className="display-4 fw-bold mb-3">Chào mừng đến với Chung cư Sentana</h1>
                    <p className="lead">Hệ thống quản lý tòa nhà thông minh và tiện lợi</p>
                </div>
            </section>

            {/* --- NỘI DUNG CHÍNH CÓ SIDEBAR --- */}
            <div className="container-fluid px-3 px-xl-5 mt-5 pt-4" style={{ maxWidth: '1920px' }}>
                <div className="d-flex flex-wrap flex-lg-nowrap justify-content-between gap-4">

                    {/* Cột nội dung bên trái */}
                    <div style={{ width: 'calc(100% - 320px)', minWidth: 0 }}>
                        <About />
                        <Facilities />
                        <Rooms />
                        <Contact />
                    </div>

                    {/* Cột Sidebar bên phải (Ẩn trên màn hình nhỏ) */}
                    <div className="d-none d-lg-block" style={{ width: '220px', flexShrink: 0 }}>	
<Sidebar activeSection={activeSection} />
                    </div>

                </div>
            </div>

            {/* --- FOOTER --- */}
            <footer className="text-white pt-5 pb-4 mt-5" style={{ backgroundColor: '#122240' }}>
                <div className="container-fluid px-3 px-xl-5" style={{ maxWidth: '1920px' }}>
                    <div className="row text-md-start text-center">

                        {/* Cột 1: Giới thiệu */}
                        <div className="col-md-4 col-lg-4 mb-4 pe-lg-5">
                            <h5 className="text-uppercase fw-bold mb-4 d-flex align-items-center justify-content-md-start justify-content-center gap-2">
                                <span className="bg-white text-dark rounded-circle d-flex align-items-center justify-content-center fw-bold" style={{ width: '35px', height: '35px', fontSize: '1.2rem' }}>S</span>
                                CHUNG CƯ SENTANA
                            </h5>
                            <p className="text-light" style={{ fontSize: '0.9rem', lineHeight: '1.8', opacity: '0.8' }}>
                                Hệ thống quản lý chung cư thông minh, mang đến trải nghiệm sống hiện đại, minh bạch và tiện nghi nhất cho cộng đồng cư dân. Ứng dụng công nghệ 4.0 vào vận hành tòa nhà.
                            </p>
                        </div>

                        {/* Cột 2: Liên kết nhanh */}
                        <div className="col-md-4 col-lg-3 mb-4 mx-auto">
                            <h5 className="text-uppercase fw-bold mb-4">Liên kết nhanh</h5>
                            <ul className="list-unstyled" style={{ fontSize: '0.95rem', lineHeight: '2' }}>
                                <li><a href="#about" className="text-light text-decoration-none" style={{ opacity: '0.8' }}>Giới thiệu tổng quan</a></li>
                                <li><a href="#facilities" className="text-light text-decoration-none" style={{ opacity: '0.8' }}>Hệ thống tiện ích</a></li>
                                <li><a href="#rooms" className="text-light text-decoration-none" style={{ opacity: '0.8' }}>Mặt bằng các loại phòng</a></li>
                                <li><a href="#contact" className="text-light text-decoration-none" style={{ opacity: '0.8' }}>Liên hệ Ban quản lý</a></li>
                            </ul>
                        </div>

                        {/* Cột 3: Thông tin dự án */}
                        <div className="col-md-4 col-lg-3 mb-4">
                            <h5 className="text-uppercase fw-bold mb-4">Thông tin thêm</h5>
                            <p className="text-light mb-2" style={{ fontSize: '0.95rem', opacity: '0.8' }}>
                                <strong>Dự án:</strong> Hệ thống Quản lý Chung cư / Phòng trọ
                            </p>
<p className="text-light mb-2" style={{ fontSize: '0.95rem', opacity: '0.8' }}>
                                <strong>Công nghệ:</strong> ReactJS, ASP.NET Core, SQL Server
                            </p>
                            <p className="text-light mb-2" style={{ fontSize: '0.95rem', opacity: '0.8' }}>
                                <strong>Thực hiện bởi:</strong> Group_07 FSA
                            </p>
                        </div>
                    </div>

                    <hr className="mb-4 mt-2" style={{ borderColor: 'rgba(255,255,255,0.2)' }} />

                    {/* Copyright */}
                    <div className="text-center text-light" style={{ fontSize: '0.85rem', opacity: '0.7' }}>
                        <p className="mb-0">© 2026 Bản quyền thuộc về Dự án Sentana.</p>
                    </div>
                </div>
            </footer>

        </div>
    );
}

export default Home;