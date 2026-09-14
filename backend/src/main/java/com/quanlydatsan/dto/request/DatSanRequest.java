package com.quanlydatsan.dto.request;

import java.time.LocalDate;
import java.time.LocalTime;

import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class DatSanRequest {

    @NotNull
    private Integer maSan;

    @NotNull
    @FutureOrPresent
    private LocalDate ngayChoi;

    @NotNull
    private LocalTime gioBatDau;

    @NotNull
    private LocalTime gioKetThuc;

    @NotBlank
    private String phuongThucThanhToan;

    private String ghiChu;
}

