package com.quanlydatsan.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@Entity
@Table(name = "ChiTietDichVu")
public class ChiTietDichVu {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "MaCTDV")
    private Integer maCTDV;

    @ManyToOne
    @JoinColumn(name = "MaDatSan", nullable = false)
    private DatSan datSan;

    @ManyToOne
    @JoinColumn(name = "MaDV", nullable = false)
    private DichVu dichVu;

    @Column(name = "SoLuong", nullable = false)
    private Integer soLuong = 1;

    @Column(name = "DonGia", nullable = false)
    private BigDecimal donGia = BigDecimal.ZERO;

    @Column(name = "GhiChu", length = 255)
    private String ghiChu;

    @Column(name = "ThoiGian", nullable = false)
    private LocalDateTime thoiGian = LocalDateTime.now();
}
