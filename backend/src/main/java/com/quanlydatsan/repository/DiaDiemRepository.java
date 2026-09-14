package com.quanlydatsan.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.quanlydatsan.entity.DiaDiem;

@Repository
public interface DiaDiemRepository extends JpaRepository<DiaDiem, Integer> {

    boolean existsByTenDiaDiem(String tenDiaDiem);
}

