/**
 * Utility functions for formatting and UI
 */

function formatTien(amount) {
  if (amount === null || amount === undefined) return '0 đ';
  return new Intl.NumberFormat('vi-VN').format(amount) + ' đ';
}

function formatNgay(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

function formatGio(timeStr) {
  if (!timeStr) return '';
  const parts = timeStr.split(':');
  if (parts.length >= 2) {
    return `${parts[0]}:${parts[1]}`;
  }
  return timeStr;
}

function badgeTrangThai(status) {
  const map = {
    'ChoXacNhan': { text: 'Chờ xác nhận', class: 'badge-warning' },
    'DaXacNhan': { text: 'Đã xác nhận', class: 'badge-success' },
    'ChoHuy': { text: 'Chờ duyệt hủy', class: 'badge-orange' },
    'DaHuy': { text: 'Đã hủy', class: 'badge-danger' },
    'HetHan': { text: 'Hết hạn', class: 'badge-secondary' },
    'HoanThanh': { text: 'Hoàn thành', class: 'badge-info' },
    'ChuaThanhToan': { text: 'Chưa thanh toán', class: 'badge-warning' },
    'DaThanhToan': { text: 'Đã thanh toán', class: 'badge-success' },
    'HoatDong': { text: 'Hoạt động', class: 'badge-success' },
    'Khoa': { text: 'Đã khóa', class: 'badge-danger' },
    'BaoTri': { text: 'Bảo trì', class: 'badge-warning' },
    'TamNgung': { text: 'Tạm ngưng', class: 'badge-danger' }
  };

  const item = map[status] || { text: status || 'Không rõ', class: 'badge-secondary' };
  
  return {
    text: item.text,
    class: item.class,
    toString() {
      return `<span class="badge ${item.class}">${item.text}</span>`;
    }
  };
}

function showAlert(message, type = 'success', containerId = 'alert-container') {
  const container = document.getElementById(containerId);
  if (!container) {
    alert(message);
    return;
  }
  container.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
  setTimeout(() => {
    if (container) container.innerHTML = '';
  }, 4000);
}

function logout() {
  localStorage.clear();
  sessionStorage.clear();
  window.location.href = '/pages/auth/login.html';
}

function toggleUserDropdown(event) {
  if (event) event.stopPropagation();
  const dropdown = document.getElementById('user-dropdown-container');
  if (dropdown) {
    dropdown.classList.toggle('open');
  }
}

// Close dropdown when clicking outside
window.addEventListener('click', (e) => {
  const dropdown = document.getElementById('user-dropdown-container');
  if (dropdown && dropdown.classList.contains('open')) {
    if (!dropdown.contains(e.target)) {
      dropdown.classList.remove('open');
    }
  }
});

// User / Admin Auth Guard & Common Initialization
document.addEventListener('DOMContentLoaded', () => {
  const guardElement = document.querySelector('[data-require-role]');
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('role');
  const hoTen = localStorage.getItem('hoTen') || 'Người dùng';

  if (guardElement) {
    const requiredRole = guardElement.getAttribute('data-require-role');
    if (!token) {
      alert('Vui lòng đăng nhập để tiếp tục.');
      window.location.href = '/pages/auth/login.html';
      return;
    }
    if (requiredRole && requiredRole !== 'ALL' && userRole !== requiredRole) {
      alert('Bạn không có quyền truy cập trang này.');
      window.location.href = userRole === 'ADMIN' ? '/pages/admin/dashboard.html' : '/pages/user/courts.html';
      return;
    }
  }

  // Render User Dropdown Pill on User pages if .user-info or #auth-controls exists
  const userInfoContainer = document.querySelector('.navbar .user-info') || document.getElementById('auth-controls');
  if (userInfoContainer && token) {
    userInfoContainer.innerHTML = `
      <div class="user-dropdown" id="user-dropdown-container">
        <button type="button" class="user-pill-btn" onclick="toggleUserDropdown(event)">
          <span class="user-pill-avatar">👤</span>
          <span id="user-display-name">${hoTen}</span>
          <span style="font-size: 0.75rem;">▾</span>
        </button>
        <div class="dropdown-menu" id="user-dropdown-menu">
          <a href="/pages/user/profile.html" class="dropdown-item">
            <span>📱</span> Trang cá nhân
          </a>
          ${userRole === 'ADMIN' ? '<a href="/pages/admin/dashboard.html" class="dropdown-item"><span>⚙️</span> Trang Admin</a>' : ''}
          <button type="button" class="dropdown-item danger" onclick="logout()">
            <span>🚪</span> Đăng xuất
          </button>
        </div>
      </div>
    `;
  } else if (userInfoContainer && !token) {
    userInfoContainer.innerHTML = `
      <a href="/pages/auth/login.html" class="btn btn-outline btn-sm">Đăng nhập</a>
      <a href="/pages/auth/register.html" class="btn btn-primary btn-sm">Đăng ký</a>
    `;
  }

  // Global logout button listener (Admin and User pages)
  document.querySelectorAll('#btn-logout, .btn-logout').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      logout();
    });
  });
});
