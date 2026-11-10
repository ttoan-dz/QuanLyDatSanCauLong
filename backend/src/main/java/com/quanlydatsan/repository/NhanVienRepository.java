package com.quanlydatsan.repository;

import com.quanlydatsan.entity.NhanVien;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface NhanVienRepository extends JpaRepository<NhanVien, Integer> {
    Optional<NhanVien> findBySdt(String sdt);
    Optional<NhanVien> findByTaiKhoan_MaTK(Integer maTK);
    Optional<NhanVien> findByTaiKhoan_TenDangNhap(String tenDangNhap);
    List<NhanVien> findByDiaDiem_MaDiaDiem(Integer maDiaDiem);
    boolean existsBySdt(String sdt);
    boolean existsByEmail(String email);
    boolean existsBySdtAndMaNVNot(String sdt, Integer maNV);
    boolean existsByEmailAndMaNVNot(String email, Integer maNV);
}
