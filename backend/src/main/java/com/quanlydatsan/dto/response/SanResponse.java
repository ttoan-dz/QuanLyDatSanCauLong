package com.quanlydatsan.dto.response;

import lombok.Data;

@Data
public class SanResponse {

    private Integer maSan;
    private String tenDiaDiem;
    private String tenSan;
    private String tinhTrang;
    private String hinhAnh;
    private String mapLink;
    private boolean dangCoNguoiChoi;
    private boolean dangDuocDat;
}

