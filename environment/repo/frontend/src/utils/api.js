import axios from 'axios';
import { ElMessage } from 'element-plus';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

// Request interceptor to inject JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle unauthenticated or error states
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.message || '网络请求错误';
      
      if (status === 401) {
        // Unauthorized, clear credentials and redirect to login if appropriate
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        ElMessage.error('登录失效或未授权，请重新登录');
        // Do not force router push here directly to avoid cyclic dependencies,
        // let the routing guard or store handle redirect
      } else {
        ElMessage.error(message);
      }
    } else {
      ElMessage.error('服务器连接超时，请检查网络');
    }
    return Promise.reject(error);
  }
);

export default api;
