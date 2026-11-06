/**
 * Notifications and Booking Progress JavaScript Logic
 */

let allHistoryBookings = [];

document.addEventListener('DOMContentLoaded', () => {
  loadNotificationsAndProgress();
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
        <div style="text-align: center; padding: 2rem 1rem; color: var(--text-muted);">
          <div style="width: 52px; height: 52px; margin: 0 auto 0.75rem; background: #eff6ff; border: 1.5px solid #bfdbfe; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #2563eb;">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <p style="margin: 0.5rem 0 1rem; font-size: 0.85rem;">Vui lòng đăng nhập để xem thông báo</p>
          <a href="/pages/auth/login.html" class="btn btn-primary btn-sm">Đăng nhập</a>
        </div>
      `;
    }

    if (progContainer) {
      progContainer.innerHTML = `
        <div style="text-align: center; padding: 3rem 1.5rem; color: var(--text-muted);">
          <div style="width: 64px; height: 64px; margin: 0 auto 1rem; background: #eff6ff; border: 1.5px solid #bfdbfe; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #2563eb;">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <h3 style="font-size: 1.25rem; color: var(--dark); margin: 0.75rem 0 0.5rem;">Vui lòng đăng nhập</h3>
          <p style="font-size: 0.9rem; margin-bottom: 1.5rem;">
            Bạn cần đăng nhập để theo dõi tiến trình các đơn đặt sân của mình.
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
}

// ======================== 1. THÔNG BÁO MỚI (CỘT TRÁI) ========================

async function loadNotifications() {
  const container = document.getElementById('notifications-feed');
  const countBadge = document.getElementById('notif-count-badge');
  if (!container) return;

  container.innerHTML = `<p style="color: var(--text-muted); font-size: 0.85rem; text-align: center; padding: 1.5rem;">Đang tải thông báo...</p>`;

  try {
    const notifications = await api.get('/user/notifications');

    if (!notifications || notifications.length === 0) {
      container.innerHTML = `<p style="color: var(--text-muted); font-size: 0.85rem; text-align: center; padding: 1.5rem;">Bạn chưa có thông báo nào.</p>`;
      if (countBadge) countBadge.textContent = '0';
      return;
    }

    const unreadCount = notifications.filter(n => !n.daDoc).length;
    if (countBadge) countBadge.textContent = unreadCount > 0 ? `${unreadCount} mới` : `${notifications.length}`;

    container.innerHTML = notifications.map(n => {
      const typeInfo = getNotificationTypeInfo(n.loaiThongBao);
      return `
        <div class="notif-item ${typeInfo.typeClass} ${n.daDoc ? '' : 'unread'}" id="notif-item-${n.maThongBao}" onclick="handleNotificationClick(${n.maThongBao}, ${n.daDoc})">
          <div class="notif-icon-box">
            ${typeInfo.icon}
          </div>
          <div class="notif-body">
            <div class="notif-item-header">
              <span class="notif-title">${n.tieuDe}</span>
              <span class="notif-time">${formatDateTime(n.thoiGianTao)}</span>
            </div>
            <div class="notif-content">${n.noiDung}</div>
          </div>
        </div>
      `;
    }).join('');
  } catch (error) {
    showAlert(`Không thể tải thông báo: ${error.message}`, 'danger');
    container.innerHTML = `
      <div style="text-align: center; padding: 2rem 1rem; color: var(--text-muted);">
        <p style="font-size: 0.85rem; margin-bottom: 0.75rem;">Không thể tải danh sách thông báo</p>
        <button type="button" class="btn btn-outline btn-sm" onclick="loadNotifications()">Thử lại</button>
      </div>
    `;
  }
}

function getNotificationTypeInfo(loaiThongBao) {
  switch (loaiThongBao) {
    case 'ThanhToan':
      return { 
        typeClass: 'type-ThanhToan', 
        icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>' 
      };
    case 'XacNhan':
      return { 
        typeClass: 'type-XacNhan', 
        icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>' 
      };
    case 'Huy':
      return { 
        typeClass: 'type-Huy', 
        icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>' 
      };
    case 'YeuCauHuy':
    case 'DuyetHuy':
      return { 
        typeClass: 'type-YeuCauHuy', 
        icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>' 
      };
    case 'DatSan':
      return { 
        typeClass: 'type-DatSan', 
        icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>' 
      };
    default:
      return { 
        typeClass: 'type-default', 
        icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>' 
      };
  }
}

async function handleNotificationClick(maThongBao, daDoc) {
  if (daDoc) return;

  try {
    await api.put(`/user/notifications/${maThongBao}/read`);
    const itemEl = document.getElementById(`notif-item-${maThongBao}`);
    if (itemEl) {
      itemEl.classList.remove('unread');
    }
  } catch (error) {
    console.error('Không thể đánh dấu đã đọc:', error);
  }
}

// ======================== 2. TIẾN TRÌNH ĐẶT SÂN (CỘT PHẢI) ========================

async function loadBookingProgress() {
  const container = document.getElementById('booking-progress-feed');
  const countBadge = document.getElementById('booking-count-badge');
  if (!container) return;

  container.innerHTML = `<p style="color: var(--text-muted); font-size: 0.9rem; text-align: center; padding: 2rem;">Đang tải tiến trình đặt sân...</p>`;

  try {
    const history = await api.get('/user/booking/history');
    allHistoryBookings = history || [];

    if (countBadge) {
      countBadge.textContent = `${allHistoryBookings.length} đơn`;
    }

    if (allHistoryBookings.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 2.5rem; color: var(--text-muted);">
          <div style="width: 56px; height: 56px; margin: 0 auto 0.75rem; background: #ecfdf5; border: 1.5px solid #a7f3d0; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #059669;">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <line x1="3" y1="9" x2="21" y2="9"/>
              <line x1="3" y1="15" x2="21" y2="15"/>
              <line x1="12" y1="3" x2="12" y2="21"/>
            </svg>
          </div>
          <p style="margin-top: 0.5rem; font-size: 0.95rem;">Bạn chưa có đơn đặt sân nào.</p>
          <a href="/pages/user/booking.html" class="btn btn-primary" style="margin-top: 1rem;">Đặt sân ngay</a>
        </div>
      `;
      return;
    }

    container.innerHTML = allHistoryBookings.map((b, index) => {
      const progressInfo = getMoTaTienTrinh(b);
      const isConfirmed = b.trangThaiDat === 'DaXacNhan';

      return `
        <div class="booking-progress-card" onclick="openBookingDetailModal(${index})">
          <div class="bp-header">
            <div class="bp-title" style="display: flex; align-items: center; gap: 6px;">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              <span>Booking #${b.maDatSan}</span>
            </div>
            <div>
              ${badgeTrangThai(b.trangThaiDat)}
            </div>
          </div>

          <div class="bp-grid-info">
            <div class="bp-info-item">Sân: <strong>${b.tenSan || 'Sân cầu lông'}</strong></div>
            <div class="bp-info-item">Địa điểm: <strong>${b.tenDiaDiem || 'Cơ sở'}</strong></div>
            <div class="bp-info-item">Ngày chơi: <strong>${formatNgay(b.ngayChoi)}</strong></div>
            <div class="bp-info-item">Khung giờ: <strong>${formatGio(b.gioBatDau)} - ${formatGio(b.gioKetThuc)}</strong></div>
            <div class="bp-info-item">Thanh toán: <strong>${b.phuongThucThanhToan === 'QR' ? 'QR Code' : 'Tiền mặt'}</strong></div>
            <div class="bp-info-item">Tổng tiền: <strong style="color: var(--primary-dark);">${formatTien(b.soTien)}</strong></div>
          </div>

          <div class="progress-container">
            <div class="progress-label-box">
              <span class="progress-label" style="color: ${progressInfo.color};">${progressInfo.label}</span>
              <span class="progress-percent">${progressInfo.percent}%</span>
            </div>
            <div class="progress-track">
              <div class="progress-fill" style="width: ${progressInfo.percent}%; background-color: ${progressInfo.color};"></div>
            </div>
          </div>

          <div class="bp-footer" onclick="event.stopPropagation()">
            <span style="font-size: 0.8rem; color: var(--text-sub);">Tạo lúc: ${formatDateTime(b.ngayTao)}</span>
            <div style="display: flex; gap: 0.75rem; align-items: center;">
              ${isConfirmed && b.mapLink ? `<a href="${b.mapLink}" target="_blank" class="bp-location-link" style="display: inline-flex; align-items: center; gap: 4px;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg> Xem địa chỉ sân</a>` : ''}
              <button type="button" class="btn btn-outline btn-sm" onclick="openBookingDetailModal(${index})">Xem chi tiết</button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  } catch (error) {
    showAlert(`Không thể tải tiến trình đặt sân: ${error.message}`, 'danger');
    container.innerHTML = `
      <div style="text-align: center; padding: 2.5rem 1.5rem; color: var(--text-muted);">
        <p style="font-size: 0.9rem; margin-bottom: 0.75rem;">Không thể tải danh sách tiến trình</p>
        <button type="button" class="btn btn-outline btn-sm" onclick="loadBookingProgress()">Thử lại</button>
      </div>
    `;
  }
}

/**
 * Xác định nhãn mô tả, phần trăm tiến trình và màu sắc theo đúng quy tắc
 */
function getMoTaTienTrinh(booking) {
  const ttDat = booking.trangThaiDat;
  const pttt = booking.phuongThucThanhToan;
  const ttTT = booking.trangThaiThanhToan;
  const lyDo = booking.lyDoHuy;

  // 1. ChoXacNhan + QR + ChuaThanhToan
  if (ttDat === 'ChoXacNhan' && pttt === 'QR' && ttTT === 'ChuaThanhToan') {
    return {
      label: 'Đặt sân thành công — vui lòng thanh toán QR trong 15 phút',
      percent: 30,
      color: '#f97316' // cam
    };
  }

  // 2. DaXacNhan + QR + DaThanhToan
  if (ttDat === 'DaXacNhan' && pttt === 'QR' && ttTT === 'DaThanhToan') {
    return {
      label: 'Đã thanh toán QR — sân đã được xác nhận',
      percent: 100,
      color: '#10b981' // xanh lá
    };
  }

  // 3. ChoXacNhan + TienMat + ChuaThanhToan
  if (ttDat === 'ChoXacNhan' && pttt === 'TienMat' && ttTT === 'ChuaThanhToan') {
    return {
      label: 'Đặt sân thành công — chưa thanh toán, vui lòng đến sân và chờ admin xác nhận',
      percent: 30,
      color: '#f97316' // cam
    };
  }

  // 4. DaXacNhan + TienMat + DaThanhToan
  if (ttDat === 'DaXacNhan' && pttt === 'TienMat' && ttTT === 'DaThanhToan') {
    return {
      label: 'Admin đã xác nhận thanh toán — sân đã được xác nhận',
      percent: 100,
      color: '#10b981' // xanh lá
    };
  }

  // 5. ChoHuy
  if (ttDat === 'ChoHuy') {
    return {
      label: 'Đã gửi yêu cầu hủy — đang chờ admin duyệt',
      percent: 60,
      color: '#eab308' // vàng
    };
  }

  // 6. DaHuy (tất cả các lý do)
  if (ttDat === 'DaHuy') {
    if (booking.lyDoHuy === 'BaoTriHoacTamNgung' || (booking.ghiChu && booking.ghiChu.includes('100%'))) {
      return {
        label: 'Đã hủy do sự cố sân — Đã hoàn tiền 100%',
        percent: 100,
        color: '#059669' // xanh ngọc hoàn tiền
      };
    }
    return {
      label: 'Đã hủy',
      percent: 0,
      color: '#ef4444' // đỏ
    };
  }

  // 9. HetHan
  if (ttDat === 'HetHan') {
    return {
      label: 'Đã hết hạn — quá 15 phút chưa thanh toán QR',
      percent: 0,
      color: '#94a3b8' // xám
    };
  }

  // 10. HoanThanh
  if (ttDat === 'HoanThanh') {
    return {
      label: 'Đã hoàn thành',
      percent: 100,
      color: '#3b82f6' // xanh dương
    };
  }

  // Fallback
  return {
    label: `Trạng thái: ${ttDat}`,
    percent: 50,
    color: '#64748b'
  };
}

// ======================== MODAL CHI TIẾT BOOKING ========================

function openBookingDetailModal(index) {
  const booking = allHistoryBookings[index];
  if (!booking) return;

  const modal = document.getElementById('modal-booking-detail');
  const bodyEl = document.getElementById('modal-booking-body');
  const titleEl = document.getElementById('modal-booking-title');

  if (!modal || !bodyEl) return;

  titleEl.textContent = `Chi tiết đơn đặt sân #${booking.maDatSan}`;

  const progress = getMoTaTienTrinh(booking);

  const isMaintenanceRefund = booking.trangThaiDat === 'DaHuy' && 
    (booking.lyDoHuy === 'BaoTriHoacTamNgung' || (booking.ghiChu && booking.ghiChu.includes('100%')));

  const paymentStatusBadge = isMaintenanceRefund
    ? '<span class="badge" style="background:#ecfdf5; color:#047857; border:1px solid #a7f3d0; font-weight:700;">Đã hoàn tiền 100%</span>'
    : badgeTrangThai(booking.trangThaiThanhToan);

  bodyEl.innerHTML = `
    ${isMaintenanceRefund ? `
      <div style="background: #eff6ff; border: 1.5px solid #bfdbfe; border-radius: var(--radius-sm); padding: 0.85rem 1rem; margin-bottom: 1.15rem; display: flex; align-items: flex-start; gap: 0.65rem;">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" style="flex-shrink:0; margin-top: 1px;"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
        <div>
          <strong style="color: #1e40af; font-size: 0.88rem; display: block;">Sân bảo trì đột xuất — Đã hoàn tiền 100%</strong>
          <span style="font-size: 0.82rem; color: #1e3a8a; line-height: 1.45; display: block; margin-top: 2px;">
            Đơn đặt sân này đã được cơ sở hủy do sân cần bảo trì kỹ thuật hoặc tạm ngưng phục vụ đột xuất. Toàn bộ 100% số tiền <strong>(${formatTien(booking.soTien)})</strong> đã được hoàn trả lại cho bạn.
          </span>
        </div>
      </div>
    ` : ''}
    <div class="modal-detail-row">
      <span class="modal-detail-label">Mã đơn đặt sân:</span>
      <span class="modal-detail-value">#${booking.maDatSan}</span>
    </div>
    <div class="modal-detail-row">
      <span class="modal-detail-label">Địa điểm cơ sở:</span>
      <span class="modal-detail-value">
        ${booking.tenDiaDiem || 'N/A'}
        ${booking.mapLink ? `<br><a href="${booking.mapLink}" target="_blank" style="color: var(--primary); font-size: 0.82rem; display: inline-flex; align-items: center; gap: 4px; text-decoration: underline; margin-top: 4px;"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg> Xem trên Google Maps ↗</a>` : ''}
      </span>
    </div>
    <div class="modal-detail-row">
      <span class="modal-detail-label">Sân được chọn:</span>
      <span class="modal-detail-value">${booking.tenSan || 'N/A'}</span>
    </div>
    <div class="modal-detail-row">
      <span class="modal-detail-label">Ngày chơi:</span>
      <span class="modal-detail-value">${formatNgay(booking.ngayChoi)}</span>
    </div>
    <div class="modal-detail-row">
      <span class="modal-detail-label">Khung giờ chơi:</span>
      <span class="modal-detail-value">${formatGio(booking.gioBatDau)} - ${formatGio(booking.gioKetThuc)}</span>
    </div>
    <div class="modal-detail-row">
      <span class="modal-detail-label">Phương thức thanh toán:</span>
      <span class="modal-detail-value">${booking.phuongThucThanhToan === 'QR' ? 'Chuyển khoản QR Code' : 'Tiền mặt tại quầy'}</span>
    </div>
    <div class="modal-detail-row">
      <span class="modal-detail-label">Tổng chi phí:</span>
      <span class="modal-detail-value" style="color: var(--primary-dark); font-size: 1.1rem;">${formatTien(booking.soTien)}</span>
    </div>
    <div class="modal-detail-row">
      <span class="modal-detail-label">Trạng thái đặt:</span>
      <span class="modal-detail-value">${badgeTrangThai(booking.trangThaiDat)}</span>
    </div>
    <div class="modal-detail-row">
      <span class="modal-detail-label">Trạng thái thanh toán:</span>
      <span class="modal-detail-value">${paymentStatusBadge}</span>
    </div>
    <div class="modal-detail-row">
      <span class="modal-detail-label">Tiến trình xử lý:</span>
      <span class="modal-detail-value" style="color: ${progress.color};">${progress.label} (${progress.percent}%)</span>
    </div>
    ${booking.lyDoHuy ? `
      <div class="modal-detail-row">
        <span class="modal-detail-label">Lý do hủy đơn:</span>
        <span class="modal-detail-value" style="color: var(--danger);">${formatLyDoHuy(booking.lyDoHuy)}</span>
      </div>
    ` : ''}
    <div class="modal-detail-row">
      <span class="modal-detail-label">Ghi chú kèm theo:</span>
      <span class="modal-detail-value">${booking.ghiChu || 'Không có'}</span>
    </div>
    <div class="modal-detail-row">
      <span class="modal-detail-label">Thời điểm tạo đơn:</span>
      <span class="modal-detail-value">${formatDateTime(booking.ngayTao)}</span>
    </div>

    <div style="display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 1.25rem;">
      <button type="button" class="btn btn-outline" onclick="closeBookingDetailModal()">Đóng</button>
      ${booking.trangThaiDat === 'ChoXacNhan' && booking.phuongThucThanhToan === 'QR' ? `
        <a href="/pages/user/booking.html" class="btn btn-primary">Thanh toán ngay</a>
      ` : ''}
    </div>
  `;

  modal.classList.remove('hidden');
}

function closeBookingDetailModal() {
  document.getElementById('modal-booking-detail').classList.add('hidden');
}

function openLocationMapModal(tenDiaDiem) {
  showAlert(`Địa chỉ cơ sở ${tenDiaDiem}: Mở cửa từ 06:00 đến 22:00 hàng ngày, có chỗ đỗ ô tô và xe máy. Vui lòng liên hệ ban quản lý để được chỉ dẫn chi tiết.`, 'info');
}

function formatDateTime(dateTimeStr) {
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
