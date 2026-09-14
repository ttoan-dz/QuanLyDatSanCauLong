# 📋 API-TEST — Hướng dẫn test Postman cho Quản Lý Đặt Sân Cầu Lông

> **Base URL**: `http://localhost:8080`
>
> Database đã có dữ liệu mẫu sẵn (từ `database/QLSanCauLong.sql`):
> - Admin: `admin` / `123456`
> - User mẫu: `an.nguyen`, `binh.tran`, `cuong.le`, `dung.pham` — tất cả mật khẩu `123456`
> - 2 Địa điểm: ID=1 (Nhà thi đấu Cầu Giấy, 5 sân), ID=2 (Sân cầu lông Thanh Xuân, 2 sân)

---

## 1. 🔐 AUTH (`/api/auth` — permitAll)

### 1.1 Đăng ký tài khoản mới

```
POST http://localhost:8080/api/auth/register
Content-Type: application/json
```

```json
{
  "hoTen": "Lê Văn Test",
  "sdt": "0909999888",
  "email": "test@gmail.com",
  "tenDangNhap": "levantest",
  "matKhau": "123456"
}
```

> ✅ Kết quả mong đợi: `201 Created`, body `{"message": "Đăng ký thành công"}`

### 1.2 Đăng nhập User (lấy TOKEN_USER)

```
POST http://localhost:8080/api/auth/login
Content-Type: application/json
```

```json
{
  "tenDangNhap": "an.nguyen",
  "matKhau": "123456"
}
```

> ✅ Kết quả: `200 OK`, body chứa `token`, `role: "CUSTOMER"`, `hoTen`, `maKH`.
> **Lưu token này** → gọi là `TOKEN_USER`, dùng cho các API ở mục 3.

### 1.3 Đăng nhập Admin (lấy TOKEN_ADMIN)

```
POST http://localhost:8080/api/auth/login
Content-Type: application/json
```

```json
{
  "tenDangNhap": "admin",
  "matKhau": "123456"
}
```

> ✅ Kết quả: `200 OK`, body chứa `token`, `role: "ADMIN"`, `maKH: null`.
> **Lưu token này** → gọi là `TOKEN_ADMIN`, dùng cho các API ở mục 4.

### 1.4 Đăng nhập sai mật khẩu

```
POST http://localhost:8080/api/auth/login
Content-Type: application/json
```

```json
{
  "tenDangNhap": "an.nguyen",
  "matKhau": "saimatkhau"
}
```

> ❌ Kết quả: `401 Unauthorized`

### 1.5 Đăng nhập tài khoản bị khóa

```
POST http://localhost:8080/api/auth/login
Content-Type: application/json
```

```json
{
  "tenDangNhap": "dung.pham",
  "matKhau": "123456"
}
```

> ❌ Kết quả: `401 Unauthorized` (tài khoản dung.pham đang bị khóa trong DB mẫu)

---

## 2. 🌐 PUBLIC (`/api/public` — permitAll)

### 2.1 Xem sân trống tại 1 địa điểm

```
GET http://localhost:8080/api/public/courts/1/available?ngay=2026-09-01&batDau=18:00:00&ketThuc=19:00:00
```

> ✅ Kết quả: `200 OK`, danh sách `SanResponse[]` — các sân hoạt động tại địa điểm 1
> không bị trùng lịch trong khung giờ đó.
> Mỗi item có: `maSan`, `tenDiaDiem`, `tenSan`, `tinhTrang`, `hinhAnh`

---

## 3. 👤 USER (`/api/user` — cần `TOKEN_USER`)

> **Header chung cho tất cả API dưới đây:**
> ```
> Content-Type: application/json
> Authorization: Bearer <TOKEN_USER>
> ```

### 3.1 Đặt sân — Thanh toán QR

```
POST http://localhost:8080/api/user/booking
Authorization: Bearer <TOKEN_USER>
Content-Type: application/json
```

```json
{
  "maSan": 1,
  "ngayChoi": "2026-09-01",
  "gioBatDau": "18:00:00",
  "gioKetThuc": "19:00:00",
  "phuongThucThanhToan": "QR",
  "ghiChu": "Đặt sân buổi tối"
}
```

