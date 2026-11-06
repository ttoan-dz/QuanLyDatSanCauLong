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

const formatDate = formatNgay;

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
    'GiuCho': { text: 'Giữ chỗ (10p)', class: 'badge-warning' },
    'DaXacNhan': { text: 'Đã xác nhận', class: 'badge-success' },
    'DangChoi': { text: 'Đang chơi', class: 'badge-primary', dot: true },
    'ChoHuy': { text: 'Chờ duyệt hủy', class: 'badge-orange' },
    'DaHuy': { text: 'Đã hủy', class: 'badge-danger' },
    'KhongDen': { text: 'Khách không đến', class: 'badge-danger' },
    'HetHan': { text: 'Hết hạn', class: 'badge-secondary' },
    'HoanThanh': { text: 'Hoàn thành', class: 'badge-info' },
    'ChuaThanhToan': { text: 'Chưa thanh toán', class: 'badge-warning' },
    'DaThanhToan': { text: 'Đã thanh toán', class: 'badge-success' },
    'DaHoanTien': { text: 'Đã hoàn tiền 100%', class: 'badge-success' },
    'HoanTien': { text: 'Đã hoàn tiền', class: 'badge-info' },
    'HoatDong': { text: 'Hoạt động', class: 'badge-success', dot: true },
    'Khoa': { text: 'Đã khóa', class: 'badge-danger' },
    'BaoTri': { text: 'Bảo trì', class: 'badge-warning' },
    'TamNgung': { text: 'Tạm ngưng', class: 'badge-danger' }
  };

  const item = map[status] || { text: status || 'Không rõ', class: 'badge-secondary' };
  
  return {
    text: item.text,
    class: item.class,
    toString() {
      const dotHtml = item.dot ? '<span class="pulsing-dot"></span>' : '';
      return `<span class="badge ${item.class}">${dotHtml}${item.text}</span>`;
    }
  };
}

function formatLyDoHuy(reason) {
  if (!reason) return '';
  const clean = String(reason).trim();
  const map = {
    'nguoidunghuy': 'Bận việc đột xuất không đến được',
    'doilichkhac': 'Muốn đổi sang khung giờ hoặc ngày khác',
    'thoitietxau': 'Lý do thời tiết / sự cố cá nhân',
    'khac': 'Lý do cá nhân khác',
    'khongdennhan': 'Khách không đến nhận sân (No-Show)',
    'cosohuy': 'Cơ sở chủ động hủy đơn do sự cố / bảo trì',
    'adminhuy': 'Quản trị viên hủy đơn',
    'baotrihoactamngung': 'Sân bảo trì / tạm ngưng phục vụ đột xuất (Hoàn 100%)',
    'baotri': 'Sân bảo trì kỹ thuật đột xuất (Hoàn 100%)',
    'tamngung': 'Sân tạm ngưng phục vụ đột xuất (Hoàn 100%)',
    'hethan': 'Hết hạn giữ chỗ thanh toán (10 phút)'
  };
  return map[clean.toLowerCase()] || clean;
}

