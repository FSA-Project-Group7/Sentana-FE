import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    }
});

let isRefreshing = false;
let failedQueue = [];

// Hàm xử lý hàng đợi
const processQueue = (error, token = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
},
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
    (response) => {
        return response;
    }, async (error) => {
        const originalRequest = error.config;
        if (originalRequest.url.includes('/Auth/Login')) {
            return Promise.reject(error);
        }

        if (error.response && error.response.status === 401 && !originalRequest._retry) {

            if (isRefreshing) {
                return new Promise(function (resolve, reject) {
                    failedQueue.push({ resolve, reject });
                }).then(token => {
                    originalRequest.headers.Authorization = 'Bearer ' + token;
                    return api(originalRequest);
                }).catch(err => {
                    return Promise.reject(err);
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const currentAccessToken = localStorage.getItem('token');
                const currentRefreshToken = localStorage.getItem('refreshToken');

                if (!currentRefreshToken) {
                    throw new Error("Không có Refresh Token.");
                }

                const refreshResponse = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/Auth/refresh-token`, {
                    accessToken: currentAccessToken,
                    refreshToken: currentRefreshToken
                });
                const newAccessToken = refreshResponse.data.data.accessToken;
                const newRefreshToken = refreshResponse.data.data.refreshToken;

                localStorage.setItem('token', newAccessToken);
                localStorage.setItem('refreshToken', newRefreshToken);

                processQueue(null, newAccessToken);

                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                return api(originalRequest);

            } catch (refreshError) {
                processQueue(refreshError, null);

                console.error("Cấp lại Token thất bại. Phiên đăng nhập đã hết hạn.", refreshError);
                localStorage.removeItem('token');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('role');
                window.location.href = '/';

                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export default api;