package com.quanlydatsan.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@Entity
@Table(name = "San")
public class San {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "MaSan")
    private Integer maSan;

    @ManyToOne
    @JoinColumn(name = "MaDiaDiem", nullable = false)
    private DiaDiem diaDiem;

    @Column(name = "TenSan", nullable = false, length = 50)
    private String tenSan;

    /**
     * Giá trị hợp lệ (CHECK constraint): 'HoatDong' | 'TamNgung' | 'BaoTri'
     */
    @Column(name = "TinhTrang", nullable = false, length = 20)
    private String tinhTrang;

    @Column(name = "GhiChu", length = 200)
    private String ghiChu;

    @Column(name = "HinhAnh", length = 255)
    private String hinhAnh;
}

