package com.quanlydatsan.repository;

import com.quanlydatsan.entity.HoaDon;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface HoaDonRepository extends JpaRepository<HoaDon, Integer> {
    Optional<HoaDon> findByDatSan_MaDatSan(Integer maDatSan);
}
