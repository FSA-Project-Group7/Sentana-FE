import React from 'react';

import facilityImg01 from '../assets/facilities_01.jpg';
import facilityImg02 from '../assets/facilities_02.jpg';
import facilityImg03 from '../assets/facilities_03.jpg';
import facilityImg04 from '../assets/facilities_04.jpg';
import facilityImg05 from '../assets/facilities_05.jpg';
import facilityImg06 from '../assets/facilities_06.jpg';
import facilityImg07 from '../assets/facilities_07.jpg';

const Facilities = () => {
    return (
        
        <section id="facilities" className="mb-5 pb-4 border-bottom">
            <h4 className="fw-bold mb-3" style={{ color: '#122240', textTransform: 'uppercase' }}>
                Tiện ích chung cư Sentana
            </h4>
            <h6 className="fw-bold mb-3" style={{ color: '#0d6efd' }}>
                Tiện ích nội khu chung cư Sentana có gì nổi bật?
            </h6>

            <p className="mb-4" style={{ lineHeight: '1.7', color: '#333' }}>
                Dự án <strong>Chung cư Sentana</strong> sở hữu hệ thống tiện ích vượt trội tiêu chuẩn 5 sao. Đến đây, cư dân sẽ thoải mái với hệ thống công viên cây xanh và đường chạy bộ vô cùng mát mẻ, ngắm cảnh và tận hưởng sự lộng lẫy của thành phố. Một số tiện ích tiêu biểu như:
            </p>

            <ul className="list-unstyled mb-4" style={{ lineHeight: '2', color: '#333' }}>
                <li className="mb-2">➔ Đường chạy bộ dọc theo hồ bơi, ven sông mát mẻ.</li>
                <li className="mb-2">➔ Có hồ bơi miễn phí dài nhất tại khu vực.</li>
                <li className="mb-2">➔ Sân chơi rộng, sân chơi trẻ em thoải mái vui chơi, giải trí, phòng chơi trong nhà rộng đến 120m2.</li>
                <li className="mb-2">➔ Thư giãn với tắm hơi và tắm thủy lực.</li>
                <li className="mb-2">➔ Các sân tập như sân thể thao đa năng, sân quần vợt, phòng tập yoga, phòng gym...</li>
                <li className="mb-2">➔ Công viên, vườn hoa xanh, sạch, đẹp cho cư dân dạo bộ, thư giãn.</li>
                <li className="mb-2">➔ Các tiện ích khác: Chuỗi nhà hàng ẩm thực, shophouse, siêu thị, trung tâm thương mại...</li>
            </ul>

            <img
                src={facilityImg01}
                alt="Tiện ích nội khu Sentana"
                className="img-fluid w-100 shadow-sm"
                
                style={{ objectFit: 'cover' }}
            />
            <p className="text-center text-muted mb-4 fst-italic">
                Cầu đi bộ nội khu chung cư Sentana
            </p>
            <p className="mb-4" style={{ lineHeight: '1.7', color: '#333' }}>
                Chỉ cần một bước chân là chạm tới sự tiện nghi của cuộc sống hiện đại. Các khu chức năng chính bao gồm: công trình công cộng, công viên cây xanh, khu căn hộ cao cấp, khu phức hợp thương mại – dịch vụ – văn phòng, văn hóa, giải trí, hứa hẹn mang lại cho cư dân một không gian sống hoàn hảo, những giá trị sống đỉnh cao.
            </p>
            <img
                src={facilityImg02}
                alt="Tiện ích nội khu Sentana"
                className="img-fluid w-100 shadow-sm"
                
                style={{ objectFit: 'cover' }}
            />
            <p className="text-center text-muted mb-4 fst-italic">
                Công viên nội khu chung cư Sentana
            </p>

            <img
                src={facilityImg03}
                alt="Tiện ích nội khu Sentana"
                className="img-fluid w-100 shadow-sm"
                
                style={{ objectFit: 'cover' }}
            />
            <p className="text-center text-muted mb-4 fst-italic">
                Khuôn viên thể thao đa chức năng Sentana
            </p>
            <p className="mb-4" style={{ lineHeight: '1.7', color: '#333' }}>
                Với những cư dân, bạn sẽ sở hữu một chốn an cư đẳng cấp ngay giữa lòng thành phố. Với các nhà đầu tư, doanh nghiệp, một văn phòng sang trọng sẽ tăng thêm uy tín thương hiệu. Với những ai có nhu cầu lưu trú ngắn hạn, <strong>Sentana</strong> hoàn toàn là lựa chọn thích hợp để bạn trải nghiệm.
            </p>
            <img
                src={facilityImg04}
                alt="Tiện ích nội khu Sentana"
                className="img-fluid w-100 shadow-sm"
                
                style={{ objectFit: 'cover' }}
            />
            <p className="text-center text-muted mb-4 fst-italic">
                Hồ bơi Panorama Căn hộ Sentana view sông cực đẹp
            </p>
            <p className="mb-4" style={{ lineHeight: '1.7', color: '#333' }}>
                Trải nghiệm tổ hợp các dịch vụ chăm sóc sức khỏe, giải trí tiêu chuẩn quốc tế tại khu phức hợp thể thao Olympic Gym với hơn 1000 máy tập hiện đại, sân tập Aerobic – Dưỡng sinh
            </p>
            <img
                src={facilityImg06}
                alt="Tiện ích nội khu Sentana"
                className="img-fluid w-100 shadow-sm"
                
                style={{ objectFit: 'cover' }}
            />
            <p className="text-center text-muted mb-4 fst-italic">
                Phòng Gym được trang bị đầy đủ thiết bị cao cấp
            </p>


        </section>
    );
};

export default Facilities;