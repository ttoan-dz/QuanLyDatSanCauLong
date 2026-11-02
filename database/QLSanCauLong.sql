/* =====================================================================
   QUẢN LÝ ĐẶT SÂN CẦU LÔNG — bản MySQL (8.0+)
   Phiên bản ĐỒNG BỘ HOÀN TOÀN THEO BÁO CÁO ĐẶC TẢ PHẦN MỀM
   Bao gồm đầy đủ 12 thực thể nghiệp vụ:
   - KhachHang, NhanVien, DiaDiem (CoSo), San, BangGia (KhungGia),
   - DatSan, ChiTietDatSan, DichVu, ChiTietDichVu, HoaDon, ThanhToan, HoanTien.
   
   Charset: utf8mb4 (hỗ trợ đầy đủ tiếng Việt có dấu).
   ===================================================================== */

CREATE DATABASE IF NOT EXISTS QuanLyDatSan
    CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE QuanLyDatSan;

/* ---------------------------------------------------------------------
   1. BẢNG DỮ LIỆU
   --------------------------------------------------------------------- */

-- 1.1 Khách hàng (kế thừa NguoiDung)
CREATE TABLE IF NOT EXISTS KhachHang (
    MaKH        INT AUTO_INCREMENT PRIMARY KEY,
    HoTen       VARCHAR(100) NOT NULL,
    SDT         VARCHAR(15)  NOT NULL UNIQUE,
    Email       VARCHAR(100) NULL,
    SoLanNoShow INT NOT NULL DEFAULT 0,
    NgayTao     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB CHARACTER SET utf8mb4;

-- 1.2 Địa điểm / Cơ sở kinh doanh (CoSo)
CREATE TABLE IF NOT EXISTS DiaDiem (
    MaDiaDiem   INT AUTO_INCREMENT PRIMARY KEY,
    TenDiaDiem  VARCHAR(100) NOT NULL UNIQUE,
    DiaChi      VARCHAR(255) NULL,
    SDT         VARCHAR(15)  NULL,
    GioMo       TIME NOT NULL DEFAULT '08:00:00',
    GioDong     TIME NOT NULL DEFAULT '20:00:00',
    TrangThai   VARCHAR(20) NOT NULL DEFAULT 'HoatDong',
    MapLink     VARCHAR(500) NULL,
    CONSTRAINT CK_DiaDiem_Gio CHECK (GioDong > GioMo),
    CONSTRAINT CK_DiaDiem_TrangThai CHECK (TrangThai IN ('HoatDong', 'TamNgung'))
) ENGINE=InnoDB CHARACTER SET utf8mb4;

-- 1.3 Sân cầu lông
CREATE TABLE IF NOT EXISTS San (
    MaSan       INT AUTO_INCREMENT PRIMARY KEY,
    MaDiaDiem   INT NOT NULL,
    TenSan      VARCHAR(50) NOT NULL,
    LoaiSan     VARCHAR(50) NOT NULL DEFAULT 'Sân tiêu chuẩn',
    TinhTrang   VARCHAR(20) NOT NULL DEFAULT 'HoatDong',
    GhiChu      VARCHAR(200) NULL,
    HinhAnh     VARCHAR(255) NULL,
    CONSTRAINT UQ_San_TenSan_TheoDiaDiem UNIQUE (MaDiaDiem, TenSan),
    CONSTRAINT FK_San_DiaDiem FOREIGN KEY (MaDiaDiem) REFERENCES DiaDiem(MaDiaDiem),
    CONSTRAINT CK_San_TinhTrang CHECK (TinhTrang IN ('HoatDong', 'TamNgung', 'BaoTri'))
) ENGINE=InnoDB CHARACTER SET utf8mb4;

-- 1.4 Bảng giá / Khung giá
CREATE TABLE IF NOT EXISTS BangGia (
    MaBangGia     INT AUTO_INCREMENT PRIMARY KEY,
    TenBangGia    VARCHAR(100) NOT NULL,
    GiaMoi30Phut  INT NOT NULL,
    DangApDung    TINYINT(1) NOT NULL DEFAULT 1,
    NgayApDung    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT CK_BangGia_Gia CHECK (GiaMoi30Phut > 0)
) ENGINE=InnoDB CHARACTER SET utf8mb4;

-- 1.5 Phân quyền & Tài khoản hệ thống
CREATE TABLE IF NOT EXISTS Role (
    MaRole   INT AUTO_INCREMENT PRIMARY KEY,
    TenRole  VARCHAR(50) NOT NULL UNIQUE
) ENGINE=InnoDB CHARACTER SET utf8mb4;

CREATE TABLE IF NOT EXISTS TaiKhoan (
    MaTK          INT AUTO_INCREMENT PRIMARY KEY,
    TenDangNhap   VARCHAR(50) NOT NULL UNIQUE,
    MatKhau       VARCHAR(100) NOT NULL,
    MaRole        INT NOT NULL,
    MaKH          INT NULL,
    TrangThai     VARCHAR(20) NOT NULL DEFAULT 'HoatDong',
    NgayTao       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT FK_TaiKhoan_Role FOREIGN KEY (MaRole) REFERENCES Role(MaRole),
    CONSTRAINT FK_TaiKhoan_KhachHang FOREIGN KEY (MaKH) REFERENCES KhachHang(MaKH),
    CONSTRAINT CK_TaiKhoan_TrangThai CHECK (TrangThai IN ('HoatDong', 'Khoa'))
) ENGINE=InnoDB CHARACTER SET utf8mb4;

-- 1.6 Nhân viên (kế thừa NguoiDung, quản lý theo cơ sở)
CREATE TABLE IF NOT EXISTS NhanVien (
    MaNV        INT AUTO_INCREMENT PRIMARY KEY,
    MaDiaDiem   INT NULL,
    HoTen       VARCHAR(100) NOT NULL,
    SDT         VARCHAR(15)  NOT NULL UNIQUE,
    Email       VARCHAR(100) NULL,
    ChucVu      VARCHAR(20)  NOT NULL DEFAULT 'NhanVien', -- NhanVien, ChuSan, QuanTri
    NgayVaoLam  DATE         NOT NULL DEFAULT (CURRENT_DATE),
    MaTK        INT          NULL UNIQUE,
    CONSTRAINT FK_NhanVien_DiaDiem FOREIGN KEY (MaDiaDiem) REFERENCES DiaDiem(MaDiaDiem),
    CONSTRAINT FK_NhanVien_TaiKhoan FOREIGN KEY (MaTK) REFERENCES TaiKhoan(MaTK)
) ENGINE=InnoDB CHARACTER SET utf8mb4;

-- 1.7 Đơn đặt sân (DatSan)
CREATE TABLE IF NOT EXISTS DatSan (
    MaDatSan              INT AUTO_INCREMENT PRIMARY KEY,
    MaKH                  INT NOT NULL,
    MaSan                 INT NOT NULL,
    MaNV                  INT NULL,
    NgayChoi              DATE NOT NULL,
    GioBatDau             TIME NOT NULL,
    GioKetThuc            TIME NOT NULL,
    GioCheckIn            DATETIME NULL,
    GioCheckOut           DATETIME NULL,
    SoBlockQuaGio         INT NOT NULL DEFAULT 0,
    TienQuaGio            DECIMAL(12,2) NOT NULL DEFAULT 0,
    TrangThaiDat          VARCHAR(20) NOT NULL DEFAULT 'ChoXacNhan', -- ChoXacNhan, DaXacNhan, DangChoi, ChoHuy, DaHuy, HetHan, HoanThanh, KhongDen
    TrangThaiThanhToan    VARCHAR(20) NOT NULL DEFAULT 'ChuaThanhToan', -- ChuaThanhToan, DaThanhToan
    PhuongThucThanhToan   VARCHAR(20) NOT NULL DEFAULT 'TienMat', -- QR, TienMat, VNPay, MoMo
    LyDoHuy               VARCHAR(50) NULL, -- NguoiDungHuy, KhongDenNhan, AdminHuy
    SoTien                INT NOT NULL DEFAULT 0,
    TienSan               DECIMAL(12,2) NOT NULL DEFAULT 0,
    TienTraTruoc          DECIMAL(12,2) NOT NULL DEFAULT 0,
    GhiChu                VARCHAR(200) NULL,
    HanThanhToan          DATETIME NULL,
    NgayTao               DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT FK_DatSan_KhachHang FOREIGN KEY (MaKH) REFERENCES KhachHang(MaKH),
    CONSTRAINT FK_DatSan_San FOREIGN KEY (MaSan) REFERENCES San(MaSan),
    CONSTRAINT FK_DatSan_NhanVien FOREIGN KEY (MaNV) REFERENCES NhanVien(MaNV),
    CONSTRAINT CK_DatSan_GioHopLe CHECK (GioKetThuc > GioBatDau),
    CONSTRAINT CK_DatSan_SoTien CHECK (SoTien >= 0),
    CONSTRAINT CK_DatSan_TrangThaiThanhToan CHECK (TrangThaiThanhToan IN ('ChuaThanhToan', 'DaThanhToan'))
) ENGINE=InnoDB CHARACTER SET utf8mb4;

-- 1.8 Chi tiết đặt sân (ChiTietDatSan)
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

-- 1.9 Dịch vụ tại sân (DichVu)
CREATE TABLE IF NOT EXISTS DichVu (
    MaDV        INT AUTO_INCREMENT PRIMARY KEY,
    MaDiaDiem   INT NOT NULL,
    TenDV       VARCHAR(100) NOT NULL,
    LoaiDV      VARCHAR(20)  NOT NULL DEFAULT 'Ban', -- Ban, ChoThue
    DonGia      DECIMAL(12,2) NOT NULL DEFAULT 0,
    SoLuongTon  INT NOT NULL DEFAULT 0,
    HinhAnh     VARCHAR(255) NULL,
    TrangThai   VARCHAR(20) NOT NULL DEFAULT 'HoatDong',
    CONSTRAINT FK_DichVu_DiaDiem FOREIGN KEY (MaDiaDiem) REFERENCES DiaDiem(MaDiaDiem),
    CONSTRAINT CK_DichVu_DonGia CHECK (DonGia >= 0),
    CONSTRAINT CK_DichVu_SoLuongTon CHECK (SoLuongTon >= 0)
) ENGINE=InnoDB CHARACTER SET utf8mb4;

-- 1.10 Chi tiết sử dụng dịch vụ (ChiTietDichVu)
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

-- 1.11 Hóa đơn tổng kết (HoaDon)
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
    TrangThai       VARCHAR(20) NOT NULL DEFAULT 'DaThanhToan', -- ChuaThanhToan, DaThanhToan
    CONSTRAINT FK_HoaDon_DatSan FOREIGN KEY (MaDatSan) REFERENCES DatSan(MaDatSan)
) ENGINE=InnoDB CHARACTER SET utf8mb4;

