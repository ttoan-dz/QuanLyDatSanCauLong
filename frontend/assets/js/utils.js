/**
 * Utility functions for formatting and UI
 */

function formatTien(amount) {
  if (amount === null || amount === undefined) return '0 đ';
  return new Intl.NumberFormat('vi-VN').format(amount) + ' đ';
}

function formatNgay(dateStr) {
  if (!dateStr) return '';
  if (typeof dateStr === 'string' && (dateStr.includes('T') || dateStr.includes(':'))) {
    return formatNgayGio(dateStr);
  }
  if (Array.isArray(dateStr)) {
    return formatNgayGio(dateStr);
  }
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

const formatDate = formatNgay;

function formatNgayGio(val) {
  if (!val) return '--';
  try {
    if (Array.isArray(val)) {
      const y = val[0];
      const m = String(val[1]).padStart(2, '0');
      const d = String(val[2]).padStart(2, '0');
      const hh = String(val[3] !== undefined ? val[3] : 0).padStart(2, '0');
      const mm = String(val[4] !== undefined ? val[4] : 0).padStart(2, '0');
      return `${d}/${m}/${y} ${hh}:${mm}`;
    }

    let d = null;
    if (val instanceof Date) {
      d = val;
    } else if (typeof val === 'number') {
      d = new Date(val);
    } else if (typeof val === 'string') {
      const match = val.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T\s](\d{1,2}):(\d{1,2}))?/);
      if (match) {
        const [, year, month, day, hours, minutes] = match;
        const dStr = day.padStart(2, '0');
        const mStr = month.padStart(2, '0');
        if (hours !== undefined && minutes !== undefined) {
          return `${dStr}/${mStr}/${year} ${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
        }
        return `${dStr}/${mStr}/${year}`;
      }
      d = new Date(val.replace(' ', 'T'));
    }

    if (d && !isNaN(d.getTime())) {
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      const hour = String(d.getHours()).padStart(2, '0');
      const minute = String(d.getMinutes()).padStart(2, '0');
      return `${day}/${month}/${year} ${hour}:${minute}`;
    }
  } catch (e) {
    console.warn('formatNgayGio error:', e);
  }
  return String(val);
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

function getAuthUsername() {
  const stored = sessionStorage.getItem('tenDangNhap') || localStorage.getItem('tenDangNhap');
  if (stored) return stored;
  const token = getAuthToken();
  if (token && token.includes('.')) {
    try {
      const parts = token.split('.');
      if (parts.length >= 2) {
        const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
        if (payload.sub) return payload.sub;
      }
    } catch (e) {}
  }
  return '';
}

function getUser() {
  try {
    const raw = sessionStorage.getItem('user') || localStorage.getItem('user');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') return parsed;
    }
  } catch (e) {}

  const token = getAuthToken();
  const role = getAuthRole();
  const hoTen = sessionStorage.getItem('hoTen') || localStorage.getItem('hoTen') || '';
  const tenDangNhap = getAuthUsername();
  const maKH = getAuthMaKH();

  if (!token && !role && !hoTen) return null;

  return {
    tenDangNhap: tenDangNhap || '',
    hoTen: hoTen || '',
    role: role || '',
    maKH: maKH ? parseInt(maKH) : null
  };
}

function clearAuthSession() {
  sessionStorage.removeItem('tenDangNhap');
  sessionStorage.removeItem('user');
  localStorage.removeItem('tenDangNhap');
  localStorage.removeItem('user');
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


/**
 * Footer Policy & Guide Modal Handlers
 */
const FOOTER_POLICY_CONTENT = {
  'guide-booking': {
    title: 'Hướng dẫn đặt sân trực tuyến',
    html: `
      <div style="display: flex; flex-direction: column; gap: 0.85rem;">
        <p><strong>Bước 1:</strong> Chọn cơ sở sân cầu lông bạn muốn chơi từ danh sách địa điểm.</p>
        <p><strong>Bước 2:</strong> Xem thông tin chi tiết sân, chọn ngày chơi và khung giờ còn trống (mỗi slot 30 phút hoặc 60 phút).</p>
        <p><strong>Bước 3:</strong> Chọn phương thức thanh toán (chuyển khoản VNPay tức thì hoặc thanh toán tiền mặt tại quầy).</p>
        <p><strong>Bước 4:</strong> Xác nhận đặt sân. Hệ thống sẽ giữ chỗ 10 phút để bạn hoàn tất thanh toán (đối với phương thức online).</p>
        <p><strong>Bước 5:</strong> Đến sân đúng giờ, mở mã đặt sân tại mục <em>Lịch sử đặt sân</em> để nhận sân và bắt đầu trận đấu.</p>
      </div>
    `
  },
  'guide-payment': {
    title: 'Hướng dẫn thanh toán',
    html: `
      <div style="display: flex; flex-direction: column; gap: 0.85rem;">
        <p>Hệ thống hiện hỗ trợ 2 hình thức thanh toán chính:</p>
        <ul style="padding-left: 1.25rem;">
          <li><strong>Thanh toán trực tuyến (VNPay QR / Thẻ ngân hàng):</strong> Quét mã QR thanh toán nhanh chóng. Đơn đặt sẽ được tự động kích hoạt và xác nhận tức thì mà không cần chờ nhân viên duyệt.</li>
          <li><strong>Thanh toán tại quầy (Tiền mặt / Chuyển khoản trực tiếp):</strong> Bạn có thể thanh toán khi đến nhận sân trước giờ chơi tối thiểu 15 phút.</li>
        </ul>
        <div style="background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; padding: 0.75rem; color: #065f46; font-size: 0.85rem;">
          💡 <em>Mẹo:</em> Thanh toán qua VNPay giúp bạn giữ sân chắc chắn 100%, không lo bị hủy slot khi giờ cao điểm.
        </div>
      </div>
    `
  },
  'policy-cancel': {
    title: 'Chính sách hủy sân',
    html: `
      <div style="display: flex; flex-direction: column; gap: 0.85rem;">
        <p>Để đảm bảo quyền lợi cho cả khách hàng và ban quản lý sân, quy định hủy đặt sân được áp dụng như sau:</p>
        <ul style="padding-left: 1.25rem;">
          <li><strong>Hủy trước giờ chơi ≥ 24 giờ:</strong> Được hoàn tiền <strong>100%</strong> giá trị đơn đặt.</li>
          <li><strong>Hủy trước giờ chơi từ 12 - 24 giờ:</strong> Được hoàn tiền <strong>50%</strong> giá trị đơn đặt.</li>
          <li><strong>Hủy trước giờ chơi < 12 giờ:</strong> Không được hoàn tiền.</li>
          <li><strong>Cơ sở hủy do sự cố / bảo trì đột xuất:</strong> Hoàn tiền <strong>100%</strong> bất kể thời điểm.</li>
        </ul>
        <p style="font-size: 0.85rem; color: var(--text-muted);">
          * Để yêu cầu hủy đơn, bạn vào mục <em>Lịch sử đặt sân</em>, nhấn vào đơn cần hủy và chọn <em>Yêu cầu hủy</em>.
        </p>
      </div>
    `
  },
  'policy-refund': {
    title: 'Chính sách hoàn tiền',
    html: `
      <div style="display: flex; flex-direction: column; gap: 0.85rem;">
        <p>Quy trình hoàn tiền cho các đơn hủy hợp lệ:</p>
        <ul style="padding-left: 1.25rem;">
          <li>Tiền hoàn được chuyển trực tiếp về tài khoản ngân hàng / ví điện tử ban đầu bạn đã thanh toán.</li>
          <li>Thời gian xử lý: Từ <strong>1 đến 3 ngày làm việc</strong> sau khi đơn hủy được phê duyệt.</li>
          <li>Khách hàng có thể theo dõi tiến trình hoàn tiền chi tiết tại mục <em>Thông báo</em> và <em>Lịch sử đặt sân</em>.</li>
        </ul>
        <p>Nếu quá thời gian quy định chưa nhận được tiền, vui lòng liên hệ hotline <strong>1900 6868</strong> để được hỗ trợ kiểm tra đối soát giao dịch.</p>
      </div>
    `
  },
  'faq': {
    title: 'Câu hỏi thường gặp (FAQ)',
    html: `
      <div style="display: flex; flex-direction: column; gap: 0.85rem;">
        <div>
          <strong>1. Tôi có cần mang theo vợt và cầu lông không?</strong>
          <p style="color: var(--text-muted); margin-top: 0.2rem;">Sân có dịch vụ cho thuê vợt chuẩn chất lượng và bán các loại cầu lông thi đấu chính hãng ngay tại quầy phục vụ.</p>
        </div>
        <div>
          <strong>2. Đến sân trễ thì có được bù giờ không?</strong>
          <p style="color: var(--text-muted); margin-top: 0.2rem;">Khung giờ chơi được tính chính xác theo thời gian đã đặt trên hệ thống. Nếu bạn đến trễ, thời gian kết thúc vẫn giữ nguyên theo lịch để không ảnh hưởng đến lượt chơi kế tiếp.</p>
        </div>
        <div>
          <strong>3. Tôi có thể đổi sang sân khác hoặc đổi giờ không?</strong>
          <p style="color: var(--text-muted); margin-top: 0.2rem;">Bạn có thể hủy đơn hiện tại theo quy định và đặt lại khung giờ mới, hoặc liên hệ trực tiếp lễ tân cơ sở để được hỗ trợ sắp xếp nếu sân còn trống.</p>
        </div>
      </div>
    `
  },
  'terms': {
    title: 'Điều khoản sử dụng',
    html: `
      <div style="display: flex; flex-direction: column; gap: 0.85rem;">
        <p>Khi sử dụng dịch vụ của hệ thống Sân Cầu Lông, quý khách vui lòng tuân thủ các quy tắc:</p>
        <ul style="padding-left: 1.25rem;">
          <li>Mang giày thể thao có đế chuyên dụng cho sân cầu lông (đế kếp, không mang giày gót nhọn hoặc giày đế đinh).</li>
          <li>Giữ gìn vệ sinh chung, bỏ rác đúng nơi quy định, không hút thuốc hoặc mang đồ uống có cồn vào khu vực thi đấu.</li>
          <li>Bảo vệ tài sản và trang thiết bị sân (lưới, cột, thảm, ghế ngồi). Trường hợp làm hư hại do cố ý sẽ phải bồi thường theo giá trị niêm yết.</li>
          <li>Tôn trọng đồng đội và các vận động viên khác đang thi đấu trên sân.</li>
        </ul>
      </div>
    `
  },
  'privacy': {
    title: 'Chính sách bảo mật',
    html: `
      <div style="display: flex; flex-direction: column; gap: 0.85rem;">
        <p>Chúng tôi cam kết bảo vệ tuyệt đối thông tin riêng tư của khách hàng:</p>
        <ul style="padding-left: 1.25rem;">
          <li>Thông tin cá nhân (họ tên, số điện thoại, email) chỉ dùng cho mục đích xác thực đặt sân và thông báo giao dịch.</li>
          <li>Không chia sẻ hoặc bán dữ liệu người dùng cho bất kỳ bên thứ ba nào vì mục đích thương mại.</li>
          <li>Giao dịch thanh toán được bảo mật qua cổng thanh toán đạt tiêu chuẩn an toàn quốc tế PCI DSS.</li>
        </ul>
      </div>
    `
  }
};

function openFooterPolicyModal(key) {
  let modal = document.getElementById('modal-footer-policy');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'modal-footer-policy';
    modal.className = 'modal-backdrop hidden';
    modal.onclick = (e) => { if (e.target === modal) closeFooterPolicyModal(); };
    modal.innerHTML = `
      <div class="modal-dialog" style="max-width: 600px;" onclick="event.stopPropagation()">
        <div class="modal-header">
          <h3 id="footer-modal-title" style="margin: 0; font-size: 1.15rem; font-weight: 700; color: var(--dark);">Hỗ trợ khách hàng</h3>
          <button type="button" class="modal-close-btn" onclick="closeFooterPolicyModal()">✕</button>
        </div>
        <div id="footer-modal-content" class="modal-body" style="font-size: 0.9rem; line-height: 1.6; color: var(--text-main); padding: 1.25rem;"></div>
        <div class="modal-footer" style="padding: 1rem 1.25rem; border-top: 1px solid var(--border-light); display: flex; justify-content: flex-end;">
          <button type="button" class="btn btn-primary" onclick="closeFooterPolicyModal()">Đã hiểu</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  const titleEl = document.getElementById('footer-modal-title');
  const bodyEl = document.getElementById('footer-modal-content');
  const item = FOOTER_POLICY_CONTENT[key] || { title: 'Thông tin quy định', html: '<p>Nội dung đang được cập nhật.</p>' };

  if (titleEl) titleEl.textContent = item.title;
  if (bodyEl) bodyEl.innerHTML = item.html;
  modal.classList.remove('hidden');
}

function closeFooterPolicyModal() {
  const modal = document.getElementById('modal-footer-policy');
  if (modal) modal.classList.add('hidden');
}
