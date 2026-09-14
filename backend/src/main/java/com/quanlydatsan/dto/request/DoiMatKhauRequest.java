package com.quanlydatsan.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class DoiMatKhauRequest {

    @NotBlank(message = "Mật khẩu hiện tại không được để trống")
    private String matKhauHienTai;

    @NotBlank(message = "Mật khẩu mới không được để trống")
    private String matKhauMoi;
}

