import React from 'react';

const Sidebar = ({ activeSection }) => {

    const navItems = [
        { id: 'about', label: 'GIỚI THIỆU SENTANA' },
        { id: 'facilities', label: 'TIỆN ÍCH CHUNG CƯ' },
        { id: 'rooms', label: 'CÁC LOẠI PHÒNG' },
        { id: 'contact', label: 'LIÊN HỆ BAN QUẢN LÝ' },
    ];


    const navyColor = '#122240';
    const diagonalRadius = '0 20px 0 20px';

    return (
        <div className="sticky-top" style={{ top: '90px', zIndex: 100 }}>

            <div className="d-flex flex-column mb-4 gap-2">
                {navItems.map((item) => (
                    <a
                        key={item.id}
                        href={`#${item.id}`}
                        className="btn py-2 shadow-sm"
                        style={{
                            fontSize: '0.9rem',
                            fontWeight: 'bold',
                            border: '1px solid #ced4da',
                            borderRadius: diagonalRadius,
                            transition: 'all 0.3s',

                            backgroundColor: activeSection === item.id ? navyColor : 'white',
                            color: activeSection === item.id ? 'white' : '#495057',
                        }}
                    >
                        {item.label}
                    </a>
                ))}
            </div>

            <div
                className="p-1 text-center mb-4 shadow-sm"
                style={{
                    backgroundColor: navyColor,
                    color: 'white',
                    borderRadius: '10px'
                }}
            >
                <div className="d-flex justify-content-center align-items-center gap-2">
                    <div className="bg-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                        <span style={{ fontSize: '1.1rem' }}>📞</span>
                    </div>
                    <h4 className="mb-0 fw-bold">0909.123.456</h4>
                </div>
            </div>

            <div className="border p-4 shadow-sm bg-white" style={{ borderRadius: '10px', color: '#495057' }}>
                <p className="mb-3" style={{ fontSize: '1.1rem' }}>Hiện có <strong className="text-dark">6</strong> khách online</p>

                <hr style={{ borderTop: '2px dotted #ced4da', opacity: 1, margin: '15px 0' }} />

                <p className="mb-0" style={{ fontSize: '1.1rem' }}>
                    Tổng truy cập: <strong className="text-dark">25.808</strong> lượt
                </p>
            </div>

        </div>
    );
};

export default Sidebar;