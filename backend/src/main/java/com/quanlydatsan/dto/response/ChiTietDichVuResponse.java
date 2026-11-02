package com.quanlydatsan.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import lombok.Data;

@Data
public class ChiTietDichVuResponse {
    private Integer maCTDV;
    private Integer maDV;
    private String tenDV;
    private String loaiDV;
    private Integer soLuong;
    private BigDecimal donGia;
    private BigDecimal thanhTien;
    private String ghiChu;
    private LocalDateTime thoiGian;
}
