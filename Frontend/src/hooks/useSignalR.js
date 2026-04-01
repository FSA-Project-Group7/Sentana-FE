import { useState, useEffect } from 'react';
import * as signalR from '@microsoft/signalr';

export const useSignalR = () => {
    const [connection, setConnection] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem('token');

        if (!token) {
            console.warn("SignalR: Không tìm thấy token xác thực, dừng kết nối.");
            return;
        }

        // LƯU Ý: Thay đổi URL này thành biến môi trường nếu có (VD: import.meta.env.VITE_API_URL + '/hubs/notification')
        const hubUrl = "https://localhost:7193/hubs/notification";

        const newConnection = new signalR.HubConnectionBuilder()
            .withUrl(hubUrl, {
                accessTokenFactory: () => token
            })
            .withAutomaticReconnect()
            .build();

        setConnection(newConnection);

        // Dọn dẹp connection object khi unmount (việc start/stop sẽ do Component quyết định)
        return () => {
            setConnection(null);
        };
    }, []);

    return connection;
};