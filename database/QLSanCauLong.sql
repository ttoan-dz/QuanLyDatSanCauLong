/* =====================================================================
   QUẢN LÝ ĐẶT SÂN CẦU LÔNG — bản MySQL (8.0+)
   Phiên bản RÚT GỌN: chỉ giữ lại CREATE TABLE và INSERT dữ liệu.
   Đã lược bỏ: VIEW, STORED PROCEDURE, INDEX phụ (functions/triggers
   trong bản gốc thực chất là các stored procedure).

   Charset: utf8mb4 (hỗ trợ đầy đủ tiếng Việt có dấu).
   ===================================================================== */

CREATE DATABASE IF NOT EXISTS QuanLyDatSan
    CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE QuanLyDatSan;

/* ---------------------------------------------------------------------
   1. BẢNG DỮ LIỆU
   --------------------------------------------------------------------- */

CREATE TABLE KhachHang (
    MaKH        INT AUTO_INCREMENT PRIMARY KEY,
    HoTen       VARCHAR(100) NOT NULL,
    SDT         VARCHAR(15)  NOT NULL UNIQUE,
    Email       VARCHAR(100) NULL,
    SoLanNoShow INT NOT NULL DEFAULT 0,
    NgayTao     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB CHARACTER SET utf8mb4;

CREATE TABLE DiaDiem (
    MaDiaDiem   INT AUTO_INCREMENT PRIMARY KEY,
    TenDiaDiem  VARCHAR(100) NOT NULL UNIQUE,
    GioMo       TIME NOT NULL DEFAULT '08:00:00',
    GioDong     TIME NOT NULL DEFAULT '20:00:00',
    TrangThai   VARCHAR(20) NOT NULL DEFAULT 'HoatDong',
    MapLink     VARCHAR(500) NULL,
    CONSTRAINT CK_DiaDiem_Gio CHECK (GioDong > GioMo),
    CONSTRAINT CK_DiaDiem_TrangThai CHECK (TrangThai IN ('HoatDong', 'TamNgung'))
) ENGINE=InnoDB CHARACTER SET utf8mb4;

CREATE TABLE San (
    MaSan       INT AUTO_INCREMENT PRIMARY KEY,
    MaDiaDiem   INT NOT NULL,
    TenSan      VARCHAR(50) NOT NULL,
    TinhTrang   VARCHAR(20) NOT NULL DEFAULT 'HoatDong',
    GhiChu      VARCHAR(200) NULL,
    HinhAnh     VARCHAR(255) NULL,
    CONSTRAINT UQ_San_TenSan_TheoDiaDiem UNIQUE (MaDiaDiem, TenSan),
    CONSTRAINT FK_San_DiaDiem FOREIGN KEY (MaDiaDiem) REFERENCES DiaDiem(MaDiaDiem),
    CONSTRAINT CK_San_TinhTrang CHECK (TinhTrang IN ('HoatDong', 'TamNgung', 'BaoTri'))
) ENGINE=InnoDB CHARACTER SET utf8mb4;

CREATE TABLE BangGia (
    MaBangGia     INT AUTO_INCREMENT PRIMARY KEY,
    TenBangGia    VARCHAR(100) NOT NULL,
    GiaMoi30Phut  INT NOT NULL,
    DangApDung    TINYINT(1) NOT NULL DEFAULT 1,
    NgayApDung    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT CK_BangGia_Gia CHECK (GiaMoi30Phut > 0)
) ENGINE=InnoDB CHARACTER SET utf8mb4;

CREATE TABLE DatSan (
    MaDatSan              INT AUTO_INCREMENT PRIMARY KEY,
    MaKH                  INT NOT NULL,
    MaSan                 INT NOT NULL,
    NgayChoi              DATE NOT NULL,
    GioBatDau             TIME NOT NULL,
    GioKetThuc            TIME NOT NULL,
    TrangThaiDat          VARCHAR(20) NOT NULL DEFAULT 'ChoXacNhan',
    TrangThaiThanhToan    VARCHAR(20) NOT NULL DEFAULT 'ChuaThanhToan',
    PhuongThucThanhToan   VARCHAR(20) NOT NULL DEFAULT 'TienMat',
    LyDoHuy               VARCHAR(30) NULL,
    SoTien                INT NOT NULL DEFAULT 0,
    GhiChu                VARCHAR(200) NULL,
    NgayTao               DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT FK_DatSan_KhachHang FOREIGN KEY (MaKH) REFERENCES KhachHang(MaKH),
    CONSTRAINT FK_DatSan_San FOREIGN KEY (MaSan) REFERENCES San(MaSan),
    CONSTRAINT CK_DatSan_GioHopLe CHECK (GioKetThuc > GioBatDau),
    CONSTRAINT CK_DatSan_SoTien CHECK (SoTien >= 0),
    CONSTRAINT CK_DatSan_TrangThaiDat
        CHECK (TrangThaiDat IN ('ChoXacNhan', 'DaXacNhan', 'ChoHuy', 'DaHuy', 'HetHan', 'HoanThanh')),
    CONSTRAINT CK_DatSan_TrangThaiThanhToan
        CHECK (TrangThaiThanhToan IN ('ChuaThanhToan', 'DaThanhToan')),
    CONSTRAINT CK_DatSan_PhuongThucThanhToan
        CHECK (PhuongThucThanhToan IN ('QR', 'TienMat')),
    CONSTRAINT CK_DatSan_LyDoHuy
        CHECK (LyDoHuy IS NULL OR LyDoHuy IN ('NguoiDungHuy', 'KhongDenNhan', 'AdminHuy'))
) ENGINE=InnoDB CHARACTER SET utf8mb4;

CREATE TABLE Role (
    MaRole   INT AUTO_INCREMENT PRIMARY KEY,
    TenRole  VARCHAR(50) NOT NULL UNIQUE
) ENGINE=InnoDB CHARACTER SET utf8mb4;

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
    CONSTRAINT CK_TaiKhoan_TrangThai CHECK (TrangThai IN ('HoatDong', 'Khoa'))
) ENGINE=InnoDB CHARACTER SET utf8mb4;

