package com.quanlydatsan.service;

import com.quanlydatsan.dto.request.CapNhatProfileRequest;
import com.quanlydatsan.dto.request.DoiMatKhauRequest;
import com.quanlydatsan.dto.response.ProfileResponse;
import com.quanlydatsan.entity.KhachHang;
import com.quanlydatsan.entity.TaiKhoan;
import com.quanlydatsan.repository.KhachHangRepository;
import com.quanlydatsan.repository.NhanVienRepository;
import com.quanlydatsan.repository.TaiKhoanRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class UserService {

    private final KhachHangRepository khachHangRepository;
    private final NhanVienRepository nhanVienRepository;
    private final TaiKhoanRepository taiKhoanRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public ProfileResponse layThongTinProfile(Integer maKH) {
        KhachHang kh = khachHangRepository.findById(maKH)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy thông tin khách hàng"));

        ProfileResponse res = new ProfileResponse();
        res.setHoTen(kh.getHoTen());
        res.setSdt(kh.getSdt());
        res.setEmail(kh.getEmail());
        return res;
    }

    @Transactional
    public ProfileResponse capNhatProfile(Integer maKH, CapNhatProfileRequest req) {
        KhachHang kh = khachHangRepository.findById(maKH)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy thông tin khách hàng"));

        String sdtMoi = req.getSdt().trim();
        if (khachHangRepository.existsBySdtAndMaKHNot(sdtMoi, maKH) || nhanVienRepository.existsBySdt(sdtMoi)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Số điện thoại đã được sử dụng bởi tài khoản khác");
        }

        if (req.getEmail() != null && !req.getEmail().trim().isEmpty()) {
            String emailMoi = req.getEmail().trim();
            if (khachHangRepository.existsByEmailAndMaKHNot(emailMoi, maKH) || nhanVienRepository.existsByEmail(emailMoi)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email đã được sử dụng bởi tài khoản khác");
            }
        }

        kh.setHoTen(req.getHoTen().trim());
        kh.setSdt(sdtMoi);
        kh.setEmail(req.getEmail() != null ? req.getEmail().trim() : null);
        khachHangRepository.save(kh);

        ProfileResponse res = new ProfileResponse();
        res.setHoTen(kh.getHoTen());
        res.setSdt(kh.getSdt());
        res.setEmail(kh.getEmail());
        return res;
    }

    @Transactional
    public void doiMatKhau(String tenDangNhap, DoiMatKhauRequest req) {
        TaiKhoan tk = taiKhoanRepository.findByTenDangNhap(tenDangNhap)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy tài khoản"));

        if (!passwordEncoder.matches(req.getMatKhauHienTai(), tk.getMatKhau())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mật khẩu hiện tại không chính xác");
        }

        if (req.getMatKhauMoi().trim().length() < 6) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mật khẩu mới phải có ít nhất 6 ký tự");
        }

        tk.setMatKhau(passwordEncoder.encode(req.getMatKhauMoi().trim()));
        taiKhoanRepository.save(tk);
    }
}
