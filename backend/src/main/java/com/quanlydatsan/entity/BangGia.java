package com.quanlydatsan.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@Entity
@Table(name = "BangGia")
public class BangGia {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "MaBangGia")
    private Integer maBangGia;

    @Column(name = "TenBangGia", nullable = false, length = 100)
    private String tenBangGia;

    @Column(name = "GiaMoi30Phut", nullable = false)
    private Integer giaMoi30Phut;

    @Column(name = "DangApDung", nullable = false)
    private Boolean dangApDung;

    @Column(name = "NgayApDung", nullable = false)
    private LocalDateTime ngayApDung;
}

