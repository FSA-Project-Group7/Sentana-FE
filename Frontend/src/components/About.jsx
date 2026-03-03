import React from 'react';
import aboutImg from '../assets/about.jpg';

const About = () => {
    return (
        <section id="about" className="mb-5 pb-4 border-bottom">

            <img
                src={aboutImg}
                alt="Tổng quan Sentana"
                className="img-fluid w-100 shadow-sm mb-4"
                style={{ objectFit: 'cover', borderRadius: '10px' }}
            />

            <h3 className="text-danger text-center fw-bold mb-2 text-uppercase">
                Chung cư Sentana - Hệ thống quản lý hiện đại & minh bạch
            </h3>
            <p className="text-center text-muted mb-4 fst-italic">
                Tối ưu hóa chi phí thuê phòng, tự động hóa hóa đơn và hỗ trợ kỹ thuật nhanh chóng.
            </p>

            <div className="row mt-4">
                <div className="col-md-6 mb-3">
                    <h5 className="fw-bold">🌟 Vị trí đắc địa</h5>
                    <p className="text-justify">
                        Tọa lạc tại trung tâm thành phố, Sentana mang đến sự thuận tiện tối đa cho cư dân trong việc di chuyển, làm việc và học tập. Bao quanh là các khu trung tâm thương mại và tiện ích công cộng.
                    </p>
                </div>
                <div className="col-md-6 mb-3">
                    <h5 className="fw-bold">🛡️ Quản lý thông minh</h5>
                    <p className="text-justify">
                        Ứng dụng công nghệ vào quản lý tòa nhà. Mọi thao tác từ theo dõi hợp đồng, thanh toán hóa đơn điện nước đến báo lỗi bảo trì đều được thực hiện chỉ qua vài cú click chuột.
                    </p>
                </div>
            </div>
        </section>
    );
};

export default About;