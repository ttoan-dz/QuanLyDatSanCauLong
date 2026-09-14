package com.quanlydatsan.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CapNhatTrangThaiSanRequest {

    @NotBlank(message = "Tình trạng không được để trống")
    private String tinhTrang;
}

