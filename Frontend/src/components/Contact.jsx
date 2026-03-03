import React from 'react';

const Contact = () => {
    const navyColor = '#122240';
    const accentColor = '#a88661';

    return (
        <section id="contact" className="mb-5 pb-5 container">
            <div className="text-center mb-5">
                <h4 className="fw-bold text-uppercase" style={{ color: navyColor, letterSpacing: '1px' }}>
                    Liên Hệ Ban Quản Lý
                </h4>
                <div style={{ width: '60px', height: '3px', backgroundColor: accentColor, margin: '0 auto' }}></div>
                <p className="text-muted mt-3 mx-auto" style={{ maxWidth: '1200px', fontSize: '0.95rem' }}>
                    Chúng tôi luôn sẵn sàng lắng nghe và hỗ trợ quý cư dân. Vui lòng gửi yêu cầu qua form bên dưới hoặc liên hệ trực tiếp qua các kênh thông tin của chúng tôi.
                </p>
            </div>

            <div className="row justify-content-center mb-5">
                <div className="col-12">
                    <div className="card border shadow-sm" style={{ borderRadius: '16px', backgroundColor: '#fff', borderColor: '#e9ecef' }}>
                        <div className="card-body p-4 p-md-5">
                            <form onSubmit={(e) => { e.preventDefault(); alert('Cảm ơn bạn! Yêu cầu đã được gửi.'); }}>

                                <div className="row g-3 mb-3">
                                    <div className="col-md-6">
                                        <input type="text" className="form-control px-3 py-3 bg-light border-0" placeholder="Họ và tên *" required style={{ borderRadius: '8px', fontSize: '0.95rem' }} />
                                    </div>
                                    <div className="col-md-6">
                                        <input type="tel" className="form-control px-3 py-3 bg-light border-0" placeholder="Số điện thoại *" required style={{ borderRadius: '8px', fontSize: '0.95rem' }} />
                                    </div>
                                </div>

                                <div className="mb-3">
                                    <input type="email" className="form-control px-3 py-3 bg-light border-0" placeholder="Email (Không bắt buộc)" style={{ borderRadius: '8px', fontSize: '0.95rem' }} />
                                </div>

                                <div className="mb-4">
                                    <textarea className="form-control px-3 py-3 bg-light border-0" rows="5" placeholder="Nội dung cần hỗ trợ *" required style={{ borderRadius: '8px', fontSize: '0.95rem' }}></textarea>
                                </div>

                                <button type="submit" className="btn text-white px-5 py-3 fw-bold w-100 shadow-sm" style={{ backgroundColor: navyColor, borderRadius: '8px', transition: 'all 0.3s', letterSpacing: '1px' }}>
                                    GỬI YÊU CẦU NGAY
                                </button>

                            </form>
                        </div>
                    </div>
                </div>
            </div>

            <div className="row justify-content-center g-4">

                <div className="col-md-6 col-lg-3">
                    <div className="h-100 p-4 text-center d-flex flex-column align-items-center border shadow-sm" style={{ backgroundColor: '#f8f9fa', borderRadius: '16px', borderColor: '#e9ecef' }}>
                        <div className="bg-white rounded-circle d-flex justify-content-center align-items-center shadow-sm mb-3" style={{ width: '60px', height: '60px' }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={accentColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                        </div>
                        <h6 className="fw-bold mb-2" style={{ color: navyColor }}>Địa chỉ văn phòng</h6>
                        <p className="text-muted mb-0" style={{ fontSize: '0.9rem' }}>Tháp A, Chung cư Sentana<br />Quận 1, TP. HCM</p>
                    </div>
                </div>

                <div className="col-md-6 col-lg-3">
                    <div className="h-100 p-4 text-center d-flex flex-column align-items-center border shadow-sm" style={{ backgroundColor: '#f8f9fa', borderRadius: '16px', borderColor: '#e9ecef' }}>
                        <div className="bg-white rounded-circle d-flex justify-content-center align-items-center shadow-sm mb-3" style={{ width: '60px', height: '60px' }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={accentColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                        </div>
                        <h6 className="fw-bold mb-2" style={{ color: navyColor }}>Hotline 24/7</h6>
                        <p className="text-muted mb-0" style={{ fontSize: '0.9rem' }}>0909.123.456<br />Hỗ trợ khẩn cấp</p>
                    </div>
                </div>

                <div className="col-md-6 col-lg-3">
                    <div className="h-100 p-4 text-center d-flex flex-column align-items-center border shadow-sm" style={{ backgroundColor: '#f8f9fa', borderRadius: '16px', borderColor: '#e9ecef' }}>
                        <div className="bg-white rounded-circle d-flex justify-content-center align-items-center shadow-sm mb-3" style={{ width: '60px', height: '60px' }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={accentColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                        </div>
                        <h6 className="fw-bold mb-2" style={{ color: navyColor }}>Email CSKH</h6>
                        <p className="text-muted mb-0" style={{ fontSize: '0.9rem' }}>cskh@sentana.vn<br />Phản hồi trong 24h</p>
                    </div>
                </div>

                <div className="col-md-6 col-lg-3">
                    <div className="h-100 p-4 text-center d-flex flex-column align-items-center border shadow-sm" style={{ backgroundColor: '#f8f9fa', borderRadius: '16px', borderColor: '#e9ecef' }}>
                        <div className="bg-white rounded-circle d-flex justify-content-center align-items-center shadow-sm mb-3" style={{ width: '60px', height: '60px' }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={accentColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                        </div>
                        <h6 className="fw-bold mb-2" style={{ color: navyColor }}>Giờ làm việc</h6>
                        <p className="text-muted mb-0" style={{ fontSize: '0.9rem' }}>08:00 - 17:30<br />Thứ 2 đến Thứ 7</p>
                    </div>
                </div>

            </div>
        </section>
    );
};

export default Contact;