/**
 * Admin & Staff JavaScript Functions
 * Đồng bộ toàn diện theo Báo cáo Đặc tả phần mềm (Kịch bản 1 & 2)
 * Master Layout Emerald Sports Tech Theme (Pro Max) - 0 Emoji
 */

// ======================== MASTER ADMIN SHELL INITIALIZATION ========================

function initAdminLayout() {
  // 1. Gán thông tin hiển thị của Admin ở sidebar & Phân quyền RBAC
  try {
    const user = typeof getUser === 'function' ? getUser() : null;
    const nameEl = document.getElementById('admin-display-name');
    const initialsEl = document.getElementById('admin-avatar-initials');
    const roleEl = document.getElementById('admin-display-role');
    const userRole = (user && (user.role || user.vaiTro || '')) ? (user.role || user.vaiTro).toUpperCase() : '';
    const isStaff = userRole.includes('STAFF') || userRole.includes('NHANVIEN');

    if (user && nameEl) {
      nameEl.textContent = user.hoTen || user.tenDangNhap || 'Quản trị viên';
    }
    if (roleEl) {
      roleEl.textContent = isStaff ? 'Nhân viên (STAFF)' : 'Quản trị viên (ADMIN)';
    }
    if (user && initialsEl) {
      const name = (user.hoTen || user.tenDangNhap || 'AD').trim();
      const parts = name.split(/\s+/);
      const initials = parts.length > 1
        ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
        : name.substring(0, 2).toUpperCase();
      initialsEl.textContent = initials;
    }

    // RBAC: Nếu tài khoản đăng nhập là STAFF, ẩn các menu/nút chỉ dành riêng cho ADMIN
    if (isStaff) {
      const usersNav = document.getElementById('sidebar-nav-users');
      if (usersNav) usersNav.style.display = 'none';
      const createStaffBtn = document.getElementById('btn-create-staff');
      if (createStaffBtn) createStaffBtn.style.display = 'none';
      const auditBtn = document.getElementById('btn-view-audit-logs');
      if (auditBtn) auditBtn.style.display = 'none';
    }
  } catch (e) {
    console.warn('initAdminLayout profile warning:', e);
  }

  // 2. Gán sự kiện nút Đăng xuất
  const logoutBtn = document.getElementById('btn-logout');
  if (logoutBtn) {
    logoutBtn.onclick = () => {
      sessionStorage.clear();
      localStorage.clear();
      window.location.href = '/pages/auth/login.html';
    };
  }

  // 3. Đồng hồ thời gian thực (Live Clock) trên Topbar
  const clockEl = document.getElementById('admin-live-clock');
  if (clockEl) {
    const updateClock = () => {
      const d = new Date();
      const pad = n => String(n).padStart(2, '0');
      const timeStr = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
      const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
      const dateStr = `${days[d.getDay()]}, ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
      clockEl.textContent = `${timeStr} | ${dateStr}`;
    };
    updateClock();
    setInterval(updateClock, 1000);
  }

  // 4. Đóng mở Sidebar trên màn hình di động/tablet
  const toggleBtn = document.getElementById('sidebar-toggle-btn');
  const sidebar = document.getElementById('admin-sidebar');
  if (toggleBtn && sidebar) {
    toggleBtn.onclick = (e) => {
      e.stopPropagation();
      sidebar.classList.toggle('mobile-open');
    };
    document.addEventListener('click', (e) => {
      if (sidebar.classList.contains('mobile-open') && !sidebar.contains(e.target) && e.target !== toggleBtn) {
        sidebar.classList.remove('mobile-open');
      }
    });
  }

  // 5. Khởi tạo drag & drop upload ảnh nếu có dropzone trên trang
  setupCourtPhotoUpload();
}

// Dialog xác nhận hiện đại thay thế window.confirm()
function showConfirmDialog(title, message, { confirmText = 'Xác nhận', cancelText = 'Hủy', danger = false } = {}) {
  return new Promise(resolve => {
    let dialog = document.getElementById('admin-global-confirm-dialog');
    if (!dialog) {
      dialog = document.createElement('div');
      dialog.id = 'admin-global-confirm-dialog';
      dialog.className = 'modal-backdrop hidden';
      dialog.style.zIndex = '1200';
      dialog.innerHTML = `
        <div class="modal-content" style="max-width: 480px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.25), 0 10px 10px -5px rgba(0, 0, 0, 0.1);">
          <div class="modal-header">
            <h3 class="modal-title" id="admin-confirm-title" style="font-size: 1.15rem; display: flex; align-items: center; gap: 0.5rem;">
              <span id="admin-confirm-icon"></span>
              <span id="admin-confirm-title-text">Xác nhận thao tác</span>
            </h3>
            <button type="button" class="modal-close" id="admin-confirm-close">&times;</button>
          </div>
          <div class="modal-body" style="padding: 1.25rem;">
            <p id="admin-confirm-message" style="font-size: 0.92rem; color: var(--text-secondary); line-height: 1.55; margin: 0;"></p>
          </div>
          <div class="modal-footer" style="display: flex; justify-content: flex-end; gap: 0.5rem; padding: 1rem 1.25rem;">
            <button type="button" class="btn btn-outline" id="admin-confirm-cancel">Hủy</button>
            <button type="button" class="btn" id="admin-confirm-ok">Xác nhận</button>
          </div>
        </div>
      `;
      document.body.appendChild(dialog);
    }
    dialog.style.zIndex = '1200';

    const titleTextEl = document.getElementById('admin-confirm-title-text');
    const titleEl = document.getElementById('admin-confirm-title');
    const iconEl = document.getElementById('admin-confirm-icon');
    const msgEl = document.getElementById('admin-confirm-message');
    const okBtn = document.getElementById('admin-confirm-ok');
    const cancelBtn = document.getElementById('admin-confirm-cancel');
    const closeBtn = document.getElementById('admin-confirm-close');

    if (titleTextEl) {
      titleTextEl.textContent = title;
    } else if (titleEl) {
      titleEl.textContent = title;
    }

    msgEl.innerHTML = message.replace(/\n/g, '<br>');
    okBtn.textContent = confirmText;
    cancelBtn.textContent = cancelText;

    if (danger) {
      okBtn.className = 'btn btn-danger';
      okBtn.style.backgroundColor = '#dc2626';
      okBtn.style.borderColor = '#dc2626';
      okBtn.style.color = '#ffffff';
      if (titleEl) titleEl.style.color = '#b91c1c';
      if (iconEl) {
        iconEl.innerHTML = `<svg width="20" height="20" fill="none" stroke="#dc2626" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>`;
      }
    } else {
      okBtn.className = 'btn btn-primary';
      okBtn.style.backgroundColor = '';
      okBtn.style.borderColor = '';
      okBtn.style.color = '';
      if (titleEl) titleEl.style.color = 'var(--text-main)';
      if (iconEl) {
        iconEl.innerHTML = `<svg width="20" height="20" fill="none" stroke="var(--primary)" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`;
      }
    }

    const cleanup = (result) => {
      dialog.classList.add('hidden');
      okBtn.onclick = null;
      cancelBtn.onclick = null;
      closeBtn.onclick = null;
      resolve(result);
    };

    okBtn.onclick = () => cleanup(true);
    cancelBtn.onclick = () => cleanup(false);
    closeBtn.onclick = () => cleanup(false);

    dialog.classList.remove('hidden');
  });
}

// Dialog nhập dữ liệu thay thế window.prompt()
function showPromptDialog(title, message, defaultValue = '') {
  return new Promise(resolve => {
    let dialog = document.getElementById('admin-global-prompt-dialog');
    if (!dialog) {
      dialog = document.createElement('div');
      dialog.id = 'admin-global-prompt-dialog';
      dialog.className = 'modal-backdrop hidden';
      dialog.innerHTML = `
        <div class="modal-content" style="max-width: 460px;">
          <div class="modal-header">
            <h3 class="modal-title" id="admin-prompt-title" style="font-size: 1.15rem;">Nhập thông tin</h3>
            <button type="button" class="modal-close" id="admin-prompt-close">&times;</button>
          </div>
          <div class="modal-body">
            <p id="admin-prompt-message" style="font-size: 0.92rem; color: var(--text-secondary); margin-bottom: 0.85rem; line-height: 1.5;"></p>
            <textarea id="admin-prompt-input" class="form-control" rows="3"></textarea>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-outline" id="admin-prompt-cancel">Hủy</button>
            <button type="button" class="btn btn-primary" id="admin-prompt-ok">Xác nhận</button>
          </div>
        </div>
      `;
      document.body.appendChild(dialog);
    }

    const titleEl = document.getElementById('admin-prompt-title');
    const msgEl = document.getElementById('admin-prompt-message');
    const inputEl = document.getElementById('admin-prompt-input');
    const okBtn = document.getElementById('admin-prompt-ok');
    const cancelBtn = document.getElementById('admin-prompt-cancel');
    const closeBtn = document.getElementById('admin-prompt-close');

    titleEl.textContent = title;
    msgEl.innerHTML = message.replace(/\n/g, '<br>');
    inputEl.value = defaultValue;

    const cleanup = (result) => {
      dialog.classList.add('hidden');
      okBtn.onclick = null;
      cancelBtn.onclick = null;
      closeBtn.onclick = null;
      resolve(result);
    };

    okBtn.onclick = () => cleanup(inputEl.value);
    cancelBtn.onclick = () => cleanup(null);
    closeBtn.onclick = () => cleanup(null);

    dialog.classList.remove('hidden');
    setTimeout(() => inputEl.focus(), 50);
  });
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.add('hidden');
}

// ======================== 1. DASHBOARD ========================

function setDashboardPeriod(thang, nam) {
  const monthInput = document.getElementById('input-thang');
  const yearInput = document.getElementById('input-nam');
  if (monthInput) monthInput.value = thang;
  if (yearInput) yearInput.value = nam;
  loadDashboard();
}

function renderDashboardRevenueChart(nam, currentMonth, monthlyRevenues, totalYear, monthsData = []) {
  const chartContainer = document.getElementById('revenue-bar-chart');
  if (!chartContainer) return;

  const peakRevenue = Math.max(...monthlyRevenues, 0);
  const peakMonthIndex = monthlyRevenues.indexOf(peakRevenue);

  // Thang đo trục Y linh hoạt theo doanh thu thực tế
  let scaleCeiling = 500000;
  if (peakRevenue > 0) {
    if (peakRevenue <= 100000) scaleCeiling = 100000;
    else if (peakRevenue <= 200000) scaleCeiling = 200000;
    else if (peakRevenue <= 500000) scaleCeiling = 500000;
    else if (peakRevenue <= 1000000) scaleCeiling = 1000000;
    else {
      const mag = Math.pow(10, Math.floor(Math.log10(peakRevenue)));
      scaleCeiling = Math.ceil(peakRevenue / mag) * mag;
    }
  }

  // Cập nhật các mốc trục Y
  const tick4 = document.getElementById('y-tick-4');
  const tick3 = document.getElementById('y-tick-3');
  const tick2 = document.getElementById('y-tick-2');
  const tick1 = document.getElementById('y-tick-1');
  const tick0 = document.getElementById('y-tick-0');

  if (tick4) tick4.textContent = formatTien(scaleCeiling);
  if (tick3) tick3.textContent = formatTien(Math.round(scaleCeiling * 0.75));
  if (tick2) tick2.textContent = formatTien(Math.round(scaleCeiling * 0.50));
  if (tick1) tick1.textContent = formatTien(Math.round(scaleCeiling * 0.25));
  if (tick0) tick0.textContent = '0 đ';

  // Cập nhật thanh tóm tắt nhanh trên biểu đồ
  const summaryMonth = document.getElementById('chart-summary-selected-month');
  const summaryPeak = document.getElementById('chart-summary-peak-revenue');
  const summaryAvg = document.getElementById('chart-summary-avg-revenue');

  const selectedRev = monthlyRevenues[currentMonth - 1] || 0;
  const curMData = (monthsData && monthsData[currentMonth - 1]) ? monthsData[currentMonth - 1] : null;
  const curSvcRev = curMData ? (curMData.doanhThuDichVu || 0) : 0;
  const curQuaGioRev = curMData ? (curMData.doanhThuQuaGio || 0) : 0;
  const curPhatHuyRev = curMData ? (curMData.doanhThuPhatHuy || 0) : 0;
  if (summaryMonth) {
    const extraParts = [];
    if (curPhatHuyRev > 0) extraParts.push(`Phí hủy: ${formatTien(curPhatHuyRev)}`);
    if (curQuaGioRev > 0) extraParts.push(`Quá giờ: ${formatTien(curQuaGioRev)}`);
    if (curSvcRev > 0) extraParts.push(`DV: ${formatTien(curSvcRev)}`);
    if (extraParts.length > 0) {
      summaryMonth.textContent = `Tháng ${currentMonth}/${nam}: ${formatTien(selectedRev)} (${extraParts.join(' | ')})`;
    } else {
      summaryMonth.textContent = `Tháng ${currentMonth}/${nam}: ${formatTien(selectedRev)}`;
    }
  }
  if (summaryPeak) {
    if (peakRevenue > 0) {
      summaryPeak.textContent = `Tháng ${peakMonthIndex + 1} (${formatTien(peakRevenue)})`;
    } else {
      summaryPeak.textContent = '0 đ';
    }
  }
  if (summaryAvg) {
    const avg = Math.round(totalYear / 12);
    summaryAvg.textContent = `${formatTien(avg)}/tháng`;
  }

  // Render 12 cột tương ứng 12 tháng
  const barsHtml = [];
  for (let m = 1; m <= 12; m++) {
    const rev = monthlyRevenues[m - 1] || 0;
    const isCurrent = (m === currentMonth);
    let pct = 4;
    if (scaleCeiling > 0 && rev > 0) {
      pct = Math.min(95, Math.max(8, Math.round((rev / scaleCeiling) * 92)));
    }

    const activeClass = isCurrent ? 'active-month' : 'inactive-month';
    const labelClass = isCurrent ? 'active-label' : '';

    const mData = (monthsData && monthsData[m - 1]) ? monthsData[m - 1] : null;
    const courtRev = mData ? (mData.doanhThuSan || 0) : 0;
    const svcRev = mData ? (mData.doanhThuDichVu || 0) : 0;
    const quaGioRev = mData ? (mData.doanhThuQuaGio || 0) : 0;
    const phatHuyRev = mData ? (mData.doanhThuPhatHuy || 0) : 0;

    let tooltipText = `Tháng ${m}/${nam}: ${formatTien(rev)}`;
    if (svcRev > 0 || quaGioRev > 0 || phatHuyRev > 0) {
      tooltipText += ` (Sân: ${formatTien(courtRev)}`;
      if (phatHuyRev > 0) tooltipText += ` [Phí hủy: ${formatTien(phatHuyRev)}]`;
      if (quaGioRev > 0) tooltipText += ` [Quá giờ: ${formatTien(quaGioRev)}]`;
      if (svcRev > 0) tooltipText += ` | Dịch vụ: ${formatTien(svcRev)}`;
      tooltipText += `)`;
    }

    barsHtml.push(`
      <div class="chart-bar-item" onclick="setDashboardPeriod(${m}, ${nam})" style="cursor: pointer;" title="Xem thống kê Tháng ${m}/${nam}">
        <div class="chart-bar-fill ${activeClass}" style="height: ${pct}%;" data-tooltip="${tooltipText}"></div>
        <span class="chart-bar-label ${labelClass}">T${m}</span>
      </div>
    `);
  }
  chartContainer.innerHTML = barsHtml.join('');
}

function renderPaymentBreakdown(bookings) {
  const container = document.getElementById('payment-breakdown-container');
  if (!container) return;

  if (!bookings || bookings.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 2rem; color: var(--text-muted); font-size: 0.88rem;">
        Chưa có đơn đặt sân nào để phân tích thanh toán.
      </div>
    `;
    return;
  }

  let qrCount = 0;
  let qrAmount = 0;
  let cashCount = 0;
  let cashAmount = 0;
  let otherCount = 0;
  let otherAmount = 0;

  bookings.forEach(b => {
    // Chỉ tính các đơn đã thanh toán
    if (b.trangThaiThanhToan !== 'DaThanhToan') return;

    let amount = Number(b.tongTien || (Number(b.tienSan || b.soTien || 0) + Number(b.tienQuaGio || 0)));

    // Nếu đơn đã hủy: chỉ tính phần tiền cơ sở thực tế giữ lại (phí hủy đơn theo chính sách)
    if (b.trangThaiDat === 'DaHuy') {
      const soTienHoan = b.thongTinHoanTien ? Number(b.thongTinHoanTien.soTienHoan || 0) : Number(b.tienSan || b.soTien || 0);
      const tienGoc = Number(b.tienSan || b.soTien || 0);
      amount = Math.max(0, tienGoc - soTienHoan);
      if (amount <= 0) return; // Nếu hoàn 100% thì không cộng vào phân bổ doanh thu
    }

    const pttt = (b.phuongThucThanhToan || '').trim();
    if (pttt === 'QR' || pttt === 'VietQR') {
      qrCount++;
      qrAmount += amount;
    } else if (pttt === 'TienMat' || !pttt) {
      cashCount++;
      cashAmount += amount;
    } else {
      otherCount++;
      otherAmount += amount;
    }
  });

  const totalOrders = qrCount + cashCount + otherCount;
  const qrPct = totalOrders > 0 ? Math.round((qrCount / totalOrders) * 100) : 0;
  const cashPct = totalOrders > 0 ? Math.round((cashCount / totalOrders) * 100) : 0;
  const otherPct = totalOrders > 0 ? (100 - qrPct - cashPct) : 0;

  let html = `
    <div class="breakdown-list">
      <div class="breakdown-item">
        <div class="breakdown-row">
          <div class="breakdown-name">
            <span class="badge badge-info" style="font-size: 0.72rem; padding: 2px 6px;">VietQR</span>
            <span>Chuyển khoản QR tự động</span>
          </div>
          <div class="breakdown-metrics">
            <span class="breakdown-amount">${formatTien(qrAmount)}</span>
            <span class="breakdown-pct">${qrCount} đơn (${qrPct}%)</span>
          </div>
        </div>
        <div class="breakdown-bar-track">
          <div class="breakdown-bar-fill" style="width: ${qrPct}%; background: linear-gradient(90deg, #10b981 0%, #059669 100%);"></div>
        </div>
      </div>

      <div class="breakdown-item">
        <div class="breakdown-row">
          <div class="breakdown-name">
            <span class="badge badge-secondary" style="font-size: 0.72rem; padding: 2px 6px;">Tiền mặt</span>
            <span>Thu ngân tại quầy trực tiếp</span>
          </div>
          <div class="breakdown-metrics">
            <span class="breakdown-amount">${formatTien(cashAmount)}</span>
            <span class="breakdown-pct">${cashCount} đơn (${cashPct}%)</span>
          </div>
        </div>
        <div class="breakdown-bar-track">
          <div class="breakdown-bar-fill" style="width: ${cashPct}%; background: linear-gradient(90deg, #3b82f6 0%, #1d4ed8 100%);"></div>
        </div>
      </div>
  `;

  if (otherCount > 0) {
    html += `
      <div class="breakdown-item">
        <div class="breakdown-row">
          <div class="breakdown-name">
            <span class="badge badge-orange" style="font-size: 0.72rem; padding: 2px 6px;">Ví / Khác</span>
            <span>Cổng thanh toán điện tử</span>
          </div>
          <div class="breakdown-metrics">
            <span class="breakdown-amount">${formatTien(otherAmount)}</span>
            <span class="breakdown-pct">${otherCount} đơn (${otherPct}%)</span>
          </div>
        </div>
        <div class="breakdown-bar-track">
          <div class="breakdown-bar-fill" style="width: ${otherPct}%; background: linear-gradient(90deg, #f59e0b 0%, #d97706 100%);"></div>
        </div>
      </div>
    `;
  }

  html += `</div>`;
  container.innerHTML = html;
}

function renderVenueRevenueReport(locations) {
  const container = document.getElementById('venue-revenue-report-container');
  if (!container) return;

  if (!locations || locations.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 2.5rem; color: var(--text-muted); font-size: 0.9rem;">
        Chưa có số liệu doanh thu theo cơ sở trong kỳ thống kê này.
      </div>
    `;
    return;
  }

  // Sắp xếp doanh thu từ cao xuống thấp
  const sorted = [...locations].sort((a, b) => (b.tongDoanhThu || 0) - (a.tongDoanhThu || 0));
  const maxRevenue = Math.max(...sorted.map(l => l.tongDoanhThu || 0), 1);
  const grandTotal = sorted.reduce((sum, l) => sum + (l.tongDoanhThu || 0), 0);

  // Biểu đồ cột so sánh trực quan
  const barsHtml = sorted.map(loc => {
    const rev = loc.tongDoanhThu || 0;
    const pct = Math.max(8, Math.min(100, Math.round((rev / maxRevenue) * 100)));
    const tooltip = `${loc.tenDiaDiem}: ${formatTien(rev)} (Sân: ${formatTien(loc.doanhThuSan || 0)} | Dịch vụ: ${formatTien(loc.doanhThuDichVu || 0)})`;

    return `
      <div class="venue-revenue-bar-item" title="${tooltip}">
        <div class="venue-bar-pillar" style="height: ${pct}%;" data-tooltip="${tooltip}"></div>
        <span class="venue-bar-label" title="${loc.tenDiaDiem}">${loc.tenDiaDiem}</span>
        <span style="font-size: 0.78rem; font-weight: 700; color: #047857; margin-top: 3px;">${formatTien(rev)}</span>
      </div>
    `;
  }).join('');

  // Bảng chi tiết bên dưới
  const tableRowsHtml = sorted.map((loc, idx) => {
    const rev = loc.tongDoanhThu || 0;
    const share = loc.tyTrongDoanhThu != null ? loc.tyTrongDoanhThu : (grandTotal > 0 ? ((rev / grandTotal) * 100).toFixed(1) : 0);

    return `
      <tr>
        <td>
          <div style="display: flex; align-items: center; gap: 0.65rem;">
            <span style="width: 22px; height: 22px; border-radius: 50%; background: #f1f5f9; display: inline-flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 700; color: var(--text-muted);">
              ${idx + 1}
            </span>
            <div>
              <strong style="color: var(--text-main); font-size: 0.92rem;">${loc.tenDiaDiem}</strong>
              ${loc.diaChi ? `<br><small style="color: var(--text-muted); font-size: 0.78rem;">${loc.diaChi}</small>` : ''}
            </div>
          </div>
        </td>
        <td>
          <strong style="color: #047857; font-size: 0.95rem;">${formatTien(rev)}</strong>
        </td>
        <td style="min-width: 140px;">
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <div class="breakdown-bar-track" style="flex: 1; height: 7px;">
              <div class="breakdown-bar-fill" style="width: ${share}%; background: linear-gradient(90deg, #10b981 0%, #047857 100%);"></div>
            </div>
            <span style="font-size: 0.8rem; font-weight: 700; color: var(--text-secondary); width: 45px; text-align: right;">${share}%</span>
          </div>
        </td>
        <td style="text-align: center;"><strong>${loc.soDonTong || 0}</strong></td>
        <td style="text-align: center;">
          <span class="badge badge-success" style="font-size: 0.75rem; padding: 2px 7px;">${loc.soDonHoanThanh || 0}</span>
        </td>
        <td style="text-align: center;">
          ${(loc.soDonHuy || 0) > 0 ? `<span class="badge badge-danger" style="font-size: 0.75rem; padding: 2px 7px;">${loc.soDonHuy}</span>` : `<span style="color: var(--text-muted);">-</span>`}
        </td>
        <td style="font-size: 0.8rem; color: var(--text-muted);">
          Sân: <strong style="color: #047857;">${formatTien(loc.doanhThuSan || 0)}</strong><br>
          DV: <strong style="color: #d97706;">${formatTien(loc.doanhThuDichVu || 0)}</strong>
        </td>
      </tr>
    `;
  }).join('');

  container.innerHTML = `
    <div class="venue-revenue-chart-bars">
      ${barsHtml}
    </div>
    <div class="table-responsive">
      <table class="venue-revenue-table">
        <thead>
          <tr>
            <th>Cơ sở / Địa điểm</th>
            <th>Tổng Doanh thu</th>
            <th>Tỷ trọng</th>
            <th style="text-align: center;">Tổng đơn</th>
            <th style="text-align: center;">Hoàn thành</th>
            <th style="text-align: center;">Hủy / Quá hạn</th>
            <th>Phân bổ nguồn thu</th>
          </tr>
        </thead>
        <tbody>
          ${tableRowsHtml}
        </tbody>
      </table>
    </div>
  `;
}

function renderVenueCapacity(courts) {
  const container = document.getElementById('venue-capacity-container');
  const statCapacity = document.getElementById('stat-court-capacity');
  const statDesc = document.getElementById('stat-court-desc');

  if (!courts || courts.length === 0) {
    if (container) {
      container.innerHTML = `
        <div style="text-align: center; padding: 2rem; color: var(--text-muted); font-size: 0.88rem;">
          Chưa có cơ sở sân bãi nào trong hệ thống.
        </div>
      `;
    }
    if (statCapacity) statCapacity.textContent = '0 / 0 Sân';
    if (statDesc) statDesc.innerHTML = 'Chưa thiết lập cơ sở';
    return;
  }

  let totalCourtsAll = 0;
  let activeCourtsAll = 0;
  let maintCourtsAll = 0;

  const venueItemsHtml = courts.map(dd => {
    const list = dd.danhSachSan || [];
    const countTotal = list.length;
    const countActive = list.filter(s => s.tinhTrang === 'HoatDong').length;
    const countMaint = list.filter(s => s.tinhTrang === 'BaoTri' || s.tinhTrang === 'TamNgung').length;

    totalCourtsAll += countTotal;
    activeCourtsAll += countActive;
    maintCourtsAll += countMaint;

    const pct = countTotal > 0 ? Math.round((countActive / countTotal) * 100) : 0;
    const isAllActive = (countActive === countTotal && countTotal > 0);
    const badgeHtml = isAllActive 
      ? `<span class="badge badge-success">${countActive}/${countTotal} Sân hoạt động</span>`
      : `<span class="badge badge-warning">${countActive}/${countTotal} Sân (${countMaint} bảo trì)</span>`;

    return `
      <div class="venue-glance-item">
        <div class="venue-glance-info">
          <div class="venue-glance-name">${dd.tenDiaDiem}</div>
          <div class="venue-glance-sub">
            Mở cửa: ${formatGio(dd.gioMo || '06:00')} - ${formatGio(dd.gioDong || '22:00')}
            ${dd.mapLink ? `&bull; <a href="${dd.mapLink}" target="_blank" style="color: var(--primary); text-decoration: none;">Bản đồ ↗</a>` : ''}
          </div>
        </div>
        <div style="text-align: right; display: flex; flex-direction: column; align-items: flex-end; gap: 0.35rem;">
          ${badgeHtml}
          <div class="breakdown-bar-track" style="width: 110px; height: 6px;">
            <div class="breakdown-bar-fill" style="width: ${pct}%; background: ${isAllActive ? '#10b981' : '#f59e0b'};"></div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  if (container) {
    container.innerHTML = venueItemsHtml;
  }

  if (statCapacity) {
    statCapacity.textContent = `${activeCourtsAll} / ${totalCourtsAll} Sân`;
  }
  if (statDesc) {
    if (maintCourtsAll === 0) {
      statDesc.innerHTML = `<span class="topbar-pulse-dot" style="display:inline-block; width:8px; height:8px; background:#10b981; border-radius:50%; margin-right:4px;"></span> 100% sân sẵn sàng phục vụ khách`;
    } else {
      statDesc.innerHTML = `<span class="topbar-pulse-dot" style="display:inline-block; width:8px; height:8px; background:#f59e0b; border-radius:50%; margin-right:4px;"></span> ${maintCourtsAll} sân đang bảo trì / tạm dừng`;
    }
  }
}

function renderRecentBookings(bookings) {
  const tbody = document.getElementById('recent-bookings-table-body');
  if (!tbody) return;

  if (!bookings || bookings.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align:center; padding: 2.5rem; color: var(--text-muted);">
          Chưa có đơn đặt sân nào trong hệ thống.
        </td>
      </tr>
    `;
    return;
  }

  const recent = [...bookings].sort((a, b) => (b.maDatSan || 0) - (a.maDatSan || 0)).slice(0, 5);

  tbody.innerHTML = recent.map(b => {
    const khachHangDisplay = b.hoTenKhachHang
      ? `<strong>${b.hoTenKhachHang}</strong><br><span style="color: var(--text-muted); font-size: 0.8rem;">${b.sdtKhachHang || ''}</span>`
      : `<span style="color: var(--text-muted);">Khách vãng lai</span>`;

    const totalMoney = Number(b.tienSan || b.soTien || 0) + Number(b.tienQuaGio || 0);

    return `
      <tr>
        <td><strong>#${b.maDatSan}</strong></td>
        <td>${khachHangDisplay}</td>
        <td>
          <span style="font-weight: 600; color: var(--text-main);">${b.tenDiaDiem || 'N/A'}</span><br>
          <span class="badge badge-secondary" style="font-size:0.75rem;">${b.tenSan || 'N/A'}</span>
        </td>
        <td>
          ${formatNgay(b.ngayChoi)}<br>
          <small style="color:var(--text-muted); font-weight:600;">${formatGio(b.gioBatDau)} - ${formatGio(b.gioKetThuc)}</small>
        </td>
        <td>
          <strong style="color: var(--primary-dark);">${formatTien(totalMoney)}</strong>
          ${b.tienQuaGio > 0 ? `<br><small style="color:#b45309; font-weight:600;">+${formatTien(b.tienQuaGio)} quá giờ</small>` : ''}
        </td>
        <td>
          ${renderPaymentBadge(b.phuongThucThanhToan)}<br>
          <small>${badgeTrangThai(b.trangThaiThanhToan)}</small>
        </td>
        <td>${badgeTrangThai(b.trangThaiDat)}</td>
        <td style="text-align: right;">
          <a href="/pages/admin/bookings.html" class="btn btn-sm btn-outline" title="Xem chi tiết tại trang quản lý">
            Chi tiết ↗
          </a>
        </td>
      </tr>
    `;
  }).join('');
}

async function loadDashboard() {
  const monthInput = document.getElementById('input-thang');
  const yearInput = document.getElementById('input-nam');
  const totalRevenueEl = document.getElementById('stat-total-revenue');
  const totalBookingsEl = document.getElementById('stat-total-bookings');
  const yearRevenueEl = document.getElementById('stat-year-revenue');
  const serviceRevenueEl = document.getElementById('stat-service-revenue');
  const courtRevenueEl = document.getElementById('stat-court-revenue');
  const serviceSubrevenueEl = document.getElementById('stat-service-subrevenue');
  const yearCourtRevenueEl = document.getElementById('stat-year-court-revenue');
  const yearServiceRevenueEl = document.getElementById('stat-year-service-revenue');

  const now = new Date();
  const thang = monthInput && monthInput.value ? parseInt(monthInput.value) : (now.getMonth() + 1);
  const nam = yearInput && yearInput.value ? parseInt(yearInput.value) : now.getFullYear();

  if (monthInput && !monthInput.value) monthInput.value = thang;
  if (yearInput && !yearInput.value) yearInput.value = nam;

  try {
    const [monthData, yearData, courts, bookings, locationRevenues] = await Promise.all([
      api.get('/admin/revenue/month', { nam, thang }).catch(() => ({ nam, thang, tongDoanhThu: 0, doanhThuSan: 0, doanhThuDichVu: 0, doanhThuQuaGio: 0, doanhThuPhatHuy: 0, soDon: 0 })),
      api.get('/admin/revenue/year', { nam }).catch(() => ({ nam, tongDoanhThu: 0, doanhThuSan: 0, doanhThuDichVu: 0, doanhThuQuaGio: 0, doanhThuPhatHuy: 0, soDon: 0 })),
      api.get('/admin/courts').catch(() => []),
      api.get('/admin/bookings').catch(() => []),
      api.get('/admin/revenue/by-location', { nam, thang }).catch(() => [])
    ]);

    const tongThang = monthData ? (monthData.tongDoanhThu || 0) : 0;
    const sanThang = monthData ? (monthData.doanhThuSan || 0) : 0;
    const dvThang = monthData ? (monthData.doanhThuDichVu || 0) : 0;
    const quaGioThang = monthData ? (monthData.doanhThuQuaGio || 0) : 0;
    const phatHuyThang = monthData ? (monthData.doanhThuPhatHuy || 0) : 0;

    const tongNam = yearData ? (yearData.tongDoanhThu || 0) : 0;
    const sanNam = yearData ? (yearData.doanhThuSan || 0) : 0;
    const dvNam = yearData ? (yearData.doanhThuDichVu || 0) : 0;
    const quaGioNam = yearData ? (yearData.doanhThuQuaGio || 0) : 0;
    const phatHuyNam = yearData ? (yearData.doanhThuPhatHuy || 0) : 0;

    if (totalRevenueEl) totalRevenueEl.textContent = formatTien(tongThang);
    if (courtRevenueEl) courtRevenueEl.textContent = formatTien(sanThang);
    if (serviceSubrevenueEl) serviceSubrevenueEl.textContent = formatTien(dvThang);
    if (serviceRevenueEl) serviceRevenueEl.textContent = formatTien(dvThang);

    const overtimeContainer = document.getElementById('stat-overtime-container');
    const overtimeRevenueEl = document.getElementById('stat-overtime-revenue');
    if (overtimeContainer && overtimeRevenueEl) {
      if (quaGioThang > 0) {
        overtimeRevenueEl.textContent = formatTien(quaGioThang);
        overtimeContainer.style.display = 'inline-flex';
      } else {
        overtimeContainer.style.display = 'none';
      }
    }

    const cancellationContainer = document.getElementById('stat-cancellation-container');
    const cancellationRevenueEl = document.getElementById('stat-cancellation-revenue');
    if (cancellationContainer && cancellationRevenueEl) {
      if (phatHuyThang > 0) {
        cancellationRevenueEl.textContent = formatTien(phatHuyThang);
        cancellationContainer.style.display = 'inline-flex';
      } else {
        cancellationContainer.style.display = 'none';
      }
    }

    if (totalBookingsEl) totalBookingsEl.textContent = `${(monthData && monthData.soDon) ? monthData.soDon : 0} đơn`;
    if (yearRevenueEl) yearRevenueEl.textContent = formatTien(tongNam);
    if (yearCourtRevenueEl) yearCourtRevenueEl.textContent = formatTien(sanNam);
    if (yearServiceRevenueEl) yearServiceRevenueEl.textContent = formatTien(dvNam);

    const yearOvertimeContainer = document.getElementById('stat-year-overtime-container');
    const yearOvertimeRevenueEl = document.getElementById('stat-year-overtime-revenue');
    if (yearOvertimeContainer && yearOvertimeRevenueEl) {
      if (quaGioNam > 0) {
        yearOvertimeRevenueEl.textContent = formatTien(quaGioNam);
        yearOvertimeContainer.style.display = 'inline-flex';
      } else {
        yearOvertimeContainer.style.display = 'none';
      }
    }

    const yearCancellationContainer = document.getElementById('stat-year-cancellation-container');
    const yearCancellationRevenueEl = document.getElementById('stat-year-cancellation-revenue');
    if (yearCancellationContainer && yearCancellationRevenueEl) {
      if (phatHuyNam > 0) {
        yearCancellationRevenueEl.textContent = formatTien(phatHuyNam);
        yearCancellationContainer.style.display = 'inline-flex';
      } else {
        yearCancellationContainer.style.display = 'none';
      }
    }

    const monthPromises = Array.from({ length: 12 }, (_, i) => {
      const m = i + 1;
      if (m === thang) return Promise.resolve(monthData);
      return api.get('/admin/revenue/month', { nam, thang: m }).catch(() => ({ nam, thang: m, tongDoanhThu: 0, doanhThuSan: 0, doanhThuDichVu: 0, doanhThuQuaGio: 0, doanhThuPhatHuy: 0, soDon: 0 }));
    });
    const monthsData = await Promise.all(monthPromises);
    const monthlyRevenues = monthsData.map(d => (d && d.tongDoanhThu) ? d.tongDoanhThu : 0);

    renderDashboardRevenueChart(nam, thang, monthlyRevenues, tongNam, monthsData);
    renderVenueRevenueReport(locationRevenues);
    renderPaymentBreakdown(bookings);
    renderVenueCapacity(courts);
    renderRecentBookings(bookings);

  } catch (error) {
    showAlert(`Không thể tải dữ liệu thống kê: ${error.message}`, 'danger');
  }
}

// ======================== 2. QUẢN LÝ ĐẶT SÂN & NGHIỆP VỤ TẠI QUẦY (KỊCH BẢN 2) ========================

let currentLoadedBookings = [];
let activeBookingForServices = null;
let activeBookingForCheckout = null;
let currentVenueServices = [];

async function loadBookings() {
  const tableBody = document.getElementById('bookings-table-body');
  const statusFilter = document.getElementById('select-status-filter');
  const searchInput = document.getElementById('input-search-booking');

  const status = statusFilter ? statusFilter.value : '';
  const keyword = searchInput ? searchInput.value.trim() : '';

  if (!tableBody) return;
  tableBody.innerHTML = `<tr><td colspan="8" style="text-align:center;">Đang tải danh sách...</td></tr>`;

  try {
    const bookings = await api.get('/admin/bookings', { status, keyword });
    currentLoadedBookings = bookings || [];

    if (!bookings || bookings.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="8" style="text-align:center; color: var(--text-muted); padding: 2rem;">Không tìm thấy đơn đặt sân nào phù hợp.</td></tr>`;
      return;
    }

    tableBody.innerHTML = bookings.map(b => {
      const trangThaiDat = (b.trangThaiDat || '').trim();
      const pttt = (b.phuongThucThanhToan || '').trim();
      let actionButtons = '';

      // 1. Nếu đơn Tiền mặt chờ xác nhận
      if (trangThaiDat === 'ChoXacNhan' && pttt === 'TienMat') {
        actionButtons += `<button class="btn btn-sm btn-success" onclick="confirmCashBooking(${b.maDatSan})">Thu tiền mặt</button> `;
      }

      // 2. Kịch bản 2 - Bước 3: Check-in khi khách đến sân
      if (trangThaiDat === 'DaXacNhan' || (trangThaiDat === 'ChoXacNhan' && pttt === 'TienMat')) {
        actionButtons += `<button class="btn btn-sm btn-primary" onclick="checkInBooking(${b.maDatSan})">Check-in</button> `;
        actionButtons += `<button class="btn btn-sm btn-outline" style="color: var(--danger); border-color: var(--danger);" onclick="cancelNoShowBooking(${b.maDatSan})" title="Khách không đến nhận sân sau 30 phút">No-Show</button> `;
      }

      // 3. Kịch bản 2 - Bước 4 & 5: Đang chơi -> Thêm dịch vụ hoặc Check-out xuất hóa đơn
      if (trangThaiDat === 'DangChoi') {
        actionButtons += `<button class="btn btn-sm btn-outline-primary" onclick="openAddServiceModal(${b.maDatSan})">+ Dịch vụ</button> `;
        actionButtons += `<button class="btn btn-sm btn-warning" onclick="openCheckOutModal(${b.maDatSan})">Check-out</button> `;
      }

      // 4. Nút hủy đơn (nếu chưa hoàn thành hoặc chưa hủy)
      if (trangThaiDat === 'ChoXacNhan' || trangThaiDat === 'DaXacNhan') {
        actionButtons += `<button class="btn btn-sm btn-danger" onclick="openCancelBookingModal(${b.maDatSan})">Hủy</button> `;
      }

      // 5. Nếu đơn đang chờ duyệt hủy (ChoHuy) -> Cho phép Admin duyệt hoàn hoặc từ chối trực tiếp tại quầy
      if (trangThaiDat === 'ChoHuy') {
        const ht = b.thongTinHoanTien || {};
        const soTienHoan = ht.soTienHoan !== undefined ? ht.soTienHoan : (b.tienSan || b.soTien || 0);
        actionButtons += `<button class="btn btn-sm btn-success" onclick="approveCancelRequest(${b.maDatSan}, true, ${soTienHoan})" title="Duyệt hoàn tiền cho khách">Duyệt hoàn</button> `;
        actionButtons += `<button class="btn btn-sm btn-danger" onclick="approveCancelRequest(${b.maDatSan}, false)" title="Từ chối yêu cầu hủy">Từ chối</button> `;
      }

      // Luôn có nút xem chi tiết hóa đơn/lịch trình
      actionButtons += `<button class="btn btn-sm btn-outline" onclick="openBookingDetailModal(${b.maDatSan})" title="Xem chi tiết">Chi tiết</button>`;

      const khachHangDisplay = b.hoTenKhachHang 
        ? `<strong>${b.hoTenKhachHang}</strong><br><span style="color: var(--text-muted); font-size: 0.8rem;">${b.sdtKhachHang || ''}</span>`
        : `<span style="color: var(--text-muted);">Khách vãng lai</span>`;

      return `
        <tr>
          <td><strong>#${b.maDatSan}</strong></td>
          <td>${khachHangDisplay}</td>
          <td>${b.tenDiaDiem || 'N/A'}<br><span class="badge badge-secondary" style="font-size:0.75rem;">${b.tenSan || 'N/A'}</span></td>
          <td>${formatNgay(b.ngayChoi)}<br><small style="color:var(--text-muted); font-weight:600;">${formatGio(b.gioBatDau)} - ${formatGio(b.gioKetThuc)}</small></td>
          <td>
            <strong>${formatTien(Number(b.tienSan || b.soTien || 0) + Number(b.tienQuaGio || 0))}</strong>
            ${b.tienQuaGio > 0 ? `<br><small style="color:#b45309; font-weight:600;">(Gốc: ${formatTien(b.tienSan || b.soTien)} + Quá giờ: ${formatTien(b.tienQuaGio)})</small>` : ''}
          </td>
          <td>
            ${renderPaymentBadge(b.phuongThucThanhToan)}<br>
            <small>${badgeTrangThai(b.trangThaiThanhToan)}</small>
          </td>
          <td>
            ${badgeTrangThai(b.trangThaiDat)}
            ${b.trangThaiDat === 'ChoHuy' ? `<br><a href="/pages/admin/cancel-requests.html" style="font-size:0.75rem; color:#d97706; text-decoration:underline; font-weight:600; display:inline-block; margin-top:2px;">Xem hang doi huy & hoan -></a>` : ''}
            ${b.lyDoHuy ? `<br><small style="color:var(--danger); line-height:1.2; display:inline-block; margin-top:2px;">Lý do: ${formatLyDoHuy(b.lyDoHuy)}</small>` : ''}
          </td>
          <td>${actionButtons}</td>
        </tr>
      `;
    }).join('');
  } catch (error) {
    tableBody.innerHTML = `<tr><td colspan="8" style="text-align:center; color: var(--danger);">Lỗi tải dữ liệu: ${error.message}</td></tr>`;
  }
}

function renderPaymentBadge(pttt) {
  if (pttt === 'QR' || pttt === 'VietQR') return '<span class="badge badge-info">VietQR</span>';
  if (pttt === 'VNPay') return '<span class="badge badge-primary">VNPay</span>';
  if (pttt === 'MoMo') return '<span class="badge badge-orange">MoMo</span>';
  return '<span class="badge badge-secondary">Tiền mặt</span>';
}

// ----------------- Thao tác Check-in -----------------
async function checkInBooking(maDatSan) {
  const confirmed = await showConfirmDialog('Check-in nhận sân', `Xác nhận Check-in cho đơn #${maDatSan}?\nKhách sẽ vào sân bắt đầu tính thời gian chơi thực tế.`);
  if (!confirmed) return;

  try {
    await api.put(`/admin/bookings/${maDatSan}/check-in`);
    showAlert(`Check-in thành công cho đơn #${maDatSan}! Trạng thái chuyển sang Đang chơi.`, 'success');
    loadBookings();
  } catch (error) {
    showAlert(`Lỗi Check-in: ${error.message}`, 'danger');
  }
}

// ----------------- Thao tác Thêm Dịch Vụ -----------------
async function openAddServiceModal(maDatSan) {
  try {
    const booking = await api.get(`/admin/bookings/${maDatSan}`);
    activeBookingForServices = booking;

    document.getElementById('service-booking-id').textContent = booking.maDatSan;
    document.getElementById('service-booking-display').textContent = `#${booking.maDatSan}`;
    document.getElementById('service-booking-id-val').value = booking.maDatSan;
    document.getElementById('service-court-name').textContent = `${booking.tenSan} (${booking.tenDiaDiem || 'Cơ sở'})`;
    document.getElementById('input-service-quantity').value = 1;
    document.getElementById('input-service-note').value = '';

    // Render danh sách dịch vụ đã dùng
    renderAlreadyUsedServices(booking.danhSachDichVu || []);

    // 1. Fetch danh sách dịch vụ của riêng cơ sở này (dựa trên maDiaDiem của đơn đặt sân)
    const maDiaDiem = booking.maDiaDiem;
    const allServices = await api.get('/admin/services', maDiaDiem ? { maDiaDiem } : {});

    // 2. Lọc: Đúng cơ sở, trạng thái Hoạt động, và ẨN HOÀN TOÀN DỊCH VỤ HẾT HÀNG (tồn <= 0)
    currentVenueServices = (allServices || []).filter(s => {
      const isHoatDong = s.trangThai === 'HoatDong';
      const isSameVenue = !maDiaDiem || s.maDiaDiem === maDiaDiem;
      const hasStock = (s.soLuongTon || 0) > 0;
      return isHoatDong && isSameVenue && hasStock;
    });

    const selectEl = document.getElementById('select-service-item');
    if (currentVenueServices.length === 0) {
      selectEl.innerHTML = `<option value="">-- Cơ sở "${booking.tenDiaDiem || ''}" hiện không có dịch vụ nào còn hàng --</option>`;
    } else {
      selectEl.innerHTML = `<option value="">-- Chọn dịch vụ tại ${booking.tenDiaDiem || 'cơ sở'} --</option>` +
        currentVenueServices.map(s => {
          const isLowStock = s.soLuongTon < 10;
          const lowStockTag = isLowStock ? ` [Sắp hết: Còn ${s.soLuongTon}]` : ` (Còn ${s.soLuongTon})`;
          return `
            <option value="${s.maDV}" data-price="${s.donGia}" data-stock="${s.soLuongTon}" data-lowstock="${isLowStock}">
              ${s.tenDV} (${s.loaiDV === 'ChoThue' ? 'Thuê' : 'Bán'}) — ${formatTien(s.donGia)}${lowStockTag}
            </option>
          `;
        }).join('');
    }

    const stockInfo = document.getElementById('service-stock-info');
    if (stockInfo) stockInfo.innerHTML = '';

    calculateServiceSubtotal();
    document.getElementById('modal-add-service').classList.remove('hidden');
  } catch (error) {
    showAlert(`Không thể mở modal dịch vụ: ${error.message}`, 'danger');
  }
}

function renderAlreadyUsedServices(list) {
  const container = document.getElementById('service-already-used-list');
  if (!container) return;

  if (!list || list.length === 0) {
    container.innerHTML = `<span style="color: var(--text-muted); font-style: italic;">Chưa có dịch vụ phát sinh nào trong ca chơi này.</span>`;
    return;
  }

  let totalDV = 0;
  const itemsHtml = list.map(item => {
    totalDV += (item.thanhTien || 0);
    return `
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.35rem 0; border-bottom: 1px dashed #e2e8f0;">
        <div>
          <strong>${item.tenDV}</strong> x <strong>${item.soLuong}</strong>
          ${item.ghiChu ? `<small style="color:var(--text-muted);"> (${item.ghiChu})</small>` : ''}
        </div>
        <div>
          <span style="font-weight: 700; color: var(--primary-dark); margin-right: 0.5rem;">${formatTien(item.thanhTien)}</span>
          <button type="button" class="btn btn-sm btn-outline" style="color:var(--danger); border-color:var(--danger); padding:0.1rem 0.4rem; font-size:0.75rem;" onclick="removeServiceFromBooking(${item.maCTDV})" title="Xóa món này (trả kho)">&times;</button>
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML = itemsHtml + `
    <div style="text-align: right; padding-top: 0.4rem; font-weight: 700; color: var(--dark);">
      Tổng tiền dịch vụ: <span style="color: var(--primary-dark);">${formatTien(totalDV)}</span>
    </div>
  `;
}

function handleSelectServiceChange() {
  const select = document.getElementById('select-service-item');
  const qtyInput = document.getElementById('input-service-quantity');
  const stockInfo = document.getElementById('service-stock-info');

  if (select && select.selectedIndex > 0) {
    const selectedOpt = select.options[select.selectedIndex];
    const stock = parseInt(selectedOpt.dataset.stock) || 0;
    const isLowStock = selectedOpt.dataset.lowstock === 'true';

    if (qtyInput) {
      qtyInput.max = stock;
      if (parseInt(qtyInput.value) > stock) {
        qtyInput.value = stock > 0 ? 1 : 0;
      }
    }

    if (stockInfo) {
      if (isLowStock) {
        stockInfo.innerHTML = `
          <div style="display: flex; align-items: center; gap: 6px; color: #b45309; background: #fef3c7; border: 1px solid #fde68a; padding: 4px 8px; border-radius: 4px; font-weight: 600;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
            <span>Sắp hết hàng: Kho cơ sở chỉ còn <strong>${stock}</strong> sản phẩm khả dụng</span>
          </div>
        `;
      } else {
        stockInfo.innerHTML = `
          <div style="display: flex; align-items: center; gap: 6px; color: #15803d; background: #dcfce7; border: 1px solid #bbf7d0; padding: 4px 8px; border-radius: 4px; font-weight: 600;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
            <span>Kho khả dụng: <strong>${stock}</strong> sản phẩm</span>
          </div>
        `;
      }
    }
  } else {
    if (stockInfo) stockInfo.innerHTML = '';
  }

  calculateServiceSubtotal();
}

function calculateServiceSubtotal() {
  const select = document.getElementById('select-service-item');
  const qtyInput = document.getElementById('input-service-quantity');
  const display = document.getElementById('display-service-subtotal');
  const btnSubmit = document.getElementById('btn-submit-service');

  if (!select || !qtyInput || !display) return;

  const selectedOpt = select.options[select.selectedIndex];
  const price = selectedOpt && selectedOpt.dataset.price ? parseFloat(selectedOpt.dataset.price) : 0;
  const stock = selectedOpt && selectedOpt.dataset.stock ? parseInt(selectedOpt.dataset.stock) : Infinity;
  const qty = parseInt(qtyInput.value) || 0;

  display.value = formatTien(price * qty);

  if (select.value && qty > stock) {
    display.value += ` (Vượt quá tồn: ${stock})`;
    if (btnSubmit) btnSubmit.disabled = true;
  } else {
    if (btnSubmit) btnSubmit.disabled = false;
  }
}

async function submitAddService(event) {
  if (event) event.preventDefault();

  const maDatSan = document.getElementById('service-booking-id-val').value;
  const select = document.getElementById('select-service-item');
  const maDV = select ? select.value : null;
  const soLuong = parseInt(document.getElementById('input-service-quantity').value) || 1;
  const ghiChu = (document.getElementById('input-service-note').value || '').trim() || null;

  if (!maDV) {
    showAlert('Vui lòng chọn một dịch vụ cần thêm!', 'warning');
    return;
  }

  const btn = document.getElementById('btn-submit-service');
  if (btn) btn.disabled = true;

  try {
    const updated = await api.post(`/admin/bookings/${maDatSan}/services`, {
      maDV: parseInt(maDV),
      soLuong,
      ghiChu
    });

    showAlert(`Đã thêm dịch vụ vào đơn #${maDatSan}!`, 'success');
    activeBookingForServices = updated;
    renderAlreadyUsedServices(updated.danhSachDichVu || []);

    // Reset form selection
    select.value = '';
    document.getElementById('input-service-quantity').value = 1;
    document.getElementById('input-service-note').value = '';
    const stockInfo = document.getElementById('service-stock-info');
    if (stockInfo) stockInfo.innerHTML = '';
    calculateServiceSubtotal();

    loadBookings();
  } catch (error) {
    showAlert(`Lỗi thêm dịch vụ: ${error.message}`, 'danger');
  } finally {
    if (btn) btn.disabled = false;
  }
}

async function removeServiceFromBooking(maCTDV) {
  if (!activeBookingForServices) return;
  const confirmed = await showConfirmDialog('Xóa dịch vụ', 'Xác nhận xóa dịch vụ này khỏi đơn? Số lượng sẽ được hoàn lại kho.', { danger: true, confirmText: 'Xác nhận xóa' });
  if (!confirmed) return;

  try {
    const updated = await api.delete(`/admin/bookings/${activeBookingForServices.maDatSan}/services/${maCTDV}`);
    showAlert('Đã xóa dịch vụ và hoàn trả tồn kho!', 'success');
    activeBookingForServices = updated;
    renderAlreadyUsedServices(updated.danhSachDichVu || []);
    loadBookings();
  } catch (error) {
    showAlert(`Lỗi xóa dịch vụ: ${error.message}`, 'danger');
  }
}

// ----------------- Thao tác Check-out & Lập Hóa Đơn -----------------
async function openCheckOutModal(maDatSan) {
  try {
    const booking = await api.get(`/admin/bookings/${maDatSan}`);
    activeBookingForCheckout = booking;

    document.getElementById('checkout-booking-id').textContent = booking.maDatSan;
    document.getElementById('checkout-booking-id-val').value = booking.maDatSan;
    document.getElementById('checkout-court-name').textContent = `${booking.tenSan} (${booking.tenDiaDiem})`;
    document.getElementById('checkout-customer-name').textContent = booking.hoTenKhachHang || 'Khách vãng lai';
    document.getElementById('checkout-checkin-time').textContent = booking.gioCheckIn ? formatGio(booking.gioCheckIn.substring(11, 16)) : formatGio(booking.gioBatDau);
    document.getElementById('checkout-scheduled-end').textContent = formatGio(booking.gioKetThuc);

    document.getElementById('input-overtime-blocks').value = booking.soBlockQuaGio || 0;

    recalculateInvoiceTotal();
    document.getElementById('modal-checkout-invoice').classList.remove('hidden');
  } catch (error) {
    showAlert(`Lỗi tải đơn check-out: ${error.message}`, 'danger');
  }
}

function recalculateInvoiceTotal() {
  if (!activeBookingForCheckout) return;

  const blocks = parseInt(document.getElementById('input-overtime-blocks').value) || 0;
  // Giá mỗi block 15p: Giá 30p * 2 / 4 = Giá 30p / 2 (mặc định 50k / 2 = 25k)
  const overtimeRate = 25000;
  const tienQuaGio = blocks * overtimeRate;

  // Tính tổng dịch vụ
  let tongTienDV = 0;
  if (activeBookingForCheckout.danhSachDichVu) {
    activeBookingForCheckout.danhSachDichVu.forEach(dv => {
      tongTienDV += (dv.thanhTien || 0);
    });
  }

  const tienSan = activeBookingForCheckout.tienSan || activeBookingForCheckout.soTien || 0;
  const tienTraTruoc = activeBookingForCheckout.tienTraTruoc || (activeBookingForCheckout.trangThaiThanhToan === 'DaThanhToan' ? tienSan : 0);

  // Công thức Báo cáo: ThanhTien = TongTienSan + TongTienDV + TienQuaGio - TienTraTruoc + TienHoanDuyet
  let thanhTien = tienSan + tongTienDV + tienQuaGio - tienTraTruoc;
  if (thanhTien < 0) thanhTien = 0;

  document.getElementById('inv-court-fee').textContent = formatTien(tienSan);
  document.getElementById('inv-service-fee').textContent = formatTien(tongTienDV);
  document.getElementById('inv-overtime-fee').textContent = `+ ${formatTien(tienQuaGio)} (${blocks} block 15p)`;
  document.getElementById('inv-prepaid-fee').textContent = `- ${formatTien(tienTraTruoc)}`;
  document.getElementById('inv-total-due').textContent = formatTien(thanhTien);

  // Ẩn/hiện phương thức thu nếu không phải thu thêm
  const payGroup = document.getElementById('group-payment-method');
  if (payGroup) {
    payGroup.style.display = thanhTien > 0 ? 'block' : 'none';
  }
}

async function submitCheckOutAndComplete(event) {
  if (event) event.preventDefault();

  if (!activeBookingForCheckout) return;
  const maDatSan = activeBookingForCheckout.maDatSan;
  const blocks = parseInt(document.getElementById('input-overtime-blocks').value) || 0;
  const selectedPayMethod = document.querySelector('input[name="checkoutPaymentMethod"]:checked');
  const phuongThuc = selectedPayMethod ? selectedPayMethod.value : 'TienMat';

  const btn = document.getElementById('btn-complete-checkout');
  if (btn) btn.disabled = true;

  try {
    // 1. Gọi Check-out để chốt quá giờ và lập hóa đơn
    await api.post(`/admin/bookings/${maDatSan}/checkout`, {
      soBlockQuaGio: blocks,
      phuongThucThanhToan: phuongThuc
    });

    // 2. Gọi Complete để thu tiền phát sinh (nếu có) và đóng đơn
    await api.post(`/admin/bookings/${maDatSan}/complete?phuongThuc=${phuongThuc}`);

    showAlert(`Đã Check-out & Hoàn tất hóa đơn cho đơn #${maDatSan}!`, 'success');
    closeModal('modal-checkout-invoice');
    loadBookings();
  } catch (error) {
    showAlert(`Lỗi check-out: ${error.message}`, 'danger');
  } finally {
    if (btn) btn.disabled = false;
  }
}

// ----------------- Thao tác Xem Chi Tiết Đơn / Hóa Đơn -----------------
async function openBookingDetailModal(maDatSan) {
  try {
    const b = await api.get(`/admin/bookings/${maDatSan}`);
    const body = document.getElementById('detail-modal-body');
    document.getElementById('detail-modal-title').textContent = `Chi tiết đơn đặt sân #${b.maDatSan}`;

    let serviceRows = '<p style="color:var(--text-muted); font-size:0.85rem;">Không có dịch vụ phát sinh</p>';
    if (b.danhSachDichVu && b.danhSachDichVu.length > 0) {
      serviceRows = `
        <table style="width:100%; font-size:0.85rem; border-collapse:collapse; margin-top:0.5rem;">
          <thead>
            <tr style="background:#f1f5f9; text-align:left;">
              <th style="padding:4px 8px;">Dịch vụ</th>
              <th style="padding:4px 8px;">Số lượng</th>
              <th style="padding:4px 8px;">Đơn giá</th>
              <th style="padding:4px 8px; text-align:right;">Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            ${b.danhSachDichVu.map(s => `
              <tr style="border-bottom:1px solid #e2e8f0;">
                <td style="padding:4px 8px;">${s.tenDV}</td>
                <td style="padding:4px 8px;">${s.soLuong}</td>
                <td style="padding:4px 8px;">${formatTien(s.donGia)}</td>
                <td style="padding:4px 8px; text-align:right; font-weight:600;">${formatTien(s.thanhTien)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    }

    let refundBlock = '';
    if (b.thongTinHoanTien) {
      let badgeHt = '';
      const st = b.thongTinHoanTien.trangThai;
      if (st === 'ChoDuyet') {
        badgeHt = '<span class="badge badge-warning" style="font-size:0.75rem;">Chờ Admin duyệt hoàn</span>';
      } else if (st === 'DaHoan') {
        badgeHt = '<span class="badge badge-success" style="font-size:0.75rem;">Đã hoàn tiền</span>';
      } else if (st === 'KhongHoan') {
        badgeHt = '<span class="badge badge-secondary" style="font-size:0.75rem;">Không hoàn tiền (0%)</span>';
      } else if (st === 'TuChoi') {
        badgeHt = '<span class="badge badge-danger" style="font-size:0.75rem;">Đã từ chối hủy</span>';
      } else {
        badgeHt = `<span class="badge badge-info" style="font-size:0.75rem;">${st || 'N/A'}</span>`;
      }

      const loaiHuyText = b.thongTinHoanTien.loaiHuy === 'KhachHuy' 
        ? 'Khách hàng tự hủy' 
        : (b.thongTinHoanTien.loaiHuy === 'CoSoHuy' ? 'Cơ sở hủy đột xuất' : (b.thongTinHoanTien.loaiHuy || 'N/A'));

      refundBlock = `
        <div style="background:#fef2f2; border:1px solid #fecaca; border-radius:var(--radius-sm); padding:0.75rem; margin-top:0.75rem;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.35rem;">
            <h4 style="color:#b91c1c; font-size:0.9rem; margin:0;">Thông tin yêu cầu hủy & hoàn tiền:</h4>
            ${badgeHt}
          </div>
          <div style="font-size:0.85rem; line-height:1.5;">
            <div><strong>Lý do:</strong> ${formatLyDoHuy(b.thongTinHoanTien.lyDo || b.lyDoHuy)}</div>
            <div><strong>Phân loại hủy:</strong> ${loaiHuyText} | <strong>Tỷ lệ hoàn:</strong> ${b.thongTinHoanTien.tyLeHoan}%</div>
            <div><strong>Số tiền hoàn:</strong> <strong style="color:#b91c1c; font-size:0.95rem;">${formatTien(b.thongTinHoanTien.soTienHoan)}</strong></div>
          </div>
        </div>
      `;
    }

    let detailActions = '';
    if (b.trangThaiDat === 'ChoHuy') {
      const soTienHoanModal = (b.thongTinHoanTien && b.thongTinHoanTien.soTienHoan !== undefined) 
        ? b.thongTinHoanTien.soTienHoan 
        : (b.tienSan || b.soTien || 0);
      detailActions = `
        <div style="margin-top:1rem; padding-top:0.75rem; border-top:1px solid var(--border); display:flex; justify-content:flex-end; gap:0.5rem; flex-wrap:wrap; background:#f8fafc; padding:0.75rem; border-radius:var(--radius-sm);">
          <button type="button" class="btn btn-success" onclick="closeModal('modal-booking-detail'); approveCancelRequest(${b.maDatSan}, true, ${soTienHoanModal})">
            Duyệt hoàn tiền (${formatTien(soTienHoanModal)})
          </button>
          <button type="button" class="btn btn-danger" onclick="closeModal('modal-booking-detail'); approveCancelRequest(${b.maDatSan}, false)">
            Từ chối yêu cầu hủy
          </button>
        </div>
      `;
    }

    let invoiceBlock = '';
    if (b.hoaDon) {
      const tongQuyetToan = Number(b.hoaDon.tongTienSan || 0) + Number(b.hoaDon.tongTienDV || 0) + Number(b.hoaDon.tienQuaGio || 0);
      invoiceBlock = `
        <div style="background:#f0fdf4; border:1px solid #bbf7d0; border-radius:var(--radius-sm); padding:0.75rem; margin-top:0.75rem;">
          <h4 style="color:#166534; font-size:0.9rem; margin-bottom:0.25rem;">Hóa đơn thanh toán (#${b.hoaDon.maHoaDon}):</h4>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.25rem; font-size:0.85rem;">
            <div>Tiền sân: <strong>${formatTien(b.hoaDon.tongTienSan)}</strong></div>
            <div>Tiền dịch vụ: <strong>${formatTien(b.hoaDon.tongTienDV)}</strong></div>
            <div>Tiền quá giờ: <strong>${formatTien(b.hoaDon.tienQuaGio)}</strong></div>
            <div>Đã thanh toán trước: <strong>${formatTien(b.hoaDon.tienTraTruoc)}</strong></div>
          </div>
          <div style="margin-top:0.4rem; padding-top:0.4rem; border-top:1px dashed #86efac; font-weight:700; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem;">
            <span>Khoản thu phát sinh: <span style="color:#15803d; font-size:1.05rem;">${formatTien(b.hoaDon.thanhTien)}</span> (${b.hoaDon.trangThai})</span>
            <span style="font-size:0.85rem; color:#166534;">Tổng quyết toán: <strong>${formatTien(tongQuyetToan)}</strong></span>
          </div>
        </div>
      `;
    }

    body.innerHTML = `
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem; margin-bottom:0.75rem;">
        <div>
          <p><strong>Khách hàng:</strong> ${b.hoTenKhachHang || 'N/A'}</p>
          <p><strong>Số điện thoại:</strong> ${b.sdtKhachHang || 'N/A'}</p>
          <p><strong>Địa điểm:</strong> ${b.tenDiaDiem || 'N/A'} - ${b.tenSan || 'N/A'}</p>
        </div>
        <div>
          <p><strong>Ngày chơi:</strong> ${formatNgay(b.ngayChoi)}</p>
          <p><strong>Khung giờ:</strong> ${formatGio(b.gioBatDau)} - ${formatGio(b.gioKetThuc)}</p>
          <p><strong>Trạng thái:</strong> ${badgeTrangThai(b.trangThaiDat)}</p>
          ${b.lyDoHuy ? `<p><strong>Lý do hủy:</strong> <span style="color:var(--danger)">${formatLyDoHuy(b.lyDoHuy)}</span></p>` : ''}
        </div>
      </div>

      <div style="background:#f8fafc; padding:0.75rem; border-radius:var(--radius-sm); font-size:0.85rem; margin-bottom:0.75rem;">
        <strong>Timeline ca chơi:</strong><br>
        • Tạo lúc: ${b.ngayTao ? b.ngayTao.replace('T', ' ').substring(0, 19) : 'N/A'}<br>
        • Check-in: ${b.gioCheckIn ? b.gioCheckIn.replace('T', ' ').substring(0, 19) : '<span style="color:var(--text-muted);">Chưa check-in</span>'}<br>
        • Check-out: ${b.gioCheckOut ? b.gioCheckOut.replace('T', ' ').substring(0, 19) : '<span style="color:var(--text-muted);">Chưa check-out</span>'}
      </div>

      <div>
        <h4 style="font-size:0.95rem; font-weight:700; margin-bottom:0.25rem;">Dịch vụ đã sử dụng:</h4>
        ${serviceRows}
      </div>

      ${invoiceBlock}
      ${refundBlock}
      ${detailActions}
    `;

    document.getElementById('modal-booking-detail').classList.remove('hidden');
  } catch (error) {
    showAlert(`Lỗi xem chi tiết: ${error.message}`, 'danger');
  }
}

// ----------------- Thao tác Khách không đến (No-Show) -----------------
async function cancelNoShowBooking(maDatSan) {
  const confirmed = await showConfirmDialog('Ghi nhận No-Show', `Xác nhận hủy đơn #${maDatSan} do khách không đến nhận sân sau 30 phút (No-Show)?\nTheo quy định: Khách không được hoàn tiền sân và hệ thống sẽ giải phóng sân.`, { danger: true, confirmText: 'Xác nhận No-Show' });
  if (!confirmed) return;

  try {
    await api.put(`/admin/bookings/${maDatSan}/no-show`);
    showAlert(`Đã ghi nhận No-Show cho đơn #${maDatSan}. Sân đã được giải phóng.`, 'success');
    loadBookings();
  } catch (error) {
    showAlert(`Lỗi: ${error.message}`, 'danger');
  }
}

async function confirmCashBooking(maDatSan) {
  const confirmed = await showConfirmDialog('Thu tiền mặt', `Xác nhận đã nhận đủ tiền mặt cho đơn #${maDatSan}?`);
  if (!confirmed) return;

  try {
    await api.put(`/admin/bookings/${maDatSan}/confirm-cash`);
    showAlert(`Đã xác nhận thanh toán tiền mặt cho đơn #${maDatSan}!`, 'success');
    loadBookings();
  } catch (error) {
    showAlert(`Lỗi: ${error.message}`, 'danger');
  }
}

function openCancelBookingModal(maDatSan) {
  const inputId = document.getElementById('cancel-booking-id');
  const textId = document.getElementById('cancel-booking-id-text');
  const noteEl = document.getElementById('cancel-booking-note');
  const modal = document.getElementById('modal-cancel-booking');

  if (inputId) inputId.value = maDatSan;
  if (textId) textId.textContent = `#${maDatSan}`;
  if (noteEl) noteEl.value = '';
  if (modal) modal.classList.remove('hidden');
  if (noteEl) noteEl.focus();
}

function handleCancelReasonChange() {
  const reason = document.getElementById('cancel-booking-reason').value;
  const note = document.getElementById('cancel-booking-note');
  if (reason === 'KhongDenNhan') {
    note.value = 'Quá 30 phút khách không đến nhận sân';
  } else {
    note.value = 'Cơ sở bảo trì đột xuất hoặc hủy theo yêu cầu';
  }
}

async function submitCancelBooking(event) {
  if (event) event.preventDefault();

  const maDatSan = document.getElementById('cancel-booking-id').value;
  const lyDoHuy = document.getElementById('cancel-booking-reason').value;
  const ghiChu = (document.getElementById('cancel-booking-note').value || '').trim();

  try {
    await api.put(`/admin/bookings/${maDatSan}/cancel`, {
      lyDoHuy: lyDoHuy,
      ghiChu: ghiChu
    });
    showAlert(`Đã hủy đơn đặt sân #${maDatSan} thành công!`, 'success');
    closeModal('modal-cancel-booking');
    loadBookings();
  } catch (error) {
    showAlert(`Lỗi hủy đơn: ${error.message}`, 'danger');
  }
}

// ======================== 3. YÊU CẦU HỦY ========================

async function loadCancelRequests() {
  const tableBody = document.getElementById('cancel-requests-table-body');
  if (!tableBody) return;

  tableBody.innerHTML = `<tr><td colspan="8" style="text-align:center;">Đang tải danh sách yêu cầu...</td></tr>`;

  try {
    const bookings = await api.get('/admin/bookings', { status: 'ChoHuy' });

    if (!bookings || bookings.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="8" style="text-align:center; color: var(--text-muted); padding: 2rem;">Không có yêu cầu hủy nào đang chờ duyệt.</td></tr>`;
      return;
    }

    tableBody.innerHTML = bookings.map(b => {
      const ht = b.thongTinHoanTien || {};
      const tyLe = ht.tyLeHoan !== undefined ? ht.tyLeHoan : 0;
      const soTienHoan = ht.soTienHoan !== undefined ? ht.soTienHoan : 0;

      return `
        <tr>
          <td><strong>#${b.maDatSan}</strong></td>
          <td>
            <strong>${b.hoTenKhachHang || 'N/A'}</strong><br>
            <span style="font-size: 0.8rem; color: var(--text-muted);">${b.sdtKhachHang || ''}</span>
          </td>
          <td>
            <strong>${b.tenSan || 'N/A'}</strong><br>
            <span style="font-size: 0.8rem; color: var(--text-muted);">${b.tenDiaDiem || 'N/A'}</span>
          </td>
          <td>
            <div>${formatNgay(b.ngayChoi)}</div>
            <span style="font-size: 0.8rem; color: var(--secondary); font-weight: 600;">${formatGio(b.gioBatDau)} - ${formatGio(b.gioKetThuc)}</span>
          </td>
          <td><strong>${formatTien(b.tienSan || b.soTien)}</strong></td>
          <td>
            <div style="font-weight: 700; color: ${tyLe > 0 ? 'var(--success)' : 'var(--danger)'};">
              ${formatTien(soTienHoan)}
            </div>
            <span style="font-size: 0.75rem; color: var(--text-muted);">Tỷ lệ: ${tyLe}%</span>
          </td>
          <td>
            <span style="font-size: 0.82rem; color: var(--text-main);">${formatLyDoHuy(b.lyDoHuy || b.ghiChu || 'Khách yêu cầu hủy đơn')}</span>
          </td>
          <td style="text-align: center;">
            <div style="display: flex; gap: 0.35rem; justify-content: center; flex-wrap: wrap;">
              <button class="btn btn-sm btn-success" onclick="approveCancelRequest(${b.maDatSan}, true, ${soTienHoan})">
                Duyệt hoàn
              </button>
              <button class="btn btn-sm btn-danger" onclick="approveCancelRequest(${b.maDatSan}, false)">
                Từ chối
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  } catch (error) {
    tableBody.innerHTML = `<tr><td colspan="8" style="text-align:center; color: var(--danger);">Lỗi tải dữ liệu: ${error.message}</td></tr>`;
  }
}

async function approveCancelRequest(maDatSan, dongY, soTienHoan = 0) {
  let ghiChu = '';

  if (dongY) {
    const confirmMsg = `Xác nhận ĐỒNG Ý duyệt hủy cho đơn #${maDatSan}?\nSố tiền hoàn lại cho khách: ${formatTien(soTienHoan)}.\nSau khi duyệt, khung giờ sân sẽ được giải phóng.`;
    const confirmed = await showConfirmDialog('Duyệt hoàn tiền hủy sân', confirmMsg, { confirmText: 'Duyệt hoàn tiền' });
    if (!confirmed) return;

    ghiChu = await showPromptDialog('Ghi chú xác nhận hoàn tiền', 'Nhập ghi chú xác nhận hoàn tiền (tùy chọn - ví dụ: Đã CK qua Techcombank):', 'Admin đã duyệt yêu cầu hủy và hoàn tiền theo chính sách');
    if (ghiChu === null) return;
  } else {
    ghiChu = await showPromptDialog('Từ chối yêu cầu hủy', 'Nhập lý do TỪ CHỐI yêu cầu hủy (sẽ gửi thông báo đến khách hàng):', 'Không đáp ứng điều kiện hủy đơn theo quy định');
    if (!ghiChu || !ghiChu.trim()) {
      showAlert('Vui lòng cung cấp lý do từ chối để thông báo cho khách!', 'warning');
      return;
    }
  }

  try {
    await api.put(`/admin/bookings/${maDatSan}/approve-cancel`, {
      dongY: dongY,
      ghiChu: ghiChu.trim()
    });
    const actionText = dongY ? 'chấp thuận và hoàn tiền' : 'từ chối';
    showAlert(`Đã ${actionText} yêu cầu hủy đơn #${maDatSan} thành công!`, 'success');
    if (typeof loadCancelRequests === 'function' && document.getElementById('cancel-requests-table-body')) {
      loadCancelRequests();
    }
    if (typeof loadBookings === 'function' && document.getElementById('bookings-table-body')) {
      loadBookings();
    }
  } catch (error) {
    showAlert(`Lỗi: ${error.message}`, 'danger');
  }
}

// ======================== 4. QUẢN LÝ DỊCH VỤ (SERVICES PAGE) ========================

async function initServicesPage() {
  await loadVenuesDropdownForServices();
  await loadServicesList();
}

async function loadVenuesDropdownForServices() {
  try {
    const venues = await api.get('/admin/courts');
    const filterSelect = document.getElementById('select-venue-filter');
    const formSelect = document.getElementById('input-service-venue');

    if (filterSelect) {
      filterSelect.innerHTML = `<option value="">-- Tất cả cơ sở --</option>` +
        (venues || []).map(v => `<option value="${v.maDiaDiem}">${v.tenDiaDiem}</option>`).join('');
    }

    if (formSelect) {
      formSelect.innerHTML = (venues || []).map(v => `<option value="${v.maDiaDiem}">${v.tenDiaDiem}</option>`).join('');
    }
  } catch (e) {
    console.error('Lỗi tải danh sách cơ sở:', e);
  }
}

async function loadServicesList() {
  const tableBody = document.getElementById('services-table-body');
  const filterSelect = document.getElementById('select-venue-filter');
  const maDiaDiem = filterSelect ? filterSelect.value : '';

  if (!tableBody) return;
  tableBody.innerHTML = `<tr><td colspan="8" style="text-align:center;">Đang tải danh sách dịch vụ...</td></tr>`;

  try {
    const services = await api.get('/admin/services', maDiaDiem ? { maDiaDiem } : {});

    if (!services || services.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="8" style="text-align:center; color: var(--text-muted); padding:2rem;">Chưa có dịch vụ nào tại cơ sở này. Hãy bấm "Thêm dịch vụ mới".</td></tr>`;
      return;
    }

    tableBody.innerHTML = services.map(s => {
      const isHoatDong = s.trangThai === 'HoatDong';
      return `
        <tr>
          <td><strong>#${s.maDV}</strong></td>
          <td><strong>${s.tenDV}</strong></td>
          <td>${s.tenDiaDiem || 'N/A'}</td>
          <td>${s.loaiDV === 'ChoThue' ? '<span class="badge badge-warning">Cho thuê</span>' : '<span class="badge badge-info">Bán hàng</span>'}</td>
          <td><strong>${formatTien(s.donGia)}</strong></td>
          <td>
            ${s.soLuongTon <= 0 
              ? `<span class="badge badge-danger" style="font-weight: 700;">Hết hàng (0)</span>` 
              : (s.soLuongTon < 10 
                ? `<span class="badge badge-warning" style="font-weight: 700;" title="Tồn kho dưới 10 - Cần bổ sung">Sắp hết hàng (${s.soLuongTon})</span>` 
                : `<span class="badge badge-success">${s.soLuongTon} cái/chai</span>`)}
          </td>
          <td>${badgeTrangThai(s.trangThai)}</td>
          <td>
            <button class="btn btn-sm btn-outline" onclick='openEditServiceModal(${JSON.stringify(s)})'>Sửa</button>
            <button class="btn btn-sm ${isHoatDong ? 'btn-danger' : 'btn-success'}" onclick="toggleServiceStatus(${s.maDV})">
              ${isHoatDong ? 'Tạm ngưng' : 'Mở lại'}
            </button>
          </td>
        </tr>
      `;
    }).join('');
  } catch (error) {
    tableBody.innerHTML = `<tr><td colspan="8" style="text-align:center; color: var(--danger);">Lỗi tải dịch vụ: ${error.message}</td></tr>`;
  }
}

function openCreateServiceModal() {
  document.getElementById('service-form-modal-title').textContent = 'Thêm dịch vụ mới';
  document.getElementById('service-edit-id').value = '';
  document.getElementById('group-service-venue').style.display = 'block';
  document.getElementById('input-service-name').value = '';
  document.getElementById('input-service-type').value = 'Ban';
  document.getElementById('input-service-price').value = '';
  document.getElementById('input-service-stock').value = 50;

  document.getElementById('modal-service-form').classList.remove('hidden');
}

function openEditServiceModal(s) {
  document.getElementById('service-form-modal-title').textContent = `Sửa dịch vụ #${s.maDV}`;
  document.getElementById('service-edit-id').value = s.maDV;
  document.getElementById('group-service-venue').style.display = 'none'; // Không đổi cơ sở khi sửa
  document.getElementById('input-service-name').value = s.tenDV || '';
  document.getElementById('input-service-type').value = s.loaiDV || 'Ban';
  document.getElementById('input-service-price').value = s.donGia || '';
  document.getElementById('input-service-stock').value = s.soLuongTon || 0;

  document.getElementById('modal-service-form').classList.remove('hidden');
}

async function submitServiceForm(event) {
  if (event) event.preventDefault();

  const editId = document.getElementById('service-edit-id').value;
  const tenDV = document.getElementById('input-service-name').value.trim();
  const loaiDV = document.getElementById('input-service-type').value;
  const donGia = parseFloat(document.getElementById('input-service-price').value);
  const soLuongTon = parseInt(document.getElementById('input-service-stock').value);

  const btn = document.getElementById('btn-save-service');
  if (btn) btn.disabled = true;

  try {
    if (editId) {
      await api.put(`/admin/services/${editId}`, {
        tenDV,
        loaiDV,
        donGia,
        soLuongTon
      });
      showAlert(`Cập nhật dịch vụ #${editId} thành công!`, 'success');
    } else {
      const maDiaDiem = parseInt(document.getElementById('input-service-venue').value);
      await api.post('/admin/services', {
        maDiaDiem,
        tenDV,
        loaiDV,
        donGia,
        soLuongTon
      });
      showAlert('Thêm dịch vụ mới thành công!', 'success');
    }
    closeModal('modal-service-form');
    loadServicesList();
  } catch (error) {
    showAlert(`Lỗi: ${error.message}`, 'danger');
  } finally {
    if (btn) btn.disabled = false;
  }
}

async function toggleServiceStatus(maDV) {
  try {
    await api.put(`/admin/services/${maDV}/toggle-status`);
    showAlert(`Đã thay đổi trạng thái dịch vụ #${maDV}!`, 'success');
    loadServicesList();
  } catch (error) {
    showAlert(`Lỗi: ${error.message}`, 'danger');
  }
}

// ======================== 5. QUẢN LÝ SÂN & UPLOAD ẢNH ========================

const availableCourtImages = [
  '/assets/images/courts.jpg',
  '/assets/images/index1.webp',
  '/assets/images/index2.webp',
  '/assets/images/index3.jpg',
  '/images/san-cau-giay-1.jpg',
  '/images/san-cau-giay-2.jpg',
  '/images/san-cau-giay-3.jpg',
  '/images/san-thanh-xuan-1.jpg',
  '/images/san-thanh-xuan-2.jpg'
];

let activeCourtIdForPhoto = null;
let selectedCourtPhotoUrl = null;
let selectedCreateCourtFile = null;
let selectedEditCourtFile = null;

function setupCourtPhotoUpload() {
  const dropzones = [
    { id: 'create-court-dropzone', mode: 'create' },
    { id: 'edit-court-dropzone', mode: 'edit' }
  ];

  dropzones.forEach(({ id, mode }) => {
    const el = document.getElementById(id);
    if (!el || el.dataset.uploadInitialized) return;
    el.dataset.uploadInitialized = 'true';

    ['dragenter', 'dragover'].forEach(eventName => {
      el.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        el.classList.add('dragover');
      }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
      el.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        el.classList.remove('dragover');
      }, false);
    });

    el.addEventListener('drop', (e) => {
      const dt = e.dataTransfer;
      const files = dt.files;
      if (files && files.length > 0) {
        handleCourtFileSelect({ target: { files, value: '' } }, mode);
      }
    }, false);
  });
}

function handleCourtFileSelect(event, mode) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    showAlert('Định dạng file không hợp lệ! Vui lòng chọn ảnh JPG, PNG hoặc WEBP.', 'warning');
    event.target.value = '';
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    showAlert('Dung lượng ảnh vượt quá 5MB! Vui lòng chọn ảnh nhỏ hơn.', 'warning');
    event.target.value = '';
    return;
  }

  const previewBox = document.getElementById(`${mode}-court-preview-box`);
  const previewThumb = document.getElementById(`${mode}-court-preview-thumb`);
  const previewName = document.getElementById(`${mode}-court-preview-name`);
  const previewSize = document.getElementById(`${mode}-court-preview-size`);

  if (mode === 'create') selectedCreateCourtFile = file;
  if (mode === 'edit') selectedEditCourtFile = file;

  const reader = new FileReader();
  reader.onload = (e) => {
    if (previewThumb) previewThumb.src = e.target.result;
    if (previewName) previewName.textContent = file.name;
    if (previewSize) previewSize.textContent = `${(file.size / 1024).toFixed(1)} KB`;
    if (previewBox) previewBox.style.display = 'flex';
  };
  reader.readAsDataURL(file);
}

function removeSelectedCourtFile(mode) {
  if (mode === 'create') {
    selectedCreateCourtFile = null;
    const input = document.getElementById('create-court-file-input');
    if (input) input.value = '';
    const box = document.getElementById('create-court-preview-box');
    if (box) box.style.display = 'none';
  } else if (mode === 'edit') {
    selectedEditCourtFile = null;
    const input = document.getElementById('edit-court-file-input');
    if (input) input.value = '';
    const box = document.getElementById('edit-court-preview-box');
    if (box) box.style.display = 'none';
  }
}

async function uploadCourtPhotoFile(file) {
  if (!file) return null;
  const formData = new FormData();
  formData.append('file', file);
  const res = await api.upload('/admin/courts/upload-image', formData);
  return res && res.url ? res.url : null;
}

async function handleModalCourtPhotoUpload(event) {
  const file = event.target.files && event.target.files[0];
  if (!file || !activeCourtIdForPhoto) return;

  const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    showAlert('Vui lòng chọn ảnh JPG, PNG hoặc WEBP.', 'warning');
    event.target.value = '';
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    showAlert('Dung lượng ảnh tối đa 5MB.', 'warning');
    event.target.value = '';
    return;
  }

  const statusEl = document.getElementById('modal-court-upload-status');
  if (statusEl) {
    statusEl.textContent = 'Đang tải ảnh lên...';
    statusEl.style.display = 'block';
    statusEl.style.color = 'var(--primary)';
  }

  try {
    const uploadedUrl = await uploadCourtPhotoFile(file);
    if (uploadedUrl) {
      await api.put(`/admin/courts/court/${activeCourtIdForPhoto}/image`, { hinhAnh: uploadedUrl });
      showAlert(`Tải ảnh lên sân #${activeCourtIdForPhoto} thành công!`, 'success');
      closeCourtPhotoModal();
      loadCourts();
    }
  } catch (e) {
    showAlert(`Lỗi upload ảnh: ${e.message}`, 'danger');
  } finally {
    if (statusEl) statusEl.style.display = 'none';
    event.target.value = '';
  }
}

