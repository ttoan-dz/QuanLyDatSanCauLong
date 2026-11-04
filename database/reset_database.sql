/* =====================================================================
   RESET CƠ SỞ DỮ LIỆU VỀ TRẠNG THÁI GỐC BAN ĐẦU
   Dự án: Quản Lý Đặt Sân Cầu Lông (MySQL 8.0+)
   - Xóa toàn bộ dữ liệu phát sinh (Đơn đặt, Hóa đơn, Thanh toán, v.v.)
   - Tái tạo sạch 100% cấu trúc 15 bảng nghiệp vụ chuẩn
   - Nạp lại đầy đủ dữ liệu mẫu gốc (Địa điểm, Sân, Tài khoản, Dịch vụ)
   - Reset toàn bộ chỉ số tự tăng (AUTO_INCREMENT) về 1
   ===================================================================== */

SET FOREIGN_KEY_CHECKS = 0;

DROP DATABASE IF EXISTS QuanLyDatSan;

CREATE DATABASE QuanLyDatSan
    CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE QuanLyDatSan;

SET NAMES 'utf8mb4';
SET CHARACTER SET utf8mb4;
SET character_set_connection = utf8mb4;

/* ---------------------------------------------------------------------
   1. KHỞI TẠO CẤU TRÚC BẢNG (15 BẢNG NGHIỆP VỤ)
   --------------------------------------------------------------------- */