function showAlert(message, type = 'success', containerId = 'alert-container') {
  // Nếu có modal đang mở, ưu tiên hiển thị toast nổi toàn cục để không bị che khuất
  const openModal = document.querySelector('.modal-backdrop:not(.hidden)');
  let container = null;

  if (openModal && containerId === 'alert-container') {
    let globalToast = document.getElementById('global-toast-container');
    if (!globalToast) {
      globalToast = document.createElement('div');
      globalToast.id = 'global-toast-container';
      globalToast.className = 'global-toast-container';
      document.body.appendChild(globalToast);
    }
    container = globalToast;
  } else {
    container = document.getElementById(containerId);
    if (!container && containerId !== 'alert-container') {
      container = document.getElementById('alert-container');
    }

    // Tự động tạo container toast nổi nếu trang không có sẵn vùng alert-container
    if (!container) {
      let globalToast = document.getElementById('global-toast-container');
      if (!globalToast) {
        globalToast = document.createElement('div');
        globalToast.id = 'global-toast-container';
        globalToast.className = 'global-toast-container';
        document.body.appendChild(globalToast);
      }
      container = globalToast;
    }
  }

  let iconSvg = '';
  let badgeTitle = '';
  if (type === 'success') {
    badgeTitle = 'Thành công';
    iconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`;
  } else if (type === 'danger' || type === 'error') {
    type = 'danger';
    badgeTitle = (message && (message.includes('khóa') || message.includes('bị khóa'))) ? 'Tài khoản bị khóa' : 'Lỗi thao tác';
    iconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`;
  } else if (type === 'warning') {
    badgeTitle = 'Lưu ý kiểm tra';
    iconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`;
  } else {
    type = 'info';
    badgeTitle = 'Thông báo';
    iconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
  }

  const alertId = 'alert-' + Date.now();
  container.innerHTML = `
    <div class="alert alert-${type}" id="${alertId}" role="alert">
      <div class="alert-content-wrap">
        <div class="alert-icon-box">${iconSvg}</div>
        <div class="alert-text-body">
          <span class="alert-badge-title">${badgeTitle}</span>
          <span class="alert-text-message">${message}</span>
        </div>
      </div>
      <button type="button" class="alert-close" onclick="document.getElementById('${alertId}')?.remove()" title="Đóng thông báo">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
      </button>
      <div class="alert-progress-bar"></div>
    </div>
  `;

  if (!container.classList.contains('global-toast-container')) {
    try {
      container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } catch (e) {}
  }

  setTimeout(() => {
    const el = document.getElementById(alertId);
    if (el) {
      el.style.opacity = '0';
      el.style.transform = 'translateY(-8px) scale(0.98)';
      el.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
      setTimeout(() => el.remove(), 260);
    }
  }, 4500);
}

function getAuthToken() {
  return sessionStorage.getItem('token') || localStorage.getItem('token');
}

function getAuthRole() {
  return sessionStorage.getItem('role') || localStorage.getItem('role');
}

function getAuthUser() {
  return sessionStorage.getItem('hoTen') || localStorage.getItem('hoTen') || 'Người dùng';
}

function getAuthMaKH() {
  return sessionStorage.getItem('maKH') || localStorage.getItem('maKH');
}

function clearAuthSession() {
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('role');
  sessionStorage.removeItem('hoTen');
  sessionStorage.removeItem('maKH');
  localStorage.removeItem('token');
  localStorage.removeItem('role');
  localStorage.removeItem('hoTen');
  localStorage.removeItem('maKH');
}

function logout() {
  clearAuthSession();
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
  const token = getAuthToken();
  const userRole = getAuthRole();
  const hoTen = getAuthUser();

  if (guardElement) {
    const requiredRole = guardElement.getAttribute('data-require-role');
    if (!token) {
      showAlert('Vui lòng đăng nhập để tiếp tục truy cập tính năng này.', 'warning');
      setTimeout(() => {
        window.location.href = '/pages/auth/login.html';
      }, 1000);
      return;
    }
    const hasAdminPerm = (requiredRole === 'ADMIN' && (userRole === 'ADMIN' || userRole === 'STAFF'));
    if (requiredRole && requiredRole !== 'ALL' && userRole !== requiredRole && !hasAdminPerm) {
      showAlert('Bạn không có quyền truy cập trang này. Đang chuyển hướng...', 'danger');
      setTimeout(() => {
        window.location.href = (userRole === 'ADMIN' || userRole === 'STAFF') ? '/pages/admin/dashboard.html' : '/pages/user/courts.html';
      }, 1200);
      return;
    }
  }

  // Render User Dropdown Pill on User pages if #auth-controls or .user-info exists
  const userInfoContainer = document.getElementById('auth-controls') || document.querySelector('.navbar .user-info');
  if (userInfoContainer && token) {
    const isStaffOrAdmin = (userRole === 'ADMIN' || userRole === 'STAFF');
    userInfoContainer.innerHTML = `
      <div style="display: flex; align-items: center; gap: 0.5rem;">
        ${isStaffOrAdmin ? `
          <a href="/pages/admin/dashboard.html" class="btn btn-outline btn-sm" style="display: inline-flex; align-items: center; gap: 0.35rem; border-color: #3b82f6; color: #1d4ed8; font-weight: 600; padding: 0.35rem 0.75rem; background: #eff6ff;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            Quản trị
          </a>
        ` : ''}
        <div class="user-dropdown" id="user-dropdown-container">
          <button type="button" class="user-pill-btn" onclick="toggleUserDropdown(event)">
            <span class="user-pill-avatar" style="display: inline-flex; align-items: center; justify-content: center;">
              ${isStaffOrAdmin ? `
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              ` : `
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              `}
            </span>
            <span id="user-display-name">${hoTen}</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
          </button>
          <div class="dropdown-menu" id="user-dropdown-menu">
            <a href="/pages/user/profile.html" class="dropdown-item" style="display: flex; align-items: center; gap: 0.5rem;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              Trang cá nhân
            </a>
            ${isStaffOrAdmin ? `
              <a href="/pages/admin/dashboard.html" class="dropdown-item" style="display: flex; align-items: center; gap: 0.5rem;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                Trang Quản lý
              </a>
            ` : ''}
            <button type="button" class="dropdown-item danger" onclick="logout()" style="display: flex; align-items: center; gap: 0.5rem; width: 100%;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              Đăng xuất
            </button>
          </div>
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
