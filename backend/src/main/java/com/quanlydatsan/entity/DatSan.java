package com.quanlydatsan.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Data
@NoArgsConstructor
@Entity
@Table(name = "DatSan")
public class DatSan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "MaDatSan")
    private Integer maDatSan;

    @ManyToOne
    @JoinColumn(name = "MaKH", nullable = false)
    private KhachHang khachHang;

    @ManyToOne
    @JoinColumn(name = "MaSan", nullable = false)
    private San san;

    @Column(name = "NgayChoi", nullable = false)
    private LocalDate ngayChoi;

    @Column(name = "GioBatDau", nullable = false)
    private LocalTime gioBatDau;

    @Column(name = "GioKetThuc", nullable = false)
    private LocalTime gioKetThuc;

    /**
     * Giá trị hợp lệ (CHECK constraint):
     * 'ChoXacNhan' | 'DaXacNhan' | 'ChoHuy' | 'DaHuy' | 'HetHan' | 'HoanThanh'
     */
    @Column(name = "TrangThaiDat", nullable = false, length = 20)
    private String trangThaiDat;

    /**
     * Giá trị hợp lệ (CHECK constraint): 'ChuaThanhToan' | 'DaThanhToan'
     */
    @Column(name = "TrangThaiThanhToan", nullable = false, length = 20)
    private String trangThaiThanhToan;

    /**
     * Giá trị hợp lệ (CHECK constraint): 'QR' | 'TienMat'
     */
    @Column(name = "PhuongThucThanhToan", nullable = false, length = 20)
    private String phuongThucThanhToan;

    /**
     * Giá trị hợp lệ (CHECK constraint):
     * NULL | 'NguoiDungHuy' | 'KhongDenNhan' | 'AdminHuy'
     */
    @Column(name = "LyDoHuy", length = 30)
    private String lyDoHuy;

    @Column(name = "SoTien", nullable = false)
    private Integer soTien;

    @Column(name = "GhiChu", length = 200)
    private String ghiChu;

    @Column(name = "NgayTao", nullable = false)
    private LocalDateTime ngayTao;
}

