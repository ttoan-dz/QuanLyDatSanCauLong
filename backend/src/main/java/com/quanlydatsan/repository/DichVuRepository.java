package com.quanlydatsan.repository;

import com.quanlydatsan.entity.DichVu;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DichVuRepository extends JpaRepository<DichVu, Integer> {
    List<DichVu> findByDiaDiem_MaDiaDiemAndTrangThai(Integer maDiaDiem, String trangThai);
    List<DichVu> findByDiaDiem_MaDiaDiem(Integer maDiaDiem);
}
