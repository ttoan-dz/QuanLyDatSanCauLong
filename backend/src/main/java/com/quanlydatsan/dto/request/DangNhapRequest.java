package com.quanlydatsan.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class DangNhapRequest {

    @NotBlank
    private String tenDangNhap;

    @NotBlank
    private String matKhau;
}