> ✅ Kết quả: `201 Created`, body `DatSanResponse` với `trangThaiDat: "ChoXacNhan"`,
> `trangThaiThanhToan: "ChuaThanhToan"`, `soTien` được tính tự động.
> **Ghi lại `maDatSan`** trả về → dùng cho bước 3.3 (thanh toán QR).

### 3.2 Đặt sân — Thanh toán Tiền mặt

```
POST http://localhost:8080/api/user/booking
Authorization: Bearer <TOKEN_USER>
Content-Type: application/json
```

```json
{
  "maSan": 2,
  "ngayChoi": "2026-09-02",
  "gioBatDau": "19:00:00",
  "gioKetThuc": "20:30:00",
  "phuongThucThanhToan": "TienMat",
  "ghiChu": null
}
```

> ✅ Kết quả: `201 Created`, `trangThaiDat: "ChoXacNhan"`.
> **Ghi lại `maDatSan`** → dùng cho bước 4.1 (admin xác nhận tiền mặt).

### 3.3 Thanh toán QR (xác nhận đơn QR)

```
POST http://localhost:8080/api/user/booking/{maDatSan_QR}/pay-qr
Authorization: Bearer <TOKEN_USER>
```

> ✅ Kết quả: `200 OK`, `trangThaiDat: "DaXacNhan"`, `trangThaiThanhToan: "DaThanhToan"`.
> (Thay `{maDatSan_QR}` bằng ID từ bước 3.1)

### 3.4 Xem lịch sử đặt sân

```
GET http://localhost:8080/api/user/booking/history
Authorization: Bearer <TOKEN_USER>
```

> ✅ Kết quả: `200 OK`, danh sách `DatSanResponse[]` sắp xếp mới nhất trước.

### 3.5 Hủy đơn — trạng thái ChoXacNhan (hủy ngay)

Tạo thêm 1 đơn mới trước (lặp lại bước 3.1/3.2 với ngày/giờ khác), rồi hủy:

```
PUT http://localhost:8080/api/user/booking/{maDatSan}/cancel
Authorization: Bearer <TOKEN_USER>
Content-Type: application/json
```

```json
{}
```

> ✅ Kết quả: `200 OK`, `trangThaiDat: "DaHuy"`, `lyDoHuy` sẽ là `"NguoiDungHuy"`.

### 3.6 Hủy đơn — trạng thái DaXacNhan (gửi yêu cầu hủy, chờ admin duyệt)

Dùng `maDatSan` của đơn QR đã thanh toán ở bước 3.3:

```
PUT http://localhost:8080/api/user/booking/{maDatSan_QR}/cancel
Authorization: Bearer <TOKEN_USER>
Content-Type: application/json
```

```json
{}
```

> ✅ Kết quả: `200 OK`, `trangThaiDat: "ChoHuy"` (không hủy ngay, chờ admin).
> **Ghi lại `maDatSan`** → dùng cho bước 4.3 (admin duyệt yêu cầu hủy).

### 3.7 Xem thông báo

```
GET http://localhost:8080/api/user/notifications
Authorization: Bearer <TOKEN_USER>
```

> ✅ Kết quả: `200 OK`, danh sách `ThongBaoResponse[]`.

### 3.8 Đánh dấu thông báo đã đọc

```
PUT http://localhost:8080/api/user/notifications/{maThongBao}/read
Authorization: Bearer <TOKEN_USER>
```

> ✅ Kết quả: `200 OK`, body trống.

---

## 4. 🛡️ ADMIN (`/api/admin` — cần `TOKEN_ADMIN`)

> **Header chung cho tất cả API dưới đây:**
> ```
> Content-Type: application/json
> Authorization: Bearer <TOKEN_ADMIN>
> ```

### 4.1 Xác nhận thanh toán tiền mặt

```
PUT http://localhost:8080/api/admin/bookings/{maDatSan_TienMat}/confirm-cash
Authorization: Bearer <TOKEN_ADMIN>
```

> ✅ Kết quả: `200 OK`, `trangThaiDat: "DaXacNhan"`, `trangThaiThanhToan: "DaThanhToan"`.
> (Thay `{maDatSan_TienMat}` bằng ID từ bước 3.2)

### 4.2 Admin hủy đơn — No-show (khách không đến nhận sân)

