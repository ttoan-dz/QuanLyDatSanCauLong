package com.quanlydatsan.dto.response;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

import lombok.Data;

@Data
public class DatSanResponse {

    private Integer maDatSan;
    private String tenDiaDiem;
    private String tenSan;
    private LocalDate ngayChoi;
    private LocalTime gioBatDau;
    private LocalTime gioKetThuc;
    private String trangThaiDat;
    private String trangThaiThanhToan;
    private String phuongThucThanhToan;
    private Integer soTien;
    private String ghiChu;
    private String lyDoHuy;
    private LocalDateTime ngayTao;
    private String mapLink;
}

