import { useState, useEffect } from 'react';
import * as signalR from '@microsoft/signalr';

export const useSignalR = () => {
    const [connection, setConnection] = useState(null);

    useEffect(() => {
        // Lấy token từ localStorage (giống với cách axiosConfig đang làm)
        const token = localStorage.getItem('token');

        // Khởi tạo kết nối
        const newConnection = new signalR.HubConnectionBuilder()
            // Đổi URL này theo domain thực tế của Backend
            .withUrl("https://localhost:7193/hubs/notification", {
                accessTokenFactory: () => token
            })
            .withAutomaticReconnect() // Tự động kết nối lại nếu rớt mạng
            .build();

        setConnection(newConnection);
    }, []);

    return connection;
};