```
PUT http://localhost:8080/api/admin/bookings/{maDatSan}/cancel
Authorization: Bearer <TOKEN_ADMIN>
Content-Type: application/json
```

```json
{
  "lyDoHuy": "KhongDenNhan",
  "ghiChu": "Khách không đến nhận sân"
}
```

> ✅ Kết quả: `200 OK`, `trangThaiDat: "DaHuy"`. KhachHang.soLanNoShow +1.

### 4.3 Admin hủy đơn — Lý do chung

```
PUT http://localhost:8080/api/admin/bookings/{maDatSan}/cancel
Authorization: Bearer <TOKEN_ADMIN>
Content-Type: application/json
```

```json
{
  "lyDoHuy": "AdminHuy",
  "ghiChu": null
}
```

> ✅ Kết quả: `200 OK`, `trangThaiDat: "DaHuy"`, `lyDoHuy: "AdminHuy"`.

### 4.4 Duyệt yêu cầu hủy — Đồng ý

```
PUT http://localhost:8080/api/admin/bookings/{maDatSan_ChoHuy}/approve-cancel
Authorization: Bearer <TOKEN_ADMIN>
Content-Type: application/json
```

```json
{
  "dongY": true,
  "ghiChu": "Chấp nhận yêu cầu hủy"
}
```

> ✅ Kết quả: `200 OK`, `trangThaiDat: "DaHuy"`.
> (Thay `{maDatSan_ChoHuy}` bằng ID từ bước 3.6)

### 4.5 Duyệt yêu cầu hủy — Từ chối

```
PUT http://localhost:8080/api/admin/bookings/{maDatSan_ChoHuy}/approve-cancel
Authorization: Bearer <TOKEN_ADMIN>
Content-Type: application/json
```

```json
{
  "dongY": false,
  "ghiChu": "Không đồng ý hủy"
}
```

> ✅ Kết quả: `200 OK`, `trangThaiDat: "DaXacNhan"` (khôi phục lại).

### 4.6 Tạo địa điểm + sân mới

```
POST http://localhost:8080/api/admin/courts
Authorization: Bearer <TOKEN_ADMIN>
Content-Type: application/json
```

```json
{
  "tenDiaDiem": "Sân cầu lông Hoàng Mai",
  "gioMo": "07:00:00",
  "gioDong": "22:00:00",
  "soSanNho": 3,
  "hinhAnh": "/images/hoang-mai.jpg"
}
```

> ✅ Kết quả: `201 Created`. Tạo 1 DiaDiem + 3 San ("Sân 1", "Sân 2", "Sân 3").

### 4.7 Sửa địa điểm (đổi tên, giờ, thêm/bớt sân)

```
PUT http://localhost:8080/api/admin/courts/{maDiaDiem}
Authorization: Bearer <TOKEN_ADMIN>
Content-Type: application/json
```

```json
{
  "tenMoi": "Sân cầu lông Hoàng Mai (mới)",
  "gioMo": "06:00:00",
  "gioDong": "23:00:00",
  "soSanNhoMoi": 5,
  "hinhAnh": "/images/hoang-mai-new.jpg"
}
```

> ✅ Kết quả: `200 OK`. Nếu tăng sân thì thêm mới, giảm thì xoá (báo lỗi nếu sân đang có đơn).

### 4.8 Cập nhật ảnh sân

```
PUT http://localhost:8080/api/admin/courts/court/{maSan}/image
Authorization: Bearer <TOKEN_ADMIN>
Content-Type: application/json
```

```json
{
  "hinhAnh": "/images/san-moi-cap-nhat.jpg"
}
```

> ✅ Kết quả: `200 OK`.

### 4.9 Xem danh sách khách hàng

```
GET http://localhost:8080/api/admin/users
Authorization: Bearer <TOKEN_ADMIN>
```

> ✅ Kết quả: `200 OK`, danh sách `KhachHangResponse[]` gồm `maKH`, `hoTen`,
> `sdt`, `email`, `soLanNoShow`, `trangThaiTaiKhoan`.

### 4.10 Khóa/Mở tài khoản (toggle)

```
PUT http://localhost:8080/api/admin/users/{maTK}/toggle-status
Authorization: Bearer <TOKEN_ADMIN>
```

> ✅ Kết quả: `200 OK`. TrangThai chuyển "HoatDong" ↔ "Khoa".

