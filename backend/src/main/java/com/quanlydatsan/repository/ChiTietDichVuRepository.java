package com.quanlydatsan.repository;

import com.quanlydatsan.entity.ChiTietDichVu;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface ChiTietDichVuRepository extends JpaRepository<ChiTietDichVu, Integer> {
    List<ChiTietDichVu> findByDatSan_MaDatSan(Integer maDatSan);

    @Query("SELECT SUM(ct.donGia * ct.soLuong) FROM ChiTietDichVu ct " +
           "WHERE YEAR(ct.datSan.ngayChoi) = :nam AND MONTH(ct.datSan.ngayChoi) = :thang " +
           "AND ct.datSan.trangThaiDat NOT IN ('DaHuy', 'HetHan')")
    BigDecimal tinhDoanhThuDichVuTheoThang(@Param("nam") int nam, @Param("thang") int thang);

    @Query("SELECT SUM(ct.donGia * ct.soLuong) FROM ChiTietDichVu ct " +
           "WHERE YEAR(ct.datSan.ngayChoi) = :nam " +
           "AND ct.datSan.trangThaiDat NOT IN ('DaHuy', 'HetHan')")
    BigDecimal tinhDoanhThuDichVuTheoNam(@Param("nam") int nam);
}
