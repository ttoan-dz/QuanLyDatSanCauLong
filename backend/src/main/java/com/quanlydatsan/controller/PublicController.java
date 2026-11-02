package com.quanlydatsan.controller;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.quanlydatsan.dto.response.DiaDiemResponse;
import com.quanlydatsan.dto.response.DichVuResponse;
import com.quanlydatsan.dto.response.SanResponse;
import com.quanlydatsan.entity.BangGia;
import com.quanlydatsan.entity.DichVu;
import com.quanlydatsan.repository.DichVuRepository;
import com.quanlydatsan.service.BookingService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/public")
@RequiredArgsConstructor
public class PublicController {

    private final BookingService bookingService;
    private final DichVuRepository dichVuRepository;

    @GetMapping("/gia-hien-hanh")
    public ResponseEntity<BangGia> layGiaHienHanh() {
        return ResponseEntity.ok(bookingService.layGiaHienHanh());
    }

    @GetMapping("/courts")
    public ResponseEntity<List<DiaDiemResponse>> layTatCaDiaDiemVaSan() {
        return ResponseEntity.ok(bookingService.layTatCaDiaDiemVaSan());
    }

    @GetMapping("/courts/{maDiaDiem}/available")
    public ResponseEntity<List<SanResponse>> timSanTrong(
            @PathVariable Integer maDiaDiem,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate ngay,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.TIME) LocalTime batDau,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.TIME) LocalTime ketThuc) {
        return ResponseEntity.ok(bookingService.timSanTrong(maDiaDiem, ngay, batDau, ketThuc));
    }

    @GetMapping("/courts/{maDiaDiem}/services")
    public ResponseEntity<List<DichVuResponse>> layDichVuTaiDiaDiem(@PathVariable Integer maDiaDiem) {
        List<DichVu> list = dichVuRepository.findByDiaDiem_MaDiaDiemAndTrangThai(maDiaDiem, "HoatDong");
        return ResponseEntity.ok(list.stream().map(dv -> {
            DichVuResponse res = new DichVuResponse();
            res.setMaDV(dv.getMaDV());
            res.setMaDiaDiem(dv.getDiaDiem().getMaDiaDiem());
            res.setTenDiaDiem(dv.getDiaDiem().getTenDiaDiem());
            res.setTenDV(dv.getTenDV());
            res.setLoaiDV(dv.getLoaiDV());
            res.setDonGia(dv.getDonGia());
            res.setSoLuongTon(dv.getSoLuongTon());
            res.setHinhAnh(dv.getHinhAnh());
            res.setTrangThai(dv.getTrangThai());
            return res;
        }).collect(Collectors.toList()));
    }
}
