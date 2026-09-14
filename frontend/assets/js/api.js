const API_BASE_URL = 'http://localhost:8080/api';

const api = {
  async request(endpoint, options = {}) {
    const token = localStorage.getItem('token');
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

    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

    try {
      const response = await fetch(url, config);

      if (response.status === 401 || response.status === 403) {
        if (response.status === 401 && !url.includes('/auth/login')) {
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

