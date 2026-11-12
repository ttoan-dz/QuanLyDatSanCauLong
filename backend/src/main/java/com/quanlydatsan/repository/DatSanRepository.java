package com.quanlydatsan.repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.quanlydatsan.entity.DatSan;

@Repository
public interface DatSanRepository extends JpaRepository<DatSan, Integer> {

    /**
     * Kiểm tra trùng lịch: các đơn đang giữ chỗ hoặc đang sử dụng sân
     * (ChoXacNhan, DaXacNhan, DangChoi, ChoHuy), so khớp overlap chuẩn.
     */
    @Query("SELECT CASE WHEN COUNT(d) > 0 THEN true ELSE false END " +
           "FROM DatSan d WHERE d.san.maSan = :maSan " +
           "AND d.ngayChoi = :ngay " +
           "AND d.trangThaiDat IN ('ChoXacNhan','DaXacNhan','DangChoi','ChoHuy') " +
           "AND :gioBatDau < d.gioKetThuc AND :gioKetThuc > d.gioBatDau")
    boolean existsTrungLich(@Param("maSan") Integer maSan,
                            @Param("ngay") LocalDate ngay,
                            @Param("gioBatDau") LocalTime gioBatDau,
                            @Param("gioKetThuc") LocalTime gioKetThuc);

    /**
     * Đếm số sân đang bị chiếm trong 1 địa điểm ở khung giờ đó.
     */
    @Query("SELECT COUNT(DISTINCT d.san.maSan) FROM DatSan d " +
           "WHERE d.san.diaDiem.maDiaDiem = :maDiaDiem " +
           "AND d.ngayChoi = :ngay " +
           "AND d.trangThaiDat IN ('ChoXacNhan','DaXacNhan','DangChoi','ChoHuy') " +
           "AND :gioBatDau < d.gioKetThuc AND :gioKetThuc > d.gioBatDau")
    long demSoSanDaDat(@Param("maDiaDiem") Integer maDiaDiem,
                       @Param("ngay") LocalDate ngay,
                       @Param("gioBatDau") LocalTime gioBatDau,
                       @Param("gioKetThuc") LocalTime gioKetThuc);

    /**
     * Danh sách đơn của 1 khách hàng, sắp xếp mới nhất trước.
     */
    List<DatSan> findByKhachHang_MaKHOrderByNgayTaoDesc(Integer maKH);

    /**
     * Tìm các đơn theo ngày chơi và danh sách trạng thái đặt.
     */
    List<DatSan> findByNgayChoiAndTrangThaiDatIn(LocalDate ngayChoi, List<String> trangThaiDats);

    /**
     * Tìm các đơn của một sân theo ngày chơi và danh sách trạng thái đặt.
     */
    List<DatSan> findBySan_MaSanAndNgayChoiAndTrangThaiDatIn(Integer maSan, LocalDate ngayChoi, List<String> trangThaiDats);

    /**
     * Tìm các đơn theo danh sách trạng thái đặt.
     */
    List<DatSan> findByTrangThaiDatIn(List<String> trangThaiDats);

    /**
     * Tìm các đơn đã xác nhận nhưng giờ chơi đã kết thúc so với hiện tại.
     */
    @Query("SELECT d FROM DatSan d WHERE d.trangThaiDat = 'DaXacNhan' AND (d.ngayChoi < :today OR (d.ngayChoi = :today AND d.gioKetThuc <= :now))")
    List<DatSan> findDonDaXacNhanQuaGio(@Param("today") LocalDate today, @Param("now") LocalTime now);

    /**
     * Thống kê doanh thu tiền sân gốc theo tháng/năm.
     */
    @Query("SELECT COALESCE(SUM(d.soTien),0) FROM DatSan d " +
           "WHERE YEAR(d.ngayChoi) = :nam AND MONTH(d.ngayChoi) = :thang " +
           "AND d.trangThaiThanhToan = 'DaThanhToan' " +
           "AND d.trangThaiDat NOT IN ('DaHuy', 'HetHan')")
    Long tinhDoanhThuTheoThang(@Param("nam") int nam, @Param("thang") int thang);

    /**
     * Thống kê tiền phụ phí quá giờ theo tháng.
     */
    @Query("SELECT COALESCE(SUM(d.tienQuaGio),0) FROM DatSan d " +
           "WHERE YEAR(d.ngayChoi) = :nam AND MONTH(d.ngayChoi) = :thang " +
           "AND d.trangThaiThanhToan = 'DaThanhToan' " +
           "AND d.trangThaiDat NOT IN ('DaHuy', 'HetHan')")
    BigDecimal tinhTienQuaGioTheoThang(@Param("nam") int nam, @Param("thang") int thang);

    /**
     * Thống kê doanh thu tiền sân gốc theo năm.
     */
    @Query("SELECT COALESCE(SUM(d.soTien),0) FROM DatSan d " +
           "WHERE YEAR(d.ngayChoi) = :nam " +
           "AND d.trangThaiThanhToan = 'DaThanhToan' " +
           "AND d.trangThaiDat NOT IN ('DaHuy', 'HetHan')")
    Long tinhDoanhThuTheoNam(@Param("nam") int nam);

