package com.quanlydatsan;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.server.ResponseStatusException;

import com.quanlydatsan.dto.request.CapNhatAdminProfileRequest;
import com.quanlydatsan.dto.request.CapNhatTaiKhoanRequest;
import com.quanlydatsan.dto.request.TaoNhanVienRequest;
import com.quanlydatsan.dto.response.AdminProfileResponse;
import com.quanlydatsan.dto.response.TaiKhoanResponse;
import com.quanlydatsan.entity.DiaDiem;
import com.quanlydatsan.entity.KhachHang;
import com.quanlydatsan.entity.NhanVien;
import com.quanlydatsan.entity.Role;
import com.quanlydatsan.entity.TaiKhoan;
import com.quanlydatsan.repository.BangGiaRepository;
import com.quanlydatsan.repository.ChiTietDatSanRepository;
import com.quanlydatsan.repository.ChiTietDichVuRepository;
import com.quanlydatsan.repository.DatSanRepository;
import com.quanlydatsan.repository.DiaDiemRepository;
import com.quanlydatsan.repository.DichVuRepository;
import com.quanlydatsan.repository.HoaDonRepository;
import com.quanlydatsan.repository.HoanTienRepository;
import com.quanlydatsan.repository.KhachHangRepository;
import com.quanlydatsan.repository.NhanVienRepository;
import com.quanlydatsan.repository.NhatKyHoatDongRepository;
import com.quanlydatsan.repository.RoleRepository;
import com.quanlydatsan.repository.SanRepository;
import com.quanlydatsan.repository.TaiKhoanRepository;
import com.quanlydatsan.repository.ThanhToanRepository;
import com.quanlydatsan.repository.ThongBaoRepository;
import com.quanlydatsan.service.AdminService;
import com.quanlydatsan.service.BookingService;

@ExtendWith(MockitoExtension.class)
public class AdminServiceAccountTest {

    @Mock
    private DatSanRepository datSanRepository;
    @Mock
    private SanRepository sanRepository;
    @Mock
    private DiaDiemRepository diaDiemRepository;
    @Mock
    private KhachHangRepository khachHangRepository;
    @Mock
    private TaiKhoanRepository taiKhoanRepository;
    @Mock
    private ThanhToanRepository thanhToanRepository;
    @Mock
    private ThongBaoRepository thongBaoRepository;
    @Mock
    private ChiTietDatSanRepository chiTietDatSanRepository;
    @Mock
    private DichVuRepository dichVuRepository;
    @Mock
    private ChiTietDichVuRepository chiTietDichVuRepository;
    @Mock
    private HoaDonRepository hoaDonRepository;
    @Mock
    private HoanTienRepository hoanTienRepository;
    @Mock
    private NhanVienRepository nhanVienRepository;
    @Mock
    private BangGiaRepository bangGiaRepository;
    @Mock
    private RoleRepository roleRepository;
    @Mock
    private NhatKyHoatDongRepository nhatKyHoatDongRepository;
    @Mock
    private BookingService bookingService;
    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private AdminService adminService;

    private Role roleAdmin;
    private Role roleStaff;
    private Role roleCustomer;

    @BeforeEach
    void setUp() {
        roleAdmin = new Role();
        roleAdmin.setMaRole(1);
        roleAdmin.setTenRole("Admin");

        roleStaff = new Role();
        roleStaff.setMaRole(2);
        roleStaff.setTenRole("Staff");

        roleCustomer = new Role();
        roleCustomer.setMaRole(3);
        roleCustomer.setTenRole("Customer");
    }

    // ==========================================
    // 1. TẠO TÀI KHOẢN NHÂN VIÊN
    // ==========================================

