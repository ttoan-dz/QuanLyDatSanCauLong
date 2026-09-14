package com.quanlydatsan.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@Entity
@Table(name = "TaiKhoan")
public class TaiKhoan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "MaTK")
    private Integer maTK;

    @Column(name = "TenDangNhap", nullable = false, unique = true, length = 50)
    private String tenDangNhap;

    @Column(name = "MatKhau", nullable = false, length = 100)
    private String matKhau;

    @ManyToOne
    @JoinColumn(name = "MaRole", nullable = false)
    private Role role;

    @ManyToOne
    @JoinColumn(name = "MaKH")
    private KhachHang khachHang;

    /**
     * Giá trị hợp lệ (CHECK constraint): 'HoatDong' | 'Khoa'
     */
    @Column(name = "TrangThai", nullable = false, length = 20)
    private String trangThai;

    @Column(name = "NgayTao", nullable = false)
    private LocalDateTime ngayTao;
}

