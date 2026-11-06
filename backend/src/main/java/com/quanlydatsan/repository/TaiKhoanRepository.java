package com.quanlydatsan.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.quanlydatsan.entity.TaiKhoan;

@Repository
public interface TaiKhoanRepository extends JpaRepository<TaiKhoan, Integer> {

    Optional<TaiKhoan> findByTenDangNhap(String tenDangNhap);

    boolean existsByTenDangNhap(String tenDangNhap);

    Optional<TaiKhoan> findByKhachHang_MaKH(Integer maKH);

    @Query("SELECT tk FROM TaiKhoan tk " +
           "LEFT JOIN tk.khachHang kh " +
           "WHERE LOWER(tk.tenDangNhap) = LOWER(:identifier) " +
           "OR (kh.email IS NOT NULL AND LOWER(kh.email) = LOWER(:identifier)) " +
           "OR tk.maTK IN (SELECT nv.taiKhoan.maTK FROM NhanVien nv WHERE nv.email IS NOT NULL AND LOWER(nv.email) = LOWER(:identifier))")
    List<TaiKhoan> findAllByTenDangNhapOrEmail(@Param("identifier") String identifier);

    default Optional<TaiKhoan> findByTenDangNhapOrEmail(String identifier) {
        if (identifier == null || identifier.trim().isEmpty()) {
            return Optional.empty();
        }
        String clean = identifier.trim();
        List<TaiKhoan> list = findAllByTenDangNhapOrEmail(clean);
        if (list.isEmpty()) {
            return Optional.empty();
        }
        for (TaiKhoan tk : list) {
            if (tk.getTenDangNhap().equalsIgnoreCase(clean)) {
                return Optional.of(tk);
            }
        }
        return Optional.of(list.get(0));
    }
}