-- 1.1 Khách hàng (KhachHang)
CREATE TABLE KhachHang (
    MaKH        INT AUTO_INCREMENT PRIMARY KEY,
    HoTen       VARCHAR(100) NOT NULL,
    SDT         VARCHAR(15)  NOT NULL UNIQUE,
    Email       VARCHAR(100) NULL,
    SoLanNoShow INT NOT NULL DEFAULT 0,
    NgayTao     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX IDX_KhachHang_Email (Email)
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 1.2 Địa điểm / Cơ sở kinh doanh (DiaDiem)
CREATE TABLE DiaDiem (
    MaDiaDiem   INT AUTO_INCREMENT PRIMARY KEY,
    TenDiaDiem  VARCHAR(100) NOT NULL UNIQUE,
    DiaChi      VARCHAR(255) NULL,
    SDT         VARCHAR(15)  NULL,
    GioMo       TIME NOT NULL DEFAULT '08:00:00',
    GioDong     TIME NOT NULL DEFAULT '20:00:00',
    TrangThai   VARCHAR(20) NOT NULL DEFAULT 'HoatDong',
    MapLink     VARCHAR(500) NULL,
    CONSTRAINT CK_DiaDiem_Gio CHECK (GioDong > GioMo),
    CONSTRAINT CK_DiaDiem_TrangThai CHECK (TrangThai IN ('HoatDong', 'TamNgung')),
    INDEX IDX_DiaDiem_TrangThai (TrangThai)
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 1.3 Sân cầu lông (San)
CREATE TABLE San (
    MaSan       INT AUTO_INCREMENT PRIMARY KEY,
    MaDiaDiem   INT NOT NULL,
    TenSan      VARCHAR(50) NOT NULL,
    LoaiSan     VARCHAR(50) NOT NULL DEFAULT 'Sân tiêu chuẩn',
    TinhTrang   VARCHAR(20) NOT NULL DEFAULT 'HoatDong',
    GhiChu      VARCHAR(200) NULL,
    HinhAnh     VARCHAR(255) NULL,
    CONSTRAINT UQ_San_TenSan_TheoDiaDiem UNIQUE (MaDiaDiem, TenSan),
    CONSTRAINT FK_San_DiaDiem FOREIGN KEY (MaDiaDiem) REFERENCES DiaDiem(MaDiaDiem),
    CONSTRAINT CK_San_TinhTrang CHECK (TinhTrang IN ('HoatDong', 'TamNgung', 'BaoTri')),
    INDEX IDX_San_DiaDiem_TinhTrang (MaDiaDiem, TinhTrang)
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 1.4 Bảng giá / Khung giá (BangGia)
CREATE TABLE BangGia (
    MaBangGia     INT AUTO_INCREMENT PRIMARY KEY,
    TenBangGia    VARCHAR(100) NOT NULL,
    GiaMoi30Phut  INT NOT NULL,
    DangApDung    TINYINT(1) NOT NULL DEFAULT 1,
    NgayApDung    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT CK_BangGia_Gia CHECK (GiaMoi30Phut > 0),
    INDEX IDX_BangGia_DangApDung (DangApDung)
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 1.5 Phân quyền & Vai trò (Role)
CREATE TABLE Role (
    MaRole   INT AUTO_INCREMENT PRIMARY KEY,
    TenRole  VARCHAR(50) NOT NULL UNIQUE
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 1.6 Tài khoản người dùng (TaiKhoan)
CREATE TABLE TaiKhoan (
    MaTK          INT AUTO_INCREMENT PRIMARY KEY,
    TenDangNhap   VARCHAR(50) NOT NULL UNIQUE,
    MatKhau       VARCHAR(100) NOT NULL,
    MaRole        INT NOT NULL,
    MaKH          INT NULL,
    TrangThai     VARCHAR(20) NOT NULL DEFAULT 'HoatDong',
    NgayTao       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT FK_TaiKhoan_Role FOREIGN KEY (MaRole) REFERENCES Role(MaRole),
    CONSTRAINT FK_TaiKhoan_KhachHang FOREIGN KEY (MaKH) REFERENCES KhachHang(MaKH),
    CONSTRAINT CK_TaiKhoan_TrangThai CHECK (TrangThai IN ('HoatDong', 'Khoa')),
    INDEX IDX_TaiKhoan_MaKH (MaKH),
    INDEX IDX_TaiKhoan_Role_TrangThai (MaRole, TrangThai)
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 1.7 Nhân viên vận hành (NhanVien)
CREATE TABLE NhanVien (
    MaNV        INT AUTO_INCREMENT PRIMARY KEY,
    MaDiaDiem   INT NULL,
    HoTen       VARCHAR(100) NOT NULL,
    SDT         VARCHAR(15)  NOT NULL UNIQUE,
    Email       VARCHAR(100) NULL,
    ChucVu      VARCHAR(20)  NOT NULL DEFAULT 'NhanVien', -- NhanVien, ChuSan, QuanTri
    NgayVaoLam  DATE         NOT NULL DEFAULT (CURRENT_DATE),
    MaTK        INT          NULL UNIQUE,
    CONSTRAINT FK_NhanVien_DiaDiem FOREIGN KEY (MaDiaDiem) REFERENCES DiaDiem(MaDiaDiem),
    CONSTRAINT FK_NhanVien_TaiKhoan FOREIGN KEY (MaTK) REFERENCES TaiKhoan(MaTK),
    INDEX IDX_NhanVien_DiaDiem (MaDiaDiem)
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 1.8 Đơn đặt sân (DatSan)
CREATE TABLE DatSan (
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
    LyDoHuy               VARCHAR(50) NULL,
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
    CONSTRAINT CK_DatSan_TrangThaiThanhToan CHECK (TrangThaiThanhToan IN ('ChuaThanhToan', 'DaThanhToan')),
    -- Tối ưu hoá chỉ mục truy vấn cao tần:
    INDEX IDX_DatSan_TrungLich (MaSan, NgayChoi, TrangThaiDat, GioBatDau, GioKetThuc),
    INDEX IDX_DatSan_KH_NgayTao (MaKH, NgayTao DESC),
    INDEX IDX_DatSan_ChoXacNhan_HanTT (TrangThaiDat, HanThanhToan),
    INDEX IDX_DatSan_ThongKe (TrangThaiThanhToan, NgayChoi, TrangThaiDat),
    INDEX IDX_DatSan_NgayChoi_TrangThai (NgayChoi, TrangThaiDat),
    INDEX IDX_DatSan_NgayTao (NgayTao DESC)
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 1.9 Chi tiết đặt sân (ChiTietDatSan)
CREATE TABLE ChiTietDatSan (
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
    TrangThai     VARCHAR(20) NOT NULL DEFAULT 'DaXacNhan',
    CONSTRAINT FK_CTDS_DatSan FOREIGN KEY (MaDatSan) REFERENCES DatSan(MaDatSan) ON DELETE CASCADE,
    CONSTRAINT FK_CTDS_San FOREIGN KEY (MaSan) REFERENCES San(MaSan),
    CONSTRAINT FK_CTDS_NhanVien FOREIGN KEY (MaNV) REFERENCES NhanVien(MaNV),
    INDEX IDX_CTDS_DatSan (MaDatSan),
    INDEX IDX_CTDS_San_ThoiGian (MaSan, BatDau, KetThuc, TrangThai)
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 1.10 Dịch vụ tại sân (DichVu)
CREATE TABLE DichVu (
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
    CONSTRAINT CK_DichVu_SoLuongTon CHECK (SoLuongTon >= 0),
    INDEX IDX_DichVu_DiaDiem_TrangThai (MaDiaDiem, TrangThai)
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 1.11 Chi tiết dịch vụ sử dụng (ChiTietDichVu)
CREATE TABLE ChiTietDichVu (
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
    CONSTRAINT CK_CTDV_DonGia CHECK (DonGia >= 0),
    INDEX IDX_CTDV_DatSan (MaDatSan),
    INDEX IDX_CTDV_DichVu (MaDV)
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 1.12 Hóa đơn tổng kết (HoaDon)
CREATE TABLE HoaDon (
    MaHoaDon        INT AUTO_INCREMENT PRIMARY KEY,
    MaDatSan        INT NOT NULL UNIQUE,
    NgayLap         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    TongTienSan     DECIMAL(12,2) NOT NULL DEFAULT 0,
    TongTienDV      DECIMAL(12,2) NOT NULL DEFAULT 0,
    TienQuaGio      DECIMAL(12,2) NOT NULL DEFAULT 0,
    TienTraTruoc    DECIMAL(12,2) NOT NULL DEFAULT 0,
    TienHoanDuyet   DECIMAL(12,2) NOT NULL DEFAULT 0,
    ThanhTien       DECIMAL(12,2) NOT NULL DEFAULT 0,
    TrangThai       VARCHAR(20) NOT NULL DEFAULT 'DaThanhToan',
    CONSTRAINT FK_HoaDon_DatSan FOREIGN KEY (MaDatSan) REFERENCES DatSan(MaDatSan),
    INDEX IDX_HoaDon_NgayLap (NgayLap DESC),
    INDEX IDX_HoaDon_TrangThai (TrangThai)
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 1.13 Giao dịch thanh toán (ThanhToan)
CREATE TABLE ThanhToan (
    MaThanhToan         INT AUTO_INCREMENT PRIMARY KEY,
    MaDatSan            INT NOT NULL,
    MaHoaDon            INT NULL,
    MaGiaoDich          VARCHAR(100) NULL,
    LoaiThanhToan       VARCHAR(20) NOT NULL DEFAULT 'TraTruoc',
    SoTien              INT NOT NULL,
    PhuongThuc          VARCHAR(50) NOT NULL DEFAULT 'Demo',
    TrangThai           VARCHAR(30) NOT NULL DEFAULT 'ThanhCongDemo',
    ThoiGianThanhToan   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT FK_ThanhToan_DatSan FOREIGN KEY (MaDatSan) REFERENCES DatSan(MaDatSan),
    CONSTRAINT FK_ThanhToan_HoaDon FOREIGN KEY (MaHoaDon) REFERENCES HoaDon(MaHoaDon),
    CONSTRAINT CK_ThanhToan_SoTien CHECK (SoTien >= 0),
    INDEX IDX_ThanhToan_MaGiaoDich (MaGiaoDich),
    INDEX IDX_ThanhToan_DatSan_Loai (MaDatSan, LoaiThanhToan),
    INDEX IDX_ThanhToan_ThoiGian (ThoiGianThanhToan DESC)
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 1.14 Hoàn tiền (HoanTien)
CREATE TABLE HoanTien (
    MaHoanTien    INT AUTO_INCREMENT PRIMARY KEY,
    MaDatSan      INT NOT NULL,
    MaThanhToan   INT NULL,
    NgayYeuCau    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    LyDo          VARCHAR(255) NOT NULL,
    LoaiHuy       VARCHAR(20) NOT NULL DEFAULT 'KhachHuy',
    TyLeHoan      INT NOT NULL DEFAULT 0,
    SoTienHoan    DECIMAL(12,2) NOT NULL DEFAULT 0,
    TrangThai     VARCHAR(20) NOT NULL DEFAULT 'DaHoan',
    CONSTRAINT FK_HoanTien_DatSan FOREIGN KEY (MaDatSan) REFERENCES DatSan(MaDatSan),
    CONSTRAINT FK_HoanTien_ThanhToan FOREIGN KEY (MaThanhToan) REFERENCES ThanhToan(MaThanhToan),
    INDEX IDX_HoanTien_DatSan (MaDatSan),
    INDEX IDX_HoanTien_TrangThai (TrangThai),
    INDEX IDX_HoanTien_NgayYeuCau (NgayYeuCau DESC)
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 1.15 Thông báo người dùng (ThongBao)
CREATE TABLE ThongBao (
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
    ),
    INDEX IDX_ThongBao_KH_DaDoc_ThoiGian (MaKH, DaDoc, ThoiGianTao DESC)
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

/* ---------------------------------------------------------------------
   2. NẠP DỮ LIỆU GỐC BAN ĐẦU (SEED DATA CHUẨN)
   --------------------------------------------------------------------- */

-- 2.1 Vai trò người dùng
INSERT INTO Role (TenRole) VALUES ('Admin'), ('User'), ('Staff');

-- 2.2 Bảng giá mặc định (50.000đ / 30 phút)
INSERT INTO BangGia (TenBangGia, GiaMoi30Phut, DangApDung) VALUES
('Bảng giá mặc định', 50000, 1);

-- 2.3 Khách hàng mẫu
INSERT INTO KhachHang (HoTen, SDT, Email, SoLanNoShow) VALUES
('Nguyễn Văn An',   '0901111111', 'an.nguyen@gmail.com',   0),
('Trần Thị Bình',   '0902222222', 'binh.tran@gmail.com',   1),
('Lê Hoàng Cường',  '0903333333', 'cuong.le@gmail.com',    0),
('Phạm Thu Dung',   '0904444444', 'dung.pham@gmail.com',   2);

-- 2.4 Tài khoản hệ thống (Mật khẩu mặc định: 123456)
INSERT INTO TaiKhoan (TenDangNhap, MatKhau, MaRole, MaKH, TrangThai) VALUES
('admin',          '$2b$12$wnZrEYBPsOOZmPysC45jFukqGbA/eT9jVUI0yGSTHa1G6pQObPmke', 1, NULL, 'HoatDong'),
('staff.caugiay',  '$2b$12$wnZrEYBPsOOZmPysC45jFukqGbA/eT9jVUI0yGSTHa1G6pQObPmke', 3, NULL, 'HoatDong'),
('an.nguyen',      '$2b$12$wnZrEYBPsOOZmPysC45jFukqGbA/eT9jVUI0yGSTHa1G6pQObPmke', 2, 1,    'HoatDong'),
('binh.tran',      '$2b$12$wnZrEYBPsOOZmPysC45jFukqGbA/eT9jVUI0yGSTHa1G6pQObPmke', 2, 2,    'HoatDong'),
('cuong.le',       '$2b$12$wnZrEYBPsOOZmPysC45jFukqGbA/eT9jVUI0yGSTHa1G6pQObPmke', 2, 3,    'HoatDong'),
('dung.pham',      '$2b$12$wnZrEYBPsOOZmPysC45jFukqGbA/eT9jVUI0yGSTHa1G6pQObPmke', 2, 4,    'Khoa');

-- 2.5 Địa điểm / Cơ sở kinh doanh
INSERT INTO DiaDiem (TenDiaDiem, DiaChi, SDT, GioMo, GioDong, TrangThai, MapLink) VALUES
('Nhà thi đấu Cầu Giấy', 'Số 35 Trần Quý Kiên, Dịch Vọng, Cầu Giấy, Hà Nội', '02438335566', '06:00:00', '22:00:00', 'HoatDong', 'https://www.google.com/maps/place/C%E1%BA%A7u+Gi%E1%BA%A5y,+H%C3%A0+N%E1%BB%99i'),
('Sân cầu lông Thanh Xuân', 'Số 9 Khuất Duy Tiến, Thanh Xuân Trung, Thanh Xuân, Hà Nội', '02435588999', '07:00:00', '21:00:00', 'HoatDong', 'https://www.google.com/maps/place/Thanh+Xu%C3%A2n,+H%C3%A0+N%E1%BB%99i');

-- 2.6 Nhân viên
INSERT INTO NhanVien (MaDiaDiem, HoTen, SDT, Email, ChucVu, NgayVaoLam, MaTK) VALUES
(1, 'Nguyễn Quản Trị', '0988888888', 'admin@datsan.vn', 'QuanTri', '2024-01-01', 1),
(1, 'Trần Nhân Viên',  '0912345678', 'staff.cg@datsan.vn', 'NhanVien', '2024-03-01', 2);

-- 2.7 Sân cầu lông
INSERT INTO San (MaDiaDiem, TenSan, LoaiSan, TinhTrang, HinhAnh) VALUES
(1, 'Sân 1', 'Sân tiêu chuẩn thảm PVC', 'HoatDong', 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=500&auto=format&fit=crop&q=60'),
(1, 'Sân 2', 'Sân tiêu chuẩn thảm PVC', 'HoatDong', 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=500&auto=format&fit=crop&q=60'),
(1, 'Sân 3', 'Sân tiêu chuẩn thảm PVC', 'BaoTri',   'https://images.unsplash.com/photo-1521537634581-0dced2fee2ef?w=500&auto=format&fit=crop&q=60'),
(2, 'Sân 1', 'Sân tiêu chuẩn thảm PVC', 'HoatDong', 'https://images.unsplash.com/photo-1613918431703-aa6321c17242?w=500&auto=format&fit=crop&q=60'),
(2, 'Sân 2', 'Sân tiêu chuẩn thảm PVC', 'HoatDong', 'https://images.unsplash.com/photo-1563299796-17596ed6b017?w=500&auto=format&fit=crop&q=60');

-- 2.8 Dịch vụ tiện ích tại sân
INSERT INTO DichVu (MaDiaDiem, TenDV, LoaiDV, DonGia, SoLuongTon) VALUES
(1, 'Nước khoáng Aquafina 500ml', 'Ban', 10000, 100),
(1, 'Nước tăng lực Revive chanh muối', 'Ban', 15000, 80),
(1, 'Nước tăng lực RedBull', 'Ban', 20000, 60),
(1, 'Thuê vợt Yonex cao cấp (cây/ca)', 'ChoThue', 30000, 20),
(1, 'Quả cầu lông Thành Công (quả)', 'Ban', 25000, 50),
(2, 'Nước khoáng Lavie 500ml', 'Ban', 10000, 100),
(2, 'Thuê vợt Victor (cây/ca)', 'ChoThue', 30000, 15);

/* =====================================================================
   HOÀN TẤT RESET DỮ LIỆU GỐC!
   - Đã xóa toàn bộ đơn đặt, hóa đơn, thanh toán test.
   - Trạng thái sân sẵn sàng đón khách.
   ===================================================================== */

