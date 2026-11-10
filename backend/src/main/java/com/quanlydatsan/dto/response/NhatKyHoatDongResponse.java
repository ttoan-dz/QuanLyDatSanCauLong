package com.quanlydatsan.dto.response;

import java.time.LocalDateTime;
import lombok.Data;

@Data
public class NhatKyHoatDongResponse {

    private Long id;
    private String nguoiThucHien;
    private String vaiTro;
    private String hanhDong;
    private String doiTuong;
    private String ketQua;
    private String chiTiet;
    private LocalDateTime thoiGian;
}

