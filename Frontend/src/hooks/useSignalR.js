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

        const hubUrl = import.meta.env.VITE_SIGNALR_HUB_URL;

        const newConnection = new signalR.HubConnectionBuilder()
            .withUrl(hubUrl, {
                accessTokenFactory: () => token
            })
            .withAutomaticReconnect()
            .build();

        setConnection(newConnection);

        return () => {
            if (newConnection) {
                newConnection.stop().then(() => console.log("SignalR Disconnected"));
            }
        };
    }, []);

    return connection;
};