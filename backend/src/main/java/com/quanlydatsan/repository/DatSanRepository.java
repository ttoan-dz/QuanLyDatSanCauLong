package com.quanlydatsan.repository;

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
     * Kiểm tra trùng lịch: chỉ tính các đơn đang thực sự giữ chỗ
     * (ChoXacNhan / DaXacNhan / ChoHuy), so khớp overlap chuẩn.
     */
    @Query("SELECT CASE WHEN COUNT(d) > 0 THEN true ELSE false END " +
           "FROM DatSan d WHERE d.san.maSan = :maSan " +
           "AND d.ngayChoi = :ngay " +
           "AND d.trangThaiDat IN ('ChoXacNhan','DaXacNhan','ChoHuy') " +
           "AND :gioBatDau < d.gioKetThuc AND :gioKetThuc > d.gioBatDau")
    boolean existsTrungLich(@Param("maSan") Integer maSan,
                            @Param("ngay") LocalDate ngay,
                            @Param("gioBatDau") LocalTime gioBatDau,
                            @Param("gioKetThuc") LocalTime gioKetThuc);

    /**
     * Đếm số sân đang bị chiếm trong 1 địa điểm ở khung giờ đó
     * (dùng để kiểm tra "hết sân toàn địa điểm").
     */
    @Query("SELECT COUNT(DISTINCT d.san.maSan) FROM DatSan d " +
           "WHERE d.san.diaDiem.maDiaDiem = :maDiaDiem " +
           "AND d.ngayChoi = :ngay " +
           "AND d.trangThaiDat IN ('ChoXacNhan','DaXacNhan','ChoHuy') " +
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
     * Tìm các đơn theo danh sách trạng thái đặt (bất kể ngày nào).
     */
    List<DatSan> findByTrangThaiDatIn(List<String> trangThaiDats);

    /**
     * Tìm các đơn đã xác nhận nhưng giờ chơi đã kết thúc so với hiện tại.
     */
    @Query("SELECT d FROM DatSan d WHERE d.trangThaiDat = 'DaXacNhan' AND (d.ngayChoi < :today OR (d.ngayChoi = :today AND d.gioKetThuc <= :now))")
    List<DatSan> findDonDaXacNhanQuaGio(@Param("today") LocalDate today, @Param("now") LocalTime now);

    /**
     * Thống kê doanh thu theo tháng/năm — loại trừ đơn đã hủy,
     * chỉ tính đơn đã thanh toán.
     */
    @Query("SELECT COALESCE(SUM(d.soTien),0) FROM DatSan d " +
           "WHERE YEAR(d.ngayChoi) = :nam AND MONTH(d.ngayChoi) = :thang " +
           "AND d.trangThaiThanhToan = 'DaThanhToan' " +
           "AND d.trangThaiDat <> 'DaHuy'")
    Long tinhDoanhThuTheoThang(@Param("nam") int nam, @Param("thang") int thang);

    /**
     * Thống kê doanh thu theo năm.
     */
    @Query("SELECT COALESCE(SUM(d.soTien),0) FROM DatSan d " +
           "WHERE YEAR(d.ngayChoi) = :nam " +
           "AND d.trangThaiThanhToan = 'DaThanhToan' " +
           "AND d.trangThaiDat <> 'DaHuy'")
    Long tinhDoanhThuTheoNam(@Param("nam") int nam);

    /**
     * Đếm số đơn đã thanh toán theo tháng.
     */
    @Query("SELECT COUNT(d) FROM DatSan d " +
           "WHERE YEAR(d.ngayChoi) = :nam AND MONTH(d.ngayChoi) = :thang " +
           "AND d.trangThaiThanhToan = 'DaThanhToan' " +
           "AND d.trangThaiDat <> 'DaHuy'")
    Long demSoDonTheoThang(@Param("nam") int nam, @Param("thang") int thang);

    /**
     * Đếm số đơn đã thanh toán theo năm.
     */
    @Query("SELECT COUNT(d) FROM DatSan d " +
           "WHERE YEAR(d.ngayChoi) = :nam " +
           "AND d.trangThaiThanhToan = 'DaThanhToan' " +
           "AND d.trangThaiDat <> 'DaHuy'")
    Long demSoDonTheoNam(@Param("nam") int nam);

    /**
     * Kiểm tra sân có đơn đặt đang active không (dùng khi xoá sân).
     */
    @Query("SELECT CASE WHEN COUNT(d) > 0 THEN true ELSE false END " +
           "FROM DatSan d WHERE d.san.maSan = :maSan " +
           "AND d.trangThaiDat IN ('ChoXacNhan','DaXacNhan','ChoHuy')")
    boolean existsDatSanActiveBySan(@Param("maSan") Integer maSan);

    /**
     * Tìm các đơn QR chờ xác nhận đã quá hạn (ngayTao trước thời điểm chỉ định).
     */
    @Query("SELECT d FROM DatSan d " +
           "WHERE d.trangThaiDat = 'ChoXacNhan' " +
           "AND d.phuongThucThanhToan = 'QR' " +
           "AND d.ngayTao < :thoiDiemHetHan")
    List<DatSan> findDonQRHetHan(@Param("thoiDiemHetHan") LocalDateTime thoiDiemHetHan);

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
}

