package com.quanlydatsan.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@Entity
@Table(name = "NhanVien")
public class NhanVien {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "MaNV")
    private Integer maNV;

    @ManyToOne
    @JoinColumn(name = "MaDiaDiem")
    private DiaDiem diaDiem;

    @Column(name = "HoTen", nullable = false, length = 100)
    private String hoTen;

    @Column(name = "SDT", nullable = false, unique = true, length = 15)
    private String sdt;

    @Column(name = "Email", length = 100)
    private String email;

    /**
     * ChucVu: NhanVien, ChuSan, QuanTri
     */
    @Column(name = "ChucVu", nullable = false, length = 20)
    private String chucVu = "NhanVien";

    @Column(name = "NgayVaoLam", nullable = false)
    private LocalDate ngayVaoLam = LocalDate.now();

    @OneToOne
    @JoinColumn(name = "MaTK", unique = true)
    private TaiKhoan taiKhoan;
}
