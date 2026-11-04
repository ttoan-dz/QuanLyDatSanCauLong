-- =====================================================================
-- MIGRATION: TỐI ƯU HÓA CHỈ MỤC VÀ HIỆU NĂNG DATABASE (INDEX OPTIMIZATION)
-- Dự án: Quản Lý Đặt Sân Cầu Lông
-- Đảm bảo an toàn: Idempotent (Chạy nhiều lần không lỗi), Không khóa bảng kéo dài
-- =====================================================================

USE QuanLyDatSan;

SET NAMES 'utf8mb4';
SET CHARACTER SET utf8mb4;
SET character_set_connection = utf8mb4;

-- Stored Procedure hỗ trợ tạo Index an toàn nếu chưa tồn tại
DROP PROCEDURE IF EXISTS AddIndexIfNotExists;

DELIMITER $$
CREATE PROCEDURE AddIndexIfNotExists(
    IN target_table VARCHAR(64),
    IN index_name VARCHAR(64),
    IN index_columns VARCHAR(255)
)
BEGIN
    DECLARE idx_exists INT DEFAULT 0;

    SELECT COUNT(1) INTO idx_exists
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = target_table
      AND INDEX_NAME = index_name;

    IF idx_exists = 0 THEN
        SET @sql_stmt = CONCAT('ALTER TABLE `', target_table, '` ADD INDEX `', index_name, '` (', index_columns, ');');
        PREPARE stmt FROM @sql_stmt;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
        SELECT CONCAT('Created index ', index_name, ' on ', target_table) AS Result;
    ELSE
        SELECT CONCAT('Index ', index_name, ' already exists on ', target_table) AS Result;
    END IF;
END$$
DELIMITER ;

-- =====================================================================
-- 1. BẢNG DATSAN (Bảng có tần suất đọc/ghi cao nhất hệ thống)
-- =====================================================================

-- 1.1 Tối ưu kiểm tra trùng lịch (existsTrungLich & demSoSanDaDat)
-- Tăng tốc quét trạng thái sân trong khung giờ chơi
CALL AddIndexIfNotExists('DatSan', 'IDX_DatSan_TrungLich', 'MaSan, NgayChoi, TrangThaiDat, GioBatDau, GioKetThuc');

-- 1.2 Tối ưu lịch sử đơn hàng của khách hàng (findByKhachHang_MaKHOrderByNgayTaoDesc)
-- Tránh filesort khi phân trang lịch sử đặt sân
CALL AddIndexIfNotExists('DatSan', 'IDX_DatSan_KH_NgayTao', 'MaKH, NgayTao DESC');

-- 1.3 Tối ưu tác vụ Scheduler quét giải phóng sân giữ chỗ quá 10 phút (findDonHetHanGiuCho)
CALL AddIndexIfNotExists('DatSan', 'IDX_DatSan_ChoXacNhan_HanTT', 'TrangThaiDat, HanThanhToan');

-- 1.4 Tối ưu thống kê doanh thu theo tháng/năm trên Admin Dashboard (tinhDoanhThuTheoThang)
CALL AddIndexIfNotExists('DatSan', 'IDX_DatSan_ThongKe', 'TrangThaiThanhToan, NgayChoi, TrangThaiDat');

-- 1.5 Tối ưu quét các đơn đã quá giờ chơi để chuyển trạng thái (findDonDaXacNhanQuaGio)
CALL AddIndexIfNotExists('DatSan', 'IDX_DatSan_NgayChoi_TrangThai', 'NgayChoi, TrangThaiDat');

-- 1.6 Tối ưu sắp xếp danh sách đơn quản trị mới nhất (findAllWithDetails)
CALL AddIndexIfNotExists('DatSan', 'IDX_DatSan_NgayTao', 'NgayTao DESC');

-- =====================================================================
-- 2. BẢNG SAN & DICHVU (Tối ưu tra cứu tài nguyên theo cơ sở)
-- =====================================================================

-- 2.1 Tra cứu sân hoạt động theo địa điểm (findByDiaDiem_MaDiaDiemAndTinhTrang)
CALL AddIndexIfNotExists('San', 'IDX_San_DiaDiem_TinhTrang', 'MaDiaDiem, TinhTrang');