function openCreateCourtModal() {
  removeSelectedCourtFile('create');
  const modal = document.getElementById('modal-create-court');
  if (modal) modal.classList.remove('hidden');
}

function closeCreateCourtModal() {
  const modal = document.getElementById('modal-create-court');
  if (modal) modal.classList.add('hidden');
}

function toggleCreateCourtForm() {
  openCreateCourtModal();
}

async function createCourt(event) {
  if (event) event.preventDefault();

  const tenDiaDiem = (document.getElementById('create-tenDiaDiem') || document.getElementById('input-tenDiaDiem')).value.trim();
  let gioMo = (document.getElementById('create-gioMo') || document.getElementById('input-gioMo')).value.trim();
  let gioDong = (document.getElementById('create-gioDong') || document.getElementById('input-gioDong')).value.trim();
  const soSanNho = parseInt((document.getElementById('create-soSanNho') || document.getElementById('input-soSanNho')).value) || 1;
  const mapLinkEl = document.getElementById('create-mapLink') || document.getElementById('input-mapLink');
  const mapLink = mapLinkEl ? mapLinkEl.value.trim() : null;

  if (!tenDiaDiem) {
    showAlert('Vui lòng nhập tên địa điểm / cơ sở!', 'warning');
    return;
  }

  if (gioMo.length === 5) gioMo += ':00';
  if (gioDong.length === 5) gioDong += ':00';

  const btn = document.getElementById('btn-submit-create-court');
  if (btn) btn.disabled = true;

  try {
    // Nếu có chọn file ảnh từ máy, tải file lên backend trước
    let hinhAnh = '/assets/images/courts.jpg';
    if (selectedCreateCourtFile) {
      const uploadedUrl = await uploadCourtPhotoFile(selectedCreateCourtFile);
      if (uploadedUrl) hinhAnh = uploadedUrl;
    } else {
      const hinhAnhEl = document.getElementById('create-hinhAnh');
      if (hinhAnhEl && hinhAnhEl.value) hinhAnh = hinhAnhEl.value.trim();
    }

    await api.post('/admin/courts', {
      tenDiaDiem,
      gioMo,
      gioDong,
      soSanNho,
      hinhAnh,
      mapLink: mapLink || null
    });
    showAlert(`Đã thêm địa điểm "${tenDiaDiem}" cùng ${soSanNho} sân con thành công!`, 'success');
    closeCreateCourtModal();
    const form = document.getElementById('form-create-court');
    if (form) form.reset();
    removeSelectedCourtFile('create');
    loadCourts();
  } catch (error) {
    showAlert(`Lỗi tạo sân: ${error.message}`, 'danger');
  } finally {
    if (btn) btn.disabled = false;
  }
}

