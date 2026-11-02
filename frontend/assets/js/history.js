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

  const token = localStorage.getItem('token');
  if (!token) {
    container.innerHTML = `
      <div class="section-box" style="text-align: center; padding: 3.5rem 1.5rem; max-width: 520px; margin: 2rem auto;">
        <span style="font-size: 3rem;">🔒</span>
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
          <span style="font-size: 3rem;">🏸</span>
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
                    <span style="color: var(--text-muted); font-size: 0.8rem;">📍 ${b.tenDiaDiem || 'Cơ sở'}</span>
                  </td>
                  <td style="padding: 0.85rem 1rem;">
                    <div>${formatNgay(b.ngayChoi)}</div>
                    <div style="color: var(--secondary); font-size: 0.8rem; font-weight: 600;">
                      ⏰ ${formatGio(b.gioBatDau)} - ${formatGio(b.gioKetThuc)}
                    </div>
                  </td>
                  <td style="padding: 0.85rem 1rem; font-weight: 700; color: var(--primary-dark);">
                    ${formatTien(b.soTien)}
                  </td>
                  <td style="padding: 0.85rem 1rem;">
                    <span style="font-size: 0.82rem;">${b.phuongThucThanhToan === 'QR' ? '📱 QR Code' : '💵 Tiền mặt'}</span><br>
                    <span style="font-size: 0.75rem; color: var(--text-muted);">${badgeTrangThai(b.trangThaiThanhToan)}</span>
                  </td>
                  <td style="padding: 0.85rem 1rem;">
                    ${badgeTrangThai(b.trangThaiDat)}
                    ${b.lyDoHuy ? `<div style="font-size: 0.75rem; color: var(--danger); margin-top: 0.2rem;">Lý do: ${b.lyDoHuy}</div>` : ''}
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
    container.innerHTML = `<div class="alert alert-danger">Lỗi tải lịch sử: ${error.message}</div>`;
  }
}

// ======================== MODAL HỦY ĐẶT SÂN ========================

let cancellingBookingId = null;

function openCancelBookingModal(maDatSan) {
  cancellingBookingId = maDatSan;
  const modal = document.getElementById('modal-cancel-booking');
  const txtId = document.getElementById('cancel-modal-booking-id');
  if (txtId) txtId.textContent = `#${maDatSan}`;
  if (modal) modal.classList.remove('hidden');
}

function closeCancelBookingModal() {
  cancellingBookingId = null;
  const modal = document.getElementById('modal-cancel-booking');
  if (modal) modal.classList.add('hidden');
}

async function confirmCancelBooking() {
  if (!cancellingBookingId) return;

  const lyDoHuy = document.getElementById('input-cancel-reason').value.trim() || 'NguoiDungHuy';
  const btn = document.getElementById('btn-confirm-cancel');
  if (btn) btn.disabled = true;

  try {
    await api.put(`/user/booking/${cancellingBookingId}/cancel`, { lyDoHuy });
    showAlert('Yêu cầu hủy đơn đã được ghi nhận!', 'success');
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
        <h4 style="font-size: 0.95rem; margin-bottom: 0.5rem; color: var(--dark);">🏸 Dịch vụ đã sử dụng</h4>
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
        <h4 style="font-size: 0.95rem; margin-bottom: 0.5rem; color: var(--primary-dark);">🧾 Chi tiết hóa đơn thanh toán (#${b.hoaDon.maHoaDon})</h4>
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
  if (b.hoanTien) {
    htHtml = `
      <div style="margin-top: 1rem; padding: 0.85rem; background: #fffbeb; border-radius: 8px; border: 1px solid #fde68a; font-size: 0.85rem;">
        <h4 style="font-size: 0.95rem; margin-bottom: 0.5rem; color: #b45309;">💰 Thông tin hoàn tiền</h4>
        <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
          <span>Tỷ lệ hoàn tiền:</span>
          <strong style="color: #b45309;">${b.hoanTien.tiLeHoan || 0}%</strong>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
          <span>Số tiền được hoàn:</span>
          <strong style="color: var(--success); font-size: 1rem;">${formatTien(b.hoanTien.soTienHoan || 0)}</strong>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
          <span>Trạng thái:</span>
          <span>${badgeTrangThai(b.hoanTien.trangThai || 'DaHoan')}</span>
        </div>
        ${b.hoanTien.lyDo ? `
          <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.25rem;">
            Lý do: ${b.hoanTien.lyDo}
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
        <div><strong>Trạng thái TT:</strong> ${badgeTrangThai(b.trangThaiThanhToan)}</div>
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

