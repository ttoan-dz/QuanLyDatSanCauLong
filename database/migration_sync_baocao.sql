-- =====================================================================
-- MIGRATION SCRIPT: ĐỒNG BỘ DỰ ÁN VỚI BÁO CÁO ĐẶC TẢ PHẦN MỀM
-- Đảm bảo an toàn dữ liệu: Không DROP TABLE, Không mất dữ liệu cũ.
-- =====================================================================

USE QuanLyDatSan;

SET NAMES 'utf8mb4';
SET CHARACTER SET utf8mb4;
SET character_set_connection = utf8mb4;

-- 1. Bổ sung các thuộc tính còn thiếu cho bảng DiaDiem (tương ứng CoSo)
ALTER TABLE DiaDiem 
    ADD COLUMN IF NOT EXISTS DiaChi VARCHAR(255) NULL AFTER TenDiaDiem,
    ADD COLUMN IF NOT EXISTS SDT VARCHAR(15) NULL AFTER DiaChi;

UPDATE DiaDiem SET DiaChi = 'Số 35 Trần Quý Kiên, Cầu Giấy, Hà Nội', SDT = '02438335566' WHERE TenDiaDiem = 'Nhà thi đấu Cầu Giấy' AND (DiaChi IS NULL OR DiaChi = '');
UPDATE DiaDiem SET DiaChi = 'Số 9 Khuất Duy Tiến, Thanh Xuân, Hà Nội', SDT = '02435588999' WHERE TenDiaDiem = 'Sân cầu lông Thanh Xuân' AND (DiaChi IS NULL OR DiaChi = '');

-- 2. Bổ sung thuộc tính LoaiSan cho bảng San
ALTER TABLE San 
    ADD COLUMN IF NOT EXISTS LoaiSan VARCHAR(50) NOT NULL DEFAULT 'Sân tiêu chuẩn' AFTER TenSan;

-- 3. Bổ sung các cột nghiệp vụ cho bảng DatSan
ALTER TABLE DatSan
    ADD COLUMN IF NOT EXISTS HanThanhToan DATETIME NULL AFTER NgayTao,
    ADD COLUMN IF NOT EXISTS TienSan DECIMAL(12,2) NOT NULL DEFAULT 0 AFTER HanThanhToan,
    ADD COLUMN IF NOT EXISTS TienTraTruoc DECIMAL(12,2) NOT NULL DEFAULT 0 AFTER TienSan,
    ADD COLUMN IF NOT EXISTS GioCheckIn DATETIME NULL AFTER GioKetThuc,
    ADD COLUMN IF NOT EXISTS GioCheckOut DATETIME NULL AFTER GioCheckIn,
    ADD COLUMN IF NOT EXISTS SoBlockQuaGio INT NOT NULL DEFAULT 0 AFTER GioCheckOut,
    ADD COLUMN IF NOT EXISTS TienQuaGio DECIMAL(12,2) NOT NULL DEFAULT 0 AFTER SoBlockQuaGio,
    ADD COLUMN IF NOT EXISTS MaNV INT NULL AFTER MaSan;

-- Cập nhật dữ liệu cũ của DatSan: TienSan = SoTien, TienTraTruoc = SoTien nếu DaThanhToan
UPDATE DatSan SET TienSan = SoTien WHERE TienSan = 0 AND SoTien > 0;
UPDATE DatSan SET TienTraTruoc = SoTien WHERE TrangThaiThanhToan = 'DaThanhToan' AND TienTraTruoc = 0;
UPDATE DatSan SET HanThanhToan = DATE_ADD(NgayTao, INTERVAL 10 MINUTE) WHERE HanThanhToan IS NULL;

