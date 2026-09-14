package com.quanlydatsan.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@Entity
@Table(name = "KhachHang")
public class KhachHang {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "MaKH")
    private Integer maKH;

    @Column(name = "HoTen", nullable = false, length = 100)
    private String hoTen;

    @Column(name = "SDT", nullable = false, unique = true, length = 15)
    private String sdt;

    @Column(name = "Email", length = 100)
    private String email;

    @Column(name = "SoLanNoShow", nullable = false)
    private Integer soLanNoShow;

    @Column(name = "NgayTao", nullable = false)
    private LocalDateTime ngayTao;
}