-- 1.12 Giao dịch thanh toán (ThanhToan)
CREATE TABLE IF NOT EXISTS ThanhToan (
    MaThanhToan         INT AUTO_INCREMENT PRIMARY KEY,
    MaDatSan            INT NOT NULL,
    MaHoaDon            INT NULL,
    MaGiaoDich          VARCHAR(100) NULL,
    LoaiThanhToan       VARCHAR(20) NOT NULL DEFAULT 'TraTruoc', -- TraTruoc, PhatSinh
    SoTien              INT NOT NULL,
    PhuongThuc          VARCHAR(50) NOT NULL DEFAULT 'Demo', -- TienMat, ChuyenKhoan, QR, VNPay, MoMo
    TrangThai           VARCHAR(30) NOT NULL DEFAULT 'ThanhCongDemo', -- ChoXuLy, ThanhCongDemo, ThatBaiDemo
    ThoiGianThanhToan   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT FK_ThanhToan_DatSan FOREIGN KEY (MaDatSan) REFERENCES DatSan(MaDatSan),
    CONSTRAINT FK_ThanhToan_HoaDon FOREIGN KEY (MaHoaDon) REFERENCES HoaDon(MaHoaDon),
    CONSTRAINT CK_ThanhToan_SoTien CHECK (SoTien >= 0)
) ENGINE=InnoDB CHARACTER SET utf8mb4;

