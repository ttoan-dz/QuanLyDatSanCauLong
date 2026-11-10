/**
 * Notifications and Booking Progress JavaScript Logic (Upgraded Design System)
 */

let allNotifications = [];
let allHistoryBookings = [];
let currentNotifFilter = 'ALL';
let currentProgressFilter = 'ALL';
let currentMobileTab = 'notifs';

document.addEventListener('DOMContentLoaded', () => {
  loadNotificationsAndProgress();
});

// Mobile tab switcher (Thông báo vs Tiến trình đặt sân)
function switchMobileTab(tab) {
  currentMobileTab = tab;
  const colNotifs = document.getElementById('col-notifications');
  const colProg = document.getElementById('col-progress');
  const btnNotifs = document.getElementById('tab-btn-notifs');
  const btnProg = document.getElementById('tab-btn-progress');

  if (window.innerWidth <= 900) {
    if (tab === 'notifs') {
      if (colNotifs) colNotifs.style.display = 'flex';
      if (colProg) colProg.style.display = 'none';
      if (btnNotifs) btnNotifs.classList.add('active');
      if (btnProg) btnProg.classList.remove('active');
    } else {
      if (colNotifs) colNotifs.style.display = 'none';
      if (colProg) colProg.style.display = 'flex';
      if (btnNotifs) btnNotifs.classList.remove('active');
      if (btnProg) btnProg.classList.add('active');
    }
  } else {
    if (colNotifs) colNotifs.style.display = 'flex';
    if (colProg) colProg.style.display = 'flex';
  }
}

window.addEventListener('resize', () => {
  const colNotifs = document.getElementById('col-notifications');
  const colProg = document.getElementById('col-progress');
  if (window.innerWidth > 900) {
    if (colNotifs) colNotifs.style.display = 'flex';
    if (colProg) colProg.style.display = 'flex';
  } else {
    switchMobileTab(currentMobileTab);
  }
});

async function loadNotificationsAndProgress() {
  const token = getAuthToken();
  if (!token) {
    const notifContainer = document.getElementById('notifications-feed');
    const progContainer = document.getElementById('booking-progress-feed');
    const notifBadge = document.getElementById('notif-count-badge');
    const progBadge = document.getElementById('booking-count-badge');

    if (notifBadge) notifBadge.textContent = '0';
    if (progBadge) progBadge.textContent = '0 đơn';

    if (notifContainer) {
      notifContainer.innerHTML = `
        <div style="text-align: center; padding: 3rem 1.5rem; color: var(--text-muted);">
          <div style="width: 56px; height: 56px; margin: 0 auto 0.85rem; background: #eff6ff; border: 1.5px solid #bfdbfe; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #2563eb;">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <p style="margin: 0.5rem 0 1.25rem; font-size: 0.9rem;">Vui lòng đăng nhập để xem thông báo</p>
          <a href="/pages/auth/login.html" class="btn btn-primary btn-sm">Đăng nhập</a>
        </div>
      `;
    }

    if (progContainer) {
      progContainer.innerHTML = `
        <div style="text-align: center; padding: 3rem 1.5rem; color: var(--text-muted);">
          <div style="width: 60px; height: 60px; margin: 0 auto 1rem; background: #eff6ff; border: 1.5px solid #bfdbfe; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #2563eb;">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <h3 style="font-size: 1.15rem; color: var(--dark); margin: 0.5rem 0 0.35rem;">Theo dõi tiến trình đặt sân</h3>
          <p style="font-size: 0.88rem; margin-bottom: 1.5rem;">
            Đăng nhập để xem tiến độ xác nhận, thời gian chơi và trạng thái thanh toán của các đơn đặt sân.
          </p>
          <a href="/pages/auth/login.html" class="btn btn-primary">Đăng nhập ngay</a>
        </div>
      `;
    }
    return;
  }

  await Promise.all([
    loadNotifications(),
    loadBookingProgress()
  ]);

  switchMobileTab('notifs');
}

// ======================== 1. THÔNG BÁO MỚI (CỘT TRÁI) ========================