-- 2.2 Tra cứu dịch vụ khả dụng tại cơ sở (findByDiaDiem_MaDiaDiemAndTrangThai)
CALL AddIndexIfNotExists('DichVu', 'IDX_DichVu_DiaDiem_TrangThai', 'MaDiaDiem, TrangThai');

-- =====================================================================
-- 3. BẢNG THONGBAO & TAIKHOAN & KHACHHANG
-- =====================================================================

-- 3.1 Tối ưu truy vấn danh sách thông báo theo khách hàng kèm trạng thái đã đọc (findByKhachHang_MaKHOrderByThoiGianTaoDesc)
CALL AddIndexIfNotExists('ThongBao', 'IDX_ThongBao_KH_DaDoc_ThoiGian', 'MaKH, DaDoc, ThoiGianTao DESC');

-- 3.2 Tối ưu tìm tài khoản theo khách hàng và phân quyền
CALL AddIndexIfNotExists('TaiKhoan', 'IDX_TaiKhoan_KH', 'MaKH');
CALL AddIndexIfNotExists('TaiKhoan', 'IDX_TaiKhoan_Role_TrangThai', 'MaRole, TrangThai');

-- 3.3 Tối ưu tra cứu khách hàng qua Email
CALL AddIndexIfNotExists('KhachHang', 'IDX_KhachHang_Email', 'Email');

-- =====================================================================
-- 4. BẢNG THANHTOAN & HOANTIEN & HOADON (Tối ưu tài chính & Webhook)
-- =====================================================================

-- 4.1 Tra cứu nhanh mã giao dịch khi nhận IPN/Webhook từ VNPay, MoMo
CALL AddIndexIfNotExists('ThanhToan', 'IDX_ThanhToan_MaGiaoDich', 'MaGiaoDich');

-- 4.2 Tra cứu giao dịch theo đơn đặt sân và loại thanh toán
CALL AddIndexIfNotExists('ThanhToan', 'IDX_ThanhToan_DatSan_Loai', 'MaDatSan, LoaiThanhToan');
CALL AddIndexIfNotExists('ThanhToan', 'IDX_ThanhToan_ThoiGian', 'ThoiGianThanhToan DESC');

-- 4.3 Tra cứu yêu cầu hoàn tiền đang chờ duyệt của Admin (HoanTien)
CALL AddIndexIfNotExists('HoanTien', 'IDX_HoanTien_TrangThai', 'TrangThai');
CALL AddIndexIfNotExists('HoanTien', 'IDX_HoanTien_DatSan', 'MaDatSan');
CALL AddIndexIfNotExists('HoanTien', 'IDX_HoanTien_NgayYeuCau', 'NgayYeuCau DESC');

-- 4.4 Tối ưu hóa đơn theo thời gian lập và trạng thái
CALL AddIndexIfNotExists('HoaDon', 'IDX_HoaDon_NgayLap', 'NgayLap DESC');
CALL AddIndexIfNotExists('HoaDon', 'IDX_HoaDon_TrangThai', 'TrangThai');

-- =====================================================================
-- 5. BẢNG CHITIETDATSAN & CHITIETDICHVU
-- =====================================================================
CALL AddIndexIfNotExists('ChiTietDatSan', 'IDX_CTDS_DatSan', 'MaDatSan');
CALL AddIndexIfNotExists('ChiTietDatSan', 'IDX_CTDS_San_ThoiGian', 'MaSan, BatDau, KetThuc, TrangThai');
CALL AddIndexIfNotExists('ChiTietDichVu', 'IDX_CTDV_DatSan', 'MaDatSan');
CALL AddIndexIfNotExists('ChiTietDichVu', 'IDX_CTDV_DichVu', 'MaDV');

-- Dọn dẹp Procedure tạm
DROP PROCEDURE IF EXISTS AddIndexIfNotExists;

SELECT 'Tối ưu hóa Index cho database QuanLyDatSan hoàn tất thành công!' AS Status;

