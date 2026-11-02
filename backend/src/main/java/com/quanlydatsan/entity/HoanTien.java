package com.quanlydatsan.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@Entity
@Table(name = "HoanTien")
public class HoanTien {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "MaHoanTien")
    private Integer maHoanTien;

    @ManyToOne
    @JoinColumn(name = "MaDatSan", nullable = false)
    private DatSan datSan;

    @ManyToOne
    @JoinColumn(name = "MaThanhToan")
    private ThanhToan thanhToan;

    @Column(name = "NgayYeuCau", nullable = false)
    private LocalDateTime ngayYeuCau = LocalDateTime.now();

    @Column(name = "LyDo", nullable = false, length = 255)
    private String lyDo;

    /**
     * LoaiHuy: 'KhachHuy' | 'CoSoHuy' | 'KhongDen'
     */
    @Column(name = "LoaiHuy", nullable = false, length = 20)
    private String loaiHuy = "KhachHuy";

    /**
     * TyLeHoan: 0, 50, 100
     */
    @Column(name = "TyLeHoan", nullable = false)
    private Integer tyLeHoan = 0;

    @Column(name = "SoTienHoan", nullable = false)
    private BigDecimal soTienHoan = BigDecimal.ZERO;

    /**
     * TrangThai: 'ChoHoan' | 'DaHoan' | 'ThatBai' | 'KhongHoan'
     */
    @Column(name = "TrangThai", nullable = false, length = 20)
    private String trangThai = "DaHoan";
}
