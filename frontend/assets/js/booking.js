/**
 * Booking Flow JavaScript Logic - 2 Steps Wizard
 */

let selectedCourt = null;
let currentPricePer30Min = 50000; // default fallback
let startBlockIdx = null;
let endBlockIdx = null;
let allTimeBlocks = [];
let bookedTimeSlots = [];

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
        <div style="width: 72px; height: 72px; margin: 0 auto 1.25rem; background: #ecfdf5; border: 1.5px solid #a7f3d0; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #059669; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.15);">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <line x1="3" y1="9" x2="21" y2="9"/>
            <line x1="3" y1="15" x2="21" y2="15"/>
            <line x1="12" y1="3" x2="12" y2="21"/>
          </svg>
        </div>
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
        ${selectedCourt.mapLink ? `<br><a href="${selectedCourt.mapLink}" target="_blank" style="color: var(--primary); font-size: 0.82rem; display: inline-flex; align-items: center; gap: 4px; text-decoration: underline; margin-top: 4px;"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg> Xem trên Google Maps ↗</a>` : ''}
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

function timeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const parts = timeStr.split(':').map(Number);
  return parts[0] * 60 + parts[1];
}

async function fetchBookedSlots(maSan, ngay) {
  try {
    const res = await api.get(`/public/courts/${maSan}/booked-slots?ngay=${ngay}`);
    bookedTimeSlots = res || [];
  } catch (err) {
    console.warn('Không tải được danh sách khung giờ đã đặt:', err);
    bookedTimeSlots = [];
  }
}

function initStep1Form() {
  const dateInput = document.getElementById('input-ngayChoi');
  if (!dateInput) return;

  const today = new Date().toISOString().split('T')[0];
  dateInput.value = today;
  dateInput.min = today;

  dateInput.addEventListener('change', async () => {
    resetTimeSlotSelection();
    await loadAndGenerateTimeSlotsGrid();
  });

  loadAndGenerateTimeSlotsGrid();
}

/**
 * Sinh lưới slot 30 phút động từ gioMo đến gioDong của địa điểm đã chọn
 * Bôi xám và ngăn chọn các khung giờ đã có người đặt trước đó (Phương án A)
 */
async function loadAndGenerateTimeSlotsGrid() {
  const grid = document.getElementById('time-slots-grid');
  const dateInput = document.getElementById('input-ngayChoi');
  if (!grid || !selectedCourt || !dateInput) return;

  const ngayChoi = dateInput.value;
  grid.innerHTML = '<p style="color: var(--text-muted); font-size: 0.85rem; grid-column: 1/-1; text-align: center; padding: 1rem 0;">Đang tải khung giờ khả dụng...</p>';

  // Lấy các dải giờ đã đặt của sân trong ngày
  await fetchBookedSlots(selectedCourt.maSan, ngayChoi);

  const gioMo = selectedCourt.gioMo || '06:00:00';
  const gioDong = selectedCourt.gioDong || '22:00:00';

  const [startH, startM] = gioMo.split(':').map(Number);
  const [endH, endM] = gioDong.split(':').map(Number);

  // Tính toán thời gian thực và buffer 15 phút
  const now = new Date();
  const [todayY, todayM, todayD] = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0')
  ];
  const todayStr = `${todayY}-${todayM}-${todayD}`;
  const isToday = (ngayChoi === todayStr);
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const bufferMinutes = 15; // 15 phút đệm chuẩn bị/thanh toán

  allTimeBlocks = [];
  let curMin = startH * 60 + startM;
  const maxMin = endH * 60 + endM;

  while (curMin + 30 <= maxMin) {
    const nextMin = curMin + 30;
    const startStr = `${String(Math.floor(curMin / 60)).padStart(2, '0')}:${String(curMin % 60).padStart(2, '0')}`;
    const endStr = `${String(Math.floor(nextMin / 60)).padStart(2, '0')}:${String(nextMin % 60).padStart(2, '0')}`;

    // 1. Kiểm tra khung giờ quá khứ (Past)
    let isPast = false;
    if (isToday) {
      if (curMin < (currentMinutes + bufferMinutes)) {
        isPast = true;
      }
    } else if (ngayChoi < todayStr) {
      isPast = true;
    }

    // 2. Kiểm tra khung giờ đã có người đặt trước (Booked)
    let isBooked = false;
    for (const b of bookedTimeSlots) {
      const bStartMin = timeToMinutes(b.gioBatDau);
      const bEndMin = timeToMinutes(b.gioKetThuc);
      if (curMin < bEndMin && nextMin > bStartMin) {
        isBooked = true;
        break;
      }
    }

    allTimeBlocks.push({
      start: startStr,
      end: endStr,
      label: `${startStr} - ${endStr}`,
      isBooked: isBooked,
      isPast: isPast
    });

    curMin += 30;
  }

  // Render lưới:
  // - Quá khứ: class .past (viền nét đứt, mờ nhạt, badge Đã qua)
  // - Đã đặt: class .booked (viền nét liền, xám rõ, badge Đã đặt)
  // - Khả dụng: class bình thường (click chọn)
  grid.innerHTML = allTimeBlocks.map((block, idx) => {
    if (block.isPast) {
      return `
        <div class="time-slot past" id="block-${idx}" title="Khung giờ ${block.label} đã qua hoặc quá sát giờ hiện tại (đệm 15 phút)">
          <span class="slot-time">${block.label}</span>
          <span class="slot-status"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> Đã qua</span>
        </div>
      `;
    } else if (block.isBooked) {
      return `
        <div class="time-slot booked" id="block-${idx}" title="Khung giờ ${block.label} đã có người đặt trước">
          <span class="slot-time">${block.label}</span>
          <span class="slot-status"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> Đã đặt</span>
        </div>
      `;
    } else {
      return `
        <div class="time-slot" id="block-${idx}" onclick="handleTimeBlockClick(${idx})" title="Chọn khung giờ ${block.label}">
          <span class="slot-time">${block.label}</span>
        </div>
      `;
    }
  }).join('');

  updateTimeSlotsUI();
}

