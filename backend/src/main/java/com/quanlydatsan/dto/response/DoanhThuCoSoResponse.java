package com.quanlydatsan.dto.response;

import lombok.Data;

@Data
public class DoanhThuCoSoResponse {

    private Integer maDiaDiem;
    private String tenDiaDiem;
    private String diaChi;
    private Long tongDoanhThu;
    private Long doanhThuSan;
    private Long doanhThuDichVu;
    private Long soDonTong;
    private Long soDonHoanThanh;
    private Long soDonHuy;
    private Double tyTrong; // Tỷ trọng phần trăm (0 - 100%)
}