-- 1.13 Hoàn tiền (HoanTien)
CREATE TABLE IF NOT EXISTS HoanTien (
    MaHoanTien    INT AUTO_INCREMENT PRIMARY KEY,
    MaDatSan      INT NOT NULL,
    MaThanhToan   INT NULL,
    NgayYeuCau    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    LyDo          VARCHAR(255) NOT NULL,
    LoaiHuy       VARCHAR(20) NOT NULL DEFAULT 'KhachHuy', -- KhachHuy, CoSoHuy, KhongDen
    TyLeHoan      INT NOT NULL DEFAULT 0,                  -- 0, 50, 100
    SoTienHoan    DECIMAL(12,2) NOT NULL DEFAULT 0,
    TrangThai     VARCHAR(20) NOT NULL DEFAULT 'DaHoan',    -- ChoHoan, DaHoan, ThatBai, KhongHoan
    CONSTRAINT FK_HoanTien_DatSan FOREIGN KEY (MaDatSan) REFERENCES DatSan(MaDatSan),
    CONSTRAINT FK_HoanTien_ThanhToan FOREIGN KEY (MaThanhToan) REFERENCES ThanhToan(MaThanhToan)
) ENGINE=InnoDB CHARACTER SET utf8mb4;

-- 1.14 Thông báo người dùng (ThongBao)
CREATE TABLE IF NOT EXISTS ThongBao (
    MaThongBao      INT AUTO_INCREMENT PRIMARY KEY,
    MaKH            INT NOT NULL,
    TieuDe          VARCHAR(200) NOT NULL,
    NoiDung         VARCHAR(1000) NOT NULL,
    LoaiThongBao    VARCHAR(30) NOT NULL,
    DaDoc           TINYINT(1) NOT NULL DEFAULT 0,
    ThoiGianTao     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT FK_ThongBao_KhachHang FOREIGN KEY (MaKH) REFERENCES KhachHang(MaKH),
    CONSTRAINT CK_ThongBao_Loai CHECK (
        LoaiThongBao IN ('DatSan', 'ThanhToan', 'XacNhan', 'Huy', 'YeuCauHuy', 'DuyetHuy')
    )
) ENGINE=InnoDB CHARACTER SET utf8mb4;

