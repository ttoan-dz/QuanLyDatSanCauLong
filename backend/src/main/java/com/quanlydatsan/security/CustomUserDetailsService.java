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

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final TaiKhoanRepository taiKhoanRepository;

    @Override
    public UserDetails loadUserByUsername(String tenDangNhap) throws UsernameNotFoundException {
        TaiKhoan taiKhoan = taiKhoanRepository.findByTenDangNhap(tenDangNhap)
                .orElseThrow(() -> new UsernameNotFoundException(
                        "Không tìm thấy tài khoản: " + tenDangNhap));

        String authority = "Admin".equals(taiKhoan.getRole().getTenRole())
                ? "ROLE_ADMIN"
                : "ROLE_USER";

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

