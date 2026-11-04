package com.quanlydatsan.security;

import java.util.Collections;

import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import com.quanlydatsan.entity.TaiKhoan;
import com.quanlydatsan.repository.TaiKhoanRepository;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final TaiKhoanRepository taiKhoanRepository;

    public CustomUserDetailsService(TaiKhoanRepository taiKhoanRepository) {
        this.taiKhoanRepository = taiKhoanRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String tenDangNhapOrEmail) throws UsernameNotFoundException {
        TaiKhoan taiKhoan = taiKhoanRepository.findByTenDangNhapOrEmail(tenDangNhapOrEmail)
                .orElseThrow(() -> new UsernameNotFoundException(
                        "Không tìm thấy tài khoản: " + tenDangNhapOrEmail));

        String roleName = taiKhoan.getRole() != null ? taiKhoan.getRole().getTenRole() : "";
        String authority;
        if ("Admin".equalsIgnoreCase(roleName)) {
            authority = "ROLE_ADMIN";
        } else if ("Staff".equalsIgnoreCase(roleName) || "NhanVien".equalsIgnoreCase(roleName)) {
            authority = "ROLE_STAFF";
        } else {
            authority = "ROLE_USER";
        }

        boolean enabled = !"Khoa".equals(taiKhoan.getTrangThai());

        return new User(
                taiKhoan.getTenDangNhap(),
                taiKhoan.getMatKhau(),
                enabled,
                true,  // accountNonExpired
                true,  // credentialsNonExpired
                true,  // accountNonLocked
                Collections.singletonList(new SimpleGrantedAuthority(authority))
        );
    }
}

