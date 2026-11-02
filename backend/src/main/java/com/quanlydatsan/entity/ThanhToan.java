package com.quanlydatsan.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@Entity
@Table(name = "ThanhToan")
public class ThanhToan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "MaThanhToan")
    private Integer maThanhToan;

    @ManyToOne
    @JoinColumn(name = "MaDatSan", nullable = false)
    private DatSan datSan;

    @ManyToOne
    @JoinColumn(name = "MaHoaDon")
    private HoaDon hoaDon;

    @Column(name = "MaGiaoDich", length = 100)
    private String maGiaoDich;

    /**
     * LoaiThanhToan: 'TraTruoc' | 'PhatSinh'
     */
    @Column(name = "LoaiThanhToan", nullable = false, length = 20)
    private String loaiThanhToan = "TraTruoc";

    @Column(name = "SoTien", nullable = false)
    private Integer soTien;

    @Column(name = "PhuongThuc", nullable = false, length = 50)
    private String phuongThuc;

    /**
     * Giá trị hợp lệ: 'ChoXuLy' | 'ThanhCongDemo' | 'ThatBaiDemo' | 'ThanhCong'
     */
    @Column(name = "TrangThai", nullable = false, length = 30)
    private String trangThai;

    @Column(name = "ThoiGianThanhToan", nullable = false)
    private LocalDateTime thoiGianThanhToan;
}