async function loadCourts() {
  const container = document.getElementById('courts-list-container');
  if (!container) return;

  container.innerHTML = `<p style="text-align:center; padding: 2rem; color: var(--text-muted);">Đang tải sơ đồ sân bãi...</p>`;

  try {
    const courts = await api.get('/admin/courts');

    if (!courts || courts.length === 0) {
      container.innerHTML = `
        <div class="card" style="text-align:center; padding: 3rem 1.5rem;">
          <h3 style="font-size: 1.15rem; font-weight: 700; margin-bottom: 0.5rem;">Chưa có cơ sở nào trong hệ thống</h3>
          <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 1.25rem;">Bắt đầu thiết lập sân bãi bằng cách bấm nút "Thêm địa điểm mới" ở góc trên.</p>
          <button type="button" class="btn btn-primary" onclick="openCreateCourtModal()">+ Thêm địa điểm mới</button>
        </div>
      `;
      return;
    }

    container.innerHTML = courts.map(dd => {
      const danhSachSan = dd.danhSachSan || [];
      const totalSan = danhSachSan.length;
      const countHoatDong = danhSachSan.filter(s => s.tinhTrang === 'HoatDong').length;
      const countBaoTri = danhSachSan.filter(s => s.tinhTrang === 'BaoTri').length;
      const countTamNgung = danhSachSan.filter(s => s.tinhTrang === 'TamNgung').length;

      const courtsGridHtml = danhSachSan.map(s => {
        const isHoatDong = s.tinhTrang === 'HoatDong';
        const isBaoTri = s.tinhTrang === 'BaoTri';
        const isTamNgung = s.tinhTrang === 'TamNgung';

        return `
          <div class="court-tile">
            <div class="court-tile-media">
              <img src="${resolveCourtImageUrl(s.hinhAnh)}" alt="${s.tenSan}" class="court-tile-img" onerror="this.src='/assets/images/courts.jpg'">
              
              <div class="court-tile-badge">
                ${badgeTrangThai(s.tinhTrang)}
              </div>

              <button type="button" class="court-tile-photo-btn" onclick='openCourtPhotoModal(${s.maSan}, "${s.hinhAnh || '/assets/images/courts.jpg'}", "${s.tenSan}")' title="Đổi ảnh đại diện sân">
                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
                Đổi ảnh
              </button>
            </div>

            <div class="court-tile-body">
              <div>
                <div class="court-tile-title-row">
                  <span class="court-tile-name">${s.tenSan}</span>
                  <span class="court-tile-id">#${s.maSan}</span>
                </div>
                <div class="court-tile-feature" style="margin-top: 0.35rem;">
                  <svg width="14" height="14" fill="none" stroke="#10b981" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                  </svg>
                  <span>Thảm BWF tiêu chuẩn • Đèn chống lóa</span>
                </div>
              </div>

              <div>
                <div style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; margin-bottom: 0.35rem; letter-spacing: 0.04em;">
                  Chuyển trạng thái 1-chạm:
                </div>
                <div class="court-status-segmented">
                  <button type="button" class="status-btn ${isHoatDong ? 'active-hoatdong' : ''}" onclick="updateCourtStatus(${s.maSan}, 'HoatDong', '${(s.tenSan || 'Sân').replace(/'/g, "\\'")}')" title="Sân sẵn sàng đón khách">
                    Hoạt động
                  </button>
                  <button type="button" class="status-btn ${isBaoTri ? 'active-baotri' : ''}" onclick="updateCourtStatus(${s.maSan}, 'BaoTri', '${(s.tenSan || 'Sân').replace(/'/g, "\\'")}')" title="Sân đang sửa chữa / bảo trì">
                    Bảo trì
                  </button>
                  <button type="button" class="status-btn ${isTamNgung ? 'active-tamngung' : ''}" onclick="updateCourtStatus(${s.maSan}, 'TamNgung', '${(s.tenSan || 'Sân').replace(/'/g, "\\'")}')" title="Sân tạm ngưng">
                    Tạm ngưng
                  </button>
                </div>
              </div>
            </div>
          </div>
        `;
      }).join('');

      return `
        <div class="venue-card">
          <div class="venue-header">
            <div class="venue-title-row">
              <span class="venue-id-pill">#${dd.maDiaDiem}</span>
              <div>
                <h2 class="venue-name">${dd.tenDiaDiem}</h2>
                <div class="venue-meta-row">
                  <span class="venue-meta-chip">
                    <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    ${formatGio(dd.gioMo)} - ${formatGio(dd.gioDong)}
                  </span>
                  <span class="venue-meta-chip">
                    <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
                    </svg>
                    <strong>${totalSan}</strong> sân (${countHoatDong} hoạt động${countBaoTri > 0 ? `, ${countBaoTri} bảo trì` : ''}${countTamNgung > 0 ? `, ${countTamNgung} ngưng` : ''})
                  </span>
                  ${badgeTrangThai(dd.trangThai)}
                  ${dd.mapLink ? `
                    <a href="${dd.mapLink}" target="_blank" class="venue-meta-chip link" title="Xem bản đồ trên Google Maps">
                      <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                      </svg>
                      Google Maps ↗
                    </a>
                  ` : ''}
                </div>
              </div>
            </div>
            <div style="display: flex; gap: 0.5rem; align-items: center;">
              <button type="button" class="btn btn-sm btn-outline" onclick='openEditCourtModal(${JSON.stringify(dd)})'>
                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                </svg>
                Sửa cơ sở
              </button>
            </div>
          </div>

          <!-- Sơ đồ lưới các sân con trực quan -->
          <div class="courts-visual-grid">
            ${courtsGridHtml}
          </div>
        </div>
      `;
    }).join('');
  } catch (error) {
    container.innerHTML = `<p style="text-align:center; color: var(--danger); padding: 2rem;">Lỗi tải danh sách sân: ${error.message}</p>`;
  }
}

