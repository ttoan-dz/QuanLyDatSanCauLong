package com.quanlydatsan.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.quanlydatsan.dto.request.CapNhatAnhSanRequest;
import com.quanlydatsan.dto.request.CapNhatKhachHangRequest;
import com.quanlydatsan.dto.request.CapNhatTrangThaiSanRequest;
import com.quanlydatsan.dto.request.DuyetYeuCauHuyRequest;
import com.quanlydatsan.dto.request.HuyDatSanRequest;
import com.quanlydatsan.dto.request.SuaSanRequest;
import com.quanlydatsan.dto.request.TaoSanRequest;
import com.quanlydatsan.dto.response.DatSanResponse;
import com.quanlydatsan.dto.response.DiaDiemResponse;
import com.quanlydatsan.dto.response.KhachHangResponse;
import com.quanlydatsan.dto.response.SanResponse;
import com.quanlydatsan.dto.response.ThongKeDoanhThuResponse;
import com.quanlydatsan.service.AdminService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;

    // ======================== ĐƠN ĐẶT SÂN ========================

    @GetMapping("/bookings")
    public ResponseEntity<List<DatSanResponse>> danhSachDatSan(
            @RequestParam(required = false) String status) {
        return ResponseEntity.ok(adminService.danhSachDatSan(status));
    }

    @PutMapping("/bookings/{id}/confirm-cash")
    public ResponseEntity<DatSanResponse> xacNhanThanhToanTienMat(@PathVariable Integer id) {
        return ResponseEntity.ok(adminService.xacNhanThanhToanTienMat(id));
    }

    @PutMapping("/bookings/{id}/cancel")
    public ResponseEntity<DatSanResponse> huyDatSan(
            @PathVariable Integer id,
            @RequestBody(required = false) HuyDatSanRequest req) {
        return ResponseEntity.ok(adminService.huyDatSan(id, req));
    }

    @PutMapping("/bookings/{id}/approve-cancel")
    public ResponseEntity<DatSanResponse> duyetYeuCauHuy(
            @PathVariable Integer id,
            @Valid @RequestBody DuyetYeuCauHuyRequest req) {
        return ResponseEntity.ok(adminService.duyetYeuCauHuy(id, req));
    }

    // ======================== QUẢN LÝ SÂN ========================

    @GetMapping("/courts")
    public ResponseEntity<List<DiaDiemResponse>> danhSachDiaDiem() {
        return ResponseEntity.ok(adminService.danhSachDiaDiem());
    }

    @PostMapping("/courts")
    public ResponseEntity<Void> taoSan(@Valid @RequestBody TaoSanRequest req) {
        adminService.taoSan(req);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @PutMapping("/courts/{maDiaDiem}")
    public ResponseEntity<Void> suaSan(
            @PathVariable Integer maDiaDiem,
            @Valid @RequestBody SuaSanRequest req) {
        adminService.suaSan(maDiaDiem, req);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/courts/court/{maSan}/image")
    public ResponseEntity<Void> capNhatAnhSan(
            @PathVariable Integer maSan,
            @Valid @RequestBody CapNhatAnhSanRequest req) {
        adminService.capNhatAnhSan(maSan, req);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/courts/court/{maSan}/status")
    public ResponseEntity<SanResponse> capNhatTrangThaiSan(
            @PathVariable Integer maSan,
            @Valid @RequestBody CapNhatTrangThaiSanRequest req) {
        return ResponseEntity.ok(adminService.capNhatTrangThaiSan(maSan, req));
    }

    // ======================== KHÁCH HÀNG ========================

    @GetMapping("/users")
    public ResponseEntity<List<KhachHangResponse>> danhSachKhachHang() {
        return ResponseEntity.ok(adminService.danhSachKhachHang());
    }

    @PutMapping("/users/{maKH}")
    public ResponseEntity<KhachHangResponse> suaKhachHang(
            @PathVariable Integer maKH,
            @Valid @RequestBody CapNhatKhachHangRequest req) {
        return ResponseEntity.ok(adminService.suaKhachHang(maKH, req));
    }

    @PutMapping("/users/{maTK}/toggle-status")
    public ResponseEntity<Void> doiTrangThaiTaiKhoan(@PathVariable Integer maTK) {
        adminService.doiTrangThaiTaiKhoan(maTK);
        return ResponseEntity.ok().build();
    }

    // ======================== THỐNG KÊ ========================

    @GetMapping("/revenue/month")
    public ResponseEntity<ThongKeDoanhThuResponse> thongKeTheoThang(
            @RequestParam int nam, @RequestParam int thang) {
        return ResponseEntity.ok(adminService.thongKeDoanhThuTheoThang(nam, thang));
    }

    @GetMapping("/revenue/year")
    public ResponseEntity<ThongKeDoanhThuResponse> thongKeTheoNam(@RequestParam int nam) {
        return ResponseEntity.ok(adminService.thongKeDoanhThuTheoNam(nam));
    }
}

