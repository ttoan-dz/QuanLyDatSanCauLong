package com.quanlydatsan.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CapNhatProfileRequest {

    @NotBlank(message = "Họ tên không được để trống")
    private String hoTen;

    @NotBlank(message = "Số điện thoại không được để trống")
    private String sdt;

    @NotBlank(message = "Email không được để trống")
    private String email;
}