-- Nới lỏng CHECK Constraint trên DatSan.TrangThaiDat để hỗ trợ DangChoi và KhongDen theo báo cáo
-- (Thực hiện an toàn nếu constraint tồn tại)
SET @drop_ck_query = (
    SELECT CONCAT('ALTER TABLE DatSan DROP CHECK ', CONSTRAINT_NAME, ';')
    FROM information_schema.TABLE_CONSTRAINTS
    WHERE TABLE_SCHEMA = 'QuanLyDatSan'
      AND TABLE_NAME = 'DatSan'
      AND CONSTRAINT_TYPE = 'CHECK'
      AND (CONSTRAINT_NAME LIKE '%TrangThaiDat%' OR CONSTRAINT_NAME LIKE '%CK_DatSan_TrangThaiDat%')
    LIMIT 1
);
PREPARE stmt FROM @drop_ck_query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 4. Bảng NHANVIEN (Kế thừa NguoiDung, quản lý nhân viên trực cơ sở)
CREATE TABLE IF NOT EXISTS NhanVien (
    MaNV        INT AUTO_INCREMENT PRIMARY KEY,
    MaDiaDiem   INT NULL,
    HoTen       VARCHAR(100) NOT NULL,
    SDT         VARCHAR(15)  NOT NULL UNIQUE,
    Email       VARCHAR(100) NULL,
    ChucVu      VARCHAR(20)  NOT NULL DEFAULT 'NhanVien', -- 'NhanVien', 'ChuSan', 'QuanTri'
    NgayVaoLam  DATE         NOT NULL DEFAULT (CURRENT_DATE),
    MaTK        INT          NULL UNIQUE,
    CONSTRAINT FK_NhanVien_DiaDiem FOREIGN KEY (MaDiaDiem) REFERENCES DiaDiem(MaDiaDiem),
    CONSTRAINT FK_NhanVien_TaiKhoan FOREIGN KEY (MaTK) REFERENCES TaiKhoan(MaTK)
) ENGINE=InnoDB CHARACTER SET utf8mb4;

-- Tạo Role Staff nếu chưa có
INSERT IGNORE INTO Role (TenRole) VALUES ('Staff');

-- Tạo nhân viên mẫu cho Admin hiện tại
INSERT INTO NhanVien (MaDiaDiem, HoTen, SDT, Email, ChucVu, NgayVaoLam, MaTK)
SELECT 1, 'Nguyễn Quản Trị', '0988888888', 'admin@datsan.vn', 'QuanTri', '2024-01-01', (SELECT MaTK FROM TaiKhoan WHERE TenDangNhap = 'admin')
WHERE NOT EXISTS (SELECT 1 FROM NhanVien WHERE MaTK = (SELECT MaTK FROM TaiKhoan WHERE TenDangNhap = 'admin'));

-- Tạo thêm tài khoản & nhân viên trực quầy mẫu
INSERT INTO TaiKhoan (TenDangNhap, MatKhau, MaRole, TrangThai)
SELECT 'staff.caugiay', '$2b$12$wnZrEYBPsOOZmPysC45jFukqGbA/eT9jVUI0yGSTHa1G6pQObPmke', (SELECT MaRole FROM Role WHERE TenRole = 'Staff' LIMIT 1), 'HoatDong'
WHERE NOT EXISTS (SELECT 1 FROM TaiKhoan WHERE TenDangNhap = 'staff.caugiay');

INSERT INTO NhanVien (MaDiaDiem, HoTen, SDT, Email, ChucVu, NgayVaoLam, MaTK)
SELECT 1, 'Trần Nhân Viên', '0912345678', 'staff.cg@datsan.vn', 'NhanVien', '2024-03-01', (SELECT MaTK FROM TaiKhoan WHERE TenDangNhap = 'staff.caugiay')
WHERE NOT EXISTS (SELECT 1 FROM NhanVien WHERE SDT = '0912345678');