CREATE TABLE ThanhToan (
    MaThanhToan         INT AUTO_INCREMENT PRIMARY KEY,
    MaDatSan            INT NOT NULL,
    SoTien              INT NOT NULL,
    PhuongThuc          VARCHAR(50) NOT NULL DEFAULT 'Demo',
    TrangThai           VARCHAR(30) NOT NULL DEFAULT 'ThanhCongDemo',
    ThoiGianThanhToan   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT FK_ThanhToan_DatSan FOREIGN KEY (MaDatSan) REFERENCES DatSan(MaDatSan),
    CONSTRAINT CK_ThanhToan_SoTien CHECK (SoTien >= 0),
    CONSTRAINT CK_ThanhToan_TrangThai CHECK (TrangThai IN ('ThanhCongDemo', 'ThatBaiDemo'))
) ENGINE=InnoDB CHARACTER SET utf8mb4;

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
    )
) ENGINE=InnoDB CHARACTER SET utf8mb4;

/* ---------------------------------------------------------------------
   2. DỮ LIỆU KHỞI TẠO BAN ĐẦU (bắt buộc phải có để hệ thống chạy được)
   --------------------------------------------------------------------- */
INSERT INTO Role (TenRole) VALUES ('Admin'), ('User');

INSERT INTO BangGia (TenBangGia, GiaMoi30Phut, DangApDung)
VALUES ('Bảng giá mặc định', 50000, 1);

/* Ghi chú: sau khi chạy xong file này, tạo tài khoản admin đầu tiên
   bằng INSERT trực tiếp (vì logic đăng ký user đã bị lược bỏ cùng
   các stored procedure):

   INSERT INTO TaiKhoan (TenDangNhap, MatKhau, MaRole, TrangThai)
   VALUES ('admin', '<mật khẩu đã hash>',
           (SELECT MaRole FROM Role WHERE TenRole = 'Admin'), 'HoatDong');
*/

