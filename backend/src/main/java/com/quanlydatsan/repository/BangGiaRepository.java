package com.quanlydatsan.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.quanlydatsan.entity.BangGia;

@Repository
public interface BangGiaRepository extends JpaRepository<BangGia, Integer> {

    Optional<BangGia> findFirstByDangApDungTrueOrderByMaBangGiaDesc();
}

