package com.quanlydatsan.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class DoiSanRequest {

    @NotNull(message = "Mã sân mới không được để trống")
    private Integer maSanMoi;

    private String ghiChu;
}