function handleTimeBlockClick(idx) {
  if (!allTimeBlocks[idx] || allTimeBlocks[idx].isBooked || allTimeBlocks[idx].isPast) return;

  if (startBlockIdx === null) {
    // Lần bấm đầu tiên: Chọn khung giờ này
    startBlockIdx = idx;
    endBlockIdx = idx;
  } else if (startBlockIdx !== null && endBlockIdx === startBlockIdx) {
    // Đang chọn 1 block
    if (idx === startBlockIdx) {
      // Bấm lại đúng block đó -> Hủy chọn
      resetTimeSlotSelection();
      return;
    } else if (idx > startBlockIdx) {
      // Kiểm tra xem từ startBlockIdx đến idx có block nào bị đã đặt hoặc quá khứ ở giữa không
      let hasBlockedInRange = false;
      for (let i = startBlockIdx; i <= idx; i++) {
        if (allTimeBlocks[i].isBooked || allTimeBlocks[i].isPast) {
          hasBlockedInRange = true;
          break;
        }
      }
      if (hasBlockedInRange) {
        showAlert('Khoảng thời gian bạn chọn chứa khung giờ không khả dụng (đã qua hoặc đã có người đặt). Vui lòng chọn khung giờ trống liền mạch!', 'warning');
        startBlockIdx = idx;
        endBlockIdx = idx;
      } else {
        endBlockIdx = idx;
      }
    } else {
      // idx < startBlockIdx (Chọn tiến về phía trước)
      let hasBlockedInRange = false;
      for (let i = idx; i <= startBlockIdx; i++) {
        if (allTimeBlocks[i].isBooked || allTimeBlocks[i].isPast) {
          hasBlockedInRange = true;
          break;
        }
      }
      if (hasBlockedInRange) {
        showAlert('Khoảng thời gian bạn chọn chứa khung giờ không khả dụng (đã qua hoặc đã có người đặt). Vui lòng chọn khung giờ trống liền mạch!', 'warning');
        startBlockIdx = idx;
        endBlockIdx = idx;
      } else {
        endBlockIdx = startBlockIdx;
        startBlockIdx = idx;
      }
    }
  } else {
    // Đã có dải nhiều block -> Bắt đầu vùng chọn mới với block vừa bấm
    startBlockIdx = idx;
    endBlockIdx = idx;
  }

  updateTimeSlotsUI();
}

function updateTimeSlotsUI() {
  allTimeBlocks.forEach((block, idx) => {
    const el = document.getElementById(`block-${idx}`);
    if (!el || block.isBooked) return;

    el.classList.remove('selected', 'in-range');

    if (startBlockIdx !== null && endBlockIdx !== null) {
      if (idx === startBlockIdx || idx === endBlockIdx) {
        el.classList.add('selected');
      } else if (idx > startBlockIdx && idx < endBlockIdx) {
        el.classList.add('in-range');
      }
    }
  });

  const startInput = document.getElementById('display-gioBatDau');
  const endInput = document.getElementById('display-gioKetThuc');
  const btnNext = document.getElementById('btn-step1-next');

  if (startBlockIdx !== null && endBlockIdx !== null) {
    startInput.value = allTimeBlocks[startBlockIdx].start;
    endInput.value = allTimeBlocks[endBlockIdx].end;
    btnNext.disabled = false;
  } else {
    startInput.value = '';
    endInput.value = '';
    btnNext.disabled = true;
  }
}