/* ---------------------------------------------------------------------
   3. DỮ LIỆU MẪU (demo) — dùng để test giao diện, KHÔNG bắt buộc.
      Mật khẩu demo cho tất cả tài khoản dưới đây: 123456
      (đã hash sẵn bằng BCrypt, dùng được luôn với
      Spring Security BCryptPasswordEncoder)
   --------------------------------------------------------------------- */

-- 3.1 Tài khoản admin đầu tiên
INSERT INTO TaiKhoan (TenDangNhap, MatKhau, MaRole, TrangThai)
VALUES (
    'admin',
    '$2b$12$wnZrEYBPsOOZmPysC45jFukqGbA/eT9jVUI0yGSTHa1G6pQObPmke',
    (SELECT MaRole FROM Role WHERE TenRole = 'Admin'),
    'HoatDong'
);

-- 3.2 Khách hàng mẫu
INSERT INTO KhachHang (HoTen, SDT, Email, SoLanNoShow) VALUES
('Nguyễn Văn An',   '0901111111', 'an.nguyen@gmail.com',   0),
('Trần Thị Bình',   '0902222222', 'binh.tran@gmail.com',   1),
('Lê Hoàng Cường',  '0903333333', 'cuong.le@gmail.com',    0),
('Phạm Thu Dung',   '0904444444', 'dung.pham@gmail.com',   2);

-- 3.3 Tài khoản user, gắn với khách hàng tương ứng ở trên
INSERT INTO TaiKhoan (TenDangNhap, MatKhau, MaRole, MaKH, TrangThai) VALUES
('an.nguyen',  '$2b$12$wnZrEYBPsOOZmPysC45jFukqGbA/eT9jVUI0yGSTHa1G6pQObPmke',
    (SELECT MaRole FROM Role WHERE TenRole = 'User'),
    (SELECT MaKH FROM KhachHang WHERE SDT = '0901111111'), 'HoatDong'),
('binh.tran',  '$2b$12$wnZrEYBPsOOZmPysC45jFukqGbA/eT9jVUI0yGSTHa1G6pQObPmke',
    (SELECT MaRole FROM Role WHERE TenRole = 'User'),
    (SELECT MaKH FROM KhachHang WHERE SDT = '0902222222'), 'HoatDong'),
('cuong.le',   '$2b$12$wnZrEYBPsOOZmPysC45jFukqGbA/eT9jVUI0yGSTHa1G6pQObPmke',
    (SELECT MaRole FROM Role WHERE TenRole = 'User'),
    (SELECT MaKH FROM KhachHang WHERE SDT = '0903333333'), 'HoatDong'),
('dung.pham',  '$2b$12$wnZrEYBPsOOZmPysC45jFukqGbA/eT9jVUI0yGSTHa1G6pQObPmke',
    (SELECT MaRole FROM Role WHERE TenRole = 'User'),
    (SELECT MaKH FROM KhachHang WHERE SDT = '0904444444'), 'Khoa'); -- mẫu tài khoản bị khóa

-- 3.4 Địa điểm + sân nhỏ (kèm ảnh minh hoạ)
INSERT INTO DiaDiem (TenDiaDiem, GioMo, GioDong, TrangThai) VALUES
('Nhà thi đấu Cầu Giấy', '06:00:00', '22:00:00', 'HoatDong'),
('Sân cầu lông Thanh Xuân', '07:00:00', '21:00:00', 'HoatDong');

