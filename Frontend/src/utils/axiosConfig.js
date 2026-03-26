import axios from 'axios';

const api = axios.create({
    baseURL: 'https://localhost:7200/api',
    headers: {
        'Content-Type': 'application/json',
    }
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

api.interceptors.response.use(
    (response) => {
        return response; 
    },
    async (error) => {
        const originalRequest = error.config;

        if (error.response && error.response.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true; // Đánh dấu để tránh lặp vô hạn

            try {
                const currentAccessToken = localStorage.getItem('token');
                const currentRefreshToken = localStorage.getItem('refreshToken');

                if (!currentRefreshToken) {
                    throw new Error("Không tìm thấy Refresh Token trong Local Storage.");
                }

                const refreshResponse = await axios.post('https://localhost:7200/api/Auth/refresh-token', {
                    accessToken: currentAccessToken,
                    refreshToken: currentRefreshToken
                });

                const newAccessToken = refreshResponse.data.data.accessToken;
                const newRefreshToken = refreshResponse.data.data.refreshToken;

                localStorage.setItem('token', newAccessToken);
                localStorage.setItem('refreshToken', newRefreshToken);

                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

                return api(originalRequest);
            } 
            catch (refreshError) {
                console.error("Cấp lại Token thất bại. Phiên đăng nhập đã hết hạn.", refreshError);
                
                localStorage.removeItem('token');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('role');

                window.location.href = '/'; 
                
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default api;