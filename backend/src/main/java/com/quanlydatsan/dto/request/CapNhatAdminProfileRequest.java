package com.quanlydatsan.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class CapNhatAdminProfileRequest {

    @NotBlank(message = "Họ và tên không được để trống")
    private String hoTen;

    @NotBlank(message = "Số điện thoại không được để trống")
    @Pattern(regexp = "^0[0-9]{9}$", message = "Số điện thoại phải gồm 10 chữ số")
    private String sdt;

    @Email(message = "Email không đúng định dạng")
    private String email;
}

