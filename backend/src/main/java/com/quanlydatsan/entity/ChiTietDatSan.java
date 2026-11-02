package com.quanlydatsan.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@Entity
@Table(name = "ChiTietDatSan")
public class ChiTietDatSan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "MaCTDatSan")
    private Integer maCTDatSan;

    @ManyToOne
    @JoinColumn(name = "MaDatSan", nullable = false)
    private DatSan datSan;

    @ManyToOne
    @JoinColumn(name = "MaSan", nullable = false)
    private San san;

    @ManyToOne
    @JoinColumn(name = "MaNV")
    private NhanVien nhanVien;

    @Column(name = "BatDau", nullable = false)
    private LocalDateTime batDau;

    @Column(name = "KetThuc", nullable = false)
    private LocalDateTime ketThuc;

    @Column(name = "GioCheckIn")
    private LocalDateTime gioCheckIn;

    @Column(name = "GioCheckOut")
    private LocalDateTime gioCheckOut;

    @Column(name = "TienSan", nullable = false)
    private BigDecimal tienSan = BigDecimal.ZERO;

    @Column(name = "SoBlockQuaGio", nullable = false)
    private Integer soBlockQuaGio = 0;

    @Column(name = "TienQuaGio", nullable = false)
    private BigDecimal tienQuaGio = BigDecimal.ZERO;

    /**
     * TrangThai: GiuCho, DaXacNhan, DangChoi, HoanThanh, DaHuy, KhongDen
     */
    @Column(name = "TrangThai", nullable = false, length = 20)
    private String trangThai = "DaXacNhan";
}