// ----------------- Thư viện ảnh sân trực quan -----------------
function openCourtPhotoModal(maSan, currentPhoto, tenSan) {
  activeCourtIdForPhoto = maSan;
  selectedCourtPhotoUrl = currentPhoto || availableCourtImages[0];

  const titleEl = document.getElementById('photo-modal-court-title');
  if (titleEl) titleEl.textContent = `${tenSan || 'Sân #' + maSan}`;

  const courtIdInput = document.getElementById('photo-modal-court-id');
  if (courtIdInput) courtIdInput.value = maSan;

  renderCourtPhotoGallery();

  const modal = document.getElementById('modal-court-photo');
  if (modal) modal.classList.remove('hidden');
}

function closeCourtPhotoModal() {
  const modal = document.getElementById('modal-court-photo');
  if (modal) modal.classList.add('hidden');
  activeCourtIdForPhoto = null;
}

function renderCourtPhotoGallery() {
  const galleryEl = document.getElementById('court-photo-gallery-grid');
  if (!galleryEl) return;

  const listToRender = (selectedCourtPhotoUrl && !availableCourtImages.includes(selectedCourtPhotoUrl))
    ? [selectedCourtPhotoUrl, ...availableCourtImages]
    : availableCourtImages;

  galleryEl.innerHTML = listToRender.map(img => {
    const isSelected = (selectedCourtPhotoUrl === img);
    return `
      <div class="photo-choice-item ${isSelected ? 'selected' : ''}" onclick="selectCourtPhoto('${img}')">
        <img src="${resolveCourtImageUrl(img)}" alt="Ảnh sân" onerror="this.src='/assets/images/courts.jpg'">
        ${isSelected ? `
          <div class="photo-choice-check">
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
            </svg>
          </div>
        ` : ''}
      </div>
    `;
  }).join('');
}

