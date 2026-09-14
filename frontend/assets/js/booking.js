/**
 * Booking Flow JavaScript Logic - 2 Steps Wizard
 */

let selectedCourt = null;
let currentPricePer30Min = 50000; // default fallback
let startIdx = null;
let endIdx = null;
let allTimeSlots = [];

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Kiểm tra selectedCourt từ sessionStorage
  const courtData = sessionStorage.getItem('selectedCourt');
  if (!courtData) {
    showNoCourtSelected();
    return;
  }

  try {
    selectedCourt = JSON.parse(courtData);
  } catch (e) {
    showNoCourtSelected();
    return;
  }

  // 2. Fetch giá hiện hành
  await fetchGiaHienHanh();

  // 3. Render Step 1
  renderCourtInfoSidebar();
  initStep1Form();
});

function showNoCourtSelected() {
  const container = document.getElementById('booking-app-container');
  if (container) {
    container.innerHTML = `
      <div class="section-box" style="text-align: center; padding: 3.5rem 1.5rem; max-width: 520px; margin: 2rem auto;">
        <span style="font-size: 3.5rem;">🏸</span>
        <h2 style="font-size: 1.35rem; margin: 1rem 0 0.5rem; color: var(--dark); font-weight: 700;">Vui lòng chọn sân trước</h2>
        <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 1.75rem; line-height: 1.5;">
          Bạn cần chọn một sân cầu lông cụ thể từ danh sách để tiến hành chọn ngày và khung giờ đặt sân.
        </p>
        <a href="/pages/user/courts.html" class="btn btn-primary">Xem danh sách sân</a>
      </div>
    `;
  }
}

async function fetchGiaHienHanh() {
  try {
    const res = await api.get('/public/gia-hien-hanh');
    if (res && res.giaMoi30Phut) {
      currentPricePer30Min = res.giaMoi30Phut;
    }
  } catch (e) {
    console.warn('Dùng giá mặc định 50.000đ/30p do không lấy được bảng giá:', e);
  }
}

function renderCourtInfoSidebar() {
  const container = document.getElementById('step1-court-info');
  if (!container || !selectedCourt) return;

  const fallbackImg = 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=500&auto=format&fit=crop&q=60';
  const courtImg = selectedCourt.hinhAnh && selectedCourt.hinhAnh.startsWith('http') ? selectedCourt.hinhAnh : fallbackImg;

  container.innerHTML = `
    <img src="${courtImg}" alt="${selectedCourt.tenSan}" style="width: 100%; height: 160px; object-fit: cover; border-radius: var(--radius-sm); margin-bottom: 1rem;" onerror="this.src='${fallbackImg}'">
    <div class="modal-detail-row">
      <span class="modal-detail-label">Mã sân:</span>
      <span class="modal-detail-value">#${selectedCourt.maSan}</span>
    </div>
    <div class="modal-detail-row">
      <span class="modal-detail-label">Tên sân:</span>
      <span class="modal-detail-value">${selectedCourt.tenSan}</span>
    </div>
    <div class="modal-detail-row">
      <span class="modal-detail-label">Địa điểm:</span>
      <span class="modal-detail-value">
        ${selectedCourt.tenDiaDiem}
        ${selectedCourt.mapLink ? `<br><a href="${selectedCourt.mapLink}" target="_blank" style="color: var(--primary); font-size: 0.82rem; text-decoration: underline;">📍 Xem trên Google Maps ↗</a>` : ''}
      </span>
    </div>
    <div class="modal-detail-row">
      <span class="modal-detail-label">Giờ mở cửa:</span>
      <span class="modal-detail-value">${formatGio(selectedCourt.gioMo)} - ${formatGio(selectedCourt.gioDong)}</span>
    </div>
    <div class="modal-detail-row">
      <span class="modal-detail-label">Tình trạng:</span>
      <span class="modal-detail-value">${badgeTrangThai(selectedCourt.tinhTrang)}</span>
    </div>
    <div class="modal-detail-row">
      <span class="modal-detail-label">Đơn giá:</span>
      <span class="modal-detail-value" style="color: var(--primary-dark);">${formatTien(currentPricePer30Min)} / 30 phút</span>
    </div>
    <div style="margin-top: 1.25rem;">
      <a href="/pages/user/courts.html" class="btn btn-outline btn-sm" style="width: 100%;">← Đổi sân khác</a>
    </div>
  `;
}

