package com.quanlydatsan;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.quanlydatsan.dto.request.DangNhapRequest;
import com.quanlydatsan.dto.response.DangNhapResponse;
import com.quanlydatsan.entity.KhachHang;
import com.quanlydatsan.entity.Role;
import com.quanlydatsan.entity.TaiKhoan;
import com.quanlydatsan.repository.KhachHangRepository;
import com.quanlydatsan.repository.NhanVienRepository;
import com.quanlydatsan.repository.RoleRepository;
import com.quanlydatsan.repository.TaiKhoanRepository;
import com.quanlydatsan.security.JwtTokenProvider;
import com.quanlydatsan.service.AuthService;

@ExtendWith(MockitoExtension.class)
public class AuthEmailLoginTest {

    @Mock
    private TaiKhoanRepository taiKhoanRepository;

    @Mock
    private KhachHangRepository khachHangRepository;

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private NhanVienRepository nhanVienRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private JwtTokenProvider jwtTokenProvider;

    @InjectMocks
    private AuthService authService;

    private TaiKhoan mockTaiKhoan;
    private KhachHang mockKhachHang;
    private Role mockRole;

    @BeforeEach
    void setUp() {
        mockRole = new Role();
        mockRole.setMaRole(1);
        mockRole.setTenRole("User");

        mockKhachHang = new KhachHang();
        mockKhachHang.setMaKH(10);
        mockKhachHang.setHoTen("Nguyen Van An");
        mockKhachHang.setEmail("an.nguyen@gmail.com");
        mockKhachHang.setSdt("0901111111");

        mockTaiKhoan = new TaiKhoan();
        mockTaiKhoan.setMaTK(1);
        mockTaiKhoan.setTenDangNhap("an.nguyen");
        mockTaiKhoan.setMatKhau("encoded_password");
        mockTaiKhoan.setRole(mockRole);
        mockTaiKhoan.setKhachHang(mockKhachHang);
        mockTaiKhoan.setTrangThai("HoatDong");

        when(passwordEncoder.matches(any(), any())).thenReturn(true);
    }

    @Test
    void testDangNhapByEmail_Success() {
        DangNhapRequest req = new DangNhapRequest();
        req.setTenDangNhap("an.nguyen@gmail.com");
        req.setMatKhau("123456");

        when(taiKhoanRepository.findByTenDangNhapOrEmail("an.nguyen@gmail.com"))
                .thenReturn(Optional.of(mockTaiKhoan));
        when(jwtTokenProvider.generateToken("an.nguyen", "CUSTOMER", 10))
                .thenReturn("mock_jwt_token_123");

        DangNhapResponse response = authService.dangNhap(req);

        assertNotNull(response);
        assertEquals("mock_jwt_token_123", response.getToken());
        assertEquals("CUSTOMER", response.getRole());
        assertEquals("Nguyen Van An", response.getHoTen());
        assertEquals(10, response.getMaKH());

        verify(passwordEncoder).matches("123456", "encoded_password");
    }

    @Test
    void testDangNhapByUsername_Success() {
        DangNhapRequest req = new DangNhapRequest();
        req.setTenDangNhap("an.nguyen");
        req.setMatKhau("123456");

        when(taiKhoanRepository.findByTenDangNhapOrEmail("an.nguyen"))
                .thenReturn(Optional.of(mockTaiKhoan));
        when(jwtTokenProvider.generateToken("an.nguyen", "CUSTOMER", 10))
                .thenReturn("mock_jwt_token_456");

        DangNhapResponse response = authService.dangNhap(req);

        assertNotNull(response);
        assertEquals("mock_jwt_token_456", response.getToken());
        assertEquals("CUSTOMER", response.getRole());
        assertEquals("Nguyen Van An", response.getHoTen());

        verify(passwordEncoder).matches("123456", "encoded_password");
    }
}