function resetTimeSlotSelection() {
  startBlockIdx = null;
  endBlockIdx = null;
  updateTimeSlotsUI();
}

/**
 * Chuyển sang Bước 2 (Chưa gọi API backend)
 */
function proceedToStep2() {
  const ngayChoi = document.getElementById('input-ngayChoi').value;
  if (!ngayChoi || startBlockIdx === null || endBlockIdx === null) {
    showAlert('Vui lòng chọn ngày và khung giờ bắt đầu, kết thúc!', 'warning');
    return;
  }

  const gioBatDauStr = allTimeBlocks[startBlockIdx].start;
  const gioKetThucStr = allTimeBlocks[endBlockIdx].end;

  // Validate thời điểm quá khứ
  const [sYear, sMonth, sDay] = ngayChoi.split('-').map(Number);
  const [sHour, sMinute] = gioBatDauStr.split(':').map(Number);
  const selectedStartDateTime = new Date(sYear, sMonth - 1, sDay, sHour, sMinute, 0);
  const now = new Date();

  if (selectedStartDateTime < now) {
    showAlert('Không thể đặt sân trong quá khứ. Vui lòng chọn ngày và giờ trong tương lai!', 'danger');
    return;
  }

  // Đảm bảo an toàn không có block nào bị đặt hoặc trong quá khứ ở giữa
  for (let i = startBlockIdx; i <= endBlockIdx; i++) {
    if (allTimeBlocks[i].isPast) {
      showAlert('Khoảng thời gian bạn chọn chứa khung giờ trong quá khứ hoặc quá sát giờ hiện tại!', 'danger');
      return;
    }
    if (allTimeBlocks[i].isBooked) {
      showAlert('Khoảng thời gian bạn chọn chứa khung giờ đã có người đặt trước!', 'danger');
      return;
    }
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
  const cards = {
    'TienMat': document.getElementById('card-pay-cash'),
    'QR': document.getElementById('card-pay-qr'),
    'VNPay': document.getElementById('card-pay-vnpay'),
    'MoMo': document.getElementById('card-pay-momo')
  };
  const radios = {
    'TienMat': document.getElementById('pay-cash'),
    'QR': document.getElementById('pay-qr'),
    'VNPay': document.getElementById('pay-vnpay'),
    'MoMo': document.getElementById('pay-momo')
  };

  Object.keys(cards).forEach(key => {
    if (cards[key]) {
      if (key === method) {
        cards[key].classList.add('active');
        if (radios[key]) radios[key].checked = true;
      } else {
        cards[key].classList.remove('active');
      }
    }
  });
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
  const selectedRadio = document.querySelector('input[name="paymentMethod"]:checked');
  const phuongThucThanhToan = selectedRadio ? selectedRadio.value : 'QR';
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

    if (phuongThucThanhToan === 'TienMat') {
      showCashSuccess(maDatSan);
    } else {
      showOnlinePaymentModal(maDatSan, draft.tongTien, phuongThucThanhToan);
    }
  } catch (error) {
    showAlert(`Đặt sân thất bại: ${error.message}`, 'danger');
    if (btnCheckout) btnCheckout.disabled = false;
  }
}

let holdTimerInterval = null;

