package com.quanlydatsan.dto.response;

import java.time.LocalTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class KhungGioDaDatResponse {
    private LocalTime gioBatDau;
    private LocalTime gioKetThuc;
    private String trangThaiDat;
}

