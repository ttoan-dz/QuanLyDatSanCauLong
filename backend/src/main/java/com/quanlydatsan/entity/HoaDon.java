package com.quanlydatsan.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@Entity
@Table(name = "HoaDon")
public class HoaDon {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "MaHoaDon")
    private Integer maHoaDon;

    @OneToOne
    @JoinColumn(name = "MaDatSan", nullable = false, unique = true)
    private DatSan datSan;

    @Column(name = "NgayLap", nullable = false)
    private LocalDateTime ngayLap = LocalDateTime.now();

    @Column(name = "TongTienSan", nullable = false)
    private BigDecimal tongTienSan = BigDecimal.ZERO;

    @Column(name = "TongTienDV", nullable = false)
    private BigDecimal tongTienDV = BigDecimal.ZERO;

    @Column(name = "TienQuaGio", nullable = false)
    private BigDecimal tienQuaGio = BigDecimal.ZERO;

    @Column(name = "TienTraTruoc", nullable = false)
    private BigDecimal tienTraTruoc = BigDecimal.ZERO;

    @Column(name = "TienHoanDuyet", nullable = false)
    private BigDecimal tienHoanDuyet = BigDecimal.ZERO;

    @Column(name = "ThanhTien", nullable = false)
    private BigDecimal thanhTien = BigDecimal.ZERO;

    /**
     * TrangThai: 'ChuaThanhToan' | 'DaThanhToan'
     */
    @Column(name = "TrangThai", nullable = false, length = 20)
    private String trangThai = "DaThanhToan";
}