function selectCourtPhoto(imgUrl) {
  selectedCourtPhotoUrl = imgUrl;
  renderCourtPhotoGallery();
}

async function saveCourtPhotoSelection() {
  if (!activeCourtIdForPhoto || !selectedCourtPhotoUrl) return;

  const btn = document.getElementById('btn-save-court-photo');
  if (btn) btn.disabled = true;

  try {
    await api.put(`/admin/courts/court/${activeCourtIdForPhoto}/image`, { hinhAnh: selectedCourtPhotoUrl });
    showAlert(`Cập nhật ảnh cho sân #${activeCourtIdForPhoto} thành công!`, 'success');
    closeCourtPhotoModal();
    loadCourts();
  } catch (error) {
    showAlert(`Lỗi cập nhật ảnh sân: ${error.message}`, 'danger');
  } finally {
    if (btn) btn.disabled = false;
  }
}

function openEditCourtModal(diaDiem) {
  removeSelectedCourtFile('edit');

  document.getElementById('edit-maDiaDiem').value = diaDiem.maDiaDiem;
  document.getElementById('edit-tenMoi').value = diaDiem.tenDiaDiem || '';
  document.getElementById('edit-gioMo').value = formatGio(diaDiem.gioMo);
  document.getElementById('edit-gioDong').value = formatGio(diaDiem.gioDong);
  document.getElementById('edit-soSanNhoMoi').value = (diaDiem.danhSachSan || []).length;
  
  const currentImg = (diaDiem.danhSachSan && diaDiem.danhSachSan[0]) ? (diaDiem.danhSachSan[0].hinhAnh || '/assets/images/courts.jpg') : '/assets/images/courts.jpg';
  document.getElementById('edit-hinhAnh').value = currentImg;

  const currentThumb = document.getElementById('edit-court-current-thumb');
  if (currentThumb) {
    currentThumb.src = resolveCourtImageUrl(currentImg);
    currentThumb.onerror = () => { currentThumb.src = '/assets/images/courts.jpg'; };
  }
  const currentPath = document.getElementById('edit-court-current-path');
  if (currentPath) currentPath.textContent = currentImg;

  document.getElementById('edit-mapLink').value = diaDiem.mapLink || '';

  document.getElementById('modal-edit-court').classList.remove('hidden');
}

