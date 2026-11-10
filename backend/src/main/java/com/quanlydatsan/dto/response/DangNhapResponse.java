package com.quanlydatsan.dto.response;

import lombok.Data;

@Data
public class DangNhapResponse {

    private String token;
    private String role;
    private String tenDangNhap;
    private String hoTen;
    private Integer maKH;
}