function initStep1Form() {
  const dateInput = document.getElementById('input-ngayChoi');
  if (!dateInput) return;

  const today = new Date().toISOString().split('T')[0];
  dateInput.value = today;
  dateInput.min = today;

  dateInput.addEventListener('change', () => {
    resetTimeSlotSelection();
  });

  generateTimeSlotsGrid();
}

/**
 * Sinh lưới slot 30 phút động từ gioMo đến gioDong của địa điểm đã chọn
 */
function generateTimeSlotsGrid() {
  const grid = document.getElementById('time-slots-grid');
  if (!grid || !selectedCourt) return;

  const gioMo = selectedCourt.gioMo || '06:00:00';
  const gioDong = selectedCourt.gioDong || '22:00:00';

  const [startH, startM] = gioMo.split(':').map(Number);
  const [endH, endM] = gioDong.split(':').map(Number);

  allTimeSlots = [];
  let curMin = startH * 60 + startM;
  const maxMin = endH * 60 + endM;

  while (curMin <= maxMin) {
    const h = String(Math.floor(curMin / 60)).padStart(2, '0');
    const m = String(curMin % 60).padStart(2, '0');
    allTimeSlots.push(`${h}:${m}`);
    curMin += 30;
  }

  grid.innerHTML = allTimeSlots.map((slot, idx) => `
    <div class="time-slot" id="slot-${idx}" data-time="${slot}" onclick="handleTimeSlotClick(${idx})">
      ${slot}
    </div>
  `).join('');
}

function handleTimeSlotClick(idx) {
  if (startIdx === null) {
    startIdx = idx;
    endIdx = null;
  } else if (endIdx === null) {
    if (idx > startIdx) {
      endIdx = idx;
    } else {
      startIdx = idx;
      endIdx = null;
    }
  } else {
    startIdx = idx;
    endIdx = null;
  }

  updateTimeSlotsUI();
}

function updateTimeSlotsUI() {
  allTimeSlots.forEach((slot, idx) => {
    const el = document.getElementById(`slot-${idx}`);
    if (!el) return;

    el.classList.remove('selected', 'in-range');

    if (idx === startIdx || idx === endIdx) {
      el.classList.add('selected');
    } else if (startIdx !== null && endIdx !== null && idx > startIdx && idx < endIdx) {
      el.classList.add('in-range');
    }
  });

  const startInput = document.getElementById('display-gioBatDau');
  const endInput = document.getElementById('display-gioKetThuc');
  const btnNext = document.getElementById('btn-step1-next');

  if (startIdx !== null) {
    startInput.value = allTimeSlots[startIdx];
  } else {
    startInput.value = '';
  }

  if (endIdx !== null) {
    endInput.value = allTimeSlots[endIdx];
  } else {
    endInput.value = '';
  }

  if (startIdx !== null && endIdx !== null) {
    btnNext.disabled = false;
  } else {
    btnNext.disabled = true;
  }
}

function resetTimeSlotSelection() {
  startIdx = null;
  endIdx = null;
  updateTimeSlotsUI();
}

/**
 * Chuyển sang Bước 2 (Chưa gọi API backend)
 */
