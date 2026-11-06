/**
 * History Page JavaScript Logic
 */

let historyList = [];

document.addEventListener('DOMContentLoaded', () => {
  loadBookingHistory();
});

async function loadBookingHistory() {
  const container = document.getElementById('history-container');
  if (!container) return;

  const token = getAuthToken();
  if (!token) {
    container.innerHTML = `
      <div class="section-box" style="text-align: center; padding: 3.5rem 1.5rem; max-width: 520px; margin: 2rem auto;">
        <div style="width: 68px; height: 68px; margin: 0 auto 1.25rem; background: #eff6ff; border: 1.5px solid #bfdbfe; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #2563eb; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.12);">
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>
        <h3 style="font-size: 1.3rem; margin: 1rem 0 0.5rem; color: var(--dark);">Vui lòng đăng nhập</h3>
        <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 1.5rem; line-height: 1.5;">
          Bạn cần đăng nhập để xem lịch sử và các đơn đặt sân của bạn.
        </p>
        <a href="/pages/auth/login.html" class="btn btn-primary">Đăng nhập</a>
      </div>
    `;
    return;
  }

  container.innerHTML = `<p style="text-align: center; color: var(--text-muted); padding: 2rem;">Đang tải lịch sử đặt sân...</p>`;

  try {
    const data = await api.get('/user/booking/history');
    historyList = data || [];

    if (historyList.length === 0) {
      container.innerHTML = `
        <div class="section-box" style="text-align: center; padding: 3rem 1.5rem;">
          <div style="width: 68px; height: 68px; margin: 0 auto 1.25rem; background: #ecfdf5; border: 1.5px solid #a7f3d0; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #059669; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.12);">
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <line x1="3" y1="9" x2="21" y2="9"/>
              <line x1="3" y1="15" x2="21" y2="15"/>
              <line x1="12" y1="3" x2="12" y2="21"/>
            </svg>
          </div>
          <h3 style="font-size: 1.25rem; color: var(--dark); margin: 0.75rem 0 0.5rem;">Chưa có lịch sử đặt sân</h3>
          <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 1.5rem;">
            Bạn chưa thực hiện đơn đặt sân nào. Hãy chọn sân và đặt lịch ngay!
          </p>
          <a href="/pages/user/courts.html" class="btn btn-primary">Xem danh sách sân</a>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="section-box" style="overflow-x: auto; padding: 0;">
        <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.875rem;">
          <thead>
            <tr style="background-color: #f8fafc; border-bottom: 1.5px solid var(--border);">
              <th style="padding: 0.85rem 1rem; font-weight: 700; color: var(--dark);">Mã đơn</th>
              <th style="padding: 0.85rem 1rem; font-weight: 700; color: var(--dark);">Sân & Địa điểm</th>
              <th style="padding: 0.85rem 1rem; font-weight: 700; color: var(--dark);">Thời gian chơi</th>
              <th style="padding: 0.85rem 1rem; font-weight: 700; color: var(--dark);">Tổng tiền</th>
              <th style="padding: 0.85rem 1rem; font-weight: 700; color: var(--dark);">Hình thức TT</th>
              <th style="padding: 0.85rem 1rem; font-weight: 700; color: var(--dark);">Trạng thái</th>
              <th style="padding: 0.85rem 1rem; font-weight: 700; color: var(--dark); text-align: right;">Hành động</th>
            </tr>
          </thead>
          <tbody>
            ${historyList.map(b => {
              const canCancel = b.trangThaiDat === 'ChoXacNhan' || b.trangThaiDat === 'DaXacNhan';
              const canPayQR = b.trangThaiDat === 'ChoXacNhan' && b.phuongThucThanhToan === 'QR';

              return `
                <tr style="border-bottom: 1px solid var(--border-light);">
                  <td style="padding: 0.85rem 1rem; font-weight: 700; color: var(--dark);">#${b.maDatSan}</td>
                  <td style="padding: 0.85rem 1rem;">
                    <strong>${b.tenSan || 'Sân cầu lông'}</strong><br>
                    <span style="color: var(--text-muted); font-size: 0.8rem; display: inline-flex; align-items: center; gap: 4px;">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                      ${b.tenDiaDiem || 'Cơ sở'}
                    </span>
                  </td>
                  <td style="padding: 0.85rem 1rem;">
                    <div>${formatNgay(b.ngayChoi)}</div>
                    <div style="color: var(--secondary); font-size: 0.8rem; font-weight: 600; display: inline-flex; align-items: center; gap: 4px;">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                      ${formatGio(b.gioBatDau)} - ${formatGio(b.gioKetThuc)}
                    </div>
                  </td>
                  <td style="padding: 0.85rem 1rem; font-weight: 700; color: var(--primary-dark);">
                    ${formatTien(b.soTien)}
                  </td>
                  <td style="padding: 0.85rem 1rem;">
                    <span style="font-size: 0.82rem; font-weight: 500; display: inline-flex; align-items: center; gap: 4px;">
                      ${b.phuongThucThanhToan === 'QR' 
                        ? `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg> QR Code`
                        : `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/></svg> Tiền mặt`
                      }
                    </span><br>
                    <span style="font-size: 0.75rem; color: var(--text-muted);">${
                      (b.trangThaiDat === 'DaHuy' && (b.lyDoHuy === 'BaoTriHoacTamNgung' || (b.ghiChu && b.ghiChu.includes('100%'))))
                        ? '<span class="badge" style="background:#ecfdf5; color:#047857; border:1px solid #a7f3d0; font-weight:700;">Đã hoàn tiền 100%</span>'
                        : badgeTrangThai(b.trangThaiThanhToan)
                    }</span>
                  </td>
                  <td style="padding: 0.85rem 1rem;">
                    ${badgeTrangThai(b.trangThaiDat)}
                    ${b.lyDoHuy ? `<div style="font-size: 0.75rem; color: var(--danger); margin-top: 0.25rem; line-height: 1.3;">Lý do: ${formatLyDoHuy(b.lyDoHuy)}</div>` : ''}
                  </td>
                  <td style="padding: 0.85rem 1rem; text-align: right;">
                    <div style="display: flex; gap: 0.35rem; justify-content: flex-end; align-items: center; flex-wrap: wrap;">
                      <button class="btn btn-sm btn-outline" onclick="openBookingDetailModal(${b.maDatSan})">Chi tiết</button>
                      ${canPayQR ? `
                        <button class="btn btn-sm btn-primary" onclick="openHistoryQRModal(${b.maDatSan}, ${b.soTien})">Thanh toán QR</button>
                      ` : ''}
                      ${canCancel ? `
                        <button class="btn btn-sm btn-outline" style="color: var(--danger); border-color: var(--danger-border);" onclick="openCancelBookingModal(${b.maDatSan})">Hủy đơn</button>
                      ` : ''}
                      ${b.trangThaiDat === 'ChoHuy' ? `
                        <span style="font-size: 0.75rem; color: var(--orange); font-weight: 600;">Chờ duyệt hủy</span>
                      ` : ''}
                    </div>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  } catch (error) {
    showAlert(`Không thể tải lịch sử đặt sân: ${error.message}`, 'danger');
    container.innerHTML = `
      <div class="section-box" style="text-align: center; padding: 2.5rem 1.5rem; color: var(--text-muted);">
        <div style="width: 56px; height: 56px; margin: 0 auto 0.75rem; background: #fff1f2; border: 1.5px solid #fecdd3; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #dc2626;">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="15" y1="9" x2="9" y2="15"></line>
            <line x1="9" y1="9" x2="15" y2="15"></line>
          </svg>
        </div>
        <h3 style="font-size: 1.15rem; color: var(--dark); margin: 0.5rem 0 0.35rem;">Không thể tải dữ liệu lịch sử</h3>
        <p style="font-size: 0.875rem; margin-bottom: 1.25rem;">${error.message}</p>
        <button type="button" class="btn btn-outline btn-sm" onclick="loadBookingHistory()">Thử lại</button>
      </div>
    `;
  }
}

// ======================== MODAL HỦY ĐẶT SÂN ========================

let cancellingBookingId = null;

function openCancelBookingModal(maDatSan) {
  cancellingBookingId = maDatSan;
  const modal = document.getElementById('modal-cancel-booking');
  const txtId = document.getElementById('cancel-modal-booking-id');
  const policyBox = document.getElementById('cancel-modal-policy-box');
  if (txtId) txtId.textContent = `#${maDatSan}`;

  const b = historyList.find(x => x.maDatSan === maDatSan);
  const btnConfirm = document.getElementById('btn-confirm-cancel');
  if (btnConfirm) btnConfirm.disabled = false;

  if (policyBox && b) {
    if (b.trangThaiDat === 'ChoXacNhan') {
      policyBox.innerHTML = `
        <div class="cancel-policy-card is-unpaid">
          <div class="policy-header" style="color: #166534;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            <span>Hủy đơn giữ chỗ chưa thanh toán</span>
          </div>
          <p style="color: #166534; font-size: 0.85rem; line-height: 1.5; margin: 0;">
            Đơn này chưa thanh toán nên sẽ được hủy ngay lập tức và giải phóng khung giờ sân cho người khác.
          </p>
        </div>
      `;
    } else if (b.trangThaiDat === 'DaXacNhan') {
      const matchDateStr = b.ngayChoi;
      const matchTimeStr = b.gioBatDau;

      const parts = (matchDateStr || '').split('-');
      let startTime;
      if (parts.length === 3) {
        const [year, month, day] = parts.map(Number);
        const timeParts = (matchTimeStr || '00:00:00').split(':').map(Number);
        startTime = new Date(year, month - 1, day, timeParts[0] || 0, timeParts[1] || 0, timeParts[2] || 0);
      } else {
        startTime = new Date(`${matchDateStr}T${matchTimeStr}`);
      }

      const now = new Date();
      const diffMs = startTime - now;

      const formatDateTimeDisplay = (d) => {
        const hh = String(d.getHours()).padStart(2, '0');
        const mm = String(d.getMinutes()).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const mo = String(d.getMonth() + 1).padStart(2, '0');
        const yyyy = d.getFullYear();
        return `${hh}:${mm} ngày ${dd}/${mo}/${yyyy}`;
      };

      const startFormatted = `${formatGio(b.gioBatDau)} ngày ${formatNgay(b.ngayChoi)}`;

      if (diffMs <= 0) {
        policyBox.innerHTML = `
          <div class="cancel-policy-card" style="background:#fff1f2; border-color:#fecdd3;">
            <div class="policy-header" style="color:#dc2626;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
              <span>Không thể hủy đơn đặt sân</span>
            </div>
            <p style="font-size: 0.85rem; color: #991b1b; line-height: 1.5; margin: 0;">
              Ca chơi đã bắt đầu vào lúc <strong>${startFormatted}</strong>. Hệ thống không hỗ trợ hủy đơn sau giờ bắt đầu ca chơi.
            </p>
          </div>
        `;
        if (btnConfirm) btnConfirm.disabled = true;
        if (modal) modal.classList.remove('hidden');
        return;
      }

      const totalMinutes = Math.floor(diffMs / (1000 * 60));
      const hoursRemaining = Math.floor(totalMinutes / 60);
      const minutesRemaining = totalMinutes % 60;

      let remainingText = '';
      if (hoursRemaining > 0) {
        remainingText = `${hoursRemaining} giờ ${minutesRemaining > 0 ? minutesRemaining + ' phút' : ''}`.trim();
      } else {
        remainingText = `${minutesRemaining} phút`;
      }

      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

      let tyLe = 0;
      let activeTier = 3;
      let tierName = 'Dưới 12 giờ';
      if (diffHours >= 24) {
        tyLe = 100;
        activeTier = 1;
        tierName = 'Trước ≥ 24 giờ';
      } else if (diffHours >= 12) {
        tyLe = 50;
        activeTier = 2;
        tierName = 'Từ 12h - dưới 24h';
      } else {
        tyLe = 0;
        activeTier = 3;
        tierName = 'Dưới 12 giờ';
      }

      const tienSan = b.tienSan || b.soTien || 0;
      const soTienHoan = Math.round(tienSan * tyLe / 100);

      policyBox.innerHTML = `
        <div class="cancel-policy-card">
          <div class="policy-header">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            <span>Ước tính thời gian & Chính sách hoàn tiền</span>
          </div>

          <div class="policy-timeline-box">
            <div class="timeline-row">
              <span class="timeline-label">Thời điểm yêu cầu hủy:</span>
              <span class="timeline-val">${formatDateTimeDisplay(now)}</span>
            </div>
            <div class="timeline-row">
              <span class="timeline-label">Thời điểm bắt đầu ca chơi:</span>
              <span class="timeline-val highlight">${startFormatted}</span>
            </div>
            <div class="timeline-divider"></div>
            <div class="timeline-row summary">
              <span class="timeline-label">Thời gian còn lại trước giờ chơi:</span>
              <span class="timeline-badge">${remainingText}</span>
            </div>
          </div>

          <div class="policy-tiers-table">
            <div class="policy-tier-item ${activeTier === 1 ? 'is-active' : ''}">
              <span class="tier-condition">Trước ≥ 24 giờ</span>
              <span class="tier-rate rate-100">Hoàn 100%</span>
            </div>
            <div class="policy-tier-item ${activeTier === 2 ? 'is-active' : ''}">
              <span class="tier-condition">Từ 12h - dưới 24h</span>
              <span class="tier-rate rate-50">Hoàn 50%</span>
            </div>
            <div class="policy-tier-item ${activeTier === 3 ? 'is-active' : ''}">
              <span class="tier-condition">Dưới 12 giờ</span>
              <span class="tier-rate rate-0">Không hoàn (0%)</span>
            </div>
          </div>

          <div class="policy-result-box">
            <div class="result-row">
              <span>Tiền sân đã thanh toán:</span>
              <strong>${formatTien(tienSan)}</strong>
            </div>
            <div class="result-row">
              <span>Khung thời gian áp dụng:</span>
              <strong style="color: ${tyLe > 0 ? '#16a34a' : '#dc2626'};">${tierName} (Tỷ lệ: ${tyLe}%)</strong>
            </div>
            <div class="result-row total">
              <span>Số tiền hoàn dự kiến:</span>
              <span class="refund-amount" style="color: ${soTienHoan > 0 ? '#16a34a' : '#dc2626'};">${formatTien(soTienHoan)}</span>
            </div>
          </div>

          <div class="policy-notice">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
            <span><strong>Quy trình xử lý:</strong> Yêu cầu hủy sẽ được gửi đến Quản trị viên đối chiếu và duyệt hoàn tiền. Trong thời gian chờ duyệt, khung giờ sân vẫn được bảo lưu cho bạn.</span>
          </div>
        </div>
      `;
    } else {
      policyBox.innerHTML = `
        <p style="font-size: 0.9rem; color: var(--text-muted);">
          Bạn có chắc chắn muốn hủy đơn đặt sân #${maDatSan} này không?
        </p>
      `;
    }
  }

  if (modal) modal.classList.remove('hidden');
}

function closeCancelBookingModal() {
  cancellingBookingId = null;
  const modal = document.getElementById('modal-cancel-booking');
  if (modal) modal.classList.add('hidden');
}

async function confirmCancelBooking() {
  if (!cancellingBookingId) return;

  const lyDoHuy = document.getElementById('input-cancel-reason').value.trim() || 'Bận việc đột xuất không đến được';
  const btn = document.getElementById('btn-confirm-cancel');
  if (btn) btn.disabled = true;

  try {
    const res = await api.put(`/user/booking/${cancellingBookingId}/cancel`, { lyDoHuy });
    if (res && res.trangThaiDat === 'ChoHuy') {
      showAlert('Yêu cầu hủy đơn đã gửi tới Quản trị viên và đang chờ duyệt!', 'warning');
    } else {
      showAlert('Đã hủy đơn đặt sân thành công!', 'success');
    }
    closeCancelBookingModal();
    loadBookingHistory();
  } catch (error) {
    showAlert(`Hủy đơn thất bại: ${error.message}`, 'danger');
  } finally {
    if (btn) btn.disabled = false;
  }
}

// ======================== MODAL THANH TOÁN QR TRONG LỊCH SỬ ========================

let qrBookingId = null;

function openHistoryQRModal(maDatSan, soTien) {
  qrBookingId = maDatSan;
  const modal = document.getElementById('modal-qr-pay');
  const txtId = document.getElementById('qr-modal-booking-id');
  const txtAmount = document.getElementById('qr-modal-amount');
  const imgQR = document.getElementById('qr-modal-img');

  if (txtId) txtId.textContent = `#${maDatSan}`;
  if (txtAmount) txtAmount.textContent = formatTien(soTien);
  if (imgQR) {
    imgQR.src = '/assets/images/qr.jpg';
  }

  if (modal) modal.classList.remove('hidden');
}

function closeHistoryQRModal() {
  qrBookingId = null;
  const modal = document.getElementById('modal-qr-pay');
  if (modal) modal.classList.add('hidden');
}

async function confirmQRPaidInHistory() {
  if (!qrBookingId) return;

  const btn = document.getElementById('btn-qr-modal-paid');
  if (btn) btn.disabled = true;

  try {
    await api.post(`/user/booking/${qrBookingId}/pay-qr`);
    showAlert('Xác nhận thanh toán QR thành công! Sân đã được kích hoạt.', 'success');
    closeHistoryQRModal();
    loadBookingHistory();
  } catch (error) {
    showAlert(`Lỗi thanh toán: ${error.message}`, 'danger');
    if (btn) btn.disabled = false;
  }
}

// ======================== MODAL XEM CHI TIẾT ĐƠN ========================

function openBookingDetailModal(maDatSan) {
  const b = historyList.find(x => x.maDatSan === maDatSan);
  if (!b) return;

  const modal = document.getElementById('modal-booking-detail');
  const txtId = document.getElementById('detail-modal-id');
  const body = document.getElementById('detail-modal-body');
  if (txtId) txtId.textContent = `#${b.maDatSan}`;

  let dvHtml = '';
  if (b.danhSachDichVu && b.danhSachDichVu.length > 0) {
    dvHtml = `
      <div style="margin-top: 1rem;">
        <h4 style="font-size: 0.95rem; margin-bottom: 0.5rem; color: var(--dark); display: flex; align-items: center; gap: 6px;">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="12" y1="3" x2="12" y2="21"/></svg>
          Dịch vụ đã sử dụng
        </h4>
        <table style="width: 100%; border-collapse: collapse; font-size: 0.82rem; margin-bottom: 0.75rem;">
          <thead>
            <tr style="background: #f1f5f9; text-align: left;">
              <th style="padding: 0.4rem 0.6rem;">Dịch vụ</th>
              <th style="padding: 0.4rem 0.6rem; text-align: center;">SL</th>
              <th style="padding: 0.4rem 0.6rem; text-align: right;">Đơn giá</th>
              <th style="padding: 0.4rem 0.6rem; text-align: right;">Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            ${b.danhSachDichVu.map(dv => `
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 0.4rem 0.6rem;">${dv.tenDV}</td>
                <td style="padding: 0.4rem 0.6rem; text-align: center;">${dv.soLuong}</td>
                <td style="padding: 0.4rem 0.6rem; text-align: right;">${formatTien(dv.donGia)}</td>
                <td style="padding: 0.4rem 0.6rem; text-align: right; font-weight: 600;">${formatTien(dv.thanhTien)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  let hdHtml = '';
  if (b.hoaDon) {
    hdHtml = `
      <div style="margin-top: 1rem; padding: 0.85rem; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; font-size: 0.85rem;">
        <h4 style="font-size: 0.95rem; margin-bottom: 0.5rem; color: var(--primary-dark); display: flex; align-items: center; gap: 6px;">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
          Chi tiết hóa đơn thanh toán (#${b.hoaDon.maHoaDon})
        </h4>
        <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
          <span>Tiền sân:</span>
          <strong>${formatTien(b.hoaDon.tongTienSan || 0)}</strong>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
          <span>Tiền dịch vụ:</span>
          <strong>${formatTien(b.hoaDon.tongTienDV || 0)}</strong>
        </div>
        ${b.hoaDon.tienQuaGio > 0 ? `
          <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem; color: var(--orange);">
            <span>Tiền quá giờ (${b.soBlockQuaGio || 0} block 15p):</span>
            <strong>+${formatTien(b.hoaDon.tienQuaGio)}</strong>
          </div>
        ` : ''}
        <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem; color: var(--text-muted);">
          <span>Đã trả trước:</span>
          <strong>-${formatTien(b.hoaDon.tienTraTruoc || 0)}</strong>
        </div>
        ${b.hoaDon.tienHoanDuyet > 0 ? `
          <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem; color: var(--success);">
            <span>Khấu trừ hoàn tiền:</span>
            <strong>-${formatTien(b.hoaDon.tienHoanDuyet)}</strong>
          </div>
        ` : ''}
        <div style="display: flex; justify-content: space-between; margin-top: 0.5rem; padding-top: 0.5rem; border-top: 1px dashed #cbd5e1; font-size: 1rem;">
          <strong style="color: var(--primary-dark);">Thực thu / Còn lại:</strong>
          <strong style="color: var(--primary-dark);">${formatTien(b.hoaDon.thanhTien || 0)}</strong>
        </div>
      </div>
    `;
  }

  let htHtml = '';
  const infoHT = b.thongTinHoanTien || b.hoanTien;
  if (infoHT) {
    htHtml = `
      <div style="margin-top: 1rem; padding: 0.85rem; background: #fffbeb; border-radius: 8px; border: 1px solid #fde68a; font-size: 0.85rem;">
        <h4 style="font-size: 0.95rem; margin-bottom: 0.5rem; color: #b45309; display: flex; align-items: center; gap: 6px;">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><line x1="12" y1="6" x2="12" y2="8"/><line x1="12" y1="16" x2="12" y2="18"/></svg>
          Thông tin hoàn tiền
        </h4>
        <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
          <span>Tỷ lệ hoàn tiền:</span>
          <strong style="color: #b45309;">${infoHT.tyLeHoan !== undefined ? infoHT.tyLeHoan : (infoHT.tiLeHoan || 0)}%</strong>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
          <span>Số tiền hoàn:</span>
          <strong style="color: var(--success); font-size: 1rem;">${formatTien(infoHT.soTienHoan || 0)}</strong>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
          <span>Trạng thái hoàn tiền:</span>
          <span>${infoHT.trangThai === 'ChoDuyet' ? '<span class="badge badge-warning" style="display:inline-flex; align-items:center; gap:4px;"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>Chờ duyệt hoàn tiền</span>' : badgeTrangThai(infoHT.trangThai || 'DaHoan')}</span>
        </div>
        ${infoHT.lyDo ? `
          <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.35rem;">
            Lý do: ${infoHT.lyDo}
          </div>
        ` : ''}
      </div>
    `;
  }

  if (body) {
    body.innerHTML = `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; font-size: 0.88rem; background: #f8fafc; padding: 0.85rem; border-radius: 8px; margin-bottom: 0.75rem;">
        <div><strong>Sân:</strong> ${b.tenSan || '---'}</div>
        <div><strong>Cơ sở:</strong> ${b.tenDiaDiem || '---'}</div>
        <div><strong>Ngày chơi:</strong> ${formatNgay(b.ngayChoi)}</div>
        <div><strong>Giờ chơi:</strong> ${formatGio(b.gioBatDau)} - ${formatGio(b.gioKetThuc)}</div>
        <div><strong>Trạng thái đơn:</strong> ${badgeTrangThai(b.trangThaiDat)}</div>
        <div><strong>Trạng thái TT:</strong> ${
          (b.trangThaiDat === 'DaHuy' && (b.lyDoHuy === 'BaoTriHoacTamNgung' || (b.ghiChu && b.ghiChu.includes('100%'))))
            ? '<span class="badge" style="background:#ecfdf5; color:#047857; border:1px solid #a7f3d0; font-weight:700;">Đã hoàn tiền 100%</span>'
            : badgeTrangThai(b.trangThaiThanhToan)
        }</div>
        ${b.lyDoHuy ? `<div style="grid-column: 1 / -1; color: var(--danger);"><strong>Lý do hủy:</strong> ${formatLyDoHuy(b.lyDoHuy)}</div>` : ''}
        ${b.gioCheckIn ? `<div><strong>Check-in:</strong> ${formatGio(b.gioCheckIn)}</div>` : ''}
        ${b.gioCheckOut ? `<div><strong>Check-out:</strong> ${formatGio(b.gioCheckOut)}</div>` : ''}
      </div>
      ${dvHtml}
      ${hdHtml}
      ${htHtml}
    `;
  }

  if (modal) modal.classList.remove('hidden');
}

function closeBookingDetailModal() {
  const modal = document.getElementById('modal-booking-detail');
  if (modal) modal.classList.add('hidden');
}

