package com.quanlydatsan.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalTime;

@Data
@NoArgsConstructor
@Entity
@Table(name = "DiaDiem")
public class DiaDiem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "MaDiaDiem")
    private Integer maDiaDiem;

    @Column(name = "TenDiaDiem", nullable = false, unique = true, length = 100)
    private String tenDiaDiem;

    @Column(name = "GioMo", nullable = false)
    private LocalTime gioMo;

    @Column(name = "GioDong", nullable = false)
    private LocalTime gioDong;

    /**
     * Giá trị hợp lệ (CHECK constraint): 'HoatDong' | 'TamNgung'
     */
    @Column(name = "TrangThai", nullable = false, length = 20)
    private String trangThai;

    @Column(name = "DiaChi", length = 255)
    private String diaChi;

    @Column(name = "SDT", length = 15)
    private String sdt;

    @Column(name = "MapLink", length = 500)
    private String mapLink;
}