### 4.11 Thống kê doanh thu theo tháng

```
GET http://localhost:8080/api/admin/revenue/month?nam=2026&thang=8
Authorization: Bearer <TOKEN_ADMIN>
```

> ✅ Kết quả: `200 OK`, body `ThongKeDoanhThuResponse` gồm `thang`, `nam`,
> `tongDoanhThu`, `soDon`.

### 4.12 Thống kê doanh thu theo năm

```
GET http://localhost:8080/api/admin/revenue/year?nam=2026
Authorization: Bearer <TOKEN_ADMIN>
```

> ✅ Kết quả: `200 OK`, `thang: null`, `tongDoanhThu` tổng cả năm.

---

## 5. ❌ Test lỗi Validation

### 5.1 Đăng ký thiếu field

```
POST http://localhost:8080/api/auth/register
Content-Type: application/json
```

```json
{
  "hoTen": "",
  "sdt": "abc",
  "tenDangNhap": "ab",
  "matKhau": "123"
}
```

> ❌ Kết quả: `400 Bad Request`, body `ApiErrorResponse` liệt kê các lỗi validation.

### 5.2 Gọi API cần auth nhưng không gửi token

```
GET http://localhost:8080/api/user/booking/history
```

> ❌ Kết quả: `401 Unauthorized` hoặc `403 Forbidden`.

### 5.3 User gọi API admin

```
GET http://localhost:8080/api/admin/users
Authorization: Bearer <TOKEN_USER>
```

> ❌ Kết quả: `403 Forbidden`.

---

## 6. 🎯 Kịch bản test End-to-End đề xuất

Thực hiện theo đúng thứ tự dưới đây để test trọn vẹn luồng nghiệp vụ:

```
1.  POST /api/auth/register        → Đăng ký user mới
2.  POST /api/auth/login            → Login user → lưu TOKEN_USER
3.  POST /api/auth/login            → Login admin → lưu TOKEN_ADMIN
4.  GET  /api/public/courts/1/available → Xem sân trống ngày mai 18h–19h
5.  POST /api/user/booking          → Đặt sân QR (ghi lại maDatSan = A)
6.  POST /api/user/booking/{A}/pay-qr → Thanh toán QR → DaXacNhan
7.  GET  /api/user/booking/history   → Xác nhận đơn A đã DaXacNhan
8.  GET  /api/user/notifications     → Có thông báo "Thanh toán QR thành công"
9.  POST /api/user/booking          → Đặt sân TienMat (ghi lại maDatSan = B)
10. PUT  /api/admin/bookings/{B}/confirm-cash → Admin xác nhận tiền mặt
11. PUT  /api/user/booking/{A}/cancel → User yêu cầu hủy đơn A (đã DaXacNhan → ChoHuy)
12. PUT  /api/admin/bookings/{A}/approve-cancel → Admin đồng ý hủy
13. GET  /api/user/notifications     → Có thông báo "yêu cầu hủy được chấp nhận"
14. POST /api/user/booking          → Đặt sân QR mới, KHÔNG thanh toán
15. ⏰  Chờ 15 phút → Scheduler tự chuyển thành "HetHan"
16. GET  /api/user/booking/history   → Xác nhận đơn đã HetHan
17. POST /api/admin/courts          → Tạo địa điểm mới + 3 sân
18. PUT  /api/admin/courts/{id}     → Sửa: tăng lên 5 sân
19. GET  /api/admin/users           → Xem danh sách khách hàng
20. PUT  /api/admin/users/{maTK}/toggle-status → Khóa tài khoản user
21. POST /api/auth/login (user bị khóa) → Xác nhận bị chặn 401
22. GET  /api/admin/revenue/month?nam=2026&thang=9 → Xem doanh thu tháng
23. GET  /api/admin/revenue/year?nam=2026 → Xem doanh thu năm
```

> 💡 **Mẹo Postman**: Tạo biến môi trường `{{BASE_URL}}`, `{{TOKEN_USER}}`,
> `{{TOKEN_ADMIN}}` để không phải copy-paste token mỗi lần.
> Trong tab **Tests** của request Login, thêm script:
> ```javascript
> var res = pm.response.json();
> pm.environment.set("TOKEN_USER", res.token);
> ```