INSERT INTO San (MaDiaDiem, TenSan, TinhTrang, HinhAnh) VALUES
((SELECT MaDiaDiem FROM DiaDiem WHERE TenDiaDiem = 'Nhà thi đấu Cầu Giấy'), 'Sân 1', 'HoatDong', '/images/san-cau-giay-1.jpg'),
((SELECT MaDiaDiem FROM DiaDiem WHERE TenDiaDiem = 'Nhà thi đấu Cầu Giấy'), 'Sân 2', 'HoatDong', '/images/san-cau-giay-2.jpg'),
((SELECT MaDiaDiem FROM DiaDiem WHERE TenDiaDiem = 'Nhà thi đấu Cầu Giấy'), 'Sân 3', 'BaoTri', '/images/san-cau-giay-3.jpg'),
((SELECT MaDiaDiem FROM DiaDiem WHERE TenDiaDiem = 'Sân cầu lông Thanh Xuân'), 'Sân 1', 'HoatDong', '/images/san-thanh-xuan-1.jpg'),
((SELECT MaDiaDiem FROM DiaDiem WHERE TenDiaDiem = 'Sân cầu lông Thanh Xuân'), 'Sân 2', 'HoatDong', '/images/san-thanh-xuan-2.jpg');

-- 3.5 Đơn đặt sân mẫu — bao phủ đủ các trạng thái/nhánh đã thống nhất
-- (a) QR đã tự xác nhận thành công
INSERT INTO DatSan (MaKH, MaSan, NgayChoi, GioBatDau, GioKetThuc,
                     TrangThaiDat, TrangThaiThanhToan, PhuongThucThanhToan, SoTien, GhiChu)
VALUES (
    (SELECT MaKH FROM KhachHang WHERE SDT = '0901111111'),
    (SELECT MaSan FROM San WHERE TenSan = 'Sân 1' AND MaDiaDiem = (SELECT MaDiaDiem FROM DiaDiem WHERE TenDiaDiem = 'Nhà thi đấu Cầu Giấy')),
    CURDATE() + INTERVAL 1 DAY, '18:00:00', '19:00:00',
    'DaXacNhan', 'DaThanhToan', 'QR', 100000, 'Đặt sân buổi tối'
);

-- (b) Tiền mặt, đang chờ admin xác nhận
INSERT INTO DatSan (MaKH, MaSan, NgayChoi, GioBatDau, GioKetThuc,
                     TrangThaiDat, TrangThaiThanhToan, PhuongThucThanhToan, SoTien)
VALUES (
    (SELECT MaKH FROM KhachHang WHERE SDT = '0902222222'),
    (SELECT MaSan FROM San WHERE TenSan = 'Sân 2' AND MaDiaDiem = (SELECT MaDiaDiem FROM DiaDiem WHERE TenDiaDiem = 'Nhà thi đấu Cầu Giấy')),
    CURDATE(), '19:00:00', '20:00:00',
    'ChoXacNhan', 'ChuaThanhToan', 'TienMat', 100000
);

-- (c) User đã gửi yêu cầu hủy, đang chờ admin duyệt
INSERT INTO DatSan (MaKH, MaSan, NgayChoi, GioBatDau, GioKetThuc,
                     TrangThaiDat, TrangThaiThanhToan, PhuongThucThanhToan, SoTien)
VALUES (
    (SELECT MaKH FROM KhachHang WHERE SDT = '0903333333'),
    (SELECT MaSan FROM San WHERE TenSan = 'Sân 1' AND MaDiaDiem = (SELECT MaDiaDiem FROM DiaDiem WHERE TenDiaDiem = 'Sân cầu lông Thanh Xuân')),
    CURDATE() + INTERVAL 2 DAY, '17:00:00', '18:30:00',
    'ChoHuy', 'DaThanhToan', 'QR', 150000
);

-- (d) Đã bị admin hủy do no-show (khách bom hàng tiền mặt)
INSERT INTO DatSan (MaKH, MaSan, NgayChoi, GioBatDau, GioKetThuc,
                     TrangThaiDat, TrangThaiThanhToan, PhuongThucThanhToan, LyDoHuy, SoTien)
VALUES (
    (SELECT MaKH FROM KhachHang WHERE SDT = '0904444444'),
    (SELECT MaSan FROM San WHERE TenSan = 'Sân 2' AND MaDiaDiem = (SELECT MaDiaDiem FROM DiaDiem WHERE TenDiaDiem = 'Sân cầu lông Thanh Xuân')),
    CURDATE() - INTERVAL 1 DAY, '20:00:00', '21:00:00',
    'DaHuy', 'ChuaThanhToan', 'TienMat', 'KhongDenNhan', 100000
);