-- 5. Bảng DICHVU (Nước uống, thuê vợt, vật dụng tại cơ sở)
CREATE TABLE IF NOT EXISTS DichVu (
    MaDV        INT AUTO_INCREMENT PRIMARY KEY,
    MaDiaDiem   INT NOT NULL,
    TenDV       VARCHAR(100) NOT NULL,
    LoaiDV      VARCHAR(20)  NOT NULL DEFAULT 'Ban', -- 'Ban', 'ChoThue'
    DonGia      DECIMAL(12,2) NOT NULL DEFAULT 0,
    SoLuongTon  INT NOT NULL DEFAULT 0,
    HinhAnh     VARCHAR(255) NULL,
    TrangThai   VARCHAR(20) NOT NULL DEFAULT 'HoatDong',
    CONSTRAINT FK_DichVu_DiaDiem FOREIGN KEY (MaDiaDiem) REFERENCES DiaDiem(MaDiaDiem),
    CONSTRAINT CK_DichVu_DonGia CHECK (DonGia >= 0),
    CONSTRAINT CK_DichVu_SoLuongTon CHECK (SoLuongTon >= 0)
) ENGINE=InnoDB CHARACTER SET utf8mb4;

-- Seed dữ liệu mẫu cho dịch vụ tại 2 cơ sở
INSERT INTO DichVu (MaDiaDiem, TenDV, LoaiDV, DonGia, SoLuongTon)
SELECT 1, 'Nước khoáng Aquafina 500ml', 'Ban', 10000, 100
WHERE NOT EXISTS (SELECT 1 FROM DichVu WHERE MaDiaDiem = 1 AND TenDV = 'Nước khoáng Aquafina 500ml');

INSERT INTO DichVu (MaDiaDiem, TenDV, LoaiDV, DonGia, SoLuongTon)
SELECT 1, 'Nước tăng lực Revive chanh muối', 'Ban', 15000, 80
WHERE NOT EXISTS (SELECT 1 FROM DichVu WHERE MaDiaDiem = 1 AND TenDV = 'Nước tăng lực Revive chanh muối');

INSERT INTO DichVu (MaDiaDiem, TenDV, LoaiDV, DonGia, SoLuongTon)
SELECT 1, 'Nước tăng lực RedBull', 'Ban', 20000, 60
WHERE NOT EXISTS (SELECT 1 FROM DichVu WHERE MaDiaDiem = 1 AND TenDV = 'Nước tăng lực RedBull');

INSERT INTO DichVu (MaDiaDiem, TenDV, LoaiDV, DonGia, SoLuongTon)
SELECT 1, 'Thuê vợt Yonex cao cấp (cây/ca)', 'ChoThue', 30000, 20
WHERE NOT EXISTS (SELECT 1 FROM DichVu WHERE MaDiaDiem = 1 AND TenDV LIKE 'Thuê vợt Yonex%');

INSERT INTO DichVu (MaDiaDiem, TenDV, LoaiDV, DonGia, SoLuongTon)
SELECT 1, 'Quả cầu lông Thành Công (quả)', 'Ban', 25000, 50
WHERE NOT EXISTS (SELECT 1 FROM DichVu WHERE MaDiaDiem = 1 AND TenDV LIKE 'Quả cầu lông%');

INSERT INTO DichVu (MaDiaDiem, TenDV, LoaiDV, DonGia, SoLuongTon)
SELECT 2, 'Nước khoáng Lavie 500ml', 'Ban', 10000, 100
WHERE NOT EXISTS (SELECT 1 FROM DichVu WHERE MaDiaDiem = 2 AND TenDV = 'Nước khoáng Lavie 500ml');

INSERT INTO DichVu (MaDiaDiem, TenDV, LoaiDV, DonGia, SoLuongTon)
SELECT 2, 'Thuê vợt Victor (cây/ca)', 'ChoThue', 30000, 15
WHERE NOT EXISTS (SELECT 1 FROM DichVu WHERE MaDiaDiem = 2 AND TenDV LIKE 'Thuê vợt Victor%');

