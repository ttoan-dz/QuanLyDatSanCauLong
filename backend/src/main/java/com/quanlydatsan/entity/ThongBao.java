package com.quanlydatsan.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@Entity
@Table(name = "ThongBao")
public class ThongBao {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "MaThongBao")
    private Integer maThongBao;

    @ManyToOne
    @JoinColumn(name = "MaKH", nullable = false)
    private KhachHang khachHang;

    @Column(name = "TieuDe", nullable = false, length = 200)
    private String tieuDe;

    @Column(name = "NoiDung", nullable = false, length = 1000)
    private String noiDung;

    /**
     * Giá trị hợp lệ (CHECK constraint):
     * 'DatSan' | 'ThanhToan' | 'XacNhan' | 'Huy' | 'YeuCauHuy' | 'DuyetHuy'
     */
    @Column(name = "LoaiThongBao", nullable = false, length = 30)
    private String loaiThongBao;

    @Column(name = "DaDoc", nullable = false)
    private Boolean daDoc;

    @Column(name = "ThoiGianTao", nullable = false)
    private LocalDateTime thoiGianTao;
}

