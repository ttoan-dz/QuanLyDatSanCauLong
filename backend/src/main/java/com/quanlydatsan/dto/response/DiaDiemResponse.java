package com.quanlydatsan.dto.response;

import lombok.Data;

import java.time.LocalTime;
import java.util.List;

@Data
public class DiaDiemResponse {

    private Integer maDiaDiem;
    private String tenDiaDiem;
    private LocalTime gioMo;
    private LocalTime gioDong;
    private String trangThai;
    private String mapLink;
    private List<SanResponse> danhSachSan;
}

