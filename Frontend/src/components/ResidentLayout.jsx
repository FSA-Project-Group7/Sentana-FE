import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import bannerBg from '../assets/banner.jpg';

const ResidentLayout = () => {
    return (
        <div
            className="min-vh-100 font-sans"
            style={{
                backgroundImage: `url(${bannerBg})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundAttachment: 'fixed',
            }}
        >
            <div style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)', minHeight: '100vh', paddingTop: '80px' }}>

                <Navbar isResident={true} />
                <div className="container mt-4">
                    <Outlet />
                </div>

            </div>
        </div>
    );
};

export default ResidentLayout;