function closeEditCourtModal() {
  document.getElementById('modal-edit-court').classList.add('hidden');
  removeSelectedCourtFile('edit');
}

async function updateCourt(event) {
  if (event) event.preventDefault();

  const maDiaDiem = document.getElementById('edit-maDiaDiem').value;
  const tenMoi = document.getElementById('edit-tenMoi').value.trim();
  let gioMo = document.getElementById('edit-gioMo').value.trim();
  let gioDong = document.getElementById('edit-gioDong').value.trim();
  const soSanNhoMoi = parseInt(document.getElementById('edit-soSanNhoMoi').value);
  let hinhAnh = document.getElementById('edit-hinhAnh').value.trim();
  const mapLink = document.getElementById('edit-mapLink').value.trim() || null;

  if (gioMo.length === 5) gioMo += ':00';
  if (gioDong.length === 5) gioDong += ':00';

  try {
    // Nếu có chọn ảnh mới từ máy, upload lên backend trước
    if (selectedEditCourtFile) {
      const uploadedUrl = await uploadCourtPhotoFile(selectedEditCourtFile);
      if (uploadedUrl) hinhAnh = uploadedUrl;
    }

    await api.put(`/admin/courts/${maDiaDiem}`, {
      tenMoi,
      gioMo,
      gioDong,
      soSanNhoMoi,
      hinhAnh,
      mapLink
    });
    showAlert(`Cập nhật thông tin địa điểm #${maDiaDiem} thành công!`, 'success');
    closeEditCourtModal();
    loadCourts();
  } catch (error) {
    showAlert(`Lỗi cập nhật: ${error.message}`, 'danger');
  }
}

async function updateCourtImage(maSan) {
  const selectEl = document.getElementById(`court-img-${maSan}`);
  const hinhAnh = selectEl ? selectEl.value.trim() : '';

  try {
    await api.put(`/admin/courts/court/${maSan}/image`, { hinhAnh });
    showAlert(`Cập nhật ảnh cho sân #${maSan} thành công!`, 'success');
    loadCourts();
  } catch (error) {
    showAlert(`Lỗi: ${error.message}`, 'danger');
  }
}

function closeMaintenanceConflictModal() {
  const modal = document.getElementById('modal-maintenance-conflict');
  if (modal) modal.classList.add('hidden');
}

function renderConflictBookingsList(conflicts, maSanGoc) {
  const container = document.getElementById('conflict-bookings-list');
  const countBadge = document.getElementById('conflict-count-badge');
  if (countBadge) countBadge.textContent = conflicts ? conflicts.length : 0;

  const totalRefund = (conflicts || []).reduce((sum, item) => {
    const b = (item && item.donDatSan) ? item.donDatSan : {};
    return sum + (b.tienTraTruoc || b.soTien || 0);
  }, 0);
  const totalRefundEl = document.getElementById('conflict-total-refund-val');
  if (totalRefundEl) totalRefundEl.textContent = formatTien(totalRefund);

  if (!container) return;

  if (!conflicts || conflicts.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 2rem; background: #f0fdf4; border: 1px dashed #86efac; border-radius: var(--radius-md); color: #166534;">
        Tất cả đơn đặt sân xung đột đã được giải quyết xong! Bạn có thể chuyển sân sang trạng thái mới.
      </div>
    `;
    return;
  }

  container.innerHTML = conflicts.map(item => {
    const b = item.donDatSan || {};
    const khach = b.tenKhachHang || 'Khách vãng lai';
    const sdt = b.soDienThoai ? ` (${b.soDienThoai})` : '';
    const tienHoan = b.tienTraTruoc || b.soTien || 0;

    const ngayFormatted = b.ngayChoi 
      ? (typeof formatNgay === 'function' ? formatNgay(b.ngayChoi) : b.ngayChoi) 
      : 'Hôm nay';

    return `
      <div class="conflict-item-card" style="border: 1px solid var(--border); border-radius: var(--radius-md); padding: 0.85rem 1rem; background: var(--bg-card); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem;">
        <div style="display: flex; flex-direction: column; gap: 0.35rem;">
          <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
            <strong style="color: var(--primary-dark); font-size: 0.95rem;">Đơn #${b.maDatSan}</strong>
            <span style="color: var(--text-muted);">•</span>
            <span style="font-weight: 600; color: var(--text-main);">${khach}</span>
            <small style="color: var(--text-muted);">${sdt}</small>
            <span>${badgeTrangThai(b.trangThaiDat)}</span>
          </div>
          <div style="font-size: 0.82rem; color: var(--text-secondary); display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;">
            <span><strong>Ngày chơi:</strong> ${ngayFormatted}</span>
            <span><strong>Khung giờ:</strong> ${b.gioBatDau || ''} - ${b.gioKetThuc || ''}</span>
          </div>
        </div>

        <div style="display: flex; align-items: center; gap: 0.85rem; flex-wrap: wrap;">
          <div style="text-align: right;">
            <div style="font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase; font-weight: 600;">Số tiền hoàn 100%:</div>
            <div style="font-size: 1.05rem; font-weight: 800; color: #b91c1c;">${formatTien(tienHoan)}</div>
          </div>
          <button type="button" class="btn btn-sm btn-outline" onclick="submitCancelBookingMaintenance(${b.maDatSan}, ${maSanGoc})" style="color: #dc2626; border-color: #fca5a5; padding: 0.4rem 0.75rem; font-size: 0.82rem;" title="Hủy đơn riêng này và hoàn 100% tiền">
            Hủy & Hoàn tiền
          </button>
        </div>
      </div>
    `;
  }).join('');
}

async function updateCourtStatus(maSan, tinhTrang, tenSan = 'Sân') {
  if (tinhTrang === 'BaoTri' || tinhTrang === 'TamNgung') {
    const actionText = (tinhTrang === 'TamNgung') ? 'Tạm ngưng' : 'Bảo trì';
    try {
      const conflicts = await api.get(`/admin/courts/court/${maSan}/conflicting-bookings`);
      if (conflicts && conflicts.length > 0) {
        const modal = document.getElementById('modal-maintenance-conflict');
        const courtIdInput = document.getElementById('conflict-court-id');
        const targetStatusInput = document.getElementById('conflict-target-status');
        const courtNameEl = document.getElementById('conflict-modal-court-name');
        const actionTitleEl = document.getElementById('conflict-action-title');
        const actionLabelEl = document.getElementById('conflict-action-label');
        const forceBtnTextEl = document.getElementById('btn-force-action-text');

        if (courtIdInput) courtIdInput.value = maSan;
        if (targetStatusInput) targetStatusInput.value = tinhTrang;
        if (courtNameEl) courtNameEl.textContent = `${tenSan} (#${maSan})`;
        if (actionTitleEl) actionTitleEl.textContent = `Cảnh báo: Sân đang có khách đặt trước khi ${actionText}`;
        if (actionLabelEl) actionLabelEl.textContent = actionText;
        if (forceBtnTextEl) forceBtnTextEl.textContent = `Hủy tất cả đơn & Chuyển ${actionText} ngay`;

        renderConflictBookingsList(conflicts, maSan);
        if (modal) modal.classList.remove('hidden');
        return;
      }
    } catch (error) {
      console.error(`Lỗi kiểm tra xung đột ${actionText.toLowerCase()}:`, error);
      showAlert(`Không thể kiểm tra lịch đặt của sân: ${error.message}`, 'danger');
      return;
    }
  }

  try {
    await api.put(`/admin/courts/court/${maSan}/status`, { tinhTrang });
    const textStatus = tinhTrang === 'HoatDong' ? 'Hoạt động' : (tinhTrang === 'BaoTri' ? 'Bảo trì' : 'Tạm ngưng');
    showAlert(`Đã chuyển trạng thái ${tenSan} (#${maSan}) sang: ${textStatus}`, 'success');
    loadCourts();
  } catch (error) {
    showAlert(`Lỗi: ${error.message}`, 'danger');
  }
}

