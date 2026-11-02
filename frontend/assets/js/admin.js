/**
 * Admin & Staff JavaScript Functions
 * Đồng bộ toàn diện theo Báo cáo Đặc tả phần mềm (Kịch bản 1 & 2)
 */

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.add('hidden');
}

// ======================== 1. DASHBOARD ========================

async function loadDashboard() {
  const monthInput = document.getElementById('input-thang');
  const yearInput = document.getElementById('input-nam');
  const totalRevenueEl = document.getElementById('stat-total-revenue');
  const totalBookingsEl = document.getElementById('stat-total-bookings');
  const yearRevenueEl = document.getElementById('stat-year-revenue');

  const now = new Date();
  const thang = monthInput && monthInput.value ? parseInt(monthInput.value) : (now.getMonth() + 1);
  const nam = yearInput && yearInput.value ? parseInt(yearInput.value) : now.getFullYear();

  if (monthInput && !monthInput.value) monthInput.value = thang;
  if (yearInput && !yearInput.value) yearInput.value = nam;

  try {
    const monthData = await api.get('/admin/revenue/month', { nam, thang });
    if (totalRevenueEl) totalRevenueEl.textContent = formatTien(monthData.tongDoanhThu);
    if (totalBookingsEl) totalBookingsEl.textContent = `${monthData.soDon || 0} đơn`;

    const yearData = await api.get('/admin/revenue/year', { nam });
    if (yearRevenueEl) yearRevenueEl.textContent = formatTien(yearData.tongDoanhThu);
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
        actionButtons += `<button class="btn btn-sm btn-primary" style="font-weight:700;" onclick="checkInBooking(${b.maDatSan})">🏸 Check-in</button> `;
        actionButtons += `<button class="btn btn-sm btn-outline" style="color: var(--danger); border-color: var(--danger);" onclick="cancelNoShowBooking(${b.maDatSan})" title="Khách không đến nhận sân sau 30 phút">No-Show</button> `;
      }

      // 3. Kịch bản 2 - Bước 4 & 5: Đang chơi -> Thêm dịch vụ hoặc Check-out xuất hóa đơn
      if (trangThaiDat === 'DangChoi') {
        actionButtons += `<button class="btn btn-sm btn-info" onclick="openAddServiceModal(${b.maDatSan})">➕ Dịch vụ</button> `;
        actionButtons += `<button class="btn btn-sm btn-warning" style="font-weight:700;" onclick="openCheckOutModal(${b.maDatSan})">🧾 Check-out</button> `;
      }

      // 4. Nút hủy đơn (nếu chưa hoàn thành hoặc chưa hủy)
      if (trangThaiDat === 'ChoXacNhan' || trangThaiDat === 'DaXacNhan') {
        actionButtons += `<button class="btn btn-sm btn-danger" onclick="openCancelBookingModal(${b.maDatSan})">Hủy</button> `;
      }

      // Luôn có nút xem chi tiết hóa đơn/lịch trình
      actionButtons += `<button class="btn btn-sm btn-outline" onclick="openBookingDetailModal(${b.maDatSan})">👁️</button>`;

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
            <strong>${formatTien(b.tienSan || b.soTien)}</strong>
            ${b.tienQuaGio > 0 ? `<br><small style="color:#b45309;">+${formatTien(b.tienQuaGio)} lố giờ</small>` : ''}
          </td>
          <td>
            ${renderPaymentBadge(b.phuongThucThanhToan)}<br>
            <small>${badgeTrangThai(b.trangThaiThanhToan)}</small>
          </td>
          <td>${badgeTrangThai(b.trangThaiDat)}</td>
          <td>${actionButtons}</td>
        </tr>
      `;
    }).join('');
  } catch (error) {
    tableBody.innerHTML = `<tr><td colspan="8" style="text-align:center; color: var(--danger);">Lỗi tải dữ liệu: ${error.message}</td></tr>`;
  }
}

function renderPaymentBadge(pttt) {
  if (pttt === 'QR') return '<span class="badge badge-info">VietQR</span>';
  if (pttt === 'VNPay') return '<span class="badge badge-primary">VNPay</span>';
  if (pttt === 'MoMo') return '<span class="badge badge-orange">MoMo</span>';
  return '<span class="badge badge-secondary">Tiền mặt</span>';
}

// ----------------- Thao tác Check-in -----------------
async function checkInBooking(maDatSan) {
  if (!confirm(`Xác nhận Check-in cho đơn #${maDatSan}? Khách sẽ vào sân bắt đầu ca chơi.`)) return;

  try {
    await api.put(`/admin/bookings/${maDatSan}/check-in`);
    showAlert(`✅ Check-in thành công cho đơn #${maDatSan}! Trạng thái chuyển sang Đang chơi.`, 'success');
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
    document.getElementById('service-court-name').textContent = `${booking.tenSan} (${booking.tenDiaDiem})`;
    document.getElementById('input-service-quantity').value = 1;
    document.getElementById('input-service-note').value = '';

    // Render danh sách dịch vụ đã dùng
    renderAlreadyUsedServices(booking.danhSachDichVu || []);

    // Fetch danh sách dịch vụ tại cơ sở này
    const allServices = await api.get('/admin/services');
    // Lọc theo địa điểm của sân
    currentVenueServices = (allServices || []).filter(s => s.trangThai === 'HoatDong');

    const selectEl = document.getElementById('select-service-item');
    if (currentVenueServices.length === 0) {
      selectEl.innerHTML = `<option value="">-- Chưa có dịch vụ nào đang bán tại cơ sở này --</option>`;
    } else {
      selectEl.innerHTML = `<option value="">-- Chọn dịch vụ / vật phẩm --</option>` +
        currentVenueServices.map(s => `
          <option value="${s.maDV}" data-price="${s.donGia}" data-stock="${s.soLuongTon}">
            ${s.tenDV} (${s.loaiDV === 'ChoThue' ? 'Thuê' : 'Bán'}) — ${formatTien(s.donGia)} (Còn ${s.soLuongTon})
          </option>
        `).join('');
    }

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
          <button type="button" class="btn btn-sm btn-outline" style="color:var(--danger); border-color:var(--danger); padding:0.1rem 0.4rem; font-size:0.75rem;" onclick="removeServiceFromBooking(${item.maCTDV})" title="Xóa món này (trả kho)">✕</button>
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
  calculateServiceSubtotal();
}

function calculateServiceSubtotal() {
  const select = document.getElementById('select-service-item');
  const qtyInput = document.getElementById('input-service-quantity');
  const display = document.getElementById('display-service-subtotal');

  if (!select || !qtyInput || !display) return;

  const selectedOpt = select.options[select.selectedIndex];
  const price = selectedOpt && selectedOpt.dataset.price ? parseFloat(selectedOpt.dataset.price) : 0;
  const qty = parseInt(qtyInput.value) || 0;

  display.value = formatTien(price * qty);
}

async function submitAddService(event) {
  if (event) event.preventDefault();

  const maDatSan = document.getElementById('service-booking-id-val').value;
  const select = document.getElementById('select-service-item');
  const maDV = select ? select.value : null;
  const soLuong = parseInt(document.getElementById('input-service-quantity').value) || 1;
  const ghiChu = (document.getElementById('input-service-note').value || '').trim() || null;

  if (!maDV) {
    alert('Vui lòng chọn một dịch vụ cần thêm!');
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
    calculateServiceSubtotal();

    loadBookings();
  } catch (error) {
    alert(`Lỗi thêm dịch vụ: ${error.message}`);
  } finally {
    if (btn) btn.disabled = false;
  }
}

async function removeServiceFromBooking(maCTDV) {
  if (!activeBookingForServices) return;
  if (!confirm('Xác nhận xóa dịch vụ này khỏi đơn? Số lượng sẽ được hoàn lại kho.')) return;

  try {
    const updated = await api.delete(`/admin/bookings/${activeBookingForServices.maDatSan}/services/${maCTDV}`);
    showAlert('Đã xóa dịch vụ và hoàn trả tồn kho!', 'success');
    activeBookingForServices = updated;
    renderAlreadyUsedServices(updated.danhSachDichVu || []);
    loadBookings();
  } catch (error) {
    alert(`Lỗi xóa dịch vụ: ${error.message}`);
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

    showAlert(`✅ Đã Check-out & Hoàn tất hóa đơn cho đơn #${maDatSan}!`, 'success');
    closeModal('modal-checkout-invoice');
    loadBookings();
  } catch (error) {
    alert(`Lỗi check-out: ${error.message}`);
  } finally {
    if (btn) btn.disabled = false;
  }
}

// ----------------- Thao tác Xem Chi Tiết Đơn / Hóa Đơn -----------------
async function openBookingDetailModal(maDatSan) {
  try {
    const b = await api.get(`/admin/bookings/${maDatSan}`);
    const body = document.getElementById('detail-modal-body');
    document.getElementById('detail-modal-title').textContent = `📋 Chi tiết đơn đặt sân #${b.maDatSan}`;

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
      refundBlock = `
        <div style="background:#fef2f2; border:1px solid #fecaca; border-radius:var(--radius-sm); padding:0.75rem; margin-top:0.75rem;">
          <h4 style="color:#b91c1c; font-size:0.9rem; margin-bottom:0.25rem;">Thông tin hủy & hoàn tiền:</h4>
          <div><strong>Lý do:</strong> ${b.thongTinHoanTien.lyDo}</div>
          <div><strong>Loại hủy:</strong> ${b.thongTinHoanTien.loaiHuy} | <strong>Tỷ lệ hoàn:</strong> ${b.thongTinHoanTien.tyLeHoan}%</div>
          <div><strong>Số tiền hoàn:</strong> <strong style="color:#b91c1c;">${formatTien(b.thongTinHoanTien.soTienHoan)}</strong> (${b.thongTinHoanTien.trangThai})</div>
        </div>
      `;
    }

    let invoiceBlock = '';
    if (b.hoaDon) {
      invoiceBlock = `
        <div style="background:#f0fdf4; border:1px solid #bbf7d0; border-radius:var(--radius-sm); padding:0.75rem; margin-top:0.75rem;">
          <h4 style="color:#166534; font-size:0.9rem; margin-bottom:0.25rem;">Hóa đơn thanh toán (#${b.hoaDon.maHoaDon}):</h4>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.25rem; font-size:0.85rem;">
            <div>Tiền sân: <strong>${formatTien(b.hoaDon.tongTienSan)}</strong></div>
            <div>Tiền dịch vụ: <strong>${formatTien(b.hoaDon.tongTienDV)}</strong></div>
            <div>Tiền quá giờ: <strong>${formatTien(b.hoaDon.tienQuaGio)}</strong></div>
            <div>Đã thanh toán trước: <strong>${formatTien(b.hoaDon.tienTraTruoc)}</strong></div>
          </div>
          <div style="margin-top:0.4rem; padding-top:0.4rem; border-top:1px dashed #86efac; font-weight:700;">
            Khoản thu phát sinh: <span style="color:#15803d; font-size:1.05rem;">${formatTien(b.hoaDon.thanhTien)}</span> (${b.hoaDon.trangThai})
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
    `;

    document.getElementById('modal-booking-detail').classList.remove('hidden');
  } catch (error) {
    showAlert(`Lỗi xem chi tiết: ${error.message}`, 'danger');
  }
}

// ----------------- Thao tác Khách không đến (No-Show) -----------------
async function cancelNoShowBooking(maDatSan) {
  if (!confirm(`Xác nhận hủy đơn #${maDatSan} do khách không đến nhận sân sau 30 phút (No-Show)?\nTheo quy định: Khách không được hoàn tiền sân.`)) return;

  try {
    await api.put(`/admin/bookings/${maDatSan}/no-show`);
    showAlert(`Đã ghi nhận No-Show cho đơn #${maDatSan}. Sân đã được giải phóng.`, 'success');
    loadBookings();
  } catch (error) {
    showAlert(`Lỗi: ${error.message}`, 'danger');
  }
}

async function confirmCashBooking(maDatSan) {
  if (!confirm(`Xác nhận đã nhận tiền mặt cho đơn #${maDatSan}?`)) return;

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
      tableBody.innerHTML = `<tr><td colspan="8" style="text-align:center; color: var(--text-muted);">Không có yêu cầu hủy nào đang chờ duyệt.</td></tr>`;
      return;
    }

    tableBody.innerHTML = bookings.map(b => `
      <tr>
        <td><strong>#${b.maDatSan}</strong></td>
        <td>${b.hoTenKhachHang || 'N/A'}<br><small>${b.sdtKhachHang || ''}</small></td>
        <td>${b.tenDiaDiem || 'N/A'} - ${b.tenSan || 'N/A'}</td>
        <td>${formatNgay(b.ngayChoi)}<br><small>${formatGio(b.gioBatDau)} - ${formatGio(b.gioKetThuc)}</small></td>
        <td><strong>${formatTien(b.tienSan || b.soTien)}</strong></td>
        <td>${badgeTrangThai(b.trangThaiThanhToan)}</td>
        <td>${b.ghiChu || 'Khách yêu cầu hủy đơn'}</td>
        <td>
          <button class="btn btn-sm btn-success" onclick="approveCancelRequest(${b.maDatSan}, true)">Đồng ý hoàn tiền</button>
          <button class="btn btn-sm btn-danger" onclick="approveCancelRequest(${b.maDatSan}, false)">Từ chối</button>
        </td>
      </tr>
    `).join('');
  } catch (error) {
    tableBody.innerHTML = `<tr><td colspan="8" style="text-align:center; color: var(--danger);">Lỗi tải dữ liệu: ${error.message}</td></tr>`;
  }
}