/* ---------------------------------------------------------------------
   2. DỮ LIỆU KHỞI TẠO BAN ĐẦU
   --------------------------------------------------------------------- */
INSERT IGNORE INTO Role (TenRole) VALUES ('Admin'), ('User'), ('Staff');

INSERT INTO BangGia (TenBangGia, GiaMoi30Phut, DangApDung)
SELECT 'Bảng giá mặc định', 50000, 1
WHERE NOT EXISTS (SELECT 1 FROM BangGia WHERE TenBangGia = 'Bảng giá mặc định');

/* ---------------------------------------------------------------------
   3. DỮ LIỆU MẪU (DEMO)
   --------------------------------------------------------------------- */

-- 3.1 Tài khoản Admin & Staff
INSERT INTO TaiKhoan (TenDangNhap, MatKhau, MaRole, TrangThai)
SELECT 'admin', '$2b$12$wnZrEYBPsOOZmPysC45jFukqGbA/eT9jVUI0yGSTHa1G6pQObPmke', (SELECT MaRole FROM Role WHERE TenRole = 'Admin' LIMIT 1), 'HoatDong'
WHERE NOT EXISTS (SELECT 1 FROM TaiKhoan WHERE TenDangNhap = 'admin');

INSERT INTO TaiKhoan (TenDangNhap, MatKhau, MaRole, TrangThai)
SELECT 'staff.caugiay', '$2b$12$wnZrEYBPsOOZmPysC45jFukqGbA/eT9jVUI0yGSTHa1G6pQObPmke', (SELECT MaRole FROM Role WHERE TenRole = 'Staff' LIMIT 1), 'HoatDong'
WHERE NOT EXISTS (SELECT 1 FROM TaiKhoan WHERE TenDangNhap = 'staff.caugiay');

-- 3.2 Khách hàng mẫu
INSERT INTO KhachHang (HoTen, SDT, Email, SoLanNoShow) VALUES
('Nguyễn Văn An',   '0901111111', 'an.nguyen@gmail.com',   0),
('Trần Thị Bình',   '0902222222', 'binh.tran@gmail.com',   1),
('Lê Hoàng Cường',  '0903333333', 'cuong.le@gmail.com',    0),
('Phạm Thu Dung',   '0904444444', 'dung.pham@gmail.com',   2)
ON DUPLICATE KEY UPDATE HoTen = VALUES(HoTen);

-- 3.3 Tài khoản user gắn với khách hàng
INSERT INTO TaiKhoan (TenDangNhap, MatKhau, MaRole, MaKH, TrangThai) VALUES
('an.nguyen',  '$2b$12$wnZrEYBPsOOZmPysC45jFukqGbA/eT9jVUI0yGSTHa1G6pQObPmke', (SELECT MaRole FROM Role WHERE TenRole = 'User'), (SELECT MaKH FROM KhachHang WHERE SDT = '0901111111'), 'HoatDong'),
('binh.tran',  '$2b$12$wnZrEYBPsOOZmPysC45jFukqGbA/eT9jVUI0yGSTHa1G6pQObPmke', (SELECT MaRole FROM Role WHERE TenRole = 'User'), (SELECT MaKH FROM KhachHang WHERE SDT = '0902222222'), 'HoatDong'),
('cuong.le',   '$2b$12$wnZrEYBPsOOZmPysC45jFukqGbA/eT9jVUI0yGSTHa1G6pQObPmke', (SELECT MaRole FROM Role WHERE TenRole = 'User'), (SELECT MaKH FROM KhachHang WHERE SDT = '0903333333'), 'HoatDong'),
('dung.pham',  '$2b$12$wnZrEYBPsOOZmPysC45jFukqGbA/eT9jVUI0yGSTHa1G6pQObPmke', (SELECT MaRole FROM Role WHERE TenRole = 'User'), (SELECT MaKH FROM KhachHang WHERE SDT = '0904444444'), 'Khoa')
ON DUPLICATE KEY UPDATE MatKhau = VALUES(MatKhau);

