package com.quanlydatsan.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@Entity
@Table(name = "DichVu")
public class DichVu {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "MaDV")
    private Integer maDV;

    @ManyToOne
    @JoinColumn(name = "MaDiaDiem", nullable = false)
    private DiaDiem diaDiem;

    @Column(name = "TenDV", nullable = false, length = 100)
    private String tenDV;

    /**
     * LoaiDV: 'Ban' (nước, bóng, đồ ăn...) | 'ChoThue' (vợt, giày...)
     */
    @Column(name = "LoaiDV", nullable = false, length = 20)
    private String loaiDV = "Ban";

    @Column(name = "DonGia", nullable = false)
    private BigDecimal donGia = BigDecimal.ZERO;

    @Column(name = "SoLuongTon", nullable = false)
    private Integer soLuongTon = 0;

    @Column(name = "HinhAnh", length = 255)
    private String hinhAnh;

    @Column(name = "TrangThai", nullable = false, length = 20)
    private String trangThai = "HoatDong";
}
