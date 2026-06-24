import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '@/config/constants';

// Create axios instance with default configuration
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config: AxiosRequestConfig) => {
    const token = await AsyncStorage.getItem('auth_token');
    if (token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      };
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Handle 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      try {
        const refreshToken = await AsyncStorage.getItem('refresh_token');
        if (refreshToken) {
          // Try to refresh the token
          const response = await axios.post(`${API_BASE_URL}/api/v1/auth/refresh/`, {
            refresh: refreshToken,
          });
          
          if (response.data.access) {
            // Store new tokens
            await AsyncStorage.setItem('auth_token', response.data.access);
            await AsyncStorage.setItem('refresh_token', response.data.refresh);
            
            // Retry the original request with new token
            originalRequest._retry = true;
            originalRequest.headers.Authorization = `Bearer ${response.data.access}`;
            return api(originalRequest);
          }
        }
      } catch (refreshError) {
        // Refresh failed, logout user
        await AsyncStorage.multiRemove(['auth_token', 'refresh_token', 'user_data']);
        // You might want to navigate to login screen here
      }
    }
    
    return Promise.reject(error);
  }
);

// API Methods
export const apiService = {
  // Authentication
  login: (credentials: any) => api.post('/auth/login/', credentials),
  logout: () => api.post('/auth/logout/'),
  refreshToken: (refreshToken: string) => api.post('/auth/refresh/', { refresh: refreshToken }),
  changePassword: (data: any) => api.post('/auth/change-password/', data),
  forgotPassword: (email: string) => api.post('/auth/password-reset/', { email }),
  
  // Chemicals
  getChemicals: (params?: any) => api.get('/chemicals/', { params }),
  getChemical: (id: string) => api.get(`/chemicals/${id}/`),
  createChemical: (data: any) => api.post('/chemicals/', data),
  updateChemical: (id: string, data: any) => api.put(`/chemicals/${id}/`, data),
  deleteChemical: (id: string) => api.delete(`/chemicals/${id}/`),
  uploadChemicalImage: (id: string, formData: FormData) => api.post(`/chemicals/${id}/upload-image/`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  
  // Inventory
  getStockTransactions: (params?: any) => api.get('/inventory/transactions/', { params }),
  createStockTransaction: (data: any) => api.post('/inventory/transactions/', data),
  updateStockTransaction: (id: string, data: any) => api.put(`/inventory/transactions/${id}/`, data),
  getStockLevels: () => api.get('/inventory/stock-levels/'),
  getLowStockAlerts: () => api.get('/inventory/low-stock-alerts/'),
  
  // Vendors
  getVendors: (params?: any) => api.get('/vendors/', { params }),
  getVendor: (id: string) => api.get(`/vendors/${id}/`),
  createVendor: (data: any) => api.post('/vendors/', data),
  updateVendor: (id: string, data: any) => api.put(`/vendors/${id}/`, data),
  deleteVendor: (id: string) => api.delete(`/vendors/${id}/`),
  getVendorPricing: (vendorId: string, chemicalId: string) => 
    api.get(`/vendors/${vendorId}/pricing/${chemicalId}/`),
  
  // Purchase Orders
  getPurchaseOrders: (params?: any) => api.get('/vendors/purchase-orders/', { params }),
  getPurchaseOrder: (id: string) => api.get(`/vendors/purchase-orders/${id}/`),
  createPurchaseOrder: (data: any) => api.post('/vendors/purchase-orders/', data),
  updatePurchaseOrder: (id: string, data: any) => api.put(`/vendors/purchase-orders/${id}/`, data),
  sendPurchaseOrder: (id: string) => api.post(`/vendors/purchase-orders/${id}/send/`),
  
  // Reports
  getStockReport: (params: any) => api.get('/reports/stock/', { params }),
  getUsageReport: (params: any) => api.get('/reports/usage/', { params }),
  getExpiryReport: (params: any) => api.get('/reports/expiry/', { params }),
  getLowStockReport: (params: any) => api.get('/reports/low-stock/', { params }),
  exportReport: (type: string, params: any) => api.post(`/reports/export/${type}/`, params),
  
  // Notifications
  getNotifications: (params?: any) => api.get('/notifications/', { params }),
  markNotificationRead: (id: string) => api.post(`/notifications/${id}/read/`),
  markAllNotificationsRead: () => api.post('/notifications/mark-all-read/'),
  
  // Users (Admin only)
  getUsers: (params?: any) => api.get('/auth/users/', { params }),
  getUser: (id: string) => api.get(`/auth/users/${id}/`),
  createUser: (data: any) => api.post('/auth/users/', data),
  updateUser: (id: string, data: any) => api.put(`/auth/users/${id}/`, data),
  deleteUser: (id: string) => api.delete(`/auth/users/${id}/`),
  
  // Settings
  getSettings: () => api.get('/settings/'),
  updateSettings: (data: any) => api.put('/settings/', data),
  
  // Audit
  getAuditLogs: (params?: any) => api.get('/audit/logs/', { params }),
  
  // File Upload
  uploadFile: (endpoint: string, formData: FormData) => api.post(endpoint, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
};

export { api };
export default apiService;
