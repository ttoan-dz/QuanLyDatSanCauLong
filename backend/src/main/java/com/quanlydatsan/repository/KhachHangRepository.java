package com.quanlydatsan.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.quanlydatsan.entity.KhachHang;

@Repository
public interface KhachHangRepository extends JpaRepository<KhachHang, Integer> {

    Optional<KhachHang> findBySdt(String sdt);

    boolean existsBySdtAndMaKHNot(String sdt, Integer maKH);
}

