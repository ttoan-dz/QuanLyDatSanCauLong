/**
 * History Page JavaScript Logic (Upgraded Design System)
 */

let historyList = [];
let filteredHistoryList = [];
let currentPage = 1;
let pageSize = 10;
let currentSearchKeyword = '';

document.addEventListener('DOMContentLoaded', () => {
  loadBookingHistory();
});

async function loadBookingHistory() {
  const container = document.getElementById('history-container');
  if (!container) return;

  const token = getAuthToken();
  if (!token) {
    container.innerHTML = `
      <div style="text-align: center; padding: 3.5rem 1.5rem; max-width: 520px; margin: 2rem auto;">
        <div style="width: 68px; height: 68px; margin: 0 auto 1.25rem; background: #eff6ff; border: 1.5px solid #bfdbfe; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #2563eb; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.12);">
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>
        <h3 style="font-size: 1.3rem; margin: 1rem 0 0.5rem; color: var(--dark);">Vui lòng đăng nhập</h3>
        <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 1.5rem; line-height: 1.5;">
          Bạn cần đăng nhập để xem lịch sử và quản lý các đơn đặt sân của bạn.
        </p>
        <a href="/pages/auth/login.html" class="btn btn-primary">Đăng nhập ngay</a>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div style="text-align: center; padding: 3.5rem 1.5rem;">
      <div class="spinner" style="margin: 0 auto 0.75rem;"></div>
      <p style="color: var(--text-muted); font-size: 0.9rem;">Đang tải danh sách lịch sử đặt sân...</p>
    </div>
  `;

  try {
    const data = await api.get('/user/booking/history');
    historyList = Array.isArray(data) ? data : [];

    updateHistoryStats();
    applyHistoryFilters();

    // Kiểm tra URL nếu có param ?pay={maDatSan} thì tự mở modal QR
    const urlParams = new URLSearchParams(window.location.search);
    const payId = urlParams.get('pay');
    if (payId) {
      const targetBooking = historyList.find(b => b.maDatSan === parseInt(payId));
      if (targetBooking) {
        openHistoryQRModal(targetBooking.maDatSan, targetBooking.soTien);
      }
    }
  } catch (error) {
    showAlert(`Không thể tải lịch sử đặt sân: ${error.message}`, 'danger');
    container.innerHTML = `
      <div style="text-align: center; padding: 3rem 1.5rem; color: var(--text-muted);">
        <div style="width: 56px; height: 56px; margin: 0 auto 0.75rem; background: #fff1f2; border: 1.5px solid #fecdd3; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #dc2626;">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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

/**
 * 4 Thẻ Thống Kê Tổng Quan từ dữ liệu thực tế
 */
function updateHistoryStats() {
  const totalCount = historyList.length;
  let completedCount = 0;
  let processingCount = 0;
  let realSpending = 0;

  historyList.forEach(b => {
    // Đã hoàn thành
    if (b.trangThaiDat === 'HoanThanh') {
      completedCount++;
    }

    // Đang xử lý
    if (['ChoXacNhan', 'DaXacNhan', 'DangChoi', 'ChoHuy'].includes(b.trangThaiDat)) {
      processingCount++;
    }

    // Tính tổng chi tiêu thực tế (chỉ tính đơn đã thanh toán hoặc đã hoàn thành)
    const isPaid = b.trangThaiThanhToan === 'DaThanhToan' || b.trangThaiDat === 'HoanThanh';
    if (isPaid) {
      let paidAmount = b.soTien || b.tienSan || 0;
      
      // Khấu trừ hoàn tiền nếu có
      const infoHT = b.thongTinHoanTien || b.hoanTien;
      let refundAmount = 0;
      if (infoHT && infoHT.soTienHoan) {
        refundAmount = infoHT.soTienHoan;
      } else if (b.hoaDon && b.hoaDon.tienHoanDuyet) {
        refundAmount = b.hoaDon.tienHoanDuyet;
      } else if (b.lyDoHuy === 'BaoTriHoacTamNgung' || (b.ghiChu && b.ghiChu.includes('100%'))) {
        refundAmount = paidAmount; // Hoàn 100%
      }

      realSpending += Math.max(0, paidAmount - refundAmount);
    }
  });

  const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const elTotal = document.getElementById('stat-history-total');
  const elComp = document.getElementById('stat-history-completed');
  const elRate = document.getElementById('stat-history-rate');
  const elProc = document.getElementById('stat-history-processing');
  const elSpend = document.getElementById('stat-history-spending');

  if (elTotal) elTotal.textContent = totalCount;
  if (elComp) elComp.textContent = completedCount;
  if (elRate) elRate.textContent = `Tỷ lệ: ${completionRate}% hoàn thành`;
  if (elProc) elProc.textContent = processingCount;
  if (elSpend) elSpend.textContent = formatTien(realSpending);
}

// Xử lý ô tìm kiếm
function handleHistorySearch(val) {
  currentSearchKeyword = (val || '').trim();
  const clearBtn = document.getElementById('btn-clear-history-search');
  if (clearBtn) clearBtn.style.display = currentSearchKeyword ? 'flex' : 'none';
  currentPage = 1;
  applyHistoryFilters();
}

function clearHistorySearch() {
  const input = document.getElementById('history-search-input');
  if (input) input.value = '';
  currentSearchKeyword = '';
  const clearBtn = document.getElementById('btn-clear-history-search');
  if (clearBtn) clearBtn.style.display = 'none';
  currentPage = 1;
  applyHistoryFilters();
}

// Áp dụng bộ lọc đa chiều
function applyHistoryFilters() {
  const statusFilter = document.getElementById('filter-booking-status')?.value || 'ALL';
  const paymentFilter = document.getElementById('filter-payment-status')?.value || 'ALL';
  const dateFilter = document.getElementById('filter-date-range')?.value || 'ALL';
  const sortBy = document.getElementById('sort-history-by')?.value || 'newest';

  const now = new Date();
  const nowMs = now.getTime();

  filteredHistoryList = historyList.filter(b => {
    // 1. Tìm kiếm theo mã đơn, tên sân, tên cơ sở
    if (currentSearchKeyword) {
      const kw = currentSearchKeyword.toLowerCase();
      const codeMatch = String(b.maDatSan || '').includes(kw.replace('#', ''));
      const nameMatch = (b.tenSan || '').toLowerCase().includes(kw);
      const locMatch = (b.tenDiaDiem || '').toLowerCase().includes(kw);
      if (!codeMatch && !nameMatch && !locMatch) return false;
    }

    // 2. Lọc trạng thái đặt
    if (statusFilter !== 'ALL') {
      if (b.trangThaiDat !== statusFilter) return false;
    }

    // 3. Lọc thanh toán
    if (paymentFilter !== 'ALL') {
      if (paymentFilter === 'DaHoanTien') {
        const isRefund = b.trangThaiThanhToan === 'DaHoanTien' || 
          (b.thongTinHoanTien && b.thongTinHoanTien.soTienHoan > 0) ||
          (b.lyDoHuy === 'BaoTriHoacTamNgung');
        if (!isRefund) return false;
      } else if (b.trangThaiThanhToan !== paymentFilter) {
        return false;
      }
    }

    // 4. Lọc thời gian
    if (dateFilter !== 'ALL') {
      const bDate = new Date(b.ngayTao || b.ngayChoi);
      if (!isNaN(bDate.getTime())) {
        const diffDays = Math.floor((nowMs - bDate.getTime()) / (1000 * 60 * 60 * 24));
        if (dateFilter === '7days' && diffDays > 7) return false;
        if (dateFilter === '30days' && diffDays > 30) return false;
        if (dateFilter === '3months' && diffDays > 90) return false;
      }
    }

    return true;
  });

  // Sắp xếp
  if (sortBy === 'newest') {
    filteredHistoryList.sort((a, b) => (b.maDatSan || 0) - (a.maDatSan || 0));
  } else if (sortBy === 'oldest') {
    filteredHistoryList.sort((a, b) => (a.maDatSan || 0) - (b.maDatSan || 0));
  } else if (sortBy === 'price-desc') {
    filteredHistoryList.sort((a, b) => (b.soTien || 0) - (a.soTien || 0));
  } else if (sortBy === 'price-asc') {
    filteredHistoryList.sort((a, b) => (a.soTien || 0) - (b.soTien || 0));
  }

  renderHistoryTable();
}

function resetHistoryFilters() {
  clearHistorySearch();
  const st = document.getElementById('filter-booking-status');
  const pay = document.getElementById('filter-payment-status');
  const dt = document.getElementById('filter-date-range');
  const sort = document.getElementById('sort-history-by');

  if (st) st.value = 'ALL';
  if (pay) pay.value = 'ALL';
  if (dt) dt.value = 'ALL';
  if (sort) sort.value = 'newest';

  currentPage = 1;
  applyHistoryFilters();
}

function renderHistoryTable() {
  const container = document.getElementById('history-container');
  if (!container) return;

  if (filteredHistoryList.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 3.5rem 1.5rem; color: var(--text-muted);">
        <div style="width: 52px; height: 52px; margin: 0 auto 0.75rem; background: #f8fafc; border: 1.5px dashed var(--border); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: var(--text-sub);">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        </div>
        <h3 style="font-size: 1.05rem; font-weight: 700; color: var(--dark); margin: 0.35rem 0;">Không tìm thấy đơn đặt sân phù hợp</h3>
        <p style="font-size: 0.85rem; max-width: 400px; margin: 0 auto 1.25rem;">
          Thử tìm kiếm với từ khóa khác hoặc xóa bộ lọc để xem toàn bộ danh sách đơn đặt.
        </p>
        <button type="button" class="btn btn-outline btn-sm" onclick="resetHistoryFilters()">Đặt lại bộ lọc</button>
      </div>
    `;
    return;
  }

  // Phân trang
  const totalItems = filteredHistoryList.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  if (currentPage > totalPages) currentPage = totalPages;
  if (currentPage < 1) currentPage = 1;

  const startIdx = (currentPage - 1) * pageSize;
  const endIdx = Math.min(startIdx + pageSize, totalItems);
  const pageItems = filteredHistoryList.slice(startIdx, endIdx);

  // HTML Bảng Desktop
  const tableRowsHtml = pageItems.map(b => {
    const canCancel = b.trangThaiDat === 'ChoXacNhan' || b.trangThaiDat === 'DaXacNhan';
    const isOnlinePay = (b.phuongThucThanhToan === 'QR' || b.phuongThucThanhToan === 'VietQR' || b.phuongThucThanhToan === 'VNPay' || b.phuongThucThanhToan === 'MoMo');
    const canPayQR = b.trangThaiDat === 'ChoXacNhan' && isOnlinePay && b.trangThaiThanhToan === 'ChuaThanhToan';
    const isMaintenanceRefund = (b.trangThaiDat === 'DaHuy' && (b.lyDoHuy === 'BaoTriHoacTamNgung' || (b.ghiChu && b.ghiChu.includes('100%'))));

    const paymentBadge = isMaintenanceRefund
      ? '<span class="badge" style="background:#ecfdf5; color:#047857; border:1px solid #a7f3d0; font-weight:700;">Đã hoàn tiền 100%</span>'
      : badgeTrangThai(b.trangThaiThanhToan);

    return `
      <tr style="border-bottom: 1px solid var(--border-light); transition: background-color 0.15s ease;">
        <td style="padding: 1rem 1.15rem;">
          <div class="history-code-badge">
            <span>#${b.maDatSan}</span>
            <button type="button" class="btn-copy-code" onclick="copyBookingCode('${b.maDatSan}')" title="Sao chép mã đơn">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            </button>
          </div>
        </td>
        <td style="padding: 1rem 1.15rem;">
          <strong style="color: var(--dark); font-size: 0.92rem;">${b.tenSan || 'Sân cầu lông'}</strong>
          <div style="color: var(--text-muted); font-size: 0.78rem; display: flex; align-items: center; gap: 4px; margin-top: 2px;">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            <span>${b.tenDiaDiem || 'Cơ sở'}</span>
          </div>
        </td>
        <td style="padding: 1rem 1.15rem;">
          <div style="font-weight: 600; color: var(--dark);">${formatNgay(b.ngayChoi)}</div>
          <div style="color: var(--secondary); font-size: 0.8rem; display: flex; align-items: center; gap: 4px; margin-top: 2px;">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            <span>${formatGio(b.gioBatDau)} - ${formatGio(b.gioKetThuc)}</span>
          </div>
        </td>
        <td style="padding: 1rem 1.15rem; font-weight: 800; color: var(--primary-dark); font-size: 0.95rem;">
          ${formatTien(b.soTien)}
        </td>
        <td style="padding: 1rem 1.15rem;">
          <div style="font-size: 0.82rem; font-weight: 600; color: var(--dark); display: flex; align-items: center; gap: 4px; margin-bottom: 3px;">
            ${formatPhuongThucThanhToan(b.phuongThucThanhToan, true)}
          </div>
          <div>${paymentBadge}</div>
        </td>
        <td style="padding: 1rem 1.15rem;">
          ${badgeTrangThai(b.trangThaiDat)}
          ${b.lyDoHuy ? `<div style="font-size: 0.72rem; color: var(--danger); margin-top: 0.25rem; line-height: 1.25;">${formatLyDoHuy(b.lyDoHuy)}</div>` : ''}
        </td>
        <td style="padding: 1rem 1.15rem; text-align: right;">
          <div style="display: flex; gap: 0.4rem; justify-content: flex-end; align-items: center; flex-wrap: wrap;">
            <button type="button" class="btn btn-sm btn-outline" onclick="openBookingDetailModal(${b.maDatSan})">Chi tiết</button>
            ${canPayQR ? `
              <button type="button" class="btn btn-sm btn-primary" onclick="openHistoryQRModal(${b.maDatSan}, ${b.soTien})">Thanh toán QR</button>
            ` : ''}
            ${canCancel ? `
              <button type="button" class="btn btn-sm btn-outline" style="color: var(--danger); border-color: var(--danger-border);" onclick="openCancelBookingModal(${b.maDatSan})">Hủy</button>
            ` : ''}
          </div>
        </td>
      </tr>
    `;
  }).join('');

  // HTML Mobile Cards
  const mobileCardsHtml = pageItems.map(b => {
    const canCancel = b.trangThaiDat === 'ChoXacNhan' || b.trangThaiDat === 'DaXacNhan';
    const isOnlinePay = (b.phuongThucThanhToan === 'QR' || b.phuongThucThanhToan === 'VietQR' || b.phuongThucThanhToan === 'VNPay' || b.phuongThucThanhToan === 'MoMo');
    const canPayQR = b.trangThaiDat === 'ChoXacNhan' && isOnlinePay && b.trangThaiThanhToan === 'ChuaThanhToan';
    const isMaintenanceRefund = (b.trangThaiDat === 'DaHuy' && (b.lyDoHuy === 'BaoTriHoacTamNgung' || (b.ghiChu && b.ghiChu.includes('100%'))));
    const paymentBadge = isMaintenanceRefund
      ? '<span class="badge" style="background:#ecfdf5; color:#047857; border:1px solid #a7f3d0; font-weight:700;">Đã hoàn tiền 100%</span>'
      : badgeTrangThai(b.trangThaiThanhToan);

    return `
      <div class="history-card-item">
        <div class="history-card-top">
          <div class="history-code-badge">#${b.maDatSan}</div>
          <div>${badgeTrangThai(b.trangThaiDat)}</div>
        </div>
        <div class="history-card-row">
          <span class="history-card-label">Sân & Cơ sở:</span>
          <span class="history-card-value">${b.tenSan} (${b.tenDiaDiem})</span>
        </div>
        <div class="history-card-row">
          <span class="history-card-label">Thời gian:</span>
          <span class="history-card-value">${formatNgay(b.ngayChoi)} (${formatGio(b.gioBatDau)} - ${formatGio(b.gioKetThuc)})</span>
        </div>
        <div class="history-card-row">
          <span class="history-card-label">Tổng tiền:</span>
          <span class="history-card-value" style="color: var(--primary-dark); font-weight: 800;">${formatTien(b.soTien)}</span>
        </div>
        <div class="history-card-row">
          <span class="history-card-label">Phương thức:</span>
          <span class="history-card-value" style="display: flex; align-items: center; gap: 4px;">${formatPhuongThucThanhToan(b.phuongThucThanhToan, true)}</span>
        </div>
        <div class="history-card-row">
          <span class="history-card-label">Thanh toán:</span>
          <div>${paymentBadge}</div>
        </div>
        <div style="display: flex; gap: 0.5rem; justify-content: flex-end; margin-top: 0.85rem; padding-top: 0.75rem; border-top: 1px solid var(--border-light);">
          <button type="button" class="btn btn-sm btn-outline" onclick="openBookingDetailModal(${b.maDatSan})">Chi tiết</button>
          ${canPayQR ? `<button type="button" class="btn btn-sm btn-primary" onclick="openHistoryQRModal(${b.maDatSan}, ${b.soTien})">Thanh toán QR</button>` : ''}
          ${canCancel ? `<button type="button" class="btn btn-sm btn-outline" style="color: var(--danger); border-color: var(--danger-border);" onclick="openCancelBookingModal(${b.maDatSan})">Hủy đơn</button>` : ''}
        </div>
      </div>
    `;
  }).join('');

  // Pagination HTML
  let pageButtonsHtml = '';
  for (let i = 1; i <= totalPages; i++) {
    pageButtonsHtml += `
      <button type="button" class="btn-page ${i === currentPage ? 'active' : ''}" onclick="goToPage(${i})">${i}</button>
    `;
  }

  const paginationBarHtml = `
    <div class="history-pagination-bar">
      <div>
        Hiển thị <strong>${startIdx + 1} - ${endIdx}</strong> trên tổng số <strong>${totalItems}</strong> đơn đặt
      </div>
      <div class="pagination-controls">
        <button type="button" class="btn-page" ${currentPage <= 1 ? 'disabled' : ''} onclick="goToPage(${currentPage - 1})">
          ‹ Trước
        </button>
        ${pageButtonsHtml}
        <button type="button" class="btn-page" ${currentPage >= totalPages ? 'disabled' : ''} onclick="goToPage(${currentPage + 1})">
          Sau ›
        </button>
      </div>
    </div>
  `;

  container.innerHTML = `
    <div class="history-table-desktop" style="overflow-x: auto;">
      <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.88rem;">
        <thead>
          <tr style="background-color: #f8fafc; border-bottom: 1.5px solid var(--border);">
            <th style="padding: 0.9rem 1.15rem; font-weight: 700; color: var(--dark);">Mã đơn</th>
            <th style="padding: 0.9rem 1.15rem; font-weight: 700; color: var(--dark);">Sân & Địa điểm</th>
            <th style="padding: 0.9rem 1.15rem; font-weight: 700; color: var(--dark);">Thời gian chơi</th>
            <th style="padding: 0.9rem 1.15rem; font-weight: 700; color: var(--dark);">Tổng tiền</th>
            <th style="padding: 0.9rem 1.15rem; font-weight: 700; color: var(--dark);">Thanh toán</th>
            <th style="padding: 0.9rem 1.15rem; font-weight: 700; color: var(--dark);">Trạng thái</th>
            <th style="padding: 0.9rem 1.15rem; font-weight: 700; color: var(--dark); text-align: right;">Hành động</th>
          </tr>
        </thead>
        <tbody>
          ${tableRowsHtml}
        </tbody>
      </table>
    </div>

    <!-- Mobile Cards View -->
    <div class="history-cards-mobile">
      ${mobileCardsHtml}
    </div>

    ${totalPages > 1 ? paginationBarHtml : ''}
  `;
}

function goToPage(page) {
  currentPage = page;
  renderHistoryTable();
  const container = document.getElementById('history-container');
  if (container) {
    container.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function copyBookingCode(code) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(code).then(() => {
      showAlert(`Đã sao chép mã đơn #${code} vào bộ nhớ tạm!`, 'success');
    }).catch(() => {
      showAlert(`Mã đơn: #${code}`, 'info');
    });
  } else {
    showAlert(`Mã đơn: #${code}`, 'info');
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
        <div class="cancel-policy-card is-unpaid" style="background:#f0fdf4; border:1px solid #bbf7d0; border-radius:8px; padding:0.85rem 1rem;">
          <div class="policy-header" style="color: #166534; font-weight:700; display:flex; align-items:center; gap:6px; margin-bottom:4px;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
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

      const startFormatted = `${formatGio(b.gioBatDau)} ngày ${formatNgay(b.ngayChoi)}`;

      if (diffMs <= 0) {
        policyBox.innerHTML = `
          <div class="cancel-policy-card" style="background:#fff1f2; border:1px solid #fecdd3; border-radius:8px; padding:0.85rem 1rem;">
            <div class="policy-header" style="color:#dc2626; font-weight:700; display:flex; align-items:center; gap:6px; margin-bottom:4px;">
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

      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      let tyLe = 0;
      let tierName = 'Dưới 12 giờ';
      if (diffHours >= 24) {
        tyLe = 100;
        tierName = 'Trước ≥ 24 giờ';
      } else if (diffHours >= 12) {
        tyLe = 50;
        tierName = 'Từ 12h - dưới 24h';
      } else {
        tyLe = 0;
        tierName = 'Dưới 12 giờ';
      }

      const tienSan = b.tienSan || b.soTien || 0;
      const soTienHoan = Math.round(tienSan * tyLe / 100);

      policyBox.innerHTML = `
        <div style="background:#f8fafc; border:1px solid var(--border); border-radius:8px; padding:1rem; font-size:0.85rem;">
          <div style="font-weight:700; color:var(--dark); margin-bottom:0.5rem; display:flex; align-items:center; gap:5px;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            Ước tính thời gian & Tỷ lệ hoàn tiền
          </div>
          <div style="display:flex; justify-content:space-between; margin-bottom:0.25rem;">
            <span>Giờ thi đấu:</span>
            <strong>${startFormatted}</strong>
          </div>
          <div style="display:flex; justify-content:space-between; margin-bottom:0.25rem;">
            <span>Khung chính sách:</span>
            <strong style="color:${tyLe > 0 ? '#16a34a' : '#dc2626'};">${tierName} (Tỷ lệ: ${tyLe}%)</strong>
          </div>
          <div style="display:flex; justify-content:space-between; padding-top:0.4rem; border-top:1px dashed var(--border); margin-top:0.4rem;">
            <span>Số tiền hoàn dự kiến:</span>
            <strong style="color:${soTienHoan > 0 ? '#16a34a' : '#dc2626'}; font-size:1rem;">${formatTien(soTienHoan)}</strong>
          </div>
        </div>
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

// ======================== MODAL THANH TOÁN QR ========================

let qrBookingId = null;

function openHistoryQRModal(maDatSan, soTien) {
  qrBookingId = maDatSan;
  const modal = document.getElementById('modal-qr-pay');
  const txtId = document.getElementById('qr-modal-booking-id');
  const txtAmount = document.getElementById('qr-modal-amount');
  const imgQR = document.getElementById('qr-modal-img');

  if (txtId) txtId.textContent = `#${maDatSan}`;
  if (txtAmount) txtAmount.textContent = formatTien(soTien);
  if (imgQR) imgQR.src = '/assets/images/qr.jpg';

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

// ======================== MODAL CHI TIẾT ĐƠN ĐẶT SÂN (5 PHẦN) ========================

function openBookingDetailModal(maDatSan) {
  const b = historyList.find(x => x.maDatSan === maDatSan);
  if (!b) return;

  const modal = document.getElementById('modal-booking-detail');
  const txtId = document.getElementById('detail-modal-id');
  const body = document.getElementById('detail-modal-body');
  if (txtId) txtId.textContent = `#${b.maDatSan}`;

  const isMaintenanceRefund = (b.trangThaiDat === 'DaHuy' && (b.lyDoHuy === 'BaoTriHoacTamNgung' || (b.ghiChu && b.ghiChu.includes('100%'))));

  // Phần 1: Thông tin đơn
  const p1Html = `
    <div class="modal-section-box">
      <div class="modal-section-title">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
        1. Thông tin đơn đặt
      </div>
      <div class="modal-kv-grid">
        <div><strong>Mã đơn:</strong> #${b.maDatSan}</div>
        <div><strong>Trạng thái:</strong> ${badgeTrangThai(b.trangThaiDat)}</div>
        <div><strong>Thời gian tạo:</strong> ${formatDateTimeVN(b.ngayTao)}</div>
        <div><strong>Thanh toán:</strong> ${isMaintenanceRefund ? '<span class="badge badge-success">Đã hoàn tiền 100%</span>' : badgeTrangThai(b.trangThaiThanhToan)}</div>
      </div>
    </div>
  `;

  // Phần 2: Thông tin sân
  const p2Html = `
    <div class="modal-section-box">
      <div class="modal-section-title">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
        2. Thông tin sân & Địa điểm thi đấu
      </div>
      <div class="modal-kv-grid">
        <div><strong>Tên sân:</strong> ${b.tenSan || '---'}</div>
        <div><strong>Cơ sở:</strong> ${b.tenDiaDiem || '---'}</div>
        <div><strong>Ngày chơi:</strong> ${formatNgay(b.ngayChoi)}</div>
        <div><strong>Khung giờ:</strong> ${formatGio(b.gioBatDau)} - ${formatGio(b.gioKetThuc)}</div>
      </div>
      ${b.mapLink ? `
        <div style="margin-top: 0.5rem; font-size: 0.82rem;">
          <a href="${b.mapLink}" target="_blank" style="color: var(--primary); text-decoration: underline; display: inline-flex; align-items: center; gap: 4px;">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>
            Xem vị trí cơ sở trên Google Maps ↗
          </a>
        </div>
      ` : ''}
    </div>
  `;

  // Phần 3: Thanh toán & Hóa đơn
  let hdRows = '';
  if (b.hoaDon) {
    hdRows = `
      <div style="margin-top: 0.5rem; padding-top: 0.5rem; border-top: 1px dashed var(--border); font-size: 0.85rem;">
        <div style="display:flex; justify-content:space-between; margin-bottom:0.25rem;"><span>Tiền sân:</span><strong>${formatTien(b.hoaDon.tongTienSan || 0)}</strong></div>
        ${b.hoaDon.tongTienDV > 0 ? `<div style="display:flex; justify-content:space-between; margin-bottom:0.25rem;"><span>Tiền dịch vụ:</span><strong>${formatTien(b.hoaDon.tongTienDV)}</strong></div>` : ''}
        ${b.hoaDon.tienQuaGio > 0 ? `<div style="display:flex; justify-content:space-between; margin-bottom:0.25rem; color:var(--orange);"><span>Tiền quá giờ:</span><strong>+${formatTien(b.hoaDon.tienQuaGio)}</strong></div>` : ''}
        ${b.hoaDon.tienHoanDuyet > 0 ? `<div style="display:flex; justify-content:space-between; margin-bottom:0.25rem; color:var(--success);"><span>Khấu trừ hoàn tiền:</span><strong>-${formatTien(b.hoaDon.tienHoanDuyet)}</strong></div>` : ''}
        <div style="display:flex; justify-content:space-between; margin-top:0.4rem; padding-top:0.4rem; border-top:1px solid var(--border); font-size:0.95rem;">
          <strong style="color:var(--primary-dark);">Thực thu / Còn lại:</strong>
          <strong style="color:var(--primary-dark);">${formatTien(b.hoaDon.thanhTien || 0)}</strong>
        </div>
      </div>
    `;
  }

  const p3Html = `
    <div class="modal-section-box">
      <div class="modal-section-title">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
        3. Thanh toán & Chi phí
      </div>
      <div class="modal-kv-grid">
        <div><strong>Phương thức:</strong> ${formatPhuongThucThanhToan(b.phuongThucThanhToan, false)}</div>
        <div><strong>Tổng tiền đơn:</strong> <span style="font-weight: 800; color: var(--primary-dark); font-size: 1.05rem;">${formatTien(b.soTien)}</span></div>
      </div>
      ${hdRows}
    </div>
  `;

  // Dịch vụ kèm theo (nếu có)
  let dvHtml = '';
  if (b.danhSachDichVu && b.danhSachDichVu.length > 0) {
    dvHtml = `
      <div class="modal-section-box">
        <div class="modal-section-title">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
          Dịch vụ đã sử dụng tại sân
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 0.82rem;">
          <thead>
            <tr style="background: #f1f5f9; text-align: left;">
              <th style="padding: 0.35rem 0.5rem;">Dịch vụ</th>
              <th style="padding: 0.35rem 0.5rem; text-align: center;">SL</th>
              <th style="padding: 0.35rem 0.5rem; text-align: right;">Đơn giá</th>
              <th style="padding: 0.35rem 0.5rem; text-align: right;">Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            ${b.danhSachDichVu.map(dv => `
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 0.35rem 0.5rem;">${dv.tenDV}</td>
                <td style="padding: 0.35rem 0.5rem; text-align: center;">${dv.soLuong}</td>
                <td style="padding: 0.35rem 0.5rem; text-align: right;">${formatTien(dv.donGia)}</td>
                <td style="padding: 0.35rem 0.5rem; text-align: right; font-weight: 600;">${formatTien(dv.thanhTien)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  // Phần 4: Mốc thời gian
  const p4Html = `
    <div class="modal-section-box">
      <div class="modal-section-title">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        4. Mốc thời gian ghi nhận
      </div>
      <div class="modal-kv-grid">
        <div><strong>Tạo đơn:</strong> ${formatDateTimeVN(b.ngayTao)}</div>
        ${b.gioCheckIn ? `<div><strong>Check-in:</strong> ${formatGio(b.gioCheckIn)}</div>` : ''}
        ${b.gioCheckOut ? `<div><strong>Check-out:</strong> ${formatGio(b.gioCheckOut)}</div>` : ''}
      </div>
    </div>
  `;

  // Phần 5: Thông tin hủy & Hoàn tiền (nếu có)
  let p5Html = '';
  const infoHT = b.thongTinHoanTien || b.hoanTien;
  if (b.trangThaiDat === 'DaHuy' || b.trangThaiDat === 'ChoHuy' || infoHT || b.lyDoHuy) {
    p5Html = `
      <div class="modal-section-box" style="background: #fffbeb; border-color: #fde68a;">
        <div class="modal-section-title" style="color: #b45309;">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
          5. Thông tin hủy đơn & Hoàn tiền
        </div>
        <div style="font-size: 0.85rem; color: #92400e; line-height: 1.5;">
          ${b.lyDoHuy ? `<div><strong>Lý do hủy:</strong> ${formatLyDoHuy(b.lyDoHuy)}</div>` : ''}
          ${infoHT ? `
            <div style="display:flex; justify-content:space-between; margin-top:0.35rem;">
              <span>Tỷ lệ hoàn tiền:</span>
              <strong>${infoHT.tyLeHoan !== undefined ? infoHT.tyLeHoan : (infoHT.tiLeHoan || 0)}%</strong>
            </div>
            <div style="display:flex; justify-content:space-between; margin-top:0.2rem;">
              <span>Số tiền hoàn:</span>
              <strong style="color:var(--success); font-size:0.95rem;">${formatTien(infoHT.soTienHoan || 0)}</strong>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  if (body) {
    body.innerHTML = p1Html + p2Html + p3Html + dvHtml + p4Html + p5Html;
  }

  if (modal) modal.classList.remove('hidden');
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
