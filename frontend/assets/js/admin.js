/**
 * Admin JavaScript Functions
 */

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
    // 1. Thống kê theo tháng
    const monthData = await api.get('/admin/revenue/month', { nam, thang });
    if (totalRevenueEl) totalRevenueEl.textContent = formatTien(monthData.tongDoanhThu);
    if (totalBookingsEl) totalBookingsEl.textContent = `${monthData.soDon || 0} đơn`;

    // 2. Thống kê theo năm
    const yearData = await api.get('/admin/revenue/year', { nam });
    if (yearRevenueEl) yearRevenueEl.textContent = formatTien(yearData.tongDoanhThu);
  } catch (error) {
    showAlert(`Không thể tải dữ liệu thống kê: ${error.message}`, 'danger');
  }
}

// ======================== 2. QUẢN LÝ ĐẶT SÂN ========================

async function loadBookings() {
  const tableBody = document.getElementById('bookings-table-body');
  const statusFilter = document.getElementById('select-status-filter');
  const status = statusFilter ? statusFilter.value : '';

  if (!tableBody) return;
  tableBody.innerHTML = `<tr><td colspan="9" style="text-align:center;">Đang tải danh sách...</td></tr>`;

  try {
    // Gọi API lấy danh sách đơn (kèm filter status nếu có)
    const bookings = await api.get('/admin/bookings', { status });

    if (!bookings || bookings.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="9" style="text-align:center; color: var(--text-muted);">Không có đơn đặt sân nào.</td></tr>`;
      return;
    }

    tableBody.innerHTML = bookings.map(b => {
      const trangThaiDat = (b.trangThaiDat || '').trim();
      const pttt = (b.phuongThucThanhToan || '').trim();
      let actionButtons = '';

      // 1. Nút "Xác nhận" + "Hủy No-Show": CHỈ hiện khi phuongThucThanhToan = 'TienMat' VÀ trangThaiDat = 'ChoXacNhan'
      if (trangThaiDat === 'ChoXacNhan' && pttt === 'TienMat') {
        actionButtons += `<button class="btn btn-sm btn-success" onclick="confirmCashBooking(${b.maDatSan})">Xác nhận</button> `;
        actionButtons += `<button class="btn btn-sm btn-outline" style="color: var(--danger); border-color: var(--danger);" onclick="cancelNoShowBooking(${b.maDatSan})">Hủy No-Show</button> `;
      }

      // 2. Nút "Hủy đơn" (admin chủ động hủy, có lý do): hiện ĐỘC LẬP, không phụ thuộc phuongThucThanhToan
      // Chỉ cần điều kiện trangThaiDat IN ('ChoXacNhan', 'DaXacNhan')
      if (trangThaiDat === 'ChoXacNhan' || trangThaiDat === 'DaXacNhan') {
        actionButtons += `<button class="btn btn-sm btn-danger" onclick="openCancelBookingModal(${b.maDatSan})">Hủy đơn</button> `;
      }

      if (!actionButtons.trim()) {
        actionButtons = `<span style="color: var(--text-muted); font-size: 0.8rem;">-</span>`;
      }

      return `
        <tr>
          <td><strong>#${b.maDatSan}</strong></td>
          <td>${b.tenDiaDiem || 'N/A'} - ${b.tenSan || 'N/A'}</td>
          <td>${formatNgay(b.ngayChoi)}</td>
          <td>${formatGio(b.gioBatDau)} - ${formatGio(b.gioKetThuc)}</td>
          <td><strong>${formatTien(b.soTien)}</strong></td>
          <td>${b.phuongThucThanhToan === 'QR' ? '<span class="badge badge-info">QR Code</span>' : '<span class="badge badge-secondary">Tiền mặt</span>'}</td>
          <td>${badgeTrangThai(b.trangThaiDat)}</td>
          <td>${badgeTrangThai(b.trangThaiThanhToan)}</td>
          <td>${actionButtons}</td>
        </tr>
      `;
    }).join('');
  } catch (error) {
    tableBody.innerHTML = `<tr><td colspan="9" style="text-align:center; color: var(--danger);">Lỗi tải dữ liệu: ${error.message}</td></tr>`;
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

async function cancelNoShowBooking(maDatSan) {
  if (!confirm(`Hủy đơn #${maDatSan} do khách không đến nhận sân (No-Show)?`)) return;

  try {
    await api.put(`/admin/bookings/${maDatSan}/cancel`, {
      lyDoHuy: 'KhongDenNhan',
      ghiChu: 'Khách không đến nhận sân theo quy định'
    });
    showAlert(`Đã hủy đơn #${maDatSan} (No-Show). Số lần No-Show của khách đã được ghi nhận.`, 'success');
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

function closeCancelBookingModal() {
  const modal = document.getElementById('modal-cancel-booking');
  if (modal) modal.classList.add('hidden');
}

async function submitCancelBooking(event) {
  if (event) event.preventDefault();

  const maDatSan = document.getElementById('cancel-booking-id').value;
  const ghiChu = (document.getElementById('cancel-booking-note').value || '').trim();

  try {
    await api.put(`/admin/bookings/${maDatSan}/cancel`, {
      lyDoHuy: 'AdminHuy',
      ghiChu: ghiChu
    });
    showAlert(`Đã hủy đơn đặt sân #${maDatSan} thành công!`, 'success');
    closeCancelBookingModal();
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
        <td>${b.tenDiaDiem || 'N/A'} - ${b.tenSan || 'N/A'}</td>
        <td>${formatNgay(b.ngayChoi)}</td>
        <td>${formatGio(b.gioBatDau)} - ${formatGio(b.gioKetThuc)}</td>
        <td><strong>${formatTien(b.soTien)}</strong></td>
        <td>${badgeTrangThai(b.trangThaiThanhToan)}</td>
        <td>${b.ghiChu || 'Khách yêu cầu hủy đơn'}</td>
        <td>
          <button class="btn btn-sm btn-success" onclick="approveCancelRequest(${b.maDatSan}, true)">Đồng ý</button>
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
      ghiChu: dongY ? 'Admin chấp nhận yêu cầu hủy' : 'Admin từ chối yêu cầu hủy'
    });
    showAlert(`Đã ${actionText.toLowerCase()} yêu cầu hủy đơn #${maDatSan} thành công!`, 'success');
    loadCancelRequests();
  } catch (error) {
    showAlert(`Lỗi: ${error.message}`, 'danger');
  }
}

// ======================== 4. QUẢN LÝ SÂN ========================

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

        <div style="margin-top: 0.75rem;">
          <h4 style="font-size: 0.9rem; font-weight: 600; margin-bottom: 0.35rem;">Danh sách sân con:</h4>
          <div class="sub-court-list">
            ${(dd.danhSachSan || []).map(s => {
              const isHoatDong = s.tinhTrang === 'HoatDong';
              const toggleTarget = isHoatDong ? 'BaoTri' : 'HoatDong';
              const toggleText = isHoatDong ? 'Chuyển Bảo trì' : 'Chuyển Hoạt động';
              const toggleBtnClass = isHoatDong ? 'btn-outline' : 'btn-success';

              const imgOptions = availableCourtImages.map(img => `
                <option value="${img}" ${s.hinhAnh === img ? 'selected' : ''}>${img.split('/').pop()}</option>
              `).join('');

              return `
                <div class="sub-court-item">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.25rem;">
                    <strong style="font-size: 0.9rem;">#${s.maSan} - ${s.tenSan}</strong>
                    <button class="btn btn-sm ${toggleBtnClass}" style="padding: 0.15rem 0.4rem; font-size: 0.75rem;" onclick="updateCourtStatus(${s.maSan}, '${toggleTarget}')">${toggleText}</button>
                  </div>
                  <div style="margin-bottom: 0.4rem;">
                    ${badgeTrangThai(s.tinhTrang)}
                    ${s.dangDuocDat ? '<span class="badge badge-secondary" style="margin-left: 0.25rem;">Đang có đơn</span>' : ''}
                  </div>
                  <div style="display: flex; gap: 0.25rem; align-items: center;">
                    <select id="court-img-${s.maSan}" class="form-control" style="font-size: 0.75rem; padding: 0.2rem 0.3rem;">
                      ${imgOptions}
                    </select>
                    <button class="btn btn-sm btn-primary" style="padding: 0.2rem 0.45rem; font-size: 0.75rem; white-space: nowrap;" onclick="updateCourtImage(${s.maSan})">Lưu ảnh</button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    `).join('');
  } catch (error) {
    container.innerHTML = `<p style="text-align:center; color: var(--danger);">Lỗi tải danh sách sân: ${error.message}</p>`;
  }
}

async function updateCourtStatus(maSan, newStatus) {
  try {
    await api.put(`/admin/courts/court/${maSan}/status`, { tinhTrang: newStatus });
    showAlert(`Đã cập nhật trạng thái sân #${maSan} sang ${newStatus === 'HoatDong' ? 'Hoạt động' : 'Bảo trì'}!`, 'success');
    loadCourts();
  } catch (error) {
    showAlert(`Lỗi: ${error.message}`, 'danger');
  }
}

async function createCourt(event) {
  if (event) event.preventDefault();

  const tenDiaDiem = document.getElementById('create-tenDiaDiem').value.trim();
  let gioMo = document.getElementById('create-gioMo').value.trim();
  let gioDong = document.getElementById('create-gioDong').value.trim();
  const soSanNho = parseInt(document.getElementById('create-soSanNho').value);
  const hinhAnh = document.getElementById('create-hinhAnh').value.trim();
  const mapLink = document.getElementById('create-mapLink').value.trim() || null;

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
    showAlert(`Tạo địa điểm "${tenDiaDiem}" và ${soSanNho} sân con thành công!`, 'success');
    document.getElementById('form-create-court').reset();
    toggleCreateCourtForm();
    loadCourts();
  } catch (error) {
    showAlert(`Lỗi tạo sân: ${error.message}`, 'danger');
  }
}

function toggleCreateCourtForm() {
  const card = document.getElementById('card-create-court');
  if (!card) return;
  const isHidden = card.classList.toggle('hidden');
  if (!isHidden) {
    const input = document.getElementById('create-tenDiaDiem');
    if (input) input.focus();
  }
}

function openEditCourtModal(diaDiem) {
  document.getElementById('edit-maDiaDiem').value = diaDiem.maDiaDiem;
  document.getElementById('edit-tenMoi').value = diaDiem.tenDiaDiem;
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

// ======================== 5. NGƯỜI DÙNG ========================

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


