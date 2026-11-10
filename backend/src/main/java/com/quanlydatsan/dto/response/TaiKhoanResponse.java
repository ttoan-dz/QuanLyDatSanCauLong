package com.quanlydatsan.dto.response;

import java.time.LocalDateTime;
import lombok.Data;

@Data
public class TaiKhoanResponse {

    private Integer maTK;
    private String tenDangNhap;
    private String role; // ADMIN, STAFF, CUSTOMER
    private String hoTen;
    private String sdt;
    private String email;
    private String trangThai; // HoatDong, Khoa
    private LocalDateTime ngayTao;
    private Integer maKH;
    private Integer soLanNoShow;
    private Integer maNV;
    private Integer maDiaDiemPhuTrach;
    private String tenDiaDiemPhuTrach;
}

