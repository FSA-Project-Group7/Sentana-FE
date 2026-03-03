import React, { useState } from 'react';
import room01 from '../assets/Room01.jpg';
import room02 from '../assets/Room02.jpg';
import room03 from '../assets/Room03.jpg';
import room04 from '../assets/Room04.jpg';
import room05 from '../assets/Room05.jpg';
import room06 from '../assets/Room06.jpg';
import room07 from '../assets/Room07.jpg';
import room08 from '../assets/Room08.jpg';
import room09 from '../assets/Room09.jpg';

const Rooms = () => {
    
    const [selectedImage, setSelectedImage] = useState(null);

    
    
    const roomsData = [
        { id: '01', type: 'OFFICETEL 01', wallArea: '77,6m2', clearArea: '69,5m2', img: room01 },
        { id: '02', type: 'CĂN HỘ 02', wallArea: '126,4m2', clearArea: '112,6m2', img: room02 },
        { id: '03', type: 'CĂN HỘ 03', wallArea: '121,8m2', clearArea: '117m2', img: room03 },
        { id: '04', type: 'CĂN HỘ 04', wallArea: '77,4m2', clearArea: '70,6m2', img: room04 },
        { id: '05', type: 'CĂN HỘ 05', wallArea: '76,8m2', clearArea: '71,3m2', img: room05 },
        { id: '06', type: 'OFFICETEL 06', wallArea: '50,7m2', clearArea: '44,9m2', img: room06 },
        { id: '07', type: 'CĂN HỘ 07', wallArea: '110,6m2', clearArea: '103,6m2', img: room07 },
        { id: '08', type: 'CĂN HỘ 08', wallArea: '110,7m2', clearArea: '103,3m2', img: room08 },
        { id: '09', type: 'CĂN HỘ 09', wallArea: '50,6m2', clearArea: '44,9m2', img: room09 },
    ];

    return (
        <section id="rooms" className="mb-5 pb-4 border-bottom">

            <h4 className="fw-bold mb-3" style={{ color: '#122240', textTransform: 'uppercase' }}>
                CÁC LOẠI PHÒNG / MẶT BẰNG
            </h4>
            <p className="mb-4" style={{ lineHeight: '1.7', color: '#333', fontSize: '0.95rem' }}>
                Tại <strong>Chung cư Sentana</strong>, khách hàng sẽ không chỉ được lựa chọn căn hộ phù hợp với nhu cầu và khả năng tài chính mà còn được trải nghiệm không gian sống thông minh và tiện nghi. Mỗi căn hộ được thiết kế để tối ưu hóa công năng sử dụng, mang lại sự thoải mái và tiện lợi. Với các giải pháp thông minh như hệ thống chiếu sáng tự động, điều hòa không khí tiết kiệm năng lượng, cư dân có thể tận hưởng một môi trường sống xanh và bền vững.
            </p>

            <div className="row g-4">
                {roomsData.map((room) => (
                    <div className="col-md-4" key={room.id}>
                        <div
                            className="card h-100 border-0 shadow-sm"
                            style={{
                                borderRadius: '12px',
                                backgroundColor: '#f8f9fa',
                                cursor: 'pointer', 
                                transition: 'transform 0.2s' 
                            }}
                            
                            onClick={() => setSelectedImage(room.img)}
                            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                        >
                            <div className="card-body d-flex flex-column">

                                <div className="mb-3">
                                    <h6 className="fw-bold mb-1" style={{ color: '#a88661' }}>{room.type}</h6>
                                    <small className="text-muted d-block">Diện tích tim tường: {room.wallArea}</small>
                                    <small className="text-muted d-block">Diện tích thông thủy: {room.clearArea}</small>
                                </div>

                                <div className="mt-auto text-center p-2 bg-white rounded">
                                    <img src={room.img} alt={room.type} className="img-fluid" style={{ maxHeight: '180px', objectFit: 'contain' }} />
                                </div>

                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {selectedImage && (
                <div
                    className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
                    style={{
                        backgroundColor: 'rgba(0, 0, 0, 0.85)',
                        zIndex: 9999, 
                        cursor: 'zoom-out'
                    }}
                    
                    onClick={() => setSelectedImage(null)}
                >
                    <button
                        className="position-absolute top-0 end-0 m-4 btn btn-outline-light rounded-circle"
                        onClick={() => setSelectedImage(null)}
                    >
                        ✖
                    </button>

                    <img
                        src={selectedImage}
                        alt="Phóng to"
                        className="img-fluid shadow-lg rounded"
                        style={{ maxHeight: '90vh', maxWidth: '90vw', objectFit: 'contain', cursor: 'default' }}
                        
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}

        </section>
    );
};

export default Rooms;