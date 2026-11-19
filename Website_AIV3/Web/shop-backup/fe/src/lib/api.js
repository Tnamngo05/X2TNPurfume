import axios from 'axios';
import emailjs from '@emailjs/browser';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

export const resolveImageUrl = (value) => {
  if (typeof value !== 'string' || !value.trim()) return '';
  const imageUrl = value.trim();
  if (/^(https?:|data:|blob:|\/\/)/i.test(imageUrl)) return imageUrl;
  try {
    return new URL(imageUrl, API_BASE_URL).href;
  } catch (error) {
    return '';
  }
};

export const readStorage = (
  key,
  fallback = null,
  storage = typeof window !== 'undefined' ? window.localStorage : null
) => {
  try {
    const value = storage.getItem(key);
    return value === null ? fallback : value;
  } catch (error) {
    return fallback;
  }
};

export const readJsonStorage = (
  key,
  fallback,
  storage = typeof window !== 'undefined' ? window.localStorage : null
) => {
  try {
    const value = storage.getItem(key);
    return value === null ? fallback : JSON.parse(value);
  } catch (error) {
    return fallback;
  }
};

export const writeStorage = (
  key,
  value,
  storage = typeof window !== 'undefined' ? window.localStorage : null
) => {
  try {
    storage.setItem(key, value);
    return true;
  } catch (error) {
    return false;
  }
};

export const removeStorage = (
  key,
  storage = typeof window !== 'undefined' ? window.localStorage : null
) => {
  try {
    storage.removeItem(key);
  } catch (error) {
    // Storage may be unavailable in private or restricted browsing contexts.
  }
};

const api = axios.create({
  baseURL: API_BASE_URL,
});

const provincesApi = axios.create({
  baseURL: 'https://provinces.open-api.vn/api/v2',
});

api.interceptors.request.use((config) => {
  const token = readStorage('token');
  if (
    !token &&
    window.location.pathname.startsWith('/admin/') &&
    window.location.pathname !== '/admin/login'
  ) {
    window.location.replace('/admin/login');
  }
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  response => response,
  error => {
    const status = error.response?.status;
    if ((status === 401 || status === 403) && window.location.pathname.startsWith('/admin')) {
      removeStorage('token');
      removeStorage('user');
      window.location.replace('/admin/login');
    }
    return Promise.reject(error);
  }
);

// --- API Xác thực ---
export const AuthAPI = {
  login: async (username, password) => {
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);
    const response = await api.post('/auth/token', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    return response.data; 
  },
};

// --- API Sản phẩm ---
export const ProductsAPI = {
  list: async () => {
    const response = await api.get('/products');
    return response.data;
  },
  related: async (id) => {
    const response = await api.get(`/products/${id}/related`, {
      params: { _t: Date.now() },
      headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' },
    });
    return response.data;
  },
  create: async (productData) => {
    const response = await api.post('/admin/products', productData);
    return response.data;
  },
  update: async (id, productData) => {
    const response = await api.put(`/admin/products/${id}`, productData);
    return response.data;
  },
  remove: async (id) => {
    await api.delete(`/admin/products/${id}`);
  },
};

// --- API Đơn hàng ---
export const OrdersAPI = {
  create: async (orderData) => {
    const response = await api.post('/orders', orderData);
    return response.data;
  },
  get: async (orderId) => {
    const response = await api.get(`/orders/${orderId}`);
    return response.data;
  },
};

export const CouponAPI = {
  list: async () => {
    const response = await api.get('/coupons');
    return response.data;
  },
  create: async (couponData) => {
    const response = await api.post('/coupons', couponData);
    return response.data;
  },
  update: async (id, couponData) => {
    const response = await api.put(`/coupons/${id}`, couponData);
    return response.data;
  },
  remove: async (id) => {
    await api.delete(`/coupons/${id}`);
  },
  validate: async (code, subtotal) => {
    const response = await api.post('/coupons/validate', { code, subtotal });
    return response.data;
  },
};

export const AddressAPI = {
  listProvinces: async () => {
    const response = await provincesApi.get('/p/');
    return response.data.map(({ code, name }) => ({ id: String(code), name }));
  },
  listWardsByProvince: async (provinceCode) => {
    const response = await provincesApi.get(`/p/${provinceCode}?depth=2`);
    return (response.data.wards || []).map(({ code, name }) => ({ id: String(code), name }));
  },
};

export const AdminOrdersAPI = {
  list: async (params = {}) => {
    const response = await api.get('/admin/orders', { params });
    return response.data;
  },
};

// API Liên hệ (NEW UPDATE)
export const ContactAPI = {
  send: async (contactData) => {
    const SERVICE_ID = "service_w33hyye"; // Thay bằng Service ID
    const TEMPLATE_ID = "template_otqc3ln"; // Thay bằng ID mẫu thư
    const PUBLIC_KEY = "fTQhLGQ4jNqKHwN2z";  // Thay bằng Public Key trong Account

    const templateParams = {
      from_name: contactData.name,
      from_email: contactData.email,
      phone: contactData.phone,
      subject: contactData.subject,
      message: contactData.message,
      to_email: "ngothainam05@gmail.com" //
    };

    return emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY);
  },
};

// --- API VNPay ---
export const VNPayAPI = {
  createPayment: async (orderId) => {
    const response = await api.post('/vnpay/create', { order_id: orderId });
    return response.data;
  },
};

// --- API Xu hướng (ẩn danh, không cần đăng nhập) ---
export const TrendAPI = {
  trackSearch: async (keyword) => {
    try {
      await api.post('/products/track/search', { keyword });
    } catch (error) {
      // Không chặn UX nếu tracking lỗi
    }
  },
  trackView: async (productId) => {
    try {
      await api.post(`/products/${productId}/track-view`);
    } catch (error) {
      // Không chặn UX nếu tracking lỗi
    }
  },
};

// --- API AI gợi ý sản phẩm (chỉ gọi khi người dùng bấm nút, không tự động) ---
export const ChatAPI = {
  getRecommendation: async (productId) => {
    const response = await api.get(`/chat/recommend/${productId}`, {
      params: { _t: Date.now() },
      headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' },
    });
    return response.data;
  },
  trackRecommendationClick: async (productId, sourceProductId) => {
    try {
      await api.post('/chat/recommend/click', { product_id: productId, source_product_id: sourceProductId });
    } catch (error) {
      // Không chặn UX nếu tracking lỗi
    }
  },
  // Đồng bộ Vector DB cho AI Chatbot (Admin endpoint)
  syncData: async () => {
    const response = await api.post('/chat/sync-data');
    return response.data;
  },
};

export const sendChatMessage = async (message) => {
  try {
    const response = await api.post('/chat/', { message });
    return response.data.reply;
  } catch (error) {
    console.error("Lỗi khi gọi chatbot:", error);
    return "Xin lỗi, hệ thống đang bận. Bạn vui lòng nhắn lại sau nhé!";
  }
};
