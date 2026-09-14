package com.quanlydatsan.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.quanlydatsan.entity.ThongBao;

@Repository
public interface ThongBaoRepository extends JpaRepository<ThongBao, Integer> {

    List<ThongBao> findByKhachHang_MaKHOrderByThoiGianTaoDesc(Integer maKH);
}

