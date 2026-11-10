package com.quanlydatsan.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.quanlydatsan.entity.NhatKyHoatDong;

@Repository
public interface NhatKyHoatDongRepository extends JpaRepository<NhatKyHoatDong, Long> {

    List<NhatKyHoatDong> findTop50ByOrderByThoiGianDesc();
}

