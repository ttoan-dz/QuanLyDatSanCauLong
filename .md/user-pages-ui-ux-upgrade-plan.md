# Kế Hoạch: Nâng Cấp Toàn Diện Giao Diện Người Dùng Với `ui-ux-pro-max`

> **Mã tác vụ:** `user-pages-ui-ux-upgrade-plan`  
> **Bộ tiêu chuẩn áp dụng:** `ui-ux-pro-max-skill` (Vibrant Athletic Energy, Design Tokens, Micro-interactions, Accessibility WCAG AA, Mobile-first Touch Target $\ge 44\text{px}$).

---

## 🎨 1. Định Hướng Thiết Kế Chuẩn Thể Thao (Design Direction)

Theo kết quả trích xuất từ cơ sở dữ liệu `ui-ux-pro-max` (`sports badminton booking`):

| Thuộc tính | Hiện trạng | Đề xuất nâng cấp `ui-ux-pro-max` |
|------------|------------|-----------------------------------|
| **Phong cách** | Cơ bản, phẳng, thiếu chiều sâu thể thao | **Modern Athletic Card**: Nổi khối, viền mỏng tinh tế, hiệu ứng hover mượt mà 200ms. |
| **Bảng màu (Tokens)** | Màu xanh lá đơn điệu | **Emerald Athletic & Fresh Mint**: Gradient năng động (`#059669` $\to$ `#10b981`), màu phụ trợ cam thể thao (`#f97316`) cho trạng thái đang có người chơi. |
| **Hình ảnh Sân** | Ảnh tĩnh cắt cụt | **Interactive Cover**: Zoom nhẹ (`scale 1.05`) khi hover, lớp gradient overlay bảo vệ độ tương phản chữ. |
| **Huy hiệu (Badges)** | Khối chữ phẳng | **Pill Badges + Pulsing Dot**: Chấm tròn xanh lá phát sáng nhịp nhàng cho sân sẵn sàng (`Hoạt động`). |
| **Thanh điều hướng** | Navbar đơn sơ | **Glassmorphism Navbar**: Nền mờ kính cao cấp `backdrop-filter: blur(12px)` + hiệu ứng tab active rõ nét. |
| **Mobile & Touch** | Nút bấm nhỏ, khoảng cách hẹp | Chuẩn **Touch Target $\ge 44\text{px}$**, thanh cuộn ngang địa điểm dạng chip trượt êm ái trên điện thoại. |

---

## 📋 2. Phân Rã Công Việc Nâng Cấp (Phase Breakdown)

### Phase 1: Nâng cấp Header & Hệ thống Design Token Chung (`style.css`)
- [x] **Task 1.1:** Tinh chỉnh Design Tokens: bổ sung bóng đổ đa tầng (`--shadow-athletic`), màu gradient thương hiệu (`--primary-gradient`), hiệu ứng bo góc mượt mà (`--radius-card: 14px`).
- [x] **Task 1.2:** Nâng cấp **Navbar**: Hiệu ứng kính mờ (Glassmorphism `backdrop-filter: blur(12px)`), logo huy hiệu `brand-icon`, menu điều hướng đồng bộ toàn hệ thống.

### Phase 2: Nâng cấp Trang Danh Sách Sân ([`courts.html`](file:///c:/Users/tn180/OneDrive/Desktop/QuanLyDatSanCauLong-main/frontend/pages/user/courts.html))
- [x] **Task 2.1:** **Hero Header & Search Bar**: Thanh tìm kiếm nhanh thời gian thực kết hợp bộ lọc trạng thái Filter Chips (Tất cả, Đang trống, Đang chơi).
- [x] **Task 2.2:** **Sidebar Địa Điểm**: Danh sách card địa điểm tương tác cao, viền xanh active bên trái, hiển thị giờ mở cửa và số lượng sân.
- [x] **Task 2.3:** **Court Cards**:
  - Tỉ lệ ảnh 16:9 chuẩn thể thao, hiệu ứng zoom mượt mà (`scale 1.05`).
  - Chấm tròn xanh phát sáng nhịp nhàng (`pulsing-dot`) biểu thị sân đang sẵn sàng.
  - Hộp hiển thị giá thuê rõ ràng (`50.000đ / 30 phút`).
  - Nút bấm "⚡ Đặt sân" chuẩn CTA thể thao.

### Phase 3: Nâng cấp Trang Đặt Sân ([`booking.html`](file:///c:/Users/tn180/OneDrive/Desktop/QuanLyDatSanCauLong-main/frontend/pages/user/booking.html))
- [x] **Task 3.1:** **Progress Stepper (Thanh tiến trình 2 bước)**: Thiết kế nổi khối, số bước tròn gradient kèm bóng đổ.
- [x] **Task 3.2:** **Lưới chọn giờ (Time Slots Grid)**: Đồng bộ phong cách mới, phân biệt rõ Quá khứ (`⏳ Đã qua`) vs Đã đặt (`🔒 Đã đặt`), thanh Legend tinh gọn.

### Phase 4: Đồng Bộ Trang Chủ ([`index.html`](file:///c:/Users/tn180/OneDrive/Desktop/QuanLyDatSanCauLong-main/frontend/index.html)) & Các Trang Con
- [x] **Task 4.1:** Đồng bộ Glassmorphism Navbar trên `index.html`, `history.html`, `notifications.html`, `profile.html`.
- [x] **Task 4.2:** Nâng cấp Hero Banner trang chủ với huy hiệu thể thao `🏸 Nền Tảng Đặt Sân Cầu Lông Số 1` và bóng đổ sâu.

---

## 💬 3. Socratic Gate: Xác Nhận Phạm Vi & Lộ Trình

Để triển khai đẹp nhất theo đúng ý bạn, xin bạn chọn cách thực hiện:

1. **Phương án 1 (Khuyên dùng - Cuốn chiếu từng trang):** Nâng cấp hoàn thiện ngay trang **`courts.html` (Danh sách sân)** trước tiên để bạn xem và cảm nhận sự lột xác của giao diện, sau đó tiếp tục sang `booking.html` và `history.html`.
2. **Phương án 2 (Đồng loạt toàn bộ):** Cập nhật toàn bộ file CSS dùng chung và làm mới tất cả 5 trang của user cùng một lúc.