async function submitReassignCourt(maDatSan, maSanGoc) {
  const selectEl = document.getElementById(`reassign-select-${maDatSan}`);
  const maSanMoi = selectEl ? parseInt(selectEl.value) : null;
  if (!maSanMoi) {
    showAlert('Vui lòng chọn sân trống muốn chuyển đến', 'warning');
    return;
  }

  const targetInput = document.getElementById('conflict-target-status');
  const targetStatus = (targetInput && targetInput.value) ? targetInput.value : 'BaoTri';
  const actionText = (targetStatus === 'TamNgung') ? 'Tạm ngưng' : 'Bảo trì';

  try {
    await api.put(`/admin/bookings/${maDatSan}/reassign-court`, { maSanMoi });
    showAlert(`Đã điều phối đơn #${maDatSan} sang sân mới thành công!`, 'success');

    // Tải lại danh sách xung đột còn lại
    const remaining = await api.get(`/admin/courts/court/${maSanGoc}/conflicting-bookings`);
    if (!remaining || remaining.length === 0) {
      // Đã giải quyết hết -> Chuyển sân sang targetStatus
      await api.put(`/admin/courts/court/${maSanGoc}/status`, { tinhTrang: targetStatus });
      closeMaintenanceConflictModal();
      showAlert(`Toàn bộ đơn đã được điều phối! Sân #${maSanGoc} đã chuyển sang ${actionText} thành công.`, 'success');
      loadCourts();
    } else {
      renderConflictBookingsList(remaining, maSanGoc);
    }
  } catch (error) {
    showAlert(`Lỗi khi đổi sân: ${error.message}`, 'danger');
  }
}

async function submitCancelBookingMaintenance(maDatSan, maSanGoc) {
  const confirmed = await showConfirmDialog(
    'Xác nhận hủy đơn & Hoàn tiền',
    `Xác nhận hủy đơn #${maDatSan}, tự động hoàn trả 100% tiền và gửi thông báo tới khách hàng?`,
    { danger: true, confirmText: 'Hủy đơn & Hoàn 100%', cancelText: 'Bỏ qua' }
  );
  if (!confirmed) {
    return;
  }

  const targetInput = document.getElementById('conflict-target-status');
  const targetStatus = (targetInput && targetInput.value) ? targetInput.value : 'BaoTri';
  const actionText = (targetStatus === 'TamNgung') ? 'Tạm ngưng' : 'Bảo trì';

  try {
    await api.post(`/admin/bookings/${maDatSan}/cancel-due-to-maintenance`);
    showAlert(`Đã hủy đơn #${maDatSan}, hoàn 100% tiền và gửi thông báo cho khách hàng thành công!`, 'success');

    const remaining = await api.get(`/admin/courts/court/${maSanGoc}/conflicting-bookings`);
    if (!remaining || remaining.length === 0) {
      await api.put(`/admin/courts/court/${maSanGoc}/status`, { tinhTrang: targetStatus });
      closeMaintenanceConflictModal();
      showAlert(`Toàn bộ đơn đã được giải quyết! Sân #${maSanGoc} đã chuyển sang ${actionText} thành công.`, 'success');
      loadCourts();
    } else {
      renderConflictBookingsList(remaining, maSanGoc);
    }
  } catch (error) {
    showAlert(`Lỗi khi hủy đơn: ${error.message}`, 'danger');
  }
}

async function submitForceMaintenanceWithRefund() {
  const courtIdInput = document.getElementById('conflict-court-id');
  const targetInput = document.getElementById('conflict-target-status');
  const maSan = courtIdInput ? parseInt(courtIdInput.value) : null;
  const targetStatus = (targetInput && targetInput.value) ? targetInput.value : 'BaoTri';
  const actionText = (targetStatus === 'TamNgung') ? 'Tạm ngưng' : 'Bảo trì';
  if (!maSan) return;

  const totalRefundEl = document.getElementById('conflict-total-refund-val');
  const refundText = totalRefundEl ? totalRefundEl.textContent : '';

  const confirmed = await showConfirmDialog(
    `Xác nhận chuyển sân sang ${actionText}`,
    `Xác nhận HỦY TOÀN BỘ đơn đặt sân bị ảnh hưởng, HOÀN TIỀN 100% (${refundText}) cho khách hàng, gửi THÔNG BÁO đến người dùng và đưa sân sang ${actionText.toUpperCase()} ngay lập tức?`,
    { danger: true, confirmText: `Hủy tất cả & Chuyển ${actionText}`, cancelText: 'Hủy bỏ' }
  );
  if (!confirmed) {
    return;
  }

  const btn = document.getElementById('btn-force-maintenance');
  if (btn) btn.disabled = true;

  try {
    await api.post(`/admin/courts/court/${maSan}/force-status-with-refund?status=${encodeURIComponent(targetStatus)}`);
    closeMaintenanceConflictModal();
    showAlert(`Đã hủy toàn bộ đơn xung đột, hoàn 100% tiền và gửi thông báo cho khách hàng thành công. Sân #${maSan} đã chuyển sang ${actionText}.`, 'success');
    loadCourts();
  } catch (error) {
    showAlert(`Lỗi: ${error.message}`, 'danger');
  } finally {
    if (btn) btn.disabled = false;
  }
}

// ======================== 6. QUẢN LÝ TÀI KHOẢN & PHÂN QUYỀN (3 ROLES) ========================

let allLoadedAccounts = [];
let allVenuesForStaff = [];

async function loadAccounts() {
  const tableBody = document.getElementById('accounts-table-body');
  if (!tableBody && !document.getElementById('users-table-body')) return;

  const targetBody = tableBody || document.getElementById('users-table-body');
  targetBody.innerHTML = `<tr><td colspan="9" style="text-align:center; padding: 3rem; color: var(--text-muted);"><div class="spinner-sm" style="display:inline-block; margin-right:8px; vertical-align:middle;"></div> Đang tải danh sách tài khoản & phân quyền...</td></tr>`;

  try {
    const [accounts, venues] = await Promise.all([
      api.get('/admin/accounts'),
      api.get('/admin/courts').catch(() => [])
    ]);

    allLoadedAccounts = accounts || [];
    allVenuesForStaff = venues || [];

    // Populate dropdown cơ sở trong modal tạo nhân viên và modal sửa
    const venueSelectCreate = document.getElementById('create-staff-venue');
    const venueSelectEdit = document.getElementById('edit-acc-venue');

    if (venueSelectCreate) {
      venueSelectCreate.innerHTML = `<option value="">-- Chọn chi nhánh sân làm việc --</option>` +
        allVenuesForStaff.map(v => `<option value="${v.maDiaDiem}">${v.tenDiaDiem}</option>`).join('');
    }
    if (venueSelectEdit) {
      venueSelectEdit.innerHTML = `<option value="">-- Chưa phân công --</option>` +
        allVenuesForStaff.map(v => `<option value="${v.maDiaDiem}">${v.tenDiaDiem}</option>`).join('');
    }

    // Cập nhật 4 thẻ KPI thống kê
    const totalCount = allLoadedAccounts.length;
    const adminCount = allLoadedAccounts.filter(a => a.role === 'ADMIN').length;
    const staffCount = allLoadedAccounts.filter(a => a.role === 'STAFF').length;
    const customerCount = allLoadedAccounts.filter(a => a.role === 'CUSTOMER').length;

    const statTotalEl = document.getElementById('stat-acc-total');
    const statAdminEl = document.getElementById('stat-acc-admin');
    const statStaffEl = document.getElementById('stat-acc-staff');
    const statCustEl = document.getElementById('stat-acc-customer');

    if (statTotalEl) statTotalEl.textContent = totalCount;
    if (statAdminEl) statAdminEl.textContent = adminCount;
    if (statStaffEl) statStaffEl.textContent = staffCount;
    if (statCustEl) statCustEl.textContent = customerCount;

    filterAccountsList();
  } catch (error) {
    targetBody.innerHTML = `<tr><td colspan="9" style="text-align:center; color: var(--danger); padding: 3rem;">
      <div style="font-weight: 700; margin-bottom: 0.5rem; font-size: 1rem;">Không thể tải dữ liệu tài khoản</div>
      <div style="font-size: 0.88rem; color: var(--text-muted); margin-bottom: 1.25rem;">${error.message}</div>
      <button type="button" class="btn btn-sm btn-outline" onclick="loadAccounts()">Thử lại</button>
    </td></tr>`;
  }
}

// Giữ lại alias loadUsers để tương thích ngược nếu có trang gọi
async function loadUsers() {
  return loadAccounts();
}

function filterAccountsList() {
  const tableBody = document.getElementById('accounts-table-body') || document.getElementById('users-table-body');
  if (!tableBody) return;

  const keyword = (document.getElementById('input-account-search') ? document.getElementById('input-account-search').value : '').toLowerCase().trim();
  const roleFilter = (document.getElementById('select-role-filter') ? document.getElementById('select-role-filter').value : '').toUpperCase();
  const statusFilter = (document.getElementById('select-status-filter') ? document.getElementById('select-status-filter').value : '');

  let filtered = allLoadedAccounts.filter(acc => {
    // 1. Lọc theo vai trò
    if (roleFilter && acc.role !== roleFilter) return false;

    // 2. Lọc theo trạng thái
    if (statusFilter && acc.trangThai !== statusFilter) return false;

    // 3. Lọc theo từ khóa tìm kiếm (Username, Họ tên, SĐT, Email, Cơ sở)
    if (keyword) {
      const uName = (acc.tenDangNhap || '').toLowerCase();
      const fName = (acc.hoTen || '').toLowerCase();
      const phone = (acc.sdt || '').toLowerCase();
      const mail = (acc.email || '').toLowerCase();
      const venue = (acc.tenDiaDiemPhuTrach || acc.tenDiaDiem || '').toLowerCase();

      return uName.includes(keyword) || fName.includes(keyword) || phone.includes(keyword) || mail.includes(keyword) || venue.includes(keyword);
    }
    return true;
  });

  if (filtered.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="9" style="text-align:center; color: var(--text-muted); padding: 3.5rem;">
      <svg width="44" height="44" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="margin: 0 auto 0.75rem auto; display: block; opacity: 0.35;">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
      </svg>
      Không tìm thấy tài khoản nào khớp với bộ lọc tìm kiếm.
    </td></tr>`;
    return;
  }

  // Thông tin user hiện tại đang đăng nhập để kiểm soát quyền
  const currentUser = typeof getUser === 'function' ? getUser() : null;
  const currentUsername = currentUser ? (currentUser.tenDangNhap || '').toLowerCase() : '';
  const currentUserRole = currentUser ? (currentUser.role || currentUser.vaiTro || '').toUpperCase() : '';
  const isCurrentStaff = currentUserRole.includes('STAFF') || currentUserRole.includes('NHANVIEN');

  tableBody.innerHTML = filtered.map(acc => {
    const isLocked = acc.trangThai === 'Khoa';
    const isSelf = (acc.tenDangNhap || '').toLowerCase() === currentUsername;
    const isTargetAdmin = acc.role === 'ADMIN';
    const isTargetStaff = acc.role === 'STAFF';

    // Xác định vai trò badge
    let roleBadge = `<span class="badge badge-role-customer">CUSTOMER</span>`;
    if (acc.role === 'ADMIN') {
      roleBadge = `<span class="badge badge-role-admin">ADMIN</span>`;
    } else if (acc.role === 'STAFF') {
      roleBadge = `<span class="badge badge-role-staff">STAFF</span>`;
    }

    // Hiển thị cơ sở làm việc
    let venueDisplay = `<span style="color: var(--text-muted); font-size: 0.8rem;">Toàn hệ thống</span>`;
    const venueName = acc.tenDiaDiemPhuTrach || acc.tenDiaDiem;
    if (acc.role === 'STAFF') {
      venueDisplay = venueName 
        ? `<strong style="color: #047857; font-size: 0.85rem;">${venueName}</strong>` 
        : `<span style="color: #b45309; font-size: 0.8rem;">Chưa phân công</span>`;
    } else if (acc.role === 'CUSTOMER') {
      venueDisplay = `<span style="color: var(--text-muted); font-size: 0.8rem;">Khách đặt sân</span>`;
    }

    // Quyền khóa:
    // - Không được khóa chính mình
    // - Không được khóa ADMIN
    // - STAFF không được khóa ADMIN hay STAFF khác
    let disableLock = false;
    let lockTooltip = isLocked ? 'Mở khóa tài khoản' : 'Khóa tài khoản này';

    if (isSelf) {
      disableLock = true;
      lockTooltip = 'Không thể tự khóa tài khoản của chính bạn';
    } else if (isTargetAdmin) {
      disableLock = true;
      lockTooltip = 'Không thể khóa tài khoản Quản trị viên (ADMIN)';
    } else if (isCurrentStaff && (isTargetStaff || isTargetAdmin)) {
      disableLock = true;
      lockTooltip = 'Nhân viên không có quyền khóa tài khoản Quản trị hoặc Nhân viên khác';
    }

    // Quyền sửa:
    // - STAFF không được sửa ADMIN hoặc STAFF khác
    let disableEdit = false;
    let editTooltip = 'Chỉnh sửa thông tin';
    if (isCurrentStaff && (isTargetStaff || isTargetAdmin) && !isSelf) {
      disableEdit = true;
      editTooltip = 'Nhân viên không có quyền chỉnh sửa tài khoản Quản trị hoặc Nhân viên khác';
    }

    const safeUsername = (acc.tenDangNhap || '').replace(/'/g, "\\'");
    const lockBtnClass = isLocked ? 'btn-success' : 'btn-danger';
    const lockBtnText = isLocked ? 'Mở khóa' : 'Khóa';

    return `
      <tr>
        <td>
          <strong style="color: var(--text-main); font-size: 0.92rem;">@${acc.tenDangNhap}</strong><br>
          <small style="color: var(--text-muted); font-size: 0.75rem;">ID: #${acc.maTK}</small>
        </td>
        <td>
          <strong>${acc.hoTen || '--'}</strong>
          ${acc.soLanNoShow > 0 ? `<br><small class="badge badge-danger" style="font-size: 0.7rem; padding: 1px 5px;">No-Show: ${acc.soLanNoShow} lần</small>` : ''}
        </td>
        <td>${acc.sdt || '<span style="color:var(--text-muted); font-size:0.8rem;">Chưa có</span>'}</td>
        <td>${acc.email || '<span style="color:var(--text-muted); font-size:0.8rem;">Chưa có</span>'}</td>
        <td>${roleBadge}</td>
        <td>${venueDisplay}</td>
        <td>${badgeTrangThai(acc.trangThai)}</td>
        <td><small style="color: var(--text-muted); font-weight: 500;">${formatNgayGio(acc.ngayTao)}</small></td>
        <td class="col-actions" style="text-align: right; white-space: nowrap; min-width: 180px;">
          <button type="button" class="btn btn-sm btn-outline" style="padding: 0.25rem 0.5rem; margin-right: 0.25rem;" onclick='openViewAccountModal(${JSON.stringify(acc)})' title="Xem chi tiết">
            Xem
          </button>
          <button type="button" class="btn btn-sm btn-outline" style="padding: 0.25rem 0.5rem; margin-right: 0.25rem;" ${disableEdit ? `disabled title="${editTooltip}"` : `title="${editTooltip}"`} onclick='openEditAccountModal(${JSON.stringify(acc)})'>
            Sửa
          </button>
          <button type="button" class="btn btn-sm ${lockBtnClass}" style="padding: 0.25rem 0.5rem;" ${disableLock ? `disabled title="${lockTooltip}"` : `title="${lockTooltip}"`} onclick="toggleAccountStatusSafe(${acc.maTK}, '${safeUsername}', '${acc.role}', '${acc.trangThai}')">
            ${lockBtnText}
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

// ----------------- Thao tác khóa / mở khóa an toàn -----------------
async function toggleAccountStatusSafe(maTK, username, role, currentStatus) {
  const isLocked = currentStatus === 'Khoa';
  const actionText = isLocked ? 'MỞ KHÓA' : 'KHÓA';
  const actionLower = isLocked ? 'mở khóa' : 'khóa';

  const confirmed = await showConfirmDialog(
    `Xác nhận ${actionLower} tài khoản`,
    `Bạn có chắc chắn muốn ${actionLower} tài khoản @${username} (Vai trò: ${role})?\n${!isLocked ? 'Sau khi khóa, người dùng sẽ không thể đăng nhập vào hệ thống.' : 'Sau khi mở khóa, người dùng có thể đăng nhập bình thường.'}`,
    { danger: !isLocked, confirmText: `Xác nhận ${actionText}`, cancelText: 'Hủy' }
  );
  if (!confirmed) return;

  try {
    await api.put(`/admin/accounts/${maTK}/status`);
    showAlert(`Đã ${actionLower} tài khoản @${username} thành công!`, 'success');
    loadAccounts();
  } catch (error) {
    showAlert(`Lỗi: ${error.message}`, 'danger');
  }
}

// ----------------- Modal Tạo Nhân Viên (Staff) -----------------
function openCreateStaffModal() {
  const form = document.getElementById('form-create-staff');
  if (form) form.reset();

  const venueSelect = document.getElementById('create-staff-venue');
  if (venueSelect && allVenuesForStaff.length > 0 && venueSelect.options.length <= 1) {
    venueSelect.innerHTML = `<option value="">-- Chọn chi nhánh sân làm việc --</option>` +
      allVenuesForStaff.map(v => `<option value="${v.maDiaDiem}">${v.tenDiaDiem}</option>`).join('');
  }

  const modal = document.getElementById('modal-create-staff');
  if (modal) modal.classList.remove('hidden');
}

function closeCreateStaffModal() {
  const modal = document.getElementById('modal-create-staff');
  if (modal) modal.classList.add('hidden');
}

async function submitCreateStaff(event) {
  if (event) event.preventDefault();

  const tenDangNhap = document.getElementById('create-staff-username').value.trim();
  const matKhau = document.getElementById('create-staff-password').value.trim();
  const confirmEl = document.getElementById('create-staff-confirm-password');
  const matKhauXacNhan = confirmEl ? confirmEl.value.trim() : matKhau;
  const hoTen = document.getElementById('create-staff-fullname').value.trim();
  const sdt = document.getElementById('create-staff-phone').value.trim();
  const emailVal = document.getElementById('create-staff-email') ? document.getElementById('create-staff-email').value.trim() : '';
  const email = emailVal || null;
  const venueEl = document.getElementById('create-staff-venue');
  const maDiaDiemVal = venueEl ? venueEl.value : '';
  const maDiaDiem = maDiaDiemVal ? parseInt(maDiaDiemVal) : null;

  if (!tenDangNhap || !matKhau || !hoTen || !sdt) {
    showAlert('Vui lòng điền đầy đủ các thông tin bắt buộc (*)', 'warning');
    return;
  }

  if (tenDangNhap.length < 3) {
    showAlert('Tên đăng nhập phải có tối thiểu 3 ký tự trở lên', 'warning');
    return;
  }

  if (matKhau.length < 6) {
    showAlert('Mật khẩu ban đầu phải từ 6 ký tự trở lên', 'warning');
    return;
  }

  if (confirmEl && matKhau !== matKhauXacNhan) {
    showAlert('Mật khẩu xác nhận không khớp với mật khẩu ban đầu!', 'warning');
    confirmEl.focus();
    return;
  }

  if (!/^0[0-9]{9}$/.test(sdt)) {
    showAlert('Số điện thoại phải gồm 10 chữ số và bắt đầu bằng số 0 (VD: 0912345678)!', 'warning');
    document.getElementById('create-staff-phone').focus();
    return;
  }

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showAlert('Email không đúng định dạng (VD: staff@example.com)!', 'warning');
    document.getElementById('create-staff-email').focus();
    return;
  }

  const btn = document.getElementById('btn-submit-create-staff');
  if (btn) btn.disabled = true;

  try {
    await api.post('/admin/staff', {
      tenDangNhap,
      matKhau,
      hoTen,
      sdt,
      email,
      maDiaDiem
    });
    showAlert(`Tạo tài khoản nhân viên @${tenDangNhap} (${hoTen}) thành công!`, 'success');
    closeCreateStaffModal();
    await loadAccounts();
  } catch (error) {
    showAlert(`Lỗi tạo nhân viên: ${error.message}`, 'danger');
  } finally {
    if (btn) btn.disabled = false;
  }
}

// ----------------- Modal Xem Chi Tiết Tài Khoản -----------------
function openViewAccountModal(account) {
  const modal = document.getElementById('modal-view-account');
  const container = document.getElementById('view-account-content');
  if (!modal || !container) return;

  let roleBadge = `<span class="badge badge-role-customer">CUSTOMER</span>`;
  if (account.role === 'ADMIN') roleBadge = `<span class="badge badge-role-admin">ADMIN</span>`;
  else if (account.role === 'STAFF') roleBadge = `<span class="badge badge-role-staff">STAFF</span>`;

  const venueName = account.tenDiaDiemPhuTrach || account.tenDiaDiem;
  let venueDisplay = 'Khách đặt sân';
  if (account.role === 'ADMIN') venueDisplay = 'Toàn quyền hệ thống (Admin)';
  else if (account.role === 'STAFF') venueDisplay = venueName || 'Chưa phân công cơ sở';

  container.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 0.85rem; font-size: 0.9rem;">
      <div style="display: flex; justify-content: space-between; border-bottom: 1px solid var(--border); padding-bottom: 0.5rem;">
        <span style="color: var(--text-muted);">Mã tài khoản (ID):</span>
        <strong>#${account.maTK}</strong>
      </div>
      <div style="display: flex; justify-content: space-between; border-bottom: 1px solid var(--border); padding-bottom: 0.5rem;">
        <span style="color: var(--text-muted);">Tên đăng nhập:</span>
        <strong style="color: var(--primary-dark);">@${account.tenDangNhap}</strong>
      </div>
      <div style="display: flex; justify-content: space-between; border-bottom: 1px solid var(--border); padding-bottom: 0.5rem;">
        <span style="color: var(--text-muted);">Vai trò:</span>
        <div>${roleBadge}</div>
      </div>
      <div style="display: flex; justify-content: space-between; border-bottom: 1px solid var(--border); padding-bottom: 0.5rem;">
        <span style="color: var(--text-muted);">Họ và tên:</span>
        <strong>${account.hoTen || '--'}</strong>
      </div>
      <div style="display: flex; justify-content: space-between; border-bottom: 1px solid var(--border); padding-bottom: 0.5rem;">
        <span style="color: var(--text-muted);">Số điện thoại:</span>
        <strong>${account.sdt || '--'}</strong>
      </div>
      <div style="display: flex; justify-content: space-between; border-bottom: 1px solid var(--border); padding-bottom: 0.5rem;">
        <span style="color: var(--text-muted);">Email:</span>
        <span>${account.email || 'Chưa cung cấp'}</span>
      </div>
      <div style="display: flex; justify-content: space-between; border-bottom: 1px solid var(--border); padding-bottom: 0.5rem;">
        <span style="color: var(--text-muted);">Cơ sở phân công:</span>
        <strong style="color: #047857;">${venueDisplay}</strong>
      </div>
      <div style="display: flex; justify-content: space-between; border-bottom: 1px solid var(--border); padding-bottom: 0.5rem;">
        <span style="color: var(--text-muted);">Trạng thái tài khoản:</span>
        <div>${badgeTrangThai(account.trangThai)}</div>
      </div>
      <div style="display: flex; justify-content: space-between;">
        <span style="color: var(--text-muted);">Ngày đăng ký / tạo:</span>
        <span>${formatNgayGio(account.ngayTao)}</span>
      </div>
    </div>
  `;

  modal.classList.remove('hidden');
}

function closeViewAccountModal() {
  const modal = document.getElementById('modal-view-account');
  if (modal) modal.classList.add('hidden');
}

// ----------------- Modal Chỉnh Sửa Tài Khoản -----------------
function openEditAccountModal(account) {
  document.getElementById('edit-acc-maTK').value = account.maTK;
  document.getElementById('edit-acc-username').value = `@${account.tenDangNhap}`;
  document.getElementById('edit-acc-role').value = account.role;
  document.getElementById('edit-acc-fullname').value = account.hoTen || '';
  document.getElementById('edit-acc-phone').value = account.sdt || '';
  document.getElementById('edit-acc-email').value = account.email || '';
  document.getElementById('edit-acc-password').value = '';

  const venueContainer = document.getElementById('edit-acc-venue-container');
  const venueSelect = document.getElementById('edit-acc-venue');

  // Chỉ hiển thị phân công cơ sở nếu tài khoản là STAFF
  if (account.role === 'STAFF') {
    if (venueContainer) venueContainer.style.display = 'block';
    if (venueSelect) {
      if (allVenuesForStaff.length > 0 && venueSelect.options.length <= 1) {
        venueSelect.innerHTML = `<option value="">-- Chưa phân công --</option>` +
          allVenuesForStaff.map(v => `<option value="${v.maDiaDiem}">${v.tenDiaDiem}</option>`).join('');
      }
      venueSelect.value = account.maDiaDiemPhuTrach || account.maDiaDiem || '';
    }
  } else {
    if (venueContainer) venueContainer.style.display = 'none';
    if (venueSelect) venueSelect.value = '';
  }

  const modal = document.getElementById('modal-edit-account');
  if (modal) modal.classList.remove('hidden');
}

function closeEditAccountModal() {
  const modal = document.getElementById('modal-edit-account');
  if (modal) modal.classList.add('hidden');
}

async function submitEditAccount(event) {
  if (event) event.preventDefault();

  const maTK = document.getElementById('edit-acc-maTK').value;
  const role = document.getElementById('edit-acc-role').value;
  const hoTen = document.getElementById('edit-acc-fullname').value.trim();
  const sdt = document.getElementById('edit-acc-phone').value.trim();
  const emailVal = document.getElementById('edit-acc-email') ? document.getElementById('edit-acc-email').value.trim() : '';
  const email = emailVal || null;
  const matKhau = document.getElementById('edit-acc-password').value.trim();
  const venueSelect = document.getElementById('edit-acc-venue');
  const maDiaDiem = (role === 'STAFF' && venueSelect && venueSelect.value) ? parseInt(venueSelect.value) : null;

  if (!hoTen || !sdt) {
    showAlert('Họ tên và Số điện thoại là bắt buộc!', 'warning');
    return;
  }

  if (!/^0[0-9]{9}$/.test(sdt)) {
    showAlert('Số điện thoại phải gồm 10 chữ số và bắt đầu bằng số 0 (VD: 0912345678)!', 'warning');
    document.getElementById('edit-acc-phone').focus();
    return;
  }

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showAlert('Email không đúng định dạng (VD: example@email.com)!', 'warning');
    document.getElementById('edit-acc-email').focus();
    return;
  }

  if (matKhau && matKhau.length < 6) {
    showAlert('Mật khẩu mới phải có tối thiểu 6 ký tự trở lên!', 'warning');
    document.getElementById('edit-acc-password').focus();
    return;
  }

  const payload = {
    hoTen,
    sdt,
    email,
    maDiaDiem,
    matKhau: matKhau || null
  };

  const btn = document.getElementById('btn-submit-edit-account');
  if (btn) btn.disabled = true;

  try {
    await api.put(`/admin/accounts/${maTK}`, payload);
    showAlert(`Cập nhật thông tin tài khoản #${maTK} thành công!`, 'success');
    closeEditAccountModal();
    await loadAccounts();
  } catch (error) {
    showAlert(`Lỗi cập nhật: ${error.message}`, 'danger');
  } finally {
    if (btn) btn.disabled = false;
  }
}