    /**
     * Thống kê tiền phụ phí quá giờ theo năm.
     */
    @Query("SELECT COALESCE(SUM(d.tienQuaGio),0) FROM DatSan d " +
           "WHERE YEAR(d.ngayChoi) = :nam " +
           "AND d.trangThaiThanhToan = 'DaThanhToan' " +
           "AND d.trangThaiDat NOT IN ('DaHuy', 'HetHan')")
    BigDecimal tinhTienQuaGioTheoNam(@Param("nam") int nam);

    /**
     * Đếm số đơn đã thanh toán theo tháng.
     */
    @Query("SELECT COUNT(d) FROM DatSan d " +
           "WHERE YEAR(d.ngayChoi) = :nam AND MONTH(d.ngayChoi) = :thang " +
           "AND d.trangThaiThanhToan = 'DaThanhToan' " +
           "AND d.trangThaiDat NOT IN ('DaHuy', 'HetHan')")
    Long demSoDonTheoThang(@Param("nam") int nam, @Param("thang") int thang);

    /**
     * Đếm số đơn đã thanh toán theo năm.
     */
    @Query("SELECT COUNT(d) FROM DatSan d " +
           "WHERE YEAR(d.ngayChoi) = :nam " +
           "AND d.trangThaiThanhToan = 'DaThanhToan' " +
           "AND d.trangThaiDat NOT IN ('DaHuy', 'HetHan')")
    Long demSoDonTheoNam(@Param("nam") int nam);

    /**
     * Kiểm tra sân có đơn đặt đang active không.
     */
    @Query("SELECT CASE WHEN COUNT(d) > 0 THEN true ELSE false END " +
           "FROM DatSan d WHERE d.san.maSan = :maSan " +
           "AND d.trangThaiDat IN ('ChoXacNhan','DaXacNhan','DangChoi','ChoHuy')")
    boolean existsDatSanActiveBySan(@Param("maSan") Integer maSan);

    /**
     * Tìm các đơn đặt sân trong tương lai bị ảnh hưởng khi sân bảo trì hoặc tạm ngưng.
     */
    @Query("SELECT d FROM DatSan d " +
           "LEFT JOIN FETCH d.san s " +
           "LEFT JOIN FETCH s.diaDiem " +
           "LEFT JOIN FETCH d.khachHang kh " +
           "WHERE d.san.maSan = :maSan " +
           "AND d.ngayChoi >= :today " +
           "AND d.trangThaiDat NOT IN ('DaHuy', 'HetHan', 'HoanThanh') " +
           "ORDER BY d.ngayChoi ASC, d.gioBatDau ASC")
    List<DatSan> findDonXungDotKhiBaoTri(@Param("maSan") Integer maSan, @Param("today") LocalDate today);

    /**
     * Tìm các đơn chờ thanh toán trực tuyến đã quá hạn giữ chỗ 10 phút (loại trừ Tiền mặt).
     */
    @Query("SELECT d FROM DatSan d " +
           "WHERE d.trangThaiDat = 'ChoXacNhan' " +
           "AND d.phuongThucThanhToan <> 'TienMat' " +
           "AND ((d.hanThanhToan IS NOT NULL AND d.hanThanhToan < :now) " +
           "  OR (d.hanThanhToan IS NULL AND d.ngayTao < :thoiDiemHetHan))")
    List<DatSan> findDonHetHanGiuCho(@Param("now") LocalDateTime now, @Param("thoiDiemHetHan") LocalDateTime thoiDiemHetHan);

    /**
     * Lấy toàn bộ đơn đặt sân (kèm JOIN FETCH) sắp xếp mới nhất trước.
     */
    @Query("SELECT d FROM DatSan d " +
           "JOIN FETCH d.san s " +
           "JOIN FETCH s.diaDiem " +
           "JOIN FETCH d.khachHang " +
           "ORDER BY d.ngayTao DESC")
    List<DatSan> findAllWithDetails();

    /**
     * Lọc đơn đặt sân theo trạng thái đặt (kèm JOIN FETCH) sắp xếp mới nhất trước.
     */
    @Query("SELECT d FROM DatSan d " +
           "JOIN FETCH d.san s " +
           "JOIN FETCH s.diaDiem " +
           "JOIN FETCH d.khachHang " +
           "WHERE d.trangThaiDat = :trangThaiDat " +
           "ORDER BY d.ngayTao DESC")
    List<DatSan> findByTrangThaiDatWithDetails(@Param("trangThaiDat") String trangThaiDat);

    /**
     * Tìm kiếm đơn đặt sân theo từ khóa (Mã đơn, SĐT, Tên KH) phục vụ nghiệp vụ tại quầy.
     */
    @Query("SELECT d FROM DatSan d " +
           "JOIN FETCH d.san s " +
           "JOIN FETCH s.diaDiem " +
           "JOIN FETCH d.khachHang kh " +
           "WHERE (:keyword IS NULL OR :keyword = '' " +
           "  OR CONCAT(d.maDatSan, '') LIKE CONCAT('%', :keyword, '%') " +
           "  OR kh.sdt LIKE CONCAT('%', :keyword, '%') " +
           "  OR LOWER(kh.hoTen) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
           "AND (:trangThaiDat IS NULL OR :trangThaiDat = '' OR d.trangThaiDat = :trangThaiDat) " +
           "ORDER BY d.ngayTao DESC")
    List<DatSan> searchBookings(@Param("keyword") String keyword, @Param("trangThaiDat") String trangThaiDat);
}
