package com.quanlydatsan.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.quanlydatsan.dto.request.CapNhatProfileRequest;
import com.quanlydatsan.dto.request.DatSanRequest;
import com.quanlydatsan.dto.request.DoiMatKhauRequest;
import com.quanlydatsan.dto.request.HuyDatSanRequest;
import com.quanlydatsan.dto.response.DatSanResponse;
import com.quanlydatsan.dto.response.ProfileResponse;
import com.quanlydatsan.dto.response.ThongBaoResponse;
import com.quanlydatsan.entity.TaiKhoan;
import com.quanlydatsan.repository.TaiKhoanRepository;
import com.quanlydatsan.service.BookingService;
import com.quanlydatsan.service.NotificationService;
import com.quanlydatsan.service.UserService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class UserBookingController {

    private final BookingService bookingService;
    private final NotificationService notificationService;
    private final UserService userService;
    private final TaiKhoanRepository taiKhoanRepository;

    @GetMapping("/profile")
    public ResponseEntity<ProfileResponse> layThongTinProfile(
            @AuthenticationPrincipal UserDetails userDetails) {
        Integer maKH = getMaKH(userDetails);
        return ResponseEntity.ok(userService.layThongTinProfile(maKH));
    }

    @PutMapping("/profile")
    public ResponseEntity<ProfileResponse> capNhatProfile(
            @Valid @RequestBody CapNhatProfileRequest req,
            @AuthenticationPrincipal UserDetails userDetails) {
        Integer maKH = getMaKH(userDetails);
        return ResponseEntity.ok(userService.capNhatProfile(maKH, req));
    }

    @PutMapping("/profile/password")
    public ResponseEntity<Void> doiMatKhau(
            @Valid @RequestBody DoiMatKhauRequest req,
            @AuthenticationPrincipal UserDetails userDetails) {
        userService.doiMatKhau(userDetails.getUsername(), req);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/booking")
    public ResponseEntity<DatSanResponse> datSan(
            @Valid @RequestBody DatSanRequest req,
            @AuthenticationPrincipal UserDetails userDetails) {
        Integer maKH = getMaKH(userDetails);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(bookingService.datSan(req, maKH));
    }

    @PostMapping("/booking/{id}/pay-qr")
    public ResponseEntity<DatSanResponse> thanhToanQR(
            @PathVariable Integer id,
            @AuthenticationPrincipal UserDetails userDetails) {
        Integer maKH = getMaKH(userDetails);
        return ResponseEntity.ok(bookingService.thanhToanQR(id, maKH));
    }

    @PutMapping("/booking/{id}/cancel")
    public ResponseEntity<DatSanResponse> huyDatSan(
            @PathVariable Integer id,
            @RequestBody(required = false) HuyDatSanRequest req,
            @AuthenticationPrincipal UserDetails userDetails) {
        Integer maKH = getMaKH(userDetails);
        return ResponseEntity.ok(bookingService.huyDatSan(id, maKH, req));
    }

    @GetMapping("/booking/history")
    public ResponseEntity<List<DatSanResponse>> xemLichSu(
            @AuthenticationPrincipal UserDetails userDetails) {
        Integer maKH = getMaKH(userDetails);
        return ResponseEntity.ok(bookingService.xemLichSu(maKH));
    }

    @GetMapping("/notifications")
    public ResponseEntity<List<ThongBaoResponse>> layThongBao(
            @AuthenticationPrincipal UserDetails userDetails) {
        Integer maKH = getMaKH(userDetails);
        return ResponseEntity.ok(notificationService.layThongBao(maKH));
    }

    @PutMapping("/notifications/{id}/read")
    public ResponseEntity<Void> danhDauDaDoc(@PathVariable Integer id) {
        notificationService.danhDauDaDoc(id);
        return ResponseEntity.ok().build();
    }

    // ======================== HELPER ========================

    private Integer getMaKH(UserDetails userDetails) {
        TaiKhoan tk = taiKhoanRepository.findByTenDangNhap(userDetails.getUsername())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED,
                        "Không tìm thấy tài khoản"));
        if (tk.getKhachHang() == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Tài khoản admin không có hồ sơ khách hàng");
        }
        return tk.getKhachHang().getMaKH();
    }
}

