import { useState, useEffect } from 'react';
import * as signalR from '@microsoft/signalr';

export const useSignalR = () => {
    const [connection, setConnection] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            console.warn("SignalR: Không tìm thấy token, dừng kết nối.");
            return;
        }

        const hubUrl = import.meta.env.VITE_SIGNALR_HUB_URL;

        const newConnection = new signalR.HubConnectionBuilder()
            .withUrl(hubUrl, {
                accessTokenFactory: () => token
            })
            .withAutomaticReconnect()
            .build();

        newConnection.start()
            .then(() => {
                setConnection(newConnection);
            })
            .catch(err => {
                console.error("🔴 [SignalR] Lỗi kết nối: ", err);
            });

        return () => {
            if (newConnection) {
                newConnection.stop();
            }
        };
    }, []);

    return connection;
};