function proceedToStep2() {
  const ngayChoi = document.getElementById('input-ngayChoi').value;
  if (!ngayChoi || startIdx === null || endIdx === null) {
    showAlert('Vui lòng chọn ngày và khung giờ bắt đầu, kết thúc!', 'warning');
    return;
  }

  const gioBatDauStr = allTimeSlots[startIdx];
  const gioKetThucStr = allTimeSlots[endIdx];

  // Validate thời điểm quá khứ
  const [sYear, sMonth, sDay] = ngayChoi.split('-').map(Number);
  const [sHour, sMinute] = gioBatDauStr.split(':').map(Number);
  const selectedStartDateTime = new Date(sYear, sMonth - 1, sDay, sHour, sMinute, 0);
  const now = new Date();

  if (selectedStartDateTime < now) {
    showAlert('Không thể đặt sân trong quá khứ. Vui lòng chọn ngày và giờ trong tương lai!', 'danger');
    return;
  }

  const gioBatDau = gioBatDauStr + ':00';
  const gioKetThuc = gioKetThucStr + ':00';
  const ghiChu = document.getElementById('input-ghiChu').value.trim() || null;

  // Tính số phút và tổng tiền
  const [sH, sM] = gioBatDauStr.split(':').map(Number);
  const [eH, eM] = gioKetThucStr.split(':').map(Number);
  const totalMinutes = (eH * 60 + eM) - (sH * 60 + sM);
  const numBlocks = totalMinutes / 30;
  const tongTien = numBlocks * currentPricePer30Min;

  const draft = {
    maSan: selectedCourt.maSan,
    tenSan: selectedCourt.tenSan,
    maDiaDiem: selectedCourt.maDiaDiem,
    tenDiaDiem: selectedCourt.tenDiaDiem,
    ngayChoi,
    gioBatDau,
    gioKetThuc,
    gioBatDauDisplay: gioBatDauStr,
    gioKetThucDisplay: gioKetThucStr,
    totalMinutes,
    numBlocks,
    tongTien,
    ghiChu
  };

  sessionStorage.setItem('bookingDraft', JSON.stringify(draft));

  // Render Step 2
  renderStep2(draft);

  // Switch Wizard UI
  document.getElementById('step-section-1').style.display = 'none';
  document.getElementById('step-section-2').style.display = 'block';

  document.getElementById('step-indicator-1').classList.remove('active');
  document.getElementById('step-indicator-1').classList.add('completed');
  document.getElementById('step-indicator-2').classList.add('active');

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function backToStep1() {
  document.getElementById('step-section-2').style.display = 'none';
  document.getElementById('step-section-1').style.display = 'block';

  document.getElementById('step-indicator-2').classList.remove('active');
  document.getElementById('step-indicator-1').classList.remove('completed');
  document.getElementById('step-indicator-1').classList.add('active');

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderStep2(draft) {
  const container = document.getElementById('step2-booking-info');
  if (!container) return;

  const hours = Math.floor(draft.totalMinutes / 60);
  const mins = draft.totalMinutes % 60;
  const timeText = hours > 0 ? (mins > 0 ? `${hours} giờ ${mins} phút` : `${hours} giờ`) : `${mins} phút`;

  container.innerHTML = `
    <div class="modal-detail-row">
      <span class="modal-detail-label">Địa điểm:</span>
      <span class="modal-detail-value">${draft.tenDiaDiem}</span>
    </div>
    <div class="modal-detail-row">
      <span class="modal-detail-label">Sân đặt:</span>
      <span class="modal-detail-value">${draft.tenSan} (#${draft.maSan})</span>
    </div>
    <div class="modal-detail-row">
      <span class="modal-detail-label">Ngày chơi:</span>
      <span class="modal-detail-value">${formatNgay(draft.ngayChoi)}</span>
    </div>
    <div class="modal-detail-row">
      <span class="modal-detail-label">Khung giờ:</span>
      <span class="modal-detail-value">${draft.gioBatDauDisplay} - ${draft.gioKetThucDisplay}</span>
    </div>
    <div class="modal-detail-row">
      <span class="modal-detail-label">Thời lượng:</span>
      <span class="modal-detail-value">${timeText} (${draft.numBlocks} slot 30p)</span>
    </div>
    <div class="modal-detail-row">
      <span class="modal-detail-label">Ghi chú:</span>
      <span class="modal-detail-value">${draft.ghiChu || 'Không có'}</span>
    </div>
    <div class="modal-detail-row" style="margin-top: 0.5rem; padding-top: 0.75rem; border-top: 2px dashed var(--border);">
      <span class="modal-detail-label" style="font-size: 1rem; font-weight: 700; color: var(--dark);">Tổng thanh toán:</span>
      <span class="modal-detail-value" style="font-size: 1.3rem; font-weight: 800; color: var(--primary-dark);">${formatTien(draft.tongTien)}</span>
    </div>
    <div style="margin-top: 1.25rem;">
      <button type="button" class="btn btn-outline btn-sm" onclick="backToStep1()" style="width: 100%;">← Quay lại sửa giờ</button>
    </div>
  `;
}

function selectPaymentMethod(method) {
  const radioCash = document.getElementById('pay-cash');
  const radioQR = document.getElementById('pay-qr');
  const cardCash = document.getElementById('card-pay-cash');
  const cardQR = document.getElementById('card-pay-qr');

  if (method === 'TienMat') {
    radioCash.checked = true;
    cardCash.classList.add('active');
    cardQR.classList.remove('active');
  } else {
    radioQR.checked = true;
    cardQR.classList.add('active');
    cardCash.classList.remove('active');
  }
}

/**
 * Click nút Thanh toán cuối cùng -> Thực sự gọi API POST /user/booking
 */
async function handleFinalCheckout() {
  const draftStr = sessionStorage.getItem('bookingDraft');
  if (!draftStr) {
    showAlert('Không tìm thấy thông tin đơn đặt, vui lòng thử lại!', 'danger');
    return;
  }

  const draft = JSON.parse(draftStr);
  const phuongThucThanhToan = document.querySelector('input[name="paymentMethod"]:checked').value;
  const btnCheckout = document.getElementById('btn-checkout');

  if (btnCheckout) btnCheckout.disabled = true;

  try {
    const payload = {
      maSan: draft.maSan,
      ngayChoi: draft.ngayChoi,
      gioBatDau: draft.gioBatDau,
      gioKetThuc: draft.gioKetThuc,
      phuongThucThanhToan: phuongThucThanhToan,
      ghiChu: draft.ghiChu
    };

    const res = await api.post('/user/booking', payload);
    const maDatSan = res.maDatSan;

    if (phuongThucThanhToan === 'QR') {
      showQRModalOrSection(maDatSan, draft.tongTien);
    } else {
      showCashSuccess(maDatSan);
    }
  } catch (error) {
    showAlert(`Đặt sân thất bại: ${error.message}`, 'danger');
    if (btnCheckout) btnCheckout.disabled = false;
  }
}

function showQRModalOrSection(maDatSan, tongTien) {
  const container = document.getElementById('booking-app-container');
  container.innerHTML = `
    <div class="qr-payment-box">
      <span style="font-size: 2.5rem;">📱</span>
      <h2 style="font-size: 1.35rem; color: var(--dark); font-weight: 700;">Quét mã QR để thanh toán</h2>
      <p style="color: var(--text-muted); font-size: 0.9rem;">
        Đơn đặt sân <strong>#${maDatSan}</strong> — Số tiền: <strong style="color: var(--primary-dark); font-size: 1.1rem;">${formatTien(tongTien)}</strong>
      </p>
      
      <img src="/assets/images/qr.jpg" alt="Mã QR thanh toán" class="qr-code-img" onerror="this.src='https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=QUANLYDATSAN_BOOKING_${maDatSan}_${tongTien}'">

      <div style="background: #f8fafc; padding: 0.75rem; border-radius: var(--radius-sm); font-size: 0.85rem; color: var(--text-muted); width: 100%;">
        <strong>Nội dung CK:</strong> DATSAN ${maDatSan}<br>
        <strong>Thời gian thanh toán:</strong> 15 phút
      </div>

      <div id="qr-alert-container" style="width: 100%;"></div>

      <button id="btn-pay-qr" class="btn btn-primary" style="width: 100%; font-size: 1rem; padding: 0.75rem;" onclick="handleConfirmQRPaid(${maDatSan})">
        ✅ Tôi đã thanh toán
      </button>
    </div>
  `;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function handleConfirmQRPaid(maDatSan) {
  const btn = document.getElementById('btn-pay-qr');
  if (btn) btn.disabled = true;

  try {
    await api.post(`/user/booking/${maDatSan}/pay-qr`);
    sessionStorage.removeItem('selectedCourt');
    sessionStorage.removeItem('bookingDraft');

    const alertBox = document.getElementById('qr-alert-container');
    if (alertBox) {
      alertBox.innerHTML = `<div class="alert alert-success">✅ Thanh toán thành công! Sân đã được xác nhận. Đang chuyển đến Lịch sử...</div>`;
    }

    setTimeout(() => {
      window.location.href = '/pages/user/history.html';
    }, 1500);
  } catch (error) {
    const alertBox = document.getElementById('qr-alert-container');
    if (alertBox) {
      alertBox.innerHTML = `<div class="alert alert-danger">Lỗi xác nhận: ${error.message}</div>`;
    }
    if (btn) btn.disabled = false;
  }
}

function showCashSuccess(maDatSan) {
  sessionStorage.removeItem('selectedCourt');
  sessionStorage.removeItem('bookingDraft');

  const container = document.getElementById('booking-app-container');
  container.innerHTML = `
    <div class="section-box" style="text-align: center; padding: 3rem 1.5rem; max-width: 520px; margin: 2rem auto;">
      <span style="font-size: 3.5rem;">🎉</span>
      <h2 style="font-size: 1.4rem; color: var(--dark); font-weight: 700; margin: 1rem 0 0.5rem;">Đặt sân thành công!</h2>
      <p style="color: var(--text-muted); font-size: 0.95rem; line-height: 1.5; margin-bottom: 1.75rem;">
        Mã đơn đặt: <strong>#${maDatSan}</strong>.<br>
        Vui lòng đến sân thanh toán tiền mặt và chờ admin xác nhận.
      </p>
      <a href="/pages/user/history.html" class="btn btn-primary">Xem lịch sử đặt sân</a>
    </div>
  `;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
