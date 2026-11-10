package com.quanlydatsan.dto.response;

import java.time.LocalDate;
import java.time.LocalDateTime;
import lombok.Data;

@Data
public class AdminProfileResponse {

    private Integer maTK;
    private Integer maNV;
    private String tenDangNhap;
    private String hoTen;
    private String sdt;
    private String email;
    private String role; // ADMIN, STAFF
    private String chucVu;
    private String trangThai;
    private LocalDateTime ngayTao;
    private LocalDate ngayVaoLam;
    private Integer maDiaDiem;
    private String tenDiaDiem;
}

