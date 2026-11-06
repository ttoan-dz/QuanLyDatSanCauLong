package com.quanlydatsan.dto.response;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

import lombok.Data;

@Data
public class DatSanResponse {

    private Integer maDatSan;
    private Integer maSan;
    private Integer maDiaDiem;
    private String tenDiaDiem;
    private String tenSan;
    private String hoTenKhachHang;
    private String sdtKhachHang;
    private LocalDate ngayChoi;
    private LocalTime gioBatDau;
    private LocalTime gioKetThuc;
    private LocalDateTime gioCheckIn;
    private LocalDateTime gioCheckOut;
    private Integer soBlockQuaGio = 0;
    private BigDecimal tienQuaGio = BigDecimal.ZERO;
    private String trangThaiDat;
    private String trangThaiThanhToan;
    private String phuongThucThanhToan;
    private Integer soTien;
    private BigDecimal tienSan = BigDecimal.ZERO;
    private BigDecimal tienTraTruoc = BigDecimal.ZERO;
    private String ghiChu;
    private String lyDoHuy;
    private LocalDateTime hanThanhToan;
    private LocalDateTime ngayTao;
    private String mapLink;

    // Thông tin hóa đơn & hoàn tiền mở rộng
    private HoaDonResponse hoaDon;
    private List<ChiTietDichVuResponse> danhSachDichVu;
    private HoanTienResponse thongTinHoanTien;
}