-- 6. Bảng CHITIETDATSAN (Quản lý chi tiết từng lượt thuê, check-in, quá giờ)
CREATE TABLE IF NOT EXISTS ChiTietDatSan (
    MaCTDatSan    INT AUTO_INCREMENT PRIMARY KEY,
    MaDatSan      INT NOT NULL,
    MaSan         INT NOT NULL,
    MaNV          INT NULL,
    BatDau        DATETIME NOT NULL,
    KetThuc       DATETIME NOT NULL,
    GioCheckIn    DATETIME NULL,
    GioCheckOut   DATETIME NULL,
    TienSan       DECIMAL(12,2) NOT NULL DEFAULT 0,
    SoBlockQuaGio INT NOT NULL DEFAULT 0,
    TienQuaGio    DECIMAL(12,2) NOT NULL DEFAULT 0,
    TrangThai     VARCHAR(20) NOT NULL DEFAULT 'DaXacNhan', -- GiuCho, DaXacNhan, DangChoi, HoanThanh, DaHuy, KhongDen
    CONSTRAINT FK_CTDS_DatSan FOREIGN KEY (MaDatSan) REFERENCES DatSan(MaDatSan) ON DELETE CASCADE,
    CONSTRAINT FK_CTDS_San FOREIGN KEY (MaSan) REFERENCES San(MaSan),
    CONSTRAINT FK_CTDS_NhanVien FOREIGN KEY (MaNV) REFERENCES NhanVien(MaNV)
) ENGINE=InnoDB CHARACTER SET utf8mb4;

-- Đồng bộ dữ liệu hiện có từ DatSan vào ChiTietDatSan
INSERT INTO ChiTietDatSan (MaDatSan, MaSan, BatDau, KetThuc, TienSan, TrangThai)
SELECT 
    d.MaDatSan, 
    d.MaSan, 
    TIMESTAMP(d.NgayChoi, d.GioBatDau), 
    TIMESTAMP(d.NgayChoi, d.GioKetThuc), 
    d.SoTien, 
    CASE 
        WHEN d.TrangThaiDat = 'ChoXacNhan' THEN 'GiuCho'
        WHEN d.TrangThaiDat = 'DaXacNhan' THEN 'DaXacNhan'
        WHEN d.TrangThaiDat = 'HoanThanh' THEN 'HoanThanh'
        WHEN d.TrangThaiDat = 'DaHuy' AND d.LyDoHuy = 'KhongDenNhan' THEN 'KhongDen'
        WHEN d.TrangThaiDat = 'DaHuy' THEN 'DaHuy'
        ELSE 'DaXacNhan'
    END
FROM DatSan d
WHERE NOT EXISTS (SELECT 1 FROM ChiTietDatSan c WHERE c.MaDatSan = d.MaDatSan);

-- 7. Bảng CHITIETDICHVU (Ghi nhận các dịch vụ sử dụng cho đơn đặt sân)
CREATE TABLE IF NOT EXISTS ChiTietDichVu (
    MaCTDV      INT AUTO_INCREMENT PRIMARY KEY,
    MaDatSan    INT NOT NULL,
    MaDV        INT NOT NULL,
    SoLuong     INT NOT NULL DEFAULT 1,
    DonGia      DECIMAL(12,2) NOT NULL DEFAULT 0,
    GhiChu      VARCHAR(255) NULL,
    ThoiGian    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT FK_CTDV_DatSan FOREIGN KEY (MaDatSan) REFERENCES DatSan(MaDatSan) ON DELETE CASCADE,
    CONSTRAINT FK_CTDV_DichVu FOREIGN KEY (MaDV) REFERENCES DichVu(MaDV),
    CONSTRAINT CK_CTDV_SoLuong CHECK (SoLuong > 0),
    CONSTRAINT CK_CTDV_DonGia CHECK (DonGia >= 0)
) ENGINE=InnoDB CHARACTER SET utf8mb4;

