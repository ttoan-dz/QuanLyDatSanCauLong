package com.quanlydatsan.dto.response;

import lombok.Data;

@Data
public class ThongKeDoanhThuResponse {

    private Integer thang;
    private Integer nam;
    private Long tongDoanhThu;
    private Long doanhThuSan;
    private Long doanhThuQuaGio;
    private Long doanhThuPhatHuy;
    private Long doanhThuDichVu;
    private Long soDon;
}