async function loadNotifications() {
  const container = document.getElementById('notifications-feed');
  const countBadge = document.getElementById('notif-count-badge');
  const unreadBadge = document.getElementById('notif-unread-badge');
  const markAllBtn = document.getElementById('btn-mark-all-read');
  const mobileCount = document.getElementById('mobile-notif-count');
  if (!container) return;

  container.innerHTML = `
    <div style="text-align: center; padding: 2.5rem 1rem;">
      <div class="spinner" style="margin: 0 auto 0.75rem;"></div>
      <p style="color: var(--text-muted); font-size: 0.85rem;">Đang tải danh sách thông báo...</p>
    </div>
  `;

  try {
    const data = await api.get('/user/notifications');
    allNotifications = Array.isArray(data) ? data : [];

    updateNotificationHeader();
    renderNotificationList();
  } catch (error) {
    showAlert(`Không thể tải thông báo: ${error.message}`, 'danger');
    container.innerHTML = `
      <div style="text-align: center; padding: 2.5rem 1rem; color: var(--text-muted);">
        <p style="font-size: 0.88rem; margin-bottom: 0.75rem;">Không thể tải danh sách thông báo</p>
        <button type="button" class="btn btn-outline btn-sm" onclick="loadNotifications()">Thử lại</button>
      </div>
    `;
  }
}

function updateNotificationHeader() {
  const countBadge = document.getElementById('notif-count-badge');
  const unreadBadge = document.getElementById('notif-unread-badge');
  const markAllBtn = document.getElementById('btn-mark-all-read');
  const mobileCount = document.getElementById('mobile-notif-count');

  const total = allNotifications.length;
  const unreadCount = allNotifications.filter(n => !n.daDoc).length;

  if (countBadge) countBadge.textContent = `${total}`;
  if (mobileCount) mobileCount.textContent = `${unreadCount > 0 ? unreadCount : total}`;

  if (unreadBadge) {
    if (unreadCount > 0) {
      unreadBadge.textContent = `${unreadCount} chưa đọc`;
      unreadBadge.style.display = 'inline-block';
    } else {
      unreadBadge.style.display = 'none';
    }
  }

  if (markAllBtn) {
    markAllBtn.style.display = unreadCount > 0 ? 'inline-flex' : 'none';
  }
}

function filterNotifications(filter, el) {
  currentNotifFilter = filter;
  document.querySelectorAll('[data-notif-filter]').forEach(b => b.classList.remove('active'));
  if (el) el.classList.add('active');
  renderNotificationList();
}

