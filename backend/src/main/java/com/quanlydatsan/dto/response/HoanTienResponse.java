package com.quanlydatsan.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import lombok.Data;

@Data
public class HoanTienResponse {
    private Integer maHoanTien;
    private Integer maDatSan;
    private LocalDateTime ngayYeuCau;
    private String lyDo;
    private String loaiHuy;
    private Integer tyLeHoan;
    private BigDecimal soTienHoan;
    private String trangThai;
}
