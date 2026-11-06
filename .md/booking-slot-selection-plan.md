# Kế Hoạch: Chuyển Đổi Cơ Chế Chặn Sân Sang Khóa Khung Giờ (Time-Slot Level Availability)

> **Mã tác vụ:** `booking-slot-selection-plan`  
> **Mục tiêu:** Cho phép nhiều người dùng (hoặc cùng một người dùng) tiếp tục đặt cùng một sân ở các khung giờ khác nhau; chỉ khóa/bôi xám và ngăn chọn các khung giờ cụ thể đã có người đặt trong ngày.

---

## 📌 1. Phân Tích Hiện Trạng & Nguyên Nhân Gốc (Root Cause)

1. **Vấn đề 1 tại danh sách sân (`courts.html`):**
   - API Backend `BookingService.layTatCaDiaDiemVaSan()` kiểm tra toàn bộ đơn đặt sân active (`ChoXacNhan`, `DaXacNhan`, `DangChoi`, `ChoHuy`). Nếu sân có bất kỳ đơn nào, cờ `dangDuocDat` bị gán `true`.
   - Frontend `courts.html` dựa vào `c.dangDuocDat === true` để vô hiệu hóa toàn bộ nút đặt: hiển thị `<button disabled>Đã có người đặt</button>`. Hệ quả: sân bị "khóa cứng" toàn diện, không ai có thể vào đặt các giờ trống khác trong ngày.

2. **Vấn đề 2 tại trang chọn giờ (`booking.html` / `booking.js`):**
   - Lưới chọn slot `time-slots-grid` được sinh cứng theo công thức `gioMo` đến `gioDong`.
   - Frontend hoàn toàn chưa gọi API để tải về các khoảng giờ đã được giữ chỗ/đã đặt trong ngày cụ thể (`ngayChoi`). Do đó không có dữ liệu để bôi xám các khung giờ đã bận (ví dụ 09:00 - 11:00).

---

## 🎯 2. Giải Pháp Kỹ Thuật (Architecture & Design)

```mermaid
flowchart TD
    A[Khách truy cập courts.html] -->|Sân luôn hiển thị Đặt sân nếu Hoạt động| B[Trang booking.html]
    B -->|Chọn Ngày chơi| C[Gọi API: /api/public/courts/{maSan}/booked-slots?ngay=YYYY-MM-DD]
    C -->|Backend trả về các dải giờ đã đặt| D[Render Lưới Slot 30 phút]
    D -->|Slot bình thường| E[Màu xanh/trắng - Cho phép Click]
    D -->|Slot trùng dải giờ đã đặt| F[Bôi xám + Badge Đã đặt + cursor: not-allowed]
    E -->|Khách chọn Giờ bắt đầu & Giờ kết thúc| G{Khoảng chọn có quét qua Slot đã đặt?}
    G -- Có --> H[Báo lỗi không thể chọn dải giờ cắt ngang lịch đã đặt]
    G -- Không --> I[Hợp lệ -> Sang Bước 2 Thanh toán]
```

---

## 📋 3. Phân Rã Công Việc (Task Breakdown)

