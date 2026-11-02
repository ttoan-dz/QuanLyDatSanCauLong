package com.quanlydatsan.repository;

import com.quanlydatsan.entity.ChiTietDichVu;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChiTietDichVuRepository extends JpaRepository<ChiTietDichVu, Integer> {
    List<ChiTietDichVu> findByDatSan_MaDatSan(Integer maDatSan);
}
