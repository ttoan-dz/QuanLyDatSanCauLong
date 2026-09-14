package com.quanlydatsan.controller;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.quanlydatsan.dto.request.DangKyRequest;
import com.quanlydatsan.dto.request.DangNhapRequest;
import com.quanlydatsan.dto.response.DangNhapResponse;
import com.quanlydatsan.service.AuthService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<Map<String, String>> register(@Valid @RequestBody DangKyRequest req) {
        String message = authService.dangKy(req);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of("message", message));
    }

    @PostMapping("/login")
    public ResponseEntity<DangNhapResponse> login(@Valid @RequestBody DangNhapRequest req) {
        DangNhapResponse res = authService.dangNhap(req);
        return ResponseEntity.ok(res);
    }
}