async function approveCancelRequest(maDatSan, dongY) {
  const actionText = dongY ? 'ĐỒNG Ý' : 'TỪ CHỐI';
  if (!confirm(`Bạn có chắc chắn muốn ${actionText} yêu cầu hủy cho đơn #${maDatSan}?`)) return;

  try {
    await api.put(`/admin/bookings/${maDatSan}/approve-cancel`, {
      dongY: dongY,
      ghiChu: dongY ? 'Admin chấp nhận yêu cầu hủy và hoàn tiền theo chính sách' : 'Admin từ chối yêu cầu hủy'
    });
    showAlert(`Đã ${actionText.toLowerCase()} yêu cầu hủy đơn #${maDatSan} thành công!`, 'success');
    loadCancelRequests();
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
            <span class="badge ${s.soLuongTon > 10 ? 'badge-success' : 'badge-danger'}">
              ${s.soLuongTon} cái/chai
            </span>
          </td>
          <td>${badgeTrangThai(s.trangThai)}</td>
          <td>
            <button class="btn btn-sm btn-outline" onclick='openEditServiceModal(${JSON.stringify(s)})'>✏️ Sửa</button>
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
    alert(`Lỗi: ${error.message}`);
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

// ======================== 5. QUẢN LÝ SÂN ========================

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

async function loadCourts() {
  const container = document.getElementById('courts-list-container');
  if (!container) return;

  container.innerHTML = `<p style="text-align:center;">Đang tải danh sách sân...</p>`;

  try {
    const courts = await api.get('/admin/courts');

    if (!courts || courts.length === 0) {
      container.innerHTML = `<p style="text-align:center; color: var(--text-muted);">Chưa có địa điểm/sân nào. Vui lòng thêm địa điểm mới ở form bên trên.</p>`;
      return;
    }

    container.innerHTML = courts.map(dd => `
      <div class="court-card">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
          <div>
            <h3 style="font-size: 1.15rem; color: var(--primary-dark); font-weight: 700;">#${dd.maDiaDiem} - ${dd.tenDiaDiem}</h3>
            <p style="color: var(--text-muted); font-size: 0.875rem;">
              Giờ mở cửa: <strong>${formatGio(dd.gioMo)} - ${formatGio(dd.gioDong)}</strong> |
              Trạng thái: ${badgeTrangThai(dd.trangThai)} |
              Số sân con: <strong>${(dd.danhSachSan || []).length} sân</strong>
              ${dd.mapLink ? ` | <a href="${dd.mapLink}" target="_blank" style="color: var(--primary-dark); text-decoration: underline;">📍 Google Maps ↗</a>` : ''}
            </p>
          </div>
          <button class="btn btn-sm btn-outline" onclick='openEditCourtModal(${JSON.stringify(dd)})'>Sửa địa điểm</button>
        </div>

        <div class="table-responsive">
          <table class="data-table" style="font-size: 0.875rem;">
            <thead>
              <tr>
                <th>Mã sân</th>
                <th>Tên sân</th>
                <th>Hình ảnh</th>
                <th>Trạng thái</th>
                <th>Đổi trạng thái</th>
                <th>Cập nhật ảnh</th>
              </tr>
            </thead>
            <tbody>
              ${(dd.danhSachSan || []).map(s => {
                const imgOptions = availableCourtImages.map(img => 
                  `<option value="${img}" ${s.hinhAnh === img ? 'selected' : ''}>${img.split('/').pop()}</option>`
                ).join('');

                return `
                  <tr>
                    <td><strong>#${s.maSan}</strong></td>
                    <td>${s.tenSan}</td>
                    <td>
                      <img src="${s.hinhAnh || '/assets/images/courts.jpg'}" alt="${s.tenSan}" style="width: 50px; height: 32px; object-fit: cover; border-radius: 4px;" onerror="this.src='/assets/images/courts.jpg'">
                    </td>
                    <td>${badgeTrangThai(s.tinhTrang)}</td>
                    <td>
                      <select class="form-control" style="font-size: 0.8rem; padding: 0.25rem 0.5rem;" onchange="updateCourtStatus(${s.maSan}, this.value)">
                        <option value="HoatDong" ${s.tinhTrang === 'HoatDong' ? 'selected' : ''}>Hoạt động</option>
                        <option value="TamNgung" ${s.tinhTrang === 'TamNgung' ? 'selected' : ''}>Tạm ngưng</option>
                        <option value="BaoTri" ${s.tinhTrang === 'BaoTri' ? 'selected' : ''}>Bảo trì</option>
                      </select>
                    </td>
                    <td>
                      <div style="display: flex; gap: 0.25rem;">
                        <select id="court-img-${s.maSan}" class="form-control" style="font-size: 0.8rem; padding: 0.25rem 0.5rem;">
                          ${imgOptions}
                        </select>
                        <button class="btn btn-sm btn-outline" onclick="updateCourtImage(${s.maSan})">Lưu</button>
                      </div>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `).join('');
  } catch (error) {
    container.innerHTML = `<p style="text-align:center; color: var(--danger);">Lỗi tải danh sách sân: ${error.message}</p>`;
  }
}

async function createCourt(event) {
  if (event) event.preventDefault();

  const tenDiaDiem = document.getElementById('input-tenDiaDiem').value.trim();
  let gioMo = document.getElementById('input-gioMo').value.trim();
  let gioDong = document.getElementById('input-gioDong').value.trim();
  const soSanNho = parseInt(document.getElementById('input-soSanNho').value);
  const hinhAnh = document.getElementById('input-hinhAnh').value.trim();
  const mapLink = document.getElementById('input-mapLink').value.trim() || null;

  if (gioMo.length === 5) gioMo += ':00';
  if (gioDong.length === 5) gioDong += ':00';

  try {
    await api.post('/admin/courts', {
      tenDiaDiem,
      gioMo,
      gioDong,
      soSanNho,
      hinhAnh,
      mapLink
    });
    showAlert(`Đã thêm địa điểm "${tenDiaDiem}" cùng ${soSanNho} sân con thành công!`, 'success');
    document.getElementById('form-create-court').reset();
    loadCourts();
  } catch (error) {
    showAlert(`Lỗi tạo sân: ${error.message}`, 'danger');
  }
}

function openEditCourtModal(diaDiem) {
  document.getElementById('edit-maDiaDiem').value = diaDiem.maDiaDiem;
  document.getElementById('edit-tenMoi').value = diaDiem.tenDiaDiem || '';
  document.getElementById('edit-gioMo').value = formatGio(diaDiem.gioMo);
  document.getElementById('edit-gioDong').value = formatGio(diaDiem.gioDong);
  document.getElementById('edit-soSanNhoMoi').value = (diaDiem.danhSachSan || []).length;
  document.getElementById('edit-hinhAnh').value = (diaDiem.danhSachSan && diaDiem.danhSachSan[0]) ? (diaDiem.danhSachSan[0].hinhAnh || '') : '';
  document.getElementById('edit-mapLink').value = diaDiem.mapLink || '';

  document.getElementById('modal-edit-court').classList.remove('hidden');
}

function closeEditCourtModal() {
  document.getElementById('modal-edit-court').classList.add('hidden');
}

async function updateCourt(event) {
  if (event) event.preventDefault();

  const maDiaDiem = document.getElementById('edit-maDiaDiem').value;
  const tenMoi = document.getElementById('edit-tenMoi').value.trim();
  let gioMo = document.getElementById('edit-gioMo').value.trim();
  let gioDong = document.getElementById('edit-gioDong').value.trim();
  const soSanNhoMoi = parseInt(document.getElementById('edit-soSanNhoMoi').value);
  const hinhAnh = document.getElementById('edit-hinhAnh').value.trim();
  const mapLink = document.getElementById('edit-mapLink').value.trim() || null;

  if (gioMo.length === 5) gioMo += ':00';
  if (gioDong.length === 5) gioDong += ':00';

  try {
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

async function updateCourtStatus(maSan, tinhTrang) {
  try {
    await api.put(`/admin/courts/court/${maSan}/status`, { tinhTrang });
    showAlert(`Đã đổi trạng thái sân #${maSan} sang: ${tinhTrang}`, 'success');
    loadCourts();
  } catch (error) {
    showAlert(`Lỗi: ${error.message}`, 'danger');
  }
}

// ======================== 6. NGƯỜI DÙNG ========================

async function loadUsers() {
  const tableBody = document.getElementById('users-table-body');
  if (!tableBody) return;

  tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center;">Đang tải danh sách người dùng...</td></tr>`;

  try {
    const users = await api.get('/admin/users');

    if (!users || users.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center; color: var(--text-muted);">Không có người dùng nào.</td></tr>`;
      return;
    }

    tableBody.innerHTML = users.map(u => {
      const isLocked = u.trangThaiTaiKhoan === 'Khoa';
      const btnClass = isLocked ? 'btn-success' : 'btn-danger';
      const btnText = isLocked ? 'Mở khóa' : 'Khóa tài khoản';

      return `
        <tr>
          <td><strong>#${u.maKH}</strong></td>
          <td><strong>${u.hoTen}</strong></td>
          <td>${u.sdt}</td>
          <td>${u.email || '<span style="color: var(--text-muted); font-size: 0.8rem;">Chưa có</span>'}</td>
          <td><span class="badge ${u.soLanNoShow > 0 ? 'badge-danger' : 'badge-secondary'}">${u.soLanNoShow} lần</span></td>
          <td>${badgeTrangThai(u.trangThaiTaiKhoan || 'HoatDong')}</td>
          <td>
            <button class="btn btn-sm btn-outline" style="margin-right: 0.25rem;" onclick='openEditUserModal(${JSON.stringify(u)})'>✏️ Sửa</button>
            <button class="btn btn-sm ${btnClass}" onclick="toggleUserStatus(${u.maKH}, '${u.trangThaiTaiKhoan || 'HoatDong'}')">${btnText}</button>
          </td>
        </tr>
      `;
    }).join('');
  } catch (error) {
    tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center; color: var(--danger);">Lỗi tải dữ liệu: ${error.message}</td></tr>`;
  }
}

function openEditUserModal(user) {
  document.getElementById('edit-user-maKH').value = user.maKH;
  document.getElementById('edit-user-maKH-display').value = `#${user.maKH}`;
  document.getElementById('edit-user-hoTen').value = user.hoTen || '';
  document.getElementById('edit-user-sdt').value = user.sdt || '';
  document.getElementById('edit-user-email').value = user.email || '';
  document.getElementById('edit-user-noShow').value = `${user.soLanNoShow || 0} lần`;
  document.getElementById('edit-user-status').value = user.trangThaiTaiKhoan === 'Khoa' ? 'Đã khóa' : 'Hoạt động';

  document.getElementById('modal-edit-user').classList.remove('hidden');
}

function closeEditUserModal() {
  document.getElementById('modal-edit-user').classList.add('hidden');
}

async function updateUser(event) {
  if (event) event.preventDefault();

  const maKH = document.getElementById('edit-user-maKH').value;
  const hoTen = document.getElementById('edit-user-hoTen').value.trim();
  const sdt = document.getElementById('edit-user-sdt').value.trim();
  const email = document.getElementById('edit-user-email').value.trim();

  try {
    await api.put(`/admin/users/${maKH}`, { hoTen, sdt, email });
    showAlert(`Cập nhật thông tin khách hàng #${maKH} thành công!`, 'success');
    closeEditUserModal();
    loadUsers();
  } catch (error) {
    showAlert(`Lỗi cập nhật người dùng: ${error.message}`, 'danger');
  }
}

async function toggleUserStatus(maTK, currentStatus) {
  const action = currentStatus === 'Khoa' ? 'mở khóa' : 'khóa';
  if (!confirm(`Bạn có chắc muốn ${action} tài khoản này?`)) return;

  try {
    await api.put(`/admin/users/${maTK}/toggle-status`);
    showAlert(`Đã ${action} tài khoản thành công!`, 'success');
    loadUsers();
  } catch (error) {
    showAlert(`Lỗi: ${error.message}`, 'danger');
  }
}
