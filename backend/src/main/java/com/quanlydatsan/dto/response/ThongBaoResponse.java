package com.quanlydatsan.dto.response;

import java.time.LocalDateTime;

import lombok.Data;

@Data
public class ThongBaoResponse {

    private Integer maThongBao;
    private String tieuDe;
    private String noiDung;
    private String loaiThongBao;
    private Boolean daDoc;
    private LocalDateTime thoiGianTao;
}

