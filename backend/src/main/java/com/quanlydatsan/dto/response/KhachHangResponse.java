package com.quanlydatsan.dto.response;

import lombok.Data;

@Data
public class KhachHangResponse {

    private Integer maKH;
    private Integer maTK;
    private String tenDangNhap;
    private String hoTen;
    private String sdt;
    private String email;
    private Integer soLanNoShow;
    private String trangThaiTaiKhoan;
}

