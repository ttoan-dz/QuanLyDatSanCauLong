package com.quanlydatsan.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class DangKyRequest {

    @NotBlank
    private String hoTen;

    @NotBlank
    @Pattern(regexp = "^\\d{10,11}$", message = "SĐT phải gồm 10-11 chữ số")
    private String sdt;

    @NotBlank(message = "Email không được để trống")
    @Email(message = "Email không đúng định dạng")
    private String email;

    @NotBlank
    @Size(min = 4, max = 50)
    private String tenDangNhap;

    @NotBlank
    @Size(min = 6)
    private String matKhau;
}

