import React, { useState, useEffect } from 'react';

const News = () => {
    
    const [newsList, setNewsList] = useState([]);
    
    useEffect(() => {
        const mockData = [
            {
                id: 1,
                title: 'Thông báo bảo trì thang máy tòa A',
                date: '25/02/2026',
                summary: 'Ban quản lý xin thông báo lịch bảo trì thang máy số 1 và số 2 từ 22h đến 24h ngày mai.'
            },
            {
                id: 2,
                title: 'Lịch phun thuốc muỗi định kỳ tháng 2',
                date: '20/02/2026',
                summary: 'Để đảm bảo vệ sinh môi trường, chung cư sẽ tiến hành phun thuốc muỗi toàn bộ hành lang các tầng.'
            },
            {
                id: 3,
                title: 'Khai trương siêu thị mini ở tầng 1',
                date: '15/02/2026',
                summary: 'Siêu thị tiện ích đã chính thức khai trương, giảm giá 10% cho toàn bộ cư dân Sentana trong tuần đầu.'
            }
        ];
        setNewsList(mockData);
    }, []);

    return (
        <section id="news" className="py-5 bg-white">
            <div className="container">
                <h2 className="text-center mb-5">Bản tin Chung cư</h2>
                <div className="row">
                    {newsList.map((news) => (
                        <div className="col-md-4 mb-4" key={news.id}>
                            <div className="card h-100 shadow-sm">
                                <div className="card-body">
                                    <h5 className="card-title text-primary">{news.title}</h5>
                                    <h6 className="card-subtitle mb-2 text-muted">{news.date}</h6>
                                    <p className="card-text">{news.summary}</p>
                                    <a href="#" className="card-link">Xem chi tiết</a>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default News;