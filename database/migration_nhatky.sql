-- =====================================================================
-- Bổ sung bảng Nhật ký hoạt động quản trị (NhatKyHoatDong)
-- Phục vụ giám sát, truy vết thao tác của Admin & Staff
-- =====================================================================

CREATE TABLE IF NOT EXISTS NhatKyHoatDong (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    NguoiThucHien   VARCHAR(50) NOT NULL,
    VaiTro          VARCHAR(30) NULL,
    HanhDong        VARCHAR(100) NOT NULL,
    DoiTuong        VARCHAR(200) NULL,
    KetQua          VARCHAR(50) NULL,
    ChiTiet         VARCHAR(1000) NULL,
    ThoiGian        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX IDX_NhatKy_ThoiGian (ThoiGian DESC),
    INDEX IDX_NhatKy_NguoiThucHien (NguoiThucHien)
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