### Phase 1: Backend API (Tầng Dữ Liệu & Endpoint)
- [x] **Task 1.1:** Viết Query trong [`DatSanRepository`](file:///c:/Users/tn180/OneDrive/Desktop/QuanLyDatSanCauLong-main/backend/src/main/java/com/quanlydatsan/repository/DatSanRepository.java):
  - Tìm tất cả đơn đặt active của `maSan` theo `ngayChoi`:
    `findBySan_MaSanAndNgayChoiAndTrangThaiDatIn(Integer maSan, LocalDate ngay, List<String> trangThaiDats)`
- [x] **Task 1.2:** Tạo DTO [`KhungGioDaDatResponse`](file:///c:/Users/tn180/OneDrive/Desktop/QuanLyDatSanCauLong-main/backend/src/main/java/com/quanlydatsan/dto/response/KhungGioDaDatResponse.java):
  - Thuộc tính: `gioBatDau` (LocalTime), `gioKetThuc` (LocalTime), `trangThaiDat` (String).
- [x] **Task 1.3:** Bổ sung Service & Endpoint trong [`PublicController`](file:///c:/Users/tn180/OneDrive/Desktop/QuanLyDatSanCauLong-main/backend/src/main/java/com/quanlydatsan/controller/PublicController.java):
  - `GET /api/public/courts/{maSan}/booked-slots?ngay=YYYY-MM-DD`
  - Trả về danh sách các khoảng giờ đã đặt trong ngày của sân.
- [x] **Task 1.4:** Tinh chỉnh logic `dangDuocDat` trong [`BookingService.layTatCaDiaDiemVaSan`](file:///c:/Users/tn180/OneDrive/Desktop/QuanLyDatSanCauLong-main/backend/src/main/java/com/quanlydatsan/service/BookingService.java):
  - Đảm bảo không khóa nhầm sân ở cấp độ danh mục tổng thể.

### Phase 2: Frontend UI / UX (Tầng Giao Diện Người Dùng)
- [x] **Task 2.1:** Mở khóa nút đặt sân tại [`courts.html`](file:///c:/Users/tn180/OneDrive/Desktop/QuanLyDatSanCauLong-main/frontend/pages/user/courts.html):
  - Miễn là sân có `tinhTrang === 'HoatDong'`, luôn cho phép người dùng click "Đặt sân" để vào chọn giờ (trừ khi sân đang `BaoTri` hoặc `TamNgung`).
- [x] **Task 2.2:** Nâng cấp [`booking.js`](file:///c:/Users/tn180/OneDrive/Desktop/QuanLyDatSanCauLong-main/frontend/assets/js/booking.js):
  - Thêm hàm `fetchBookedTimeSlots(maSan, ngayChoi)`.
  - Gọi lại hàm này mỗi khi người dùng thay đổi ngày chơi trên `#input-ngayChoi`.
- [x] **Task 2.3:** Bôi xám & Vô hiệu hóa Slot đã đặt (Phương án A):
  - Khi render từng slot 30 phút (ví dụ: `09:00 - 09:30`, `09:30 - 10:00`, `10:00 - 10:30`, `10:30 - 11:00`):
    - Kiểm tra xem slot có rơi vào bất kỳ khoảng `[gioBatDau, gioKetThuc)` nào đã đặt hay không.
    - Đã triển khai Phương án A: class `.time-slot.booked` (màu nền xám `#e2e8f0`, chữ xám gạch ngang và chữ nhỏ *"Đã đặt"* bên dưới giờ, `pointer-events: none`).
- [x] **Task 2.4:** Kiểm tra tính liên tục & Chống chọn chồng lấn (Overlap Prevention):
  - Nếu người dùng chọn giờ bắt đầu và giờ kết thúc mà có bất kỳ slot đã đặt nào ở giữa: lập tức cảnh báo và chặn chuyển bước.

### Phase 3: Kiểm Thử & Xác Nhận (Verification)
- [ ] **Task 3.1:** Kiểm thử tình huống User 1 đặt `09:00 - 11:00` sân 1.
- [ ] **Task 3.2:** Xác nhận User 1 (hoặc User 2) quay lại sân 1:
  - Các ô `09:00`, `09:30`, `10:00`, `10:30` bị bôi xám hoàn toàn, không thể click.
  - Các ô `07:00 - 09:00` hoặc `11:00 - 13:00` vẫn click chọn và đặt thành công bình thường.
- [ ] **Task 3.3:** Kiểm tra với trường hợp ngày hôm sau: các slot của ngày hôm sau vẫn trống hoàn toàn.

---

## 💬 Socratic Gate — Câu Hỏi Thống Nhất Trải Nghiệm (UX Clarification)

Trước khi tiến hành sửa code, xin bạn xác nhận 2 điểm giao diện sau:

1. **Hiển thị Slot bị chiếm:**
   - Bạn muốn ô giờ đã đặt hiển thị dạng **nền xám nhạt + chữ gạch ngang** (kèm chữ *"Đã đặt"* nhỏ bên dưới), hay chỉ cần **màu xám và icon khóa 🔒**?
2. **Trạng thái giữ chỗ 10 phút:**
   - Đơn đang trong 10 phút chờ thanh toán (`ChoXacNhan`) có hiển thị màu khác (ví dụ: **vàng nhạt / Đang giữ chỗ**) so với đơn đã thanh toán xác nhận 100% (**xám / Đã đặt**) không, hay đều bôi xám chung để ngăn đặt trùng?