    @Test
    @DisplayName("Tạo nhân viên thành công - mã hóa mật khẩu và lưu database")
    void testTaoNhanVien_Success() {
        TaoNhanVienRequest req = new TaoNhanVienRequest();
        req.setTenDangNhap("staff_moi");
        req.setMatKhau("123456");
        req.setHoTen("Nguyen Van Staff");
        req.setSdt("0912345678");
        req.setEmail("staff@example.com");
        req.setMaDiaDiem(1);

        DiaDiem dd = new DiaDiem();
        dd.setMaDiaDiem(1);
        dd.setTenDiaDiem("San Cau Long Quan 1");

        when(taiKhoanRepository.existsByTenDangNhap("staff_moi")).thenReturn(false);
        when(nhanVienRepository.existsBySdt("0912345678")).thenReturn(false);
        when(khachHangRepository.existsBySdt("0912345678")).thenReturn(false);
        when(nhanVienRepository.existsByEmail("staff@example.com")).thenReturn(false);
        when(khachHangRepository.existsByEmail("staff@example.com")).thenReturn(false);
        when(roleRepository.findByTenRole("Staff")).thenReturn(Optional.of(roleStaff));
        when(passwordEncoder.encode("123456")).thenReturn("hashed_password");
        when(diaDiemRepository.findById(1)).thenReturn(Optional.of(dd));

        TaiKhoanResponse res = adminService.taoNhanVien(req, "admin");

        assertNotNull(res);
        assertEquals("staff_moi", res.getTenDangNhap());
        assertEquals("STAFF", res.getRole());
        assertEquals("Nguyen Van Staff", res.getHoTen());
        assertEquals("0912345678", res.getSdt());
        assertEquals("staff@example.com", res.getEmail());
        assertEquals(1, res.getMaDiaDiemPhuTrach());
        assertEquals("San Cau Long Quan 1", res.getTenDiaDiemPhuTrach());

        verify(taiKhoanRepository).save(any(TaiKhoan.class));
        verify(nhanVienRepository).save(any(NhanVien.class));
        verify(nhatKyHoatDongRepository).save(any());
    }