-- (e) Đã hoàn thành (diễn ra trong quá khứ, đã thanh toán) — dùng để test thống kê doanh thu
INSERT INTO DatSan (MaKH, MaSan, NgayChoi, GioBatDau, GioKetThuc,
                     TrangThaiDat, TrangThaiThanhToan, PhuongThucThanhToan, SoTien)
VALUES (
    (SELECT MaKH FROM KhachHang WHERE SDT = '0901111111'),
    (SELECT MaSan FROM San WHERE TenSan = 'Sân 1' AND MaDiaDiem = (SELECT MaDiaDiem FROM DiaDiem WHERE TenDiaDiem = 'Nhà thi đấu Cầu Giấy')),
    CURDATE() - INTERVAL 5 DAY, '18:00:00', '19:30:00',
    'HoanThanh', 'DaThanhToan', 'QR', 150000
);

-- 3.6 Bản ghi thanh toán tương ứng với các đơn đã thanh toán ở trên
INSERT INTO ThanhToan (MaDatSan, SoTien, PhuongThuc, TrangThai)
SELECT MaDatSan, SoTien, PhuongThucThanhToan, 'ThanhCongDemo'
FROM DatSan
WHERE TrangThaiThanhToan = 'DaThanhToan';

-- 3.7 Thông báo mẫu
INSERT INTO ThongBao (MaKH, TieuDe, NoiDung, LoaiThongBao, DaDoc) VALUES
((SELECT MaKH FROM KhachHang WHERE SDT = '0901111111'),
 'Sân đã được đặt', 'Thanh toán QR thành công. Sân của bạn đã được xác nhận.', 'ThanhToan', 1),
((SELECT MaKH FROM KhachHang WHERE SDT = '0902222222'),
 'Sân đã được đặt', 'Sân đã được giữ chỗ. Vui lòng thanh toán tại sân và chờ admin xác nhận.', 'DatSan', 0),
((SELECT MaKH FROM KhachHang WHERE SDT = '0903333333'),
 'Đã gửi yêu cầu hủy', 'Yêu cầu hủy sân của bạn đang chờ admin duyệt.', 'YeuCauHuy', 0),
((SELECT MaKH FROM KhachHang WHERE SDT = '0904444444'),
 'Đơn đã bị hủy', 'Đơn đặt sân đã bị hủy do quá thời gian chờ nhận sân.', 'Huy', 0);

 -- Cập nhật link Google Maps cho các địa điểm mẫu
UPDATE DiaDiem
SET MapLink = 'https://www.google.com/maps/place/C%E1%BA%A7u+Gi%E1%BA%A5y,+H%C3%A0+N%E1%BB%99i,+Vi%E1%BB%87t+Nam/@21.0297337,105.7796498,4035m/data=!3m2!1e3!4b1!4m6!3m5!1s0x3135ab495508b8cd:0x74bd3693fb53bda!8m2!3d21.0333967!4d105.790872!16s%2Fg%2F11z303t4g1?entry=ttu&g_ep=EgoyMDI2MDgyNi4wIKXMDSoASAFQAw%3D%3D'
WHERE TenDiaDiem = 'Nhà thi đấu Cầu Giấy';

UPDATE DiaDiem
SET MapLink = 'https://www.google.com/maps/place/Thanh+Xu%C3%A2n,+H%C3%A0+N%E1%BB%99i,+Vi%E1%BB%87t+Nam/@20.9994637,105.7938338,4036m/data=!3m2!1e3!4b1!4m6!3m5!1s0x3135acbd2780815d:0x60878d3ed3ece62f!8m2!3d20.9975091!4d105.802612!16s%2Fg%2F11y_zl67rz?entry=ttu&g_ep=EgoyMDI2MDgyNi4wIKXMDSoASAFQAw%3D%3D'
WHERE TenDiaDiem = 'Sân cầu lông Thanh Xuân';