-- 8. Bảng HOADON (Bảng tổng kết tài chính của đơn khi kết thúc)
CREATE TABLE IF NOT EXISTS HoaDon (
    MaHoaDon        INT AUTO_INCREMENT PRIMARY KEY,
    MaDatSan        INT NOT NULL UNIQUE,
    NgayLap         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    TongTienSan     DECIMAL(12,2) NOT NULL DEFAULT 0,
    TongTienDV      DECIMAL(12,2) NOT NULL DEFAULT 0,
    TienQuaGio      DECIMAL(12,2) NOT NULL DEFAULT 0,
    TienTraTruoc    DECIMAL(12,2) NOT NULL DEFAULT 0,
    TienHoanDuyet   DECIMAL(12,2) NOT NULL DEFAULT 0,
    ThanhTien       DECIMAL(12,2) NOT NULL DEFAULT 0,
    TrangThai       VARCHAR(20) NOT NULL DEFAULT 'DaThanhToan', -- 'ChuaThanhToan', 'DaThanhToan'
    CONSTRAINT FK_HoaDon_DatSan FOREIGN KEY (MaDatSan) REFERENCES DatSan(MaDatSan)
) ENGINE=InnoDB CHARACTER SET utf8mb4;

-- Tạo hóa đơn mẫu cho các đơn đã HoanThanh cũ
INSERT INTO HoaDon (MaDatSan, NgayLap, TongTienSan, TongTienDV, TienQuaGio, TienTraTruoc, TienHoanDuyet, ThanhTien, TrangThai)
SELECT 
    d.MaDatSan,
    d.NgayTao,
    d.SoTien,
    0,
    0,
    d.SoTien,
    0,
    0,
    'DaThanhToan'
FROM DatSan d
WHERE d.TrangThaiDat = 'HoanThanh'
  AND NOT EXISTS (SELECT 1 FROM HoaDon h WHERE h.MaDatSan = d.MaDatSan);

-- 9. Bổ sung các cột cho bảng ThanhToan
ALTER TABLE ThanhToan
    ADD COLUMN IF NOT EXISTS MaHoaDon INT NULL AFTER MaDatSan,
    ADD COLUMN IF NOT EXISTS MaGiaoDich VARCHAR(100) NULL AFTER MaHoaDon,
    ADD COLUMN IF NOT EXISTS LoaiThanhToan VARCHAR(20) NOT NULL DEFAULT 'TraTruoc' AFTER MaGiaoDich;

-- 10. Bảng HOANTIEN (Lưu kết quả hủy đơn và tính tỷ lệ hoàn tiền theo chính sách)
CREATE TABLE IF NOT EXISTS HoanTien (
    MaHoanTien    INT AUTO_INCREMENT PRIMARY KEY,
    MaDatSan      INT NOT NULL,
    MaThanhToan   INT NULL,
    NgayYeuCau    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    LyDo          VARCHAR(255) NOT NULL,
    LoaiHuy       VARCHAR(20) NOT NULL DEFAULT 'KhachHuy', -- 'KhachHuy', 'CoSoHuy', 'KhongDen'
    TyLeHoan      INT NOT NULL DEFAULT 0,                  -- 0, 50, 100
    SoTienHoan    DECIMAL(12,2) NOT NULL DEFAULT 0,
    TrangThai     VARCHAR(20) NOT NULL DEFAULT 'DaHoan',    -- 'ChoHoan', 'DaHoan', 'ThatBai', 'KhongHoan'
    CONSTRAINT FK_HoanTien_DatSan FOREIGN KEY (MaDatSan) REFERENCES DatSan(MaDatSan),
    CONSTRAINT FK_HoanTien_ThanhToan FOREIGN KEY (MaThanhToan) REFERENCES ThanhToan(MaThanhToan)
) ENGINE=InnoDB CHARACTER SET utf8mb4;

-- Seed dữ liệu mẫu cho đơn đã hủy số 4 (No-Show: KhongDenNhan)
INSERT INTO HoanTien (MaDatSan, NgayYeuCau, LyDo, LoaiHuy, TyLeHoan, SoTienHoan, TrangThai)
SELECT 4, '2026-09-25 20:30:00', 'Khách không đến nhận sân quá 30 phút', 'KhongDen', 0, 0, 'KhongHoan'
WHERE EXISTS (SELECT 1 FROM DatSan WHERE MaDatSan = 4)
  AND NOT EXISTS (SELECT 1 FROM HoanTien WHERE MaDatSan = 4);