function showOnlinePaymentModal(maDatSan, tongTien, method) {
  const container = document.getElementById('booking-app-container');
  let title = 'Quét mã QR để thanh toán';
  let iconSvg = `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><line x1="7" y1="17" x2="7" y2="17.01"/><line x1="17" y1="7" x2="17" y2="7.01"/></svg>`;
  let badgeText = 'VietQR';

  if (method === 'VNPay') {
    title = 'Thanh toán trực tuyến VNPay Gateway';
    iconSvg = `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>`;
    badgeText = 'Cổng VNPAY-QR';
  } else if (method === 'MoMo') {
    title = 'Thanh toán qua Ví điện tử MoMo';
    iconSvg = `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4z"/></svg>`;
    badgeText = 'Ví MoMo';
  }

  container.innerHTML = `
    <div class="qr-payment-box">
      <div style="width: 56px; height: 56px; margin: 0 auto 1rem; border-radius: 50%; background: #ecfdf5; color: #059669; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(16,185,129,0.15);">
        ${iconSvg}
      </div>
      <h2 style="font-size: 1.35rem; color: var(--dark); font-weight: 700;">${title}</h2>
      <p style="color: var(--text-muted); font-size: 0.9rem;">
        Đơn đặt sân <strong>#${maDatSan}</strong> — Số tiền: <strong style="color: var(--primary-dark); font-size: 1.2rem;">${formatTien(tongTien)}</strong>
      </p>

      <div style="background: #eff6ff; border: 1px solid #bfdbfe; color: #1e40af; border-radius: var(--radius-sm); padding: 0.65rem 1rem; width: 100%; text-align: center; font-size: 0.9rem; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 6px;">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        <span>Thời gian giữ chỗ còn lại:</span> <span id="countdown-timer" style="color: #dc2626; font-size: 1.05rem;">10:00</span>
      </div>
      
      <img src="/assets/images/qr.jpg" alt="Mã QR thanh toán" class="qr-code-img" onerror="this.src='https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=QUANLYDATSAN_BOOKING_${maDatSan}_${tongTien}'">

      <div style="background: #f8fafc; padding: 0.75rem; border-radius: var(--radius-sm); font-size: 0.85rem; color: var(--text-muted); width: 100%; line-height: 1.6;">
        <strong>Hình thức:</strong> ${badgeText} (Thanh toán trước 100%)<br>
        <strong>Nội dung chuyển khoản:</strong> <code style="color: #0369a1; font-weight: 700;">DATSAN ${maDatSan}</code><br>
        <strong>Quy định:</strong> Quá 10 phút chưa hoàn tất thanh toán, hệ thống sẽ tự động hủy đơn giữ chỗ.
      </div>

      <div id="qr-alert-container" style="width: 100%;"></div>

      <button id="btn-pay-qr" class="btn btn-primary" style="width: 100%; font-size: 1rem; padding: 0.75rem; display: inline-flex; align-items: center; justify-content: center; gap: 8px;" onclick="handleConfirmQRPaid(${maDatSan})">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
        <span>Đã hoàn tất thanh toán (${badgeText})</span>
      </button>
    </div>
  `;
  window.scrollTo({ top: 0, behavior: 'smooth' });

  // 10 phút đếm ngược
  let timeLeft = 10 * 60;
  if (holdTimerInterval) clearInterval(holdTimerInterval);
  holdTimerInterval = setInterval(() => {
    timeLeft--;
    if (timeLeft <= 0) {
      clearInterval(holdTimerInterval);
      const timerEl = document.getElementById('countdown-timer');
      if (timerEl) timerEl.textContent = '00:00 (Hết hạn)';
      const btn = document.getElementById('btn-pay-qr');
      if (btn) btn.disabled = true;
      showAlert('Đơn đặt sân đã quá 10 phút giữ chỗ và tự động bị hủy để giải phóng sân.', 'danger', 'qr-alert-container');
    } else {
      const minutes = String(Math.floor(timeLeft / 60)).padStart(2, '0');
      const seconds = String(timeLeft % 60).padStart(2, '0');
      const timerEl = document.getElementById('countdown-timer');
      if (timerEl) timerEl.textContent = `${minutes}:${seconds}`;
    }
  }, 1000);
}

function showQRModalOrSection(maDatSan, tongTien) {
  showOnlinePaymentModal(maDatSan, tongTien, 'QR');
}

async function handleConfirmQRPaid(maDatSan) {
  if (holdTimerInterval) clearInterval(holdTimerInterval);
  const btn = document.getElementById('btn-pay-qr');
  if (btn) btn.disabled = true;

  try {
    await api.post(`/user/booking/${maDatSan}/pay-qr`);
    sessionStorage.removeItem('selectedCourt');
    sessionStorage.removeItem('bookingDraft');

    showAlert('Thanh toán thành công! Đơn đặt sân đã được xác nhận. Đang chuyển đến Lịch sử...', 'success', 'qr-alert-container');

    setTimeout(() => {
      window.location.href = '/pages/user/history.html';
    }, 1500);
  } catch (error) {
    showAlert(`Lỗi xác nhận thanh toán: ${error.message}`, 'danger', 'qr-alert-container');
    if (btn) btn.disabled = false;
  }
}

function showCashSuccess(maDatSan) {
  sessionStorage.removeItem('selectedCourt');
  sessionStorage.removeItem('bookingDraft');

  const container = document.getElementById('booking-app-container');
  container.innerHTML = `
    <div class="section-box" style="text-align: center; padding: 3rem 1.5rem; max-width: 520px; margin: 2rem auto;">
      <div style="width: 72px; height: 72px; margin: 0 auto 1.25rem; background: #ecfdf5; border: 1.5px solid #a7f3d0; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #059669; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.15);">
        <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
          <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
      </div>
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
