package com.quanlydatsan.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class DuyetYeuCauHuyRequest {

    @NotNull
    private Boolean dongY;

    private String ghiChu;
}

