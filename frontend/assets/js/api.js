// ============================================================================
// CẤU HÌNH TẬP TRUNG URL BACKEND CHO TOÀN BỘ ỨNG DỤNG FRONTEND
// ============================================================================
// Khi deploy lên Render:
// - Mặc định tự động nhận diện nếu Frontend và Backend đặt tên theo quy chuẩn Render:
//   Ví dụ: Frontend 'quanlydatsan-frontend' -> Backend 'quanlydatsan-backend'
// - Nếu đặt tên service Backend khác trên Render Dashboard, chỉ cần cập nhật DUY NHẤT URL này:
const DEFAULT_PRODUCTION_BACKEND_URL = 'https://quanlydatsan-backend.onrender.com';

const isLocalhost = window.location.hostname === 'localhost' || 
                    window.location.hostname === '127.0.0.1' || 
                    window.location.hostname === '';

function resolveApiBaseUrl() {
  if (window.API_BASE_URL) {
    return window.API_BASE_URL.replace(/\/+$/, '');
  }
  const cachedUrl = localStorage.getItem('API_BASE_URL');
  if (cachedUrl) {
    return cachedUrl.replace(/\/+$/, '');
  }

  // 1. Môi trường phát triển Localhost
  if (isLocalhost) {
    return 'http://localhost:8080/api';
  }

  // 2. Môi trường Render: Tự động suy luận domain backend từ frontend (*-frontend -> *-backend)
  const hostname = window.location.hostname;
  if (hostname.endsWith('.onrender.com')) {
    if (hostname.includes('-frontend')) {
      const backendHost = hostname.replace('-frontend', '-backend');
      return `https://${backendHost}/api`;
    }
  }

  // 3. Fallback URL backend production mặc định
  return `${DEFAULT_PRODUCTION_BACKEND_URL.replace(/\/+$/, '')}/api`;
}

const API_BASE_URL = resolveApiBaseUrl();

const api = {
  async request(endpoint, options = {}) {
    const token = sessionStorage.getItem('token') || localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
      ...options,
      headers
    };

    let path = endpoint;
    if (path.startsWith('/api/')) {
      path = path.substring(4);
    }
    if (!path.startsWith('/')) {
      path = '/' + path;
    }
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${path}`;

    try {
      const response = await fetch(url, config);

      if (response.status === 401 || response.status === 403) {
        if (response.status === 401 && !url.includes('/auth/login')) {
          sessionStorage.clear();
          localStorage.clear();
          window.location.href = '/pages/auth/login.html';
        }
      }

      if (response.status === 204) {
        return null;
      }

      const contentType = response.headers.get('content-type');
      let data = null;
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      }

      if (!response.ok) {
        const errorMsg = data && (data.message || data.error) ? (data.message || data.error) : `Lỗi ${response.status}: ${response.statusText}`;
        throw new Error(errorMsg);
      }

      return data;
    } catch (error) {
      console.error(`API Error [${options.method || 'GET'} ${url}]:`, error);
      throw error;
    }
  },

  get(endpoint, params = {}) {
    let url = endpoint;
    const query = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
        query.append(key, params[key]);
      }
    });
    const queryString = query.toString();
    if (queryString) {
      url += (url.includes('?') ? '&' : '?') + queryString;
    }
    return this.request(url, { method: 'GET' });
  },

  post(endpoint, body = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(body)
    });
  },

  put(endpoint, body = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body)
    });
  },

  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }
};

async function callApi(endpoint, method = 'GET', body = null) {
  const options = { method };
  if (body) {
    options.body = JSON.stringify(body);
  }
  return api.request(endpoint, options);
}

