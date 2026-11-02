package com.quanlydatsan.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class TaoDichVuRequest {

    @NotNull(message = "Mã địa điểm không được để trống")
    private Integer maDiaDiem;

    @NotBlank(message = "Tên dịch vụ không được để trống")
    private String tenDV;

    /**
     * LoaiDV: 'Ban' | 'ChoThue'
     */
    @NotBlank(message = "Loại dịch vụ không được để trống")
    private String loaiDV;

    @NotNull(message = "Đơn giá không được để trống")
    @DecimalMin(value = "0.0", inclusive = true, message = "Đơn giá không được âm")
    private BigDecimal donGia;

    @NotNull(message = "Số lượng tồn không được để trống")
    @Min(value = 0, message = "Số lượng tồn không được âm")
    private Integer soLuongTon;

    private String hinhAnh;
}