-- 3.4 Địa điểm / Cơ sở
INSERT INTO DiaDiem (TenDiaDiem, DiaChi, SDT, GioMo, GioDong, TrangThai, MapLink) VALUES
('Nhà thi đấu Cầu Giấy', 'Số 35 Trần Quý Kiên, Dịch Vọng, Cầu Giấy, Hà Nội', '02438335566', '06:00:00', '22:00:00', 'HoatDong', 'https://www.google.com/maps/place/C%E1%BA%A7u+Gi%E1%BA%A5y,+H%C3%A0+N%E1%BB%99i'),
('Sân cầu lông Thanh Xuân', 'Số 9 Khuất Duy Tiến, Thanh Xuân Trung, Thanh Xuân, Hà Nội', '02435588999', '07:00:00', '21:00:00', 'HoatDong', 'https://www.google.com/maps/place/Thanh+Xu%C3%A2n,+H%C3%A0+N%E1%BB%99i')
ON DUPLICATE KEY UPDATE DiaChi = VALUES(DiaChi), SDT = VALUES(SDT);

-- 3.5 Nhân viên mẫu
INSERT INTO NhanVien (MaDiaDiem, HoTen, SDT, Email, ChucVu, NgayVaoLam, MaTK)
SELECT 1, 'Nguyễn Quản Trị', '0988888888', 'admin@datsan.vn', 'QuanTri', '2024-01-01', (SELECT MaTK FROM TaiKhoan WHERE TenDangNhap = 'admin')
WHERE NOT EXISTS (SELECT 1 FROM NhanVien WHERE SDT = '0988888888');

INSERT INTO NhanVien (MaDiaDiem, HoTen, SDT, Email, ChucVu, NgayVaoLam, MaTK)
SELECT 1, 'Trần Nhân Viên', '0912345678', 'staff.cg@datsan.vn', 'NhanVien', '2024-03-01', (SELECT MaTK FROM TaiKhoan WHERE TenDangNhap = 'staff.caugiay')
WHERE NOT EXISTS (SELECT 1 FROM NhanVien WHERE SDT = '0912345678');
-- 3.6 Sân cầu lông
INSERT INTO San (MaDiaDiem, TenSan, LoaiSan, TinhTrang, HinhAnh) VALUES
(1, 'Sân 1', 'Sân tiêu chuẩn thảm PVC', 'HoatDong', '/images/san-cau-giay-1.jpg'),
(1, 'Sân 2', 'Sân tiêu chuẩn thảm PVC', 'HoatDong', '/images/san-cau-giay-2.jpg'),
(1, 'Sân 3', 'Sân tiêu chuẩn thảm PVC', 'BaoTri', '/images/san-cau-giay-3.jpg'),
(2, 'Sân 1', 'Sân tiêu chuẩn thảm PVC', 'HoatDong', '/images/san-thanh-xuan-1.jpg'),
(2, 'Sân 2', 'Sân tiêu chuẩn thảm PVC', 'HoatDong', '/images/san-thanh-xuan-2.jpg')
ON DUPLICATE KEY UPDATE LoaiSan = VALUES(LoaiSan);

-- 3.7 Dịch vụ tại sân
INSERT INTO DichVu (MaDiaDiem, TenDV, LoaiDV, DonGia, SoLuongTon) VALUES
(1, 'Nước khoáng Aquafina 500ml', 'Ban', 10000, 100),
(1, 'Nước tăng lực Revive chanh muối', 'Ban', 15000, 80),
(1, 'Nước tăng lực RedBull', 'Ban', 20000, 60),
(1, 'Thuê vợt Yonex cao cấp (cây/ca)', 'ChoThue', 30000, 20),
(1, 'Quả cầu lông Thành Công (quả)', 'Ban', 25000, 50),
(2, 'Nước khoáng Lavie 500ml', 'Ban', 10000, 100),
(2, 'Thuê vợt Victor (cây/ca)', 'ChoThue', 30000, 15)
ON DUPLICATE KEY UPDATE DonGia = VALUES(DonGia), SoLuongTon = VALUES(SoLuongTon);
