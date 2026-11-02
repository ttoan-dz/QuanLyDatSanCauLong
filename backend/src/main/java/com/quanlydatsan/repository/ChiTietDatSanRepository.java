package com.quanlydatsan.repository;

import com.quanlydatsan.entity.ChiTietDatSan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ChiTietDatSanRepository extends JpaRepository<ChiTietDatSan, Integer> {
    List<ChiTietDatSan> findByDatSan_MaDatSan(Integer maDatSan);
    Optional<ChiTietDatSan> findFirstByDatSan_MaDatSan(Integer maDatSan);
}
