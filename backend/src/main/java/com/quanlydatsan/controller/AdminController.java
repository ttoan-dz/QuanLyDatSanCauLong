package com.quanlydatsan.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.quanlydatsan.dto.request.CapNhatAnhSanRequest;
import com.quanlydatsan.dto.request.CapNhatDichVuRequest;
import com.quanlydatsan.dto.request.CapNhatKhachHangRequest;
import com.quanlydatsan.dto.request.CapNhatTrangThaiSanRequest;
import com.quanlydatsan.dto.request.CheckOutRequest;
import com.quanlydatsan.dto.request.DuyetYeuCauHuyRequest;
import com.quanlydatsan.dto.request.HuyDatSanRequest;
import com.quanlydatsan.dto.request.SuaSanRequest;
import com.quanlydatsan.dto.request.TaoDichVuRequest;
import com.quanlydatsan.dto.request.TaoSanRequest;
import com.quanlydatsan.dto.request.ThemDichVuRequest;
import com.quanlydatsan.dto.response.DatSanResponse;
import com.quanlydatsan.dto.response.DiaDiemResponse;
import com.quanlydatsan.dto.response.DichVuResponse;
import com.quanlydatsan.dto.response.KhachHangResponse;
import com.quanlydatsan.dto.response.SanResponse;
import com.quanlydatsan.dto.response.ThongKeDoanhThuResponse;
import com.quanlydatsan.service.AdminService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;

    // ======================== 1. ĐƠN ĐẶT SÂN & NGHIỆP VỤ TẠI QUẦY (KỊCH BẢN 2) ========================

    @GetMapping("/bookings")
    public ResponseEntity<List<DatSanResponse>> danhSachDatSan(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String keyword) {
        return ResponseEntity.ok(adminService.danhSachDatSan(status, keyword));
    }

    @GetMapping("/bookings/{id}")
    public ResponseEntity<DatSanResponse> chiTietDatSan(@PathVariable Integer id) {
        return ResponseEntity.ok(adminService.chiTietDatSan(id));
    }

    @PutMapping("/bookings/{id}/confirm-cash")
    public ResponseEntity<DatSanResponse> xacNhanThanhToanTienMat(@PathVariable Integer id) {
        return ResponseEntity.ok(adminService.xacNhanThanhToanTienMat(id));
    }

    /**
     * Kịch bản 2 - Bước 3: Nhân viên xác nhận Check-in cho khách
     */
    @PutMapping("/bookings/{id}/check-in")
    public ResponseEntity<DatSanResponse> checkIn(
            @PathVariable Integer id,
            @AuthenticationPrincipal UserDetails userDetails) {
        String username = userDetails != null ? userDetails.getUsername() : null;
        return ResponseEntity.ok(adminService.checkIn(id, username));
    }

    /**
     * Kịch bản 2 - Bước 4: Gọi thêm dịch vụ (nước uống, thuê vợt) vào đơn
     */
    @PostMapping("/bookings/{id}/services")
    public ResponseEntity<DatSanResponse> themDichVu(
            @PathVariable Integer id,
            @Valid @RequestBody ThemDichVuRequest req) {
        return ResponseEntity.ok(adminService.themDichVu(id, req));
    }

    /**
     * Xóa dòng dịch vụ khỏi đơn (trả tồn kho)
     */
    @DeleteMapping("/bookings/{id}/services/{maCTDV}")
    public ResponseEntity<DatSanResponse> xoaDichVuKhoiDon(
            @PathVariable Integer id,
            @PathVariable Integer maCTDV) {
        return ResponseEntity.ok(adminService.xoaDichVuKhoiDon(id, maCTDV));
    }

    /**
     * Kịch bản 2 - Bước 5: Check-out, tính phụ phí quá giờ và lập Hóa đơn
     */
    @PostMapping("/bookings/{id}/checkout")
    public ResponseEntity<DatSanResponse> checkOut(
            @PathVariable Integer id,
            @RequestBody(required = false) CheckOutRequest req) {
        return ResponseEntity.ok(adminService.checkOut(id, req));
    }

    /**
     * Kịch bản 2 - Bước 6: Khách thanh toán phần phát sinh còn lại, nhân viên Hoàn thành đơn
     */
    @PostMapping("/bookings/{id}/complete")
    public ResponseEntity<DatSanResponse> hoanThanhDon(
            @PathVariable Integer id,
            @RequestParam(defaultValue = "TienMat") String phuongThuc) {
        return ResponseEntity.ok(adminService.hoanThanhDon(id, phuongThuc));
    }

    /**
     * Kịch bản 2 - Ngoại lệ 1: Khách không đến nhận sân (No-Show quá 30 phút)
     */
    @PutMapping("/bookings/{id}/no-show")
    public ResponseEntity<DatSanResponse> huyNoShow(@PathVariable Integer id) {
        return ResponseEntity.ok(adminService.huyNoShow(id));
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

    // ======================== 2. QUẢN LÝ DỊCH VỤ ========================

    @GetMapping("/services")
    public ResponseEntity<List<DichVuResponse>> danhSachDichVu(
            @RequestParam(required = false) Integer maDiaDiem) {
        return ResponseEntity.ok(adminService.danhSachDichVu(maDiaDiem));
    }

    @PostMapping("/services")
    public ResponseEntity<DichVuResponse> taoDichVu(@Valid @RequestBody TaoDichVuRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(adminService.taoDichVu(req));
    }

    @PutMapping("/services/{id}")
    public ResponseEntity<DichVuResponse> suaDichVu(
            @PathVariable Integer id,
            @Valid @RequestBody CapNhatDichVuRequest req) {
        return ResponseEntity.ok(adminService.suaDichVu(id, req));
    }

    @PutMapping("/services/{id}/toggle-status")
    public ResponseEntity<Void> doiTrangThaiDichVu(@PathVariable Integer id) {
        adminService.doiTrangThaiDichVu(id);
        return ResponseEntity.ok().build();
    }

    // ======================== 3. QUẢN LÝ SÂN ========================

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

    // ======================== 4. KHÁCH HÀNG ========================

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

    // ======================== 5. THỐNG KÊ ========================

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
