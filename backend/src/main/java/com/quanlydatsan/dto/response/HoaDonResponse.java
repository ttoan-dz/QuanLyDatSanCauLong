package com.quanlydatsan.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import lombok.Data;

@Data
public class HoaDonResponse {
    private Integer maHoaDon;
    private Integer maDatSan;
    private LocalDateTime ngayLap;
    private BigDecimal tongTienSan;
    private BigDecimal tongTienDV;
    private BigDecimal tienQuaGio;
    private BigDecimal tienTraTruoc;
    private BigDecimal tienHoanDuyet;
    private BigDecimal thanhTien;
    private String trangThai;
}
