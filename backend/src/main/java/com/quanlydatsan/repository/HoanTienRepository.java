package com.quanlydatsan.repository;

import com.quanlydatsan.entity.HoanTien;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface HoanTienRepository extends JpaRepository<HoanTien, Integer> {
    List<HoanTien> findByDatSan_MaDatSan(Integer maDatSan);
    Optional<HoanTien> findFirstByDatSan_MaDatSanOrderByNgayYeuCauDesc(Integer maDatSan);
}
