package com.quanlydatsan.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CapNhatAnhSanRequest {

    @NotBlank
    private String hinhAnh;
}

