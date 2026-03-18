import React, { useState } from 'react';

const ResidentPage = () => {
    const announcements = [
        { id: 1, title: 'Bảo trì định kỳ thang máy tòa A', date: '17/03/2026', category: 'Bảo trì', content: 'Từ 22h00 - 04h00 sáng mai sẽ tiến hành bảo trì thang máy số 1 và số 2.' },
        { id: 2, title: 'Phát hành hóa đơn dịch vụ tháng 03/2026', date: '15/03/2026', category: 'Tài chính', content: 'Hóa đơn tháng 3 đã được cập nhật. Quý cư dân vui lòng kiểm tra và thanh toán.' },
        { id: 3, title: 'Đăng ký bãi đỗ xe ô tô tháng tới', date: '10/03/2026', category: 'Thông báo', content: 'BQL bắt đầu tiếp nhận form đăng ký gia hạn bãi đỗ xe ô tô dưới tầng hầm B2.' },
        { id: 4, title: 'Lịch phun thuốc diệt muỗi toàn khu', date: '08/03/2026', category: 'Sức khỏe', content: 'Cuối tuần này, BQL sẽ tổ chức phun thuốc diệt muỗi, côn trùng tại các khu vực chung.' },
        { id: 5, title: 'Bảo dưỡng hệ thống PCCC', date: '05/03/2026', category: 'An toàn', content: 'Sẽ có chuông báo cháy thử nghiệm đổ chuông trong khoảng từ 9h - 9h30 sáng thứ 7.' }
    ];

    const [startIndex, setStartIndex] = useState(0);

    const visibleNews = [
        announcements[startIndex % announcements.length],
        announcements[(startIndex + 1) % announcements.length],
        announcements[(startIndex + 2) % announcements.length]
    ];

    const nextSlide = () => setStartIndex((prev) => (prev + 1) % announcements.length);
    const prevSlide = () => setStartIndex((prev) => (prev === 0 ? announcements.length - 1 : prev - 1));

    return (
        <div className="container">
            <div className="text-center mb-5">
                <h2
                    className="fw-bold text-white mb-2"
                    style={{ textShadow: '2px 2px 8px rgba(0,0,0,0.8)' }}
                >
                    Bản tin SENTANA
                </h2>
                <p
                    className="text-light"
                    style={{ textShadow: '1px 1px 4px rgba(0,0,0,0.8)' }}
                >
                    Cập nhật những thông báo mới nhất từ Ban quản lý tòa nhà
                </p>
            </div>
            <div className="position-relative px-2 px-md-5">
                <button
                    onClick={prevSlide}
                    className="btn btn-white bg-white shadow border rounded-circle position-absolute top-50 start-0 translate-middle-y z-2 d-flex align-items-center justify-content-center hover-dark"
                    style={{ width: '50px', height: '50px', transition: 'all 0.2s' }}
                >
                    <svg width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                        <path fillRule="evenodd" d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8z" />
                    </svg>
                </button>

                <div className="row g-4">
                    {visibleNews.map((news, index) => (
                        <div className="col-lg-4 col-md-6 col-12" key={`${news.id}-${index}`}>
                            <div className="card border-0 shadow-sm bg-white rounded-3 h-100 d-flex flex-column hover-shadow-lg" style={{ transition: 'transform 0.3s ease, box-shadow 0.3s ease', minHeight: '320px' }}>
                                <div className="card-body p-4 d-flex flex-column">
                                    <div className="d-flex align-items-center mb-3">
                                        <span className="badge bg-light text-dark border me-3 py-2 px-3">{news.category}</span>
                                    </div>

                                    <h5 className="fw-bold text-dark mb-3" style={{
                                        display: '-webkit-box',
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: 'vertical',
                                        overflow: 'hidden',
                                        height: '3rem',
                                        lineHeight: '1.5rem'
                                    }}>
                                        {news.title}
                                    </h5>

                                    <p className="text-muted fs-6 mb-4 flex-grow-1" style={{
                                        display: '-webkit-box',
                                        WebkitLineClamp: 4,
                                        WebkitBoxOrient: 'vertical',
                                        overflow: 'hidden',
                                        height: '10rem',
                                        lineHeight: '1.5rem'
                                    }}>
                                        {news.content}
                                    </p>

                                    <div className="mt-auto pt-3 border-top d-flex align-items-center text-muted small fw-medium">
                                        <i className="bi bi-calendar3 me-2"></i> {news.date}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <button
                    onClick={nextSlide}
                    className="btn btn-white bg-white shadow border rounded-circle position-absolute top-50 end-0 translate-middle-y z-2 d-flex align-items-center justify-content-center hover-dark"
                    style={{ width: '50px', height: '50px', transition: 'all 0.2s' }}
                >
                    <svg width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                        <path fillRule="evenodd" d="M1 8a.5.5 0 0 1 .5-.5h11.793l-3.147-3.146a.5.5 0 0 1 .708-.708l4 4a.5.5 0 0 1 0 .708l-4 4a.5.5 0 0 1-.708-.708L13.293 8.5H1.5A.5.5 0 0 1 1 8z" />
                    </svg>
                </button>

            </div>

            <style jsx="true">{`
                .hover-shadow-lg:hover { transform: translateY(-5px); box-shadow: 0 1rem 3rem rgba(0,0,0,.175)!important; }
                .hover-dark:hover { background-color: #212529 !important; }
                .hover-dark:hover i { color: white !important; }

                .line-clamp-2 {
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }
                .line-clamp-4 {
                    display: -webkit-box;
                    -webkit-line-clamp: 4; 
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }
            `}</style>
        </div>
    );
};

export default ResidentPage;