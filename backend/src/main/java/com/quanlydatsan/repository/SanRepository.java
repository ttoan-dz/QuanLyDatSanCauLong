package com.quanlydatsan.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.quanlydatsan.entity.San;

@Repository
public interface SanRepository extends JpaRepository<San, Integer> {

    List<San> findByDiaDiem_MaDiaDiem(Integer maDiaDiem);

    List<San> findByDiaDiem_MaDiaDiemAndTinhTrang(Integer maDiaDiem, String tinhTrang);
}