    @Test
    @DisplayName("Tạo nhân viên thất bại khi tên đăng nhập đã tồn tại (400)")
    void testTaoNhanVien_DuplicateUsername_Throws400() {
        TaoNhanVienRequest req = new TaoNhanVienRequest();
        req.setTenDangNhap("admin");
        req.setMatKhau("123456");
        req.setHoTen("Admin Duplicate");
        req.setSdt("0988776655");

        when(taiKhoanRepository.existsByTenDangNhap("admin")).thenReturn(true);

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> {
            adminService.taoNhanVien(req, "admin");
        });
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatusCode());
    }

    @Test
    @DisplayName("Tạo nhân viên thất bại khi SĐT đã tồn tại ở khách hàng hoặc nhân viên khác (400)")
    void testTaoNhanVien_DuplicatePhone_Throws400() {
        TaoNhanVienRequest req = new TaoNhanVienRequest();
        req.setTenDangNhap("newstaff");
        req.setMatKhau("123456");
        req.setHoTen("New Staff");
        req.setSdt("0901234567");

        when(taiKhoanRepository.existsByTenDangNhap("newstaff")).thenReturn(false);
        when(nhanVienRepository.existsBySdt("0901234567")).thenReturn(false);
        when(khachHangRepository.existsBySdt("0901234567")).thenReturn(true);

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> {
            adminService.taoNhanVien(req, "admin");
        });
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatusCode());
    }

    // ==========================================
    // 2. CHỈNH SỬA TÀI KHOẢN VÀ RBAC
    // ==========================================

    @Test
    @DisplayName("Staff không có quyền sửa tài khoản Admin (403)")
    void testSuaTaiKhoan_StaffEditsAdmin_Forbidden403() {
        TaiKhoan adminTk = new TaiKhoan();
        adminTk.setMaTK(1);
        adminTk.setTenDangNhap("admin");
        adminTk.setRole(roleAdmin);

        when(taiKhoanRepository.findById(1)).thenReturn(Optional.of(adminTk));

        CapNhatTaiKhoanRequest req = new CapNhatTaiKhoanRequest();
        req.setHoTen("Hacked Admin");
        req.setSdt("0909090909");

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> {
            adminService.suaTaiKhoan(1, req, "staff1", "STAFF");
        });
        assertEquals(HttpStatus.FORBIDDEN, ex.getStatusCode());
    }

    @Test
    @DisplayName("Staff không có quyền sửa tài khoản Staff khác (403)")
    void testSuaTaiKhoan_StaffEditsOtherStaff_Forbidden403() {
        TaiKhoan otherStaffTk = new TaiKhoan();
        otherStaffTk.setMaTK(2);
        otherStaffTk.setTenDangNhap("staff2");
        otherStaffTk.setRole(roleStaff);

        when(taiKhoanRepository.findById(2)).thenReturn(Optional.of(otherStaffTk));

        CapNhatTaiKhoanRequest req = new CapNhatTaiKhoanRequest();
        req.setHoTen("Edited Staff");
        req.setSdt("0909090909");

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> {
            adminService.suaTaiKhoan(2, req, "staff1", "STAFF");
        });
        assertEquals(HttpStatus.FORBIDDEN, ex.getStatusCode());
    }

    @Test
    @DisplayName("Admin sửa tài khoản Staff khi NhanVien chưa tồn tại trong DB -> Tự động khởi tạo NhanVien")
    void testSuaTaiKhoan_MissingNhanVienRecord_AutoCreatesNhanVien() {
        TaiKhoan staffTk = new TaiKhoan();
        staffTk.setMaTK(5);
        staffTk.setTenDangNhap("staff5");
        staffTk.setRole(roleStaff);

        when(taiKhoanRepository.findById(5)).thenReturn(Optional.of(staffTk));
        when(nhanVienRepository.findByTaiKhoan_MaTK(5)).thenReturn(Optional.empty());
        when(nhanVienRepository.existsBySdt("0933333333")).thenReturn(false);
        when(khachHangRepository.existsBySdt("0933333333")).thenReturn(false);

        CapNhatTaiKhoanRequest req = new CapNhatTaiKhoanRequest();
        req.setHoTen("Staff Mới Bổ Sung");
        req.setSdt("0933333333");

        adminService.suaTaiKhoan(5, req, "admin", "ADMIN");

        verify(nhanVienRepository).save(any(NhanVien.class));
        verify(nhatKyHoatDongRepository).save(any());
    }

    // ==========================================
    // 3. KHÓA / MỞ KHÓA AN TOÀN
    // ==========================================

    @Test
    @DisplayName("Admin khóa tài khoản Staff thành công")
    void testDoiTrangThaiTaiKhoanAnToan_AdminLocksStaff_Success() {
        TaiKhoan staffTk = new TaiKhoan();
        staffTk.setMaTK(10);
        staffTk.setTenDangNhap("staff_active");
        staffTk.setRole(roleStaff);
        staffTk.setTrangThai("HoatDong");

        when(taiKhoanRepository.findById(10)).thenReturn(Optional.of(staffTk));

        adminService.doiTrangThaiTaiKhoanAnToan(10, "admin", "ADMIN", "Vi phạm nội quy");

        assertEquals("Khoa", staffTk.getTrangThai());
        verify(taiKhoanRepository).save(staffTk);
        verify(nhatKyHoatDongRepository).save(any());
    }

    @Test
    @DisplayName("Không được tự khóa chính mình (403)")
    void testDoiTrangThaiTaiKhoanAnToan_SelfLock_Forbidden403() {
        TaiKhoan adminTk = new TaiKhoan();
        adminTk.setMaTK(1);
        adminTk.setTenDangNhap("admin");
        adminTk.setRole(roleAdmin);
        adminTk.setTrangThai("HoatDong");

        when(taiKhoanRepository.findById(1)).thenReturn(Optional.of(adminTk));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> {
            adminService.doiTrangThaiTaiKhoanAnToan(1, "admin", "ADMIN", "Test self lock");
        });
        assertEquals(HttpStatus.FORBIDDEN, ex.getStatusCode());
    }

    @Test
    @DisplayName("Không được khóa tài khoản Admin (403)")
    void testDoiTrangThaiTaiKhoanAnToan_LockAdmin_Forbidden403() {
        TaiKhoan adminTk = new TaiKhoan();
        adminTk.setMaTK(99);
        adminTk.setTenDangNhap("superadmin");
        adminTk.setRole(roleAdmin);
        adminTk.setTrangThai("HoatDong");

        when(taiKhoanRepository.findById(99)).thenReturn(Optional.of(adminTk));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> {
            adminService.doiTrangThaiTaiKhoanAnToan(99, "other_admin", "ADMIN", "Lock admin");
        });
        assertEquals(HttpStatus.FORBIDDEN, ex.getStatusCode());
    }

    @Test
    @DisplayName("Staff không có quyền khóa Staff khác (403)")
    void testDoiTrangThaiTaiKhoanAnToan_StaffLocksStaff_Forbidden403() {
        TaiKhoan targetStaff = new TaiKhoan();
        targetStaff.setMaTK(12);
        targetStaff.setTenDangNhap("target_staff");
        targetStaff.setRole(roleStaff);
        targetStaff.setTrangThai("HoatDong");

        when(taiKhoanRepository.findById(12)).thenReturn(Optional.of(targetStaff));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> {
            adminService.doiTrangThaiTaiKhoanAnToan(12, "staff_actor", "STAFF", "Staff lock staff");
        });
        assertEquals(HttpStatus.FORBIDDEN, ex.getStatusCode());
    }

    // ==========================================
    // 4. HỒ SƠ ADMIN / STAFF
    // ==========================================

    @Test
    @DisplayName("Cập nhật hồ sơ Admin thành công và đồng bộ")
    void testCapNhatProfileAdmin_Success() {
        TaiKhoan adminTk = new TaiKhoan();
        adminTk.setMaTK(1);
        adminTk.setTenDangNhap("admin");
        adminTk.setRole(roleAdmin);
        adminTk.setTrangThai("HoatDong");

        NhanVien adminNv = new NhanVien();
        adminNv.setMaNV(1);
        adminNv.setHoTen("Admin Cu");
        adminNv.setSdt("0900000001");
        adminNv.setEmail("admin@old.com");
        adminNv.setTaiKhoan(adminTk);

        when(taiKhoanRepository.findByTenDangNhap("admin")).thenReturn(Optional.of(adminTk));
        when(nhanVienRepository.findByTaiKhoan_MaTK(1)).thenReturn(Optional.of(adminNv));
        when(nhanVienRepository.existsBySdtAndMaNVNot("0988888888", 1)).thenReturn(false);
        when(khachHangRepository.existsBySdt("0988888888")).thenReturn(false);
        when(nhanVienRepository.existsByEmailAndMaNVNot("admin@new.com", 1)).thenReturn(false);
        when(khachHangRepository.existsByEmail("admin@new.com")).thenReturn(false);

        CapNhatAdminProfileRequest req = new CapNhatAdminProfileRequest();
        req.setHoTen("Admin Quan Tri Vien");
        req.setSdt("0988888888");
        req.setEmail("admin@new.com");

        AdminProfileResponse res = adminService.capNhatProfileAdmin("admin", req);

        assertNotNull(res);
        assertEquals("Admin Quan Tri Vien", res.getHoTen());
        assertEquals("0988888888", res.getSdt());
        assertEquals("admin@new.com", res.getEmail());
        verify(nhanVienRepository).save(adminNv);
        verify(nhatKyHoatDongRepository).save(any());
    }

    @Test
    @DisplayName("Cập nhật hồ sơ thất bại khi SĐT trùng với người khác (400)")
    void testCapNhatProfileAdmin_PhoneCollision_Throws400() {
        TaiKhoan adminTk = new TaiKhoan();
        adminTk.setMaTK(1);
        adminTk.setTenDangNhap("admin");
        adminTk.setRole(roleAdmin);

        NhanVien adminNv = new NhanVien();
        adminNv.setMaNV(1);
        adminNv.setTaiKhoan(adminTk);

        when(taiKhoanRepository.findByTenDangNhap("admin")).thenReturn(Optional.of(adminTk));
        when(nhanVienRepository.findByTaiKhoan_MaTK(1)).thenReturn(Optional.of(adminNv));
        when(nhanVienRepository.existsBySdtAndMaNVNot("0999999999", 1)).thenReturn(true);

        CapNhatAdminProfileRequest req = new CapNhatAdminProfileRequest();
        req.setHoTen("Admin Duplicated Phone");
        req.setSdt("0999999999");

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> {
            adminService.capNhatProfileAdmin("admin", req);
        });
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatusCode());
    }
}

