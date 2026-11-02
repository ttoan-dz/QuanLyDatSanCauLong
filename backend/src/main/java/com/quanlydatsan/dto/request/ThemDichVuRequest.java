package com.quanlydatsan.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ThemDichVuRequest {

    @NotNull(message = "Mã dịch vụ không được để trống")
    private Integer maDV;

    @NotNull(message = "Số lượng không được để trống")
    @Min(value = 1, message = "Số lượng phải lớn hơn 0")
    private Integer soLuong;

    private String ghiChu;
}
