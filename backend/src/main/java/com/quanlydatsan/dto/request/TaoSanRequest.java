package com.quanlydatsan.dto.request;

import java.time.LocalTime;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class TaoSanRequest {

    @NotBlank
    private String tenDiaDiem;

    @NotNull
    private LocalTime gioMo;

    @NotNull
    private LocalTime gioDong;

    @NotNull
    @Min(1)
    private Integer soSanNho;

    private String hinhAnh;

    private String mapLink;
}

