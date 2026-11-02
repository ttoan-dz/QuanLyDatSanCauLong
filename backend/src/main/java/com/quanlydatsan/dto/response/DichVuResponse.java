package com.quanlydatsan.dto.response;

import java.math.BigDecimal;

import lombok.Data;

@Data
public class DichVuResponse {
    private Integer maDV;
    private Integer maDiaDiem;
    private String tenDiaDiem;
    private String tenDV;
    private String loaiDV;
    private BigDecimal donGia;
    private Integer soLuongTon;
    private String hinhAnh;
    private String trangThai;
}
