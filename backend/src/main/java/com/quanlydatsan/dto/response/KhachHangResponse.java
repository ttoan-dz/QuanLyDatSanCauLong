package com.quanlydatsan.dto.response;

import lombok.Data;

@Data
public class KhachHangResponse {

    private Integer maKH;
    private String hoTen;
    private String sdt;
    private String email;
    private Integer soLanNoShow;
    private String trangThaiTaiKhoan;
}