function renderNotificationList() {
  const container = document.getElementById('notifications-feed');
  if (!container) return;

  // Lọc theo chip
  let filtered = allNotifications.filter(n => {
    if (currentNotifFilter === 'UNREAD') return !n.daDoc;
    if (currentNotifFilter === 'READ') return n.daDoc;
    if (currentNotifFilter === 'DatSan') return (n.loaiThongBao || '').toLowerCase().includes('dat') || (n.tieuDe || '').toLowerCase().includes('đặt');
    if (currentNotifFilter === 'ThanhToan') return (n.loaiThongBao || '').toLowerCase().includes('thanhtoan') || (n.tieuDe || '').toLowerCase().includes('thanh toán');
    if (currentNotifFilter === 'Huy') return (n.loaiThongBao || '').toLowerCase().includes('huy') || (n.tieuDe || '').toLowerCase().includes('hủy');
    return true;
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 2.5rem 1rem; color: var(--text-muted);">
        <div style="width: 48px; height: 48px; margin: 0 auto 0.75rem; background: #f8fafc; border: 1.5px dashed var(--border); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: var(--text-sub);">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        </div>
        <p style="font-size: 0.88rem; margin: 0;">Không có thông báo nào trong mục này.</p>
      </div>
    `;
    return;
  }

  // Phân nhóm theo thời gian (Hôm nay, Hôm qua, 7 ngày gần đây, Trước đó)
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);

  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const groups = {
    'Hôm nay': [],
    'Hôm qua': [],
    '7 ngày gần đây': [],
    'Trước đó': []
  };

  filtered.forEach(n => {
    const itemDate = new Date(n.thoiGianTao);
    const itemDateStr = !isNaN(itemDate.getTime()) ? itemDate.toISOString().slice(0, 10) : '';

    if (itemDateStr === todayStr) {
      groups['Hôm nay'].push(n);
    } else if (itemDateStr === yesterdayStr) {
      groups['Hôm qua'].push(n);
    } else if (itemDate >= sevenDaysAgo) {
      groups['7 ngày gần đây'].push(n);
    } else {
      groups['Trước đó'].push(n);
    }
  });

  let html = '';
  Object.keys(groups).forEach(groupName => {
    const items = groups[groupName];
    if (items.length > 0) {
      html += `<div class="notif-group-title">${groupName} (${items.length})</div>`;
      html += items.map(n => renderNotifCard(n)).join('');
    }
  });

  container.innerHTML = html;
}

function renderNotifCard(n) {
  const typeInfo = getNotificationTypeInfo(n.loaiThongBao, n.tieuDe);
  const isUnread = !n.daDoc;

  return `
    <div class="notif-card-v2 ${isUnread ? 'unread' : ''}" id="notif-item-${n.maThongBao}" onclick="handleNotificationClick(${n.maThongBao}, ${n.daDoc})">
      ${isUnread ? '<div class="notif-unread-dot" title="Chưa đọc"></div>' : ''}
      <div class="notif-icon-box ${typeInfo.colorClass}">
        ${typeInfo.icon}
      </div>
      <div class="notif-body-v2">
        <div class="notif-title-row">
          <span class="notif-title-text" style="${isUnread ? 'font-weight: 800;' : ''}">${n.tieuDe}</span>
          <span class="notif-time-text">${formatDateTimeVN(n.thoiGianTao)}</span>
        </div>
        <div class="notif-message-text">${n.noiDung}</div>
      </div>
    </div>
  `;
}

function getNotificationTypeInfo(loaiThongBao, tieuDe) {
  const cleanType = String(loaiThongBao || '').toLowerCase();
  const cleanTitle = String(tieuDe || '').toLowerCase();

  if (cleanType.includes('thanhtoan') || cleanTitle.includes('thanh toán') || cleanTitle.includes('thành công')) {
    return {
      colorClass: 'success',
      icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>'
    };
  }
  if (cleanType.includes('huy') || cleanTitle.includes('hủy')) {
    return {
      colorClass: 'danger',
      icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>'
    };
  }
  if (cleanType.includes('yeucau') || cleanTitle.includes('nhắc nhở') || cleanTitle.includes('chờ')) {
    return {
      colorClass: 'warning',
      icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>'
    };
  }
  // Default info
  return {
    colorClass: 'info',
    icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
  };
}

async function handleNotificationClick(maThongBao, daDoc) {
  // Tìm thông báo trong mảng
  const notif = allNotifications.find(n => n.maThongBao === maThongBao);

  // Đánh dấu đã đọc qua API nếu chưa đọc
  if (!daDoc) {
    try {
      await api.put(`/user/notifications/${maThongBao}/read`);
      if (notif) notif.daDoc = true;
      updateNotificationHeader();
      renderNotificationList();
    } catch (error) {
      console.warn('Lỗi đánh dấu đã đọc:', error);
    }
  }

  // Nếu trong nội dung thông báo có mã đơn booking (ví dụ: "#123"), mở chi tiết đơn đó
  if (notif && notif.noiDung) {
    const match = notif.noiDung.match(/#(\d+)/);
    if (match && match[1]) {
      const maDat = parseInt(match[1]);
      const bookingIdx = allHistoryBookings.findIndex(b => b.maDatSan === maDat);
      if (bookingIdx !== -1) {
        openBookingDetailModal(bookingIdx);
      }
    }
  }
}

async function markAllNotificationsAsRead() {
  const unreadList = allNotifications.filter(n => !n.daDoc);
  if (unreadList.length === 0) return;

  try {
    // Gửi request đánh dấu đọc
    await Promise.allSettled(
      unreadList.map(n => api.put(`/user/notifications/${n.maThongBao}/read`))
    );

    allNotifications.forEach(n => { n.daDoc = true; });
    updateNotificationHeader();
    renderNotificationList();
    showAlert('Đã đánh dấu toàn bộ thông báo là đã đọc.', 'success');
  } catch (error) {
    showAlert('Có lỗi khi đánh dấu đã đọc.', 'danger');
  }
}

// ======================== 2. TIẾN TRÌNH ĐẶT SÂN (CỘT PHẢI) ========================

async function loadBookingProgress() {
  const container = document.getElementById('booking-progress-feed');
  const countBadge = document.getElementById('booking-count-badge');
  const mobileCount = document.getElementById('mobile-prog-count');
  if (!container) return;

  container.innerHTML = `
    <div style="text-align: center; padding: 3rem 1.5rem;">
      <div class="spinner" style="margin: 0 auto 0.75rem;"></div>
      <p style="color: var(--text-muted); font-size: 0.9rem;">Đang tải tiến trình các đơn đặt sân...</p>
    </div>
  `;

  try {
    const history = await api.get('/user/booking/history');
    allHistoryBookings = Array.isArray(history) ? history : [];

    if (countBadge) countBadge.textContent = `${allHistoryBookings.length} đơn`;
    if (mobileCount) mobileCount.textContent = `${allHistoryBookings.length}`;

    renderProgressList();
  } catch (error) {
    showAlert(`Không thể tải tiến trình đặt sân: ${error.message}`, 'danger');
    container.innerHTML = `
      <div style="text-align: center; padding: 3rem 1.5rem; color: var(--text-muted);">
        <p style="font-size: 0.9rem; margin-bottom: 0.75rem;">Không thể tải danh sách tiến trình</p>
        <button type="button" class="btn btn-outline btn-sm" onclick="loadBookingProgress()">Thử lại</button>
      </div>
    `;
  }
}

function filterProgress(filter, el) {
  currentProgressFilter = filter;
  document.querySelectorAll('[data-progress-filter]').forEach(b => b.classList.remove('active'));
  if (el) el.classList.add('active');
  renderProgressList();
}

function renderProgressList() {
  const container = document.getElementById('booking-progress-feed');
  if (!container) return;

  if (allHistoryBookings.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 3rem 1.5rem; color: var(--text-muted); background: #ffffff; border-radius: var(--radius); border: 1.5px dashed var(--border);">
        <div style="width: 56px; height: 56px; margin: 0 auto 0.75rem; background: #ecfdf5; border: 1.5px solid #a7f3d0; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #059669;">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <line x1="3" y1="9" x2="21" y2="9"/>
            <line x1="3" y1="15" x2="21" y2="15"/>
            <line x1="12" y1="3" x2="12" y2="21"/>
          </svg>
        </div>
        <h3 style="font-size: 1.05rem; font-weight: 700; color: var(--dark); margin: 0.35rem 0;">Bạn chưa có đơn đặt sân nào</h3>
        <p style="font-size: 0.85rem; max-width: 380px; margin: 0 auto 1.25rem;">
          Khám phá danh sách sân và đặt trước khung giờ vàng ngay hôm nay!
        </p>
        <a href="/pages/user/courts.html" class="btn btn-primary btn-sm">Xem danh sách sân</a>
      </div>
    `;
    return;
  }

  const filtered = allHistoryBookings.filter(b => {
    if (currentProgressFilter === 'ALL') return true;
    return b.trangThaiDat === currentProgressFilter;
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 2.5rem 1rem; color: var(--text-muted); background: #ffffff; border-radius: var(--radius); border: 1px dashed var(--border);">
        <p style="font-size: 0.88rem; margin: 0;">Không có đơn đặt sân nào trong trạng thái này.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map((b) => {
    const originalIndex = allHistoryBookings.indexOf(b);
    const timelineHtml = renderTimelineStepper(b);

    return `
      <div class="booking-progress-card" onclick="openBookingDetailModal(${originalIndex})" style="background:#ffffff; border:1px solid var(--border); border-radius:var(--radius); padding:1.25rem; margin-bottom:1.15rem; box-shadow:var(--shadow-sm); cursor:pointer; transition: transform 0.2s ease, box-shadow 0.2s ease;">
        <div class="bp-header" style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border-light); padding-bottom: 0.75rem; margin-bottom: 0.85rem;">
          <div class="bp-title" style="display: flex; align-items: center; gap: 6px;">
            <span style="font-family: monospace; font-weight: 800; font-size: 0.95rem; color: var(--dark); background: #f1f5f9; padding: 2px 8px; border-radius: 6px;">#${b.maDatSan}</span>
            <span style="font-size: 0.95rem; font-weight: 700; color: var(--dark);">${b.tenSan || 'Sân cầu lông'}</span>
          </div>
          <div>
            ${badgeTrangThai(b.trangThaiDat)}
          </div>
        </div>

        <div class="bp-grid-info" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5rem 1rem; font-size: 0.84rem; margin-bottom: 1rem;">
          <div class="bp-info-item" style="color: var(--text-muted);">Cơ sở: <strong style="color: var(--dark);">${b.tenDiaDiem || 'Cơ sở'}</strong></div>
          <div class="bp-info-item" style="color: var(--text-muted);">Ngày chơi: <strong style="color: var(--dark);">${formatNgay(b.ngayChoi)}</strong></div>
          <div class="bp-info-item" style="color: var(--text-muted);">Khung giờ: <strong style="color: var(--dark);">${formatGio(b.gioBatDau)} - ${formatGio(b.gioKetThuc)}</strong></div>
          <div class="bp-info-item" style="color: var(--text-muted);">Tổng tiền: <strong style="color: var(--primary-dark); font-size: 0.92rem;">${formatTien(b.soTien)}</strong></div>
        </div>

        <!-- TIMELINE STEPPER CHUẨN TIẾN TRÌNH -->
        ${timelineHtml}

        <div class="bp-footer" onclick="event.stopPropagation()" style="display: flex; align-items: center; justify-content: space-between; border-top: 1px solid var(--border-light); padding-top: 0.75rem; margin-top: 0.75rem;">
          <span style="font-size: 0.78rem; color: var(--text-sub);">
            Tạo: ${formatDateTimeVN(b.ngayTao)}
          </span>
          <div style="display: flex; gap: 0.5rem; align-items: center;">
            <button type="button" class="btn btn-outline btn-sm" onclick="openBookingDetailModal(${originalIndex})">
              Xem chi tiết
            </button>
            ${b.trangThaiDat === 'ChoXacNhan' && b.phuongThucThanhToan === 'QR' && b.trangThaiThanhToan === 'ChuaThanhToan' ? `
              <a href="/pages/user/history.html?pay=${b.maDatSan}" class="btn btn-primary btn-sm" style="font-weight: 700;">Thanh toán QR</a>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

/**
 * Render Timeline Stepper Component (5 bước hoặc trạng thái kết thúc Hủy/Hết hạn)
 */
function renderTimelineStepper(b) {
  const isCancelled = b.trangThaiDat === 'DaHuy' || b.trangThaiDat === 'ChoHuy';
  const isExpired = b.trangThaiDat === 'HetHan';

  if (isCancelled) {
    const isMaintenanceRefund = b.lyDoHuy === 'BaoTriHoacTamNgung' || (b.ghiChu && b.ghiChu.includes('100%'));
    return `
      <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 0.75rem 1rem; margin: 0.75rem 0;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.25rem;">
          <span style="font-size: 0.82rem; font-weight: 700; color: #dc2626; display: flex; align-items: center; gap: 0.35rem;">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
            ${b.trangThaiDat === 'ChoHuy' ? 'Đang chờ duyệt hủy' : 'Đơn đặt đã bị hủy'}
          </span>
          <span style="font-size: 0.75rem; font-weight: 600; color: #991b1b;">
            ${isMaintenanceRefund ? 'Hoàn tiền 100%' : (b.lyDoHuy ? formatLyDoHuy(b.lyDoHuy) : 'Đã hủy theo quy định')}
          </span>
        </div>
        <div style="font-size: 0.78rem; color: #7f1d1d; line-height: 1.4;">
          ${isMaintenanceRefund
            ? 'Sự cố bảo trì cơ sở đột xuất. Toàn bộ tiền sân đã được hoàn trả lại cho bạn.'
            : 'Đơn đã dừng tiến trình. Quý khách vui lòng kiểm tra chính sách hoàn tiền trong chi tiết đơn.'}
        </div>
      </div>
    `;
  }

  if (isExpired) {
    return `
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 0.75rem 1rem; margin: 0.75rem 0; display: flex; align-items: center; justify-content: space-between;">
        <span style="font-size: 0.82rem; font-weight: 600; color: #64748b; display: flex; align-items: center; gap: 0.35rem;">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          Hết hạn giữ chỗ (Quá thời hạn thanh toán 10 phút)
        </span>
        <span class="badge badge-secondary" style="font-size: 0.72rem;">Hết hạn</span>
      </div>
    `;
  }

  // 5 Bước: 1. Đặt sân -> 2. Thanh toán -> 3. Xác nhận -> 4. Đang chơi -> 5. Hoàn thành
  let activeStep = 1;
  const isPaid = b.trangThaiThanhToan === 'DaThanhToan';

  if (b.trangThaiDat === 'HoanThanh') {
    activeStep = 5;
  } else if (b.trangThaiDat === 'DangChoi') {
    activeStep = 4;
  } else if (b.trangThaiDat === 'DaXacNhan') {
    activeStep = 3;
  } else if (isPaid) {
    activeStep = 2;
  } else {
    activeStep = 1;
  }

  const steps = [
    { label: 'Đặt sân', num: 1 },
    { label: isPaid ? 'Đã TT' : 'Chờ TT', num: 2 },
    { label: 'Xác nhận', num: 3 },
    { label: 'Đang chơi', num: 4 },
    { label: 'Hoàn thành', num: 5 }
  ];

  const fillPercent = ((activeStep - 1) / (steps.length - 1)) * 100;

  return `
    <div class="timeline-stepper">
      <div class="timeline-line-connector">
        <div class="timeline-line-fill" style="width: ${fillPercent}%;"></div>
      </div>
      ${steps.map(s => {
        let stepClass = '';
        if (s.num < activeStep) stepClass = 'completed';
        else if (s.num === activeStep) stepClass = 'current';

        return `
          <div class="timeline-step ${stepClass}">
            <div class="timeline-node">
              ${s.num < activeStep
                ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>'
                : s.num
              }
            </div>
            <div class="timeline-label">${s.label}</div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

// ======================== MODAL CHI TIẾT BOOKING ========================

function openBookingDetailModal(index) {
  const booking = allHistoryBookings[index];
  if (!booking) return;

  const modal = document.getElementById('modal-booking-detail');
  const bodyEl = document.getElementById('modal-booking-body');
  const titleEl = document.getElementById('modal-booking-title');
  if (!modal || !bodyEl) return;

  if (titleEl) titleEl.textContent = `Chi tiết đơn đặt sân #${booking.maDatSan}`;

  const isMaintenanceRefund = booking.trangThaiDat === 'DaHuy' && 
    (booking.lyDoHuy === 'BaoTriHoacTamNgung' || (booking.ghiChu && booking.ghiChu.includes('100%')));

  bodyEl.innerHTML = `
    ${isMaintenanceRefund ? `
      <div style="background: #eff6ff; border: 1.5px solid #bfdbfe; border-radius: var(--radius-sm); padding: 0.85rem 1rem; margin-bottom: 1rem; display: flex; align-items: flex-start; gap: 0.65rem;">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" style="flex-shrink:0; margin-top: 1px;"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
        <div>
          <strong style="color: #1e40af; font-size: 0.88rem; display: block;">Sân bảo trì đột xuất — Hoàn tiền 100%</strong>
          <span style="font-size: 0.82rem; color: #1e3a8a; line-height: 1.45; display: block; margin-top: 2px;">
            Đơn này đã được cơ sở hủy do sự cố bảo trì. Toàn bộ 100% số tiền <strong>(${formatTien(booking.soTien)})</strong> đã được chuyển hoàn lại cho bạn.
          </span>
        </div>
      </div>
    ` : ''}

    <div class="modal-section-box">
      <div class="modal-section-title">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
        Thông tin đơn đặt
      </div>
      <div class="modal-kv-grid">
        <div><strong>Mã đơn:</strong> #${booking.maDatSan}</div>
        <div><strong>Trạng thái:</strong> ${badgeTrangThai(booking.trangThaiDat)}</div>
        <div><strong>Thời gian tạo:</strong> ${formatDateTimeVN(booking.ngayTao)}</div>
        <div><strong>Thanh toán:</strong> ${badgeTrangThai(booking.trangThaiThanhToan)}</div>
      </div>
    </div>

    <div class="modal-section-box">
      <div class="modal-section-title">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
        Sân & Thời gian thi đấu
      </div>
      <div class="modal-kv-grid">
        <div><strong>Sân thi đấu:</strong> ${booking.tenSan || 'N/A'}</div>
        <div><strong>Cơ sở địa điểm:</strong> ${booking.tenDiaDiem || 'N/A'}</div>
        <div><strong>Ngày chơi:</strong> ${formatNgay(booking.ngayChoi)}</div>
        <div><strong>Khung giờ:</strong> ${formatGio(booking.gioBatDau)} - ${formatGio(booking.gioKetThuc)}</div>
      </div>
    </div>

    <div class="modal-section-box">
      <div class="modal-section-title">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
        Thanh toán & Hóa đơn
      </div>
      <div class="modal-kv-grid">
        <div><strong>Phương thức:</strong> ${booking.phuongThucThanhToan === 'QR' ? 'Chuyển khoản VNPay QR' : 'Tiền mặt tại quầy'}</div>
        <div><strong>Tổng chi phí:</strong> <span style="font-weight: 800; color: var(--primary-dark); font-size: 1.05rem;">${formatTien(booking.soTien)}</span></div>
      </div>
    </div>

    ${booking.lyDoHuy ? `
      <div class="modal-section-box" style="background: #fef2f2; border-color: #fecaca;">
        <div class="modal-section-title" style="color: #dc2626;">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
          Thông tin hủy & hoàn tiền
        </div>
        <div style="font-size: 0.88rem; color: #7f1d1d; line-height: 1.5;">
          <div><strong>Lý do hủy:</strong> ${formatLyDoHuy(booking.lyDoHuy)}</div>
          ${booking.ghiChu ? `<div style="margin-top: 4px;"><strong>Ghi chú:</strong> ${booking.ghiChu}</div>` : ''}
        </div>
      </div>
    ` : ''}

    <div style="display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 1.25rem;">
      <button type="button" class="btn btn-outline" onclick="closeBookingDetailModal()">Đóng</button>
      ${booking.trangThaiDat === 'ChoXacNhan' && booking.phuongThucThanhToan === 'QR' && booking.trangThaiThanhToan === 'ChuaThanhToan' ? `
        <a href="/pages/user/history.html?pay=${booking.maDatSan}" class="btn btn-primary">Thanh toán QR ngay</a>
      ` : ''}
    </div>
  `;

  modal.classList.remove('hidden');
}

function closeBookingDetailModal() {
  const modal = document.getElementById('modal-booking-detail');
  if (modal) modal.classList.add('hidden');
}

function formatDateTimeVN(dateTimeStr) {
  if (!dateTimeStr) return '';
  const date = new Date(dateTimeStr);
  if (isNaN(date.getTime())) return dateTimeStr;
  return date.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}
