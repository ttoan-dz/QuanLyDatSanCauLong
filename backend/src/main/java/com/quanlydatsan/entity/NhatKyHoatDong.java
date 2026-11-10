package com.quanlydatsan.entity;

import java.time.LocalDateTime;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@Entity
@Table(name = "NhatKyHoatDong")
public class NhatKyHoatDong {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "NguoiThucHien", length = 50, nullable = false)
    private String nguoiThucHien;

    @Column(name = "VaiTro", length = 30)
    private String vaiTro;

    @Column(name = "HanhDong", length = 100, nullable = false)
    private String hanhDong;

    @Column(name = "DoiTuong", length = 200)
    private String doiTuong;

    @Column(name = "KetQua", length = 50)
    private String ketQua;

    @Column(name = "ChiTiet", length = 1000)
    private String chiTiet;

    @Column(name = "ThoiGian", nullable = false)
    private LocalDateTime thoiGian = LocalDateTime.now();
}

