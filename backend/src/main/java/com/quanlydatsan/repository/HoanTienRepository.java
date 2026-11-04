package com.quanlydatsan.repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.quanlydatsan.entity.HoanTien;

@Repository
public interface HoanTienRepository extends JpaRepository<HoanTien, Integer> {
    List<HoanTien> findByDatSan_MaDatSan(Integer maDatSan);
    Optional<HoanTien> findFirstByDatSan_MaDatSanOrderByNgayYeuCauDesc(Integer maDatSan);

    /**
     * Doanh thu giữ lại từ các đơn hủy (khách hủy không hoàn 0% hoặc hoàn một phần 50%) theo tháng.
     */
    @Query("SELECT COALESCE(SUM(ht.datSan.soTien - ht.soTienHoan), 0) FROM HoanTien ht " +
           "WHERE YEAR(ht.datSan.ngayChoi) = :nam AND MONTH(ht.datSan.ngayChoi) = :thang " +
           "AND ht.datSan.trangThaiThanhToan = 'DaThanhToan' " +
           "AND ht.datSan.trangThaiDat = 'DaHuy' " +
           "AND ht.trangThai IN ('DaHoan', 'KhongHoan')")
    BigDecimal tinhDoanhThuGiuLaiTuDonHuyTheoThang(@Param("nam") int nam, @Param("thang") int thang);

    /**
     * Doanh thu giữ lại từ các đơn hủy (khách hủy không hoàn 0% hoặc hoàn một phần 50%) theo năm.
     */
    @Query("SELECT COALESCE(SUM(ht.datSan.soTien - ht.soTienHoan), 0) FROM HoanTien ht " +
           "WHERE YEAR(ht.datSan.ngayChoi) = :nam " +
           "AND ht.datSan.trangThaiThanhToan = 'DaThanhToan' " +
           "AND ht.datSan.trangThaiDat = 'DaHuy' " +
           "AND ht.trangThai IN ('DaHoan', 'KhongHoan')")
    BigDecimal tinhDoanhThuGiuLaiTuDonHuyTheoNam(@Param("nam") int nam);
}
