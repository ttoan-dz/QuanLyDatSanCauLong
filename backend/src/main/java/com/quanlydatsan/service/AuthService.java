package com.quanlydatsan.service;

import java.time.LocalDateTime;

import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.quanlydatsan.dto.request.DangKyRequest;
import com.quanlydatsan.dto.request.DangNhapRequest;
import com.quanlydatsan.dto.response.DangNhapResponse;
import com.quanlydatsan.entity.KhachHang;
import com.quanlydatsan.entity.NhanVien;
import com.quanlydatsan.entity.Role;
import com.quanlydatsan.entity.TaiKhoan;
import com.quanlydatsan.repository.KhachHangRepository;
import com.quanlydatsan.repository.NhanVienRepository;
import com.quanlydatsan.repository.RoleRepository;
import com.quanlydatsan.repository.TaiKhoanRepository;
import com.quanlydatsan.security.JwtTokenProvider;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final TaiKhoanRepository taiKhoanRepository;
    private final KhachHangRepository khachHangRepository;
    private final RoleRepository roleRepository;
    private final NhanVienRepository nhanVienRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;

    @Transactional
    public String dangKy(DangKyRequest req) {
        if (khachHangRepository.findBySdt(req.getSdt()).isPresent()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Số điện thoại đã được đăng ký");
        }
        if (req.getEmail() != null && !req.getEmail().trim().isEmpty() && khachHangRepository.existsByEmail(req.getEmail().trim())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Email đã được sử dụng bởi tài khoản khác");
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
        String identifier = req.getTenDangNhap() != null ? req.getTenDangNhap().trim() : "";

        TaiKhoan tk = taiKhoanRepository.findByTenDangNhapOrEmail(identifier)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED,
                        "Tên đăng nhập hoặc mật khẩu không chính xác"));

        if ("Khoa".equalsIgnoreCase(tk.getTrangThai())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ ban quản trị để được hỗ trợ!");
        }

        if (!passwordEncoder.matches(req.getMatKhau(), tk.getMatKhau())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,
                    "Tên đăng nhập hoặc mật khẩu không chính xác");
        }

        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            tk.getTenDangNhap(), req.getMatKhau()));
        } catch (org.springframework.security.authentication.DisabledException | org.springframework.security.authentication.LockedException e) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ ban quản trị để được hỗ trợ!");
        } catch (AuthenticationException e) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,
                    "Tên đăng nhập hoặc mật khẩu không chính xác");
        }

        String tenRole = tk.getRole() != null ? tk.getRole().getTenRole() : "";
        String roleMapped;
        if ("Admin".equalsIgnoreCase(tenRole)) {
            roleMapped = "ADMIN";
        } else if ("Staff".equalsIgnoreCase(tenRole) || "NhanVien".equalsIgnoreCase(tenRole)) {
            roleMapped = "STAFF";
        } else {
            roleMapped = "CUSTOMER";
        }

        Integer maKH = tk.getKhachHang() != null ? tk.getKhachHang().getMaKH() : null;
        String hoTen;
        if (tk.getKhachHang() != null) {
            hoTen = tk.getKhachHang().getHoTen();
        } else {
            hoTen = nhanVienRepository.findByTaiKhoan_MaTK(tk.getMaTK())
                    .map(NhanVien::getHoTen)
                    .orElse(tenRole);
        }

        String token = jwtTokenProvider.generateToken(tk.getTenDangNhap(), roleMapped, maKH);

        DangNhapResponse res = new DangNhapResponse();
        res.setToken(token);
        res.setRole(roleMapped);
        res.setHoTen(hoTen);
        res.setMaKH(maKH);
        return res;
    }
}
