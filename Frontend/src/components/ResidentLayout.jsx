import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import bannerBg from '../assets/banner.jpg';
import { useSignalR } from '../hooks/useSignalR';
import { notify } from '../utils/notificationAlert';

const ResidentLayout = () => {
    // Khởi tạo kết nối SignalR
    const connection = useSignalR();

    // LẮNG NGHE SIGNALR TOÀN CỤC CHO CƯ DÂN
    useEffect(() => {
        if (!connection) return;

        // Định nghĩa các câu thông báo nảy lên (Toast/Pop-up)
        const handleAssigned = (data) => notify.info(`👨‍🔧 Sự cố '${data?.title || 'của bạn'}' đã được giao cho thợ!`);
        const handleProcessing = (data) => notify.info(`🛠️ Thợ đang tiến hành sửa chữa sự cố '${data?.title || 'của bạn'}'.`);
        const handleFixedReq = (data) => notify.success(`✅ Thợ đã sửa xong sự cố '${data?.title || 'của bạn'}'. Vui lòng vào nghiệm thu!`);
        const handleClosed = (data) => notify.success(`🎉 Sự cố '${data?.title || 'của bạn'}' đã được đóng thành công!`);

        // Bật lắng nghe các sự kiện từ Backend
        connection.on("ReceiveAssignedTask", handleAssigned);
        connection.on("TaskProcessing", handleProcessing);
        connection.on("ReceiveFixedTask", handleFixedReq);
        connection.on("TaskClosed", handleClosed);

        // Dọn dẹp kết nối khi component unmount
        return () => {
            connection.off("ReceiveAssignedTask", handleAssigned);
            connection.off("TaskProcessing", handleProcessing);
            connection.off("ReceiveFixedTask", handleFixedReq);
            connection.off("TaskClosed", handleClosed);
        };
    }, [connection]);

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