// ======================== 7. HỒ SƠ QUẢN TRỊ ("TÀI KHOẢN CỦA TÔI") ========================

async function loadAdminProfile() {
  try {
    const profile = await api.get('/admin/profile');
    if (!profile) return;

    // Header info
    const fullnameEl = document.getElementById('profile-header-fullname');
    const usernameEl = document.getElementById('profile-header-username');
    const roleBadgeEl = document.getElementById('profile-header-role-badge');
    const avatarLargeEl = document.getElementById('profile-avatar-large');

    if (fullnameEl) fullnameEl.textContent = profile.hoTen || profile.tenDangNhap;
    if (usernameEl) usernameEl.textContent = `@${profile.tenDangNhap}`;

    if (roleBadgeEl) {
      if (profile.role === 'ADMIN') {
        roleBadgeEl.innerHTML = `<span class="badge badge-role-admin">ADMIN</span>`;
      } else {
        roleBadgeEl.innerHTML = `<span class="badge badge-role-staff">STAFF</span>`;
      }
    }

    if (avatarLargeEl) {
      const name = (profile.hoTen || profile.tenDangNhap || 'AD').trim();
      const parts = name.split(/\s+/);
      const initials = parts.length > 1
        ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
        : name.substring(0, 2).toUpperCase();
      avatarLargeEl.textContent = initials;
    }

    // Metadata box
    const metaIdEl = document.getElementById('profile-meta-id');
    const metaVenueEl = document.getElementById('profile-meta-venue');
    const metaCreatedEl = document.getElementById('profile-meta-created');

    if (metaIdEl) metaIdEl.textContent = `#${profile.maTK}`;
    if (metaVenueEl) {
      metaVenueEl.textContent = profile.tenDiaDiem ? profile.tenDiaDiem : (profile.role === 'ADMIN' ? 'Toàn hệ thống (Admin)' : 'Chưa phân công');
    }
    if (metaCreatedEl) metaCreatedEl.textContent = formatNgayGio(profile.ngayTao || profile.ngayVaoLam);

    // Form inputs
    const inputFullname = document.getElementById('profile-input-fullname');
    const inputPhone = document.getElementById('profile-input-phone');
    const inputEmail = document.getElementById('profile-input-email');

    if (inputFullname) inputFullname.value = profile.hoTen || '';
    if (inputPhone) inputPhone.value = profile.sdt || '';
    if (inputEmail) inputEmail.value = profile.email || '';
  } catch (error) {
    showAlert(`Không thể tải thông tin hồ sơ: ${error.message}`, 'danger');
  }
}

async function submitUpdateProfile(event) {
  if (event) event.preventDefault();

  const hoTen = document.getElementById('profile-input-fullname').value.trim();
  const sdt = document.getElementById('profile-input-phone').value.trim();
  const emailVal = document.getElementById('profile-input-email') ? document.getElementById('profile-input-email').value.trim() : '';
  const email = emailVal || null;

  if (!hoTen || !sdt) {
    showAlert('Họ tên và Số điện thoại là bắt buộc!', 'warning');
    return;
  }

  if (!/^0[0-9]{9}$/.test(sdt)) {
    showAlert('Số điện thoại phải gồm 10 chữ số và bắt đầu bằng số 0 (VD: 0912345678)!', 'warning');
    document.getElementById('profile-input-phone').focus();
    return;
  }

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showAlert('Email không đúng định dạng (VD: example@email.com)!', 'warning');
    document.getElementById('profile-input-email').focus();
    return;
  }

  const btn = document.getElementById('btn-submit-profile');
  if (btn) btn.disabled = true;

  try {
    const updated = await api.put('/admin/profile', { hoTen, sdt, email });
    showAlert('Cập nhật thông tin hồ sơ cá nhân thành công!', 'success');
    
    // Cập nhật lại session user hiện tại
    try {
      const user = typeof getUser === 'function' ? getUser() : {};
      if (user) {
        user.hoTen = hoTen;
        user.sdt = sdt;
        user.email = email;
        sessionStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('user', JSON.stringify(user));
      }
      sessionStorage.setItem('hoTen', hoTen);
      localStorage.setItem('hoTen', hoTen);
    } catch (e) {}

    // Cập nhật ngay lập tức thông tin trên Header & Sidebar
    const nameEl = document.getElementById('admin-display-name');
    if (nameEl) nameEl.textContent = hoTen;
    const initialsEl = document.getElementById('admin-avatar-initials');
    if (initialsEl) {
      const parts = hoTen.split(/\s+/);
      initialsEl.textContent = parts.length > 1
        ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
        : hoTen.substring(0, 2).toUpperCase();
    }

    if (typeof initAdminLayout === 'function') initAdminLayout();
    await loadAdminProfile();
  } catch (error) {
    showAlert(`Lỗi cập nhật hồ sơ: ${error.message}`, 'danger');
  } finally {
    if (btn) btn.disabled = false;
  }
}

async function submitChangePassword(event) {
  if (event) event.preventDefault();

  const matKhauHienTai = document.getElementById('pwd-current').value;
  const matKhauMoi = document.getElementById('pwd-new').value;
  const matKhauXacNhan = document.getElementById('pwd-confirm').value;

  if (!matKhauHienTai || !matKhauMoi) {
    showAlert('Vui lòng nhập mật khẩu hiện tại và mật khẩu mới!', 'warning');
    return;
  }

  if (matKhauMoi.length < 6) {
    showAlert('Mật khẩu mới phải có tối thiểu 6 ký tự trở lên!', 'warning');
    return;
  }

  if (matKhauMoi !== matKhauXacNhan) {
    showAlert('Mật khẩu xác nhận không khớp với mật khẩu mới!', 'warning');
    return;
  }

  const btn = document.getElementById('btn-submit-password');
  if (btn) btn.disabled = true;

  try {
    await api.put('/admin/profile/password', {
      matKhauHienTai,
      matKhauMoi
    });
    showAlert('Đổi mật khẩu thành công! Hãy ghi nhớ mật khẩu mới của bạn.', 'success');
    document.getElementById('form-change-password').reset();
  } catch (error) {
    showAlert(`Lỗi đổi mật khẩu: ${error.message}`, 'danger');
  } finally {
    if (btn) btn.disabled = false;
  }
}

// ======================== 8. NHẬT KÝ HOẠT ĐỘNG (AUDIT LOGS) ========================

function openAuditLogModal() {
  const modal = document.getElementById('modal-audit-log');
  if (modal) {
    modal.classList.remove('hidden');
    loadAuditLogs();
  }
}

function closeAuditLogModal() {
  const modal = document.getElementById('modal-audit-log');
  if (modal) modal.classList.add('hidden');
}

async function loadAuditLogs() {
  const tableBody = document.getElementById('audit-logs-table-body');
  if (!tableBody) return;

  tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 2rem; color: var(--text-muted);">Đang tải 50 hoạt động gần nhất...</td></tr>`;

  try {
    const logs = await api.get('/admin/audit-logs');
    if (!logs || logs.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 2rem; color: var(--text-muted);">Chưa có nhật ký hoạt động nào được ghi nhận.</td></tr>`;
      return;
    }

    tableBody.innerHTML = logs.map(l => {
      let roleBadge = `<span class="badge badge-secondary" style="font-size:0.7rem;">${l.vaiTro || 'USER'}</span>`;
      if ((l.vaiTro || '').toUpperCase() === 'ADMIN') roleBadge = `<span class="badge badge-role-admin" style="font-size:0.7rem;">ADMIN</span>`;
      else if ((l.vaiTro || '').toUpperCase() === 'STAFF') roleBadge = `<span class="badge badge-role-staff" style="font-size:0.7rem;">STAFF</span>`;

      return `
        <tr>
          <td><small style="color:var(--text-muted); font-weight:600;">${formatNgayGio(l.thoiGian)}</small></td>
          <td>
            <strong>${l.nguoiThucHien}</strong><br>
            ${roleBadge}
          </td>
          <td><strong style="color: var(--primary-dark);">${l.hanhDong}</strong></td>
          <td>${l.doiTuong || '--'}</td>
          <td><span class="badge badge-success" style="font-size:0.75rem;">${l.ketQua || 'Thành công'}</span></td>
          <td><small style="color:var(--text-secondary);">${l.chiTiet || '--'}</small></td>
        </tr>
      `;
    }).join('');
  } catch (error) {
    tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; color: var(--danger); padding: 1.5rem;">Không thể tải nhật ký: ${error.message}</td></tr>`;
  }
}
