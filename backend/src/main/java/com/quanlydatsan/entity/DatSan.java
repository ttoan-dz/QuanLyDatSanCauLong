package com.quanlydatsan.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
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

    @ManyToOne
    @JoinColumn(name = "MaNV")
    private NhanVien nhanVien;

    @Column(name = "NgayChoi", nullable = false)
    private LocalDate ngayChoi;

    @Column(name = "GioBatDau", nullable = false)
    private LocalTime gioBatDau;

    @Column(name = "GioKetThuc", nullable = false)
    private LocalTime gioKetThuc;

    @Column(name = "GioCheckIn")
    private LocalDateTime gioCheckIn;

    @Column(name = "GioCheckOut")
    private LocalDateTime gioCheckOut;

    @Column(name = "SoBlockQuaGio", nullable = false)
    private Integer soBlockQuaGio = 0;

    @Column(name = "TienQuaGio", nullable = false)
    private BigDecimal tienQuaGio = BigDecimal.ZERO;

    /**
     * Giá trị hợp lệ theo báo cáo:
     * 'ChoXacNhan' (hoặc 'GiuCho') | 'DaXacNhan' | 'DangChoi' | 'ChoHuy' | 'DaHuy' | 'HetHan' | 'HoanThanh' | 'KhongDen'
     */
    @Column(name = "TrangThaiDat", nullable = false, length = 20)
    private String trangThaiDat;

    /**
     * Giá trị hợp lệ: 'ChuaThanhToan' | 'DaThanhToan'
     */
    @Column(name = "TrangThaiThanhToan", nullable = false, length = 20)
    private String trangThaiThanhToan;

    /**
     * Giá trị hợp lệ: 'QR' | 'TienMat' | 'VNPay' | 'MoMo'
     */
    @Column(name = "PhuongThucThanhToan", nullable = false, length = 20)
    private String phuongThucThanhToan;

    @Column(name = "LyDoHuy", length = 50)
    private String lyDoHuy;

    @Column(name = "SoTien", nullable = false)
    private Integer soTien;

    @Column(name = "TienSan", nullable = false)
    private BigDecimal tienSan = BigDecimal.ZERO;

    @Column(name = "TienTraTruoc", nullable = false)
    private BigDecimal tienTraTruoc = BigDecimal.ZERO;

    @Column(name = "GhiChu", length = 200)
    private String ghiChu;

    @Column(name = "HanThanhToan")
    private LocalDateTime hanThanhToan;

    @Column(name = "NgayTao", nullable = false)
    private LocalDateTime ngayTao;
}
