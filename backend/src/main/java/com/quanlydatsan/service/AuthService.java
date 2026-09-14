package com.quanlydatsan.service;

import com.quanlydatsan.dto.request.DangKyRequest;
import com.quanlydatsan.dto.request.DangNhapRequest;
import com.quanlydatsan.dto.response.DangNhapResponse;
import com.quanlydatsan.entity.KhachHang;
import com.quanlydatsan.entity.Role;
import com.quanlydatsan.entity.TaiKhoan;
import com.quanlydatsan.repository.KhachHangRepository;
import com.quanlydatsan.repository.RoleRepository;
import com.quanlydatsan.repository.TaiKhoanRepository;
import com.quanlydatsan.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final TaiKhoanRepository taiKhoanRepository;
    private final KhachHangRepository khachHangRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;

    @Transactional
    public String dangKy(DangKyRequest req) {
        if (khachHangRepository.findBySdt(req.getSdt()).isPresent()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Số điện thoại đã được đăng ký");
        }
        if (taiKhoanRepository.existsByTenDangNhap(req.getTenDangNhap())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Tên đăng nhập đã tồn tại");
        }

        KhachHang kh = new KhachHang();
        kh.setHoTen(req.getHoTen());
        kh.setSdt(req.getSdt());
        kh.setEmail(req.getEmail());
        kh.setSoLanNoShow(0);
        kh.setNgayTao(LocalDateTime.now());
        khachHangRepository.save(kh);

        Role roleUser = roleRepository.findByTenRole("User")
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Không tìm thấy role User trong hệ thống"));

        TaiKhoan tk = new TaiKhoan();
        tk.setTenDangNhap(req.getTenDangNhap());
        tk.setMatKhau(passwordEncoder.encode(req.getMatKhau()));
        tk.setRole(roleUser);
        tk.setKhachHang(kh);
        tk.setTrangThai("HoatDong");
        tk.setNgayTao(LocalDateTime.now());
        taiKhoanRepository.save(tk);

        return "Đăng ký thành công";
    }

    public DangNhapResponse dangNhap(DangNhapRequest req) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            req.getTenDangNhap(), req.getMatKhau()));
        } catch (AuthenticationException e) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,
                    "Tên đăng nhập hoặc mật khẩu không đúng, hoặc tài khoản đã bị khóa");
        }

        TaiKhoan tk = taiKhoanRepository.findByTenDangNhap(req.getTenDangNhap())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED,
                        "Không tìm thấy tài khoản"));

        String tenRole = tk.getRole().getTenRole();
        String roleMapped = "Admin".equals(tenRole) ? "ADMIN" : "CUSTOMER";

        Integer maKH = tk.getKhachHang() != null ? tk.getKhachHang().getMaKH() : null;
        String hoTen = tk.getKhachHang() != null ? tk.getKhachHang().getHoTen() : tenRole;

        String token = jwtTokenProvider.generateToken(tk.getTenDangNhap(), roleMapped, maKH);

        DangNhapResponse res = new DangNhapResponse();
        res.setToken(token);
        res.setRole(roleMapped);
        res.setHoTen(hoTen);
        res.setMaKH(maKH);
        return res;
    }
}
