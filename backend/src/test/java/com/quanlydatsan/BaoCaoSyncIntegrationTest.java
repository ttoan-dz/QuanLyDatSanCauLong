package com.quanlydatsan;

import static org.junit.jupiter.api.Assertions.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import com.quanlydatsan.dto.request.CheckOutRequest;
import com.quanlydatsan.dto.request.DatSanRequest;
import com.quanlydatsan.dto.request.HuyDatSanRequest;
import com.quanlydatsan.dto.request.ThemDichVuRequest;
import com.quanlydatsan.dto.response.DatSanResponse;
import com.quanlydatsan.entity.DiaDiem;
import com.quanlydatsan.entity.DichVu;
import com.quanlydatsan.entity.NhanVien;
import com.quanlydatsan.entity.San;
import com.quanlydatsan.repository.DiaDiemRepository;
import com.quanlydatsan.repository.DichVuRepository;
import com.quanlydatsan.repository.NhanVienRepository;
import com.quanlydatsan.repository.SanRepository;
import com.quanlydatsan.service.AdminService;
import com.quanlydatsan.service.BookingService;

@SpringBootTest
class BaoCaoSyncIntegrationTest {

    @Autowired
    private BookingService bookingService;

    @Autowired
    private AdminService adminService;

    @Autowired
    private DiaDiemRepository diaDiemRepository;

    @Autowired
    private SanRepository sanRepository;

    @Autowired
    private NhanVienRepository nhanVienRepository;

    @Autowired
    private DichVuRepository dichVuRepository;

    @Test
    @DisplayName("Kiểm tra thông tin các thực thể mới và thuộc tính bổ sung theo báo cáo")
    void testEntitiesAndSchema() {
        // Kiểm tra DiaDiem có DiaChi, SDT
        List<DiaDiem> dsDiaDiem = diaDiemRepository.findAll();
        assertFalse(dsDiaDiem.isEmpty(), "Danh sách cơ sở không được rỗng");
        DiaDiem dd = dsDiaDiem.get(0);
        assertNotNull(dd.getDiaChi(), "Địa chỉ cơ sở phải có giá trị");
        assertNotNull(dd.getSdt(), "SĐT cơ sở phải có giá trị");

        // Kiểm tra San có LoaiSan
        List<San> dsSan = sanRepository.findAll();
        assertFalse(dsSan.isEmpty(), "Danh sách sân không được rỗng");
        San s = dsSan.get(0);
        assertNotNull(s.getLoaiSan(), "Loại sân phải có giá trị");

        // Kiểm tra NhanVien
        List<NhanVien> dsNV = nhanVienRepository.findAll();
        assertFalse(dsNV.isEmpty(), "Danh sách nhân viên phải có ít nhất 1 nhân viên");

        // Kiểm tra DichVu
        List<DichVu> dsDV = dichVuRepository.findAll();
        assertFalse(dsDV.isEmpty(), "Danh sách dịch vụ mẫu phải có ít nhất 1 dịch vụ");
    }

    @Test
    @Transactional
    @DisplayName("Kịch bản 1: Khách đặt sân online, giữ chỗ 10 phút, thanh toán và hủy có hoàn tiền theo mốc")
    void testScenario1_OnlineBookingAndRefund() {
        // 1. Tạo đơn đặt sân ngày mai (cách > 24h)
        LocalDate ngayChoi = LocalDate.now().plusDays(2);
        LocalTime batDau = LocalTime.of(8, 0);
        LocalTime ketThuc = LocalTime.of(9, 30); // 1.5 tiếng

        DatSanRequest req = new DatSanRequest();
        req.setMaSan(1);
        req.setNgayChoi(ngayChoi);
        req.setGioBatDau(batDau);
        req.setGioKetThuc(ketThuc);
        req.setPhuongThucThanhToan("QR");

        DatSanResponse res = bookingService.datSan(req, 1);
        assertNotNull(res.getMaDatSan());
        assertEquals("ChoXacNhan", res.getTrangThaiDat());
        assertNotNull(res.getHanThanhToan(), "Hạn thanh toán 10 phút phải được khởi tạo");
        assertTrue(res.getHanThanhToan().isAfter(res.getNgayTao()), "Hạn thanh toán phải sau thời gian tạo đơn");

        // 2. Xác nhận thanh toán QR
        DatSanResponse paidRes = bookingService.thanhToanQR(res.getMaDatSan(), 1);
        assertEquals("DaXacNhan", paidRes.getTrangThaiDat());
        assertEquals("DaThanhToan", paidRes.getTrangThaiThanhToan());

        // 3. Khách hủy đơn trước > 24h -> hoàn tiền 100%
        HuyDatSanRequest huyReq = new HuyDatSanRequest();
        huyReq.setLyDoHuy("Bận việc đột xuất trước 2 ngày");

        DatSanResponse cancelRes = bookingService.huyDatSan(res.getMaDatSan(), 1, huyReq);
        assertEquals("DaHuy", cancelRes.getTrangThaiDat());
        assertNotNull(cancelRes.getThongTinHoanTien(), "Bản ghi hoàn tiền phải được tạo");
        assertEquals(100, cancelRes.getThongTinHoanTien().getTyLeHoan(), "Hủy trước >= 24h phải hoàn 100%");
        assertEquals(0, cancelRes.getThongTinHoanTien().getSoTienHoan().compareTo(BigDecimal.valueOf(paidRes.getSoTien())),
                "Số tiền hoàn phải bằng 100% tiền sân đã trả");
    }

    @Test
    @Transactional
    @DisplayName("Kịch bản 2: Khách đến sân Check-in, thêm dịch vụ, tính tiền quá giờ theo block 15p và xuất hóa đơn")
    void testScenario2_CounterServiceAndInvoice() {
        // 1. Tạo và xác nhận đơn đặt sân
        LocalDate ngayChoi = LocalDate.now();
        LocalTime batDau = LocalTime.of(14, 0);
        LocalTime ketThuc = LocalTime.of(15, 0);

        DatSanRequest req = new DatSanRequest();
        req.setMaSan(2);
        req.setNgayChoi(ngayChoi);
        req.setGioBatDau(batDau);
        req.setGioKetThuc(ketThuc);
        req.setPhuongThucThanhToan("QR");

        DatSanResponse res = bookingService.datSan(req, 1);
        bookingService.thanhToanQR(res.getMaDatSan(), 1);

        // 2. Nhân viên check-in đơn tại quầy
        DatSanResponse checkInRes = adminService.checkIn(res.getMaDatSan(), "admin");
        assertEquals("DangChoi", checkInRes.getTrangThaiDat(), "Sau khi check-in, trạng thái phải là DangChoi");
        assertNotNull(checkInRes.getGioCheckIn());

        // 3. Khách gọi thêm dịch vụ (nước uống / thuê vợt)
        ThemDichVuRequest themDV = new ThemDichVuRequest();
        themDV.setMaDV(1); // Nước tăng lực RedBull
        themDV.setSoLuong(2);
        themDV.setGhiChu("Phục vụ tại sân 2");

        adminService.themDichVu(res.getMaDatSan(), themDV);

        // 4. Check-out với chơi quá giờ (ví dụ quá 32 phút = 3 block 15 phút)
        CheckOutRequest checkOutReq = new CheckOutRequest();
        checkOutReq.setSoBlockQuaGio(3);
        checkOutReq.setPhuongThucThanhToan("TienMat");

        DatSanResponse checkOutRes = adminService.checkOut(res.getMaDatSan(), checkOutReq);

        assertEquals(3, checkOutRes.getSoBlockQuaGio(), "3 block 15 phút");
        assertTrue(checkOutRes.getTienQuaGio().compareTo(BigDecimal.ZERO) > 0, "Tiền quá giờ phải lớn hơn 0");
        assertNotNull(checkOutRes.getHoaDon(), "Hóa đơn phải được tạo khi check-out");
        assertTrue(checkOutRes.getHoaDon().getTongTienDV().compareTo(BigDecimal.ZERO) > 0, "Tiền dịch vụ phải lớn hơn 0");

        // 5. Nhân viên xác nhận hoàn thành đơn và thanh toán
        DatSanResponse completed = adminService.hoanThanhDon(res.getMaDatSan(), "TienMat");
        assertEquals("HoanThanh", completed.getTrangThaiDat(), "Đơn phải có trạng thái HoanThanh");
        assertEquals("DaThanhToan", completed.getTrangThaiThanhToan(), "Đơn đã thanh toán đầy đủ");
        assertNotNull(completed.getHoaDon());
        assertEquals("DaThanhToan", completed.getHoaDon().getTrangThai());
    }

    @Test
    @Transactional
    @DisplayName("Kịch bản 2 mở rộng: Khách quá giờ hẹn > 30 phút không đến (No-Show), ghi nhận DaHuy, KhongDen và không hoàn tiền")
    void testScenario2_NoShowHandling() {
        // 1. Tạo đơn đặt sân
        LocalDate ngayChoi = LocalDate.now();
        LocalTime batDau = LocalTime.of(16, 0);
        LocalTime ketThuc = LocalTime.of(17, 0);

        DatSanRequest req = new DatSanRequest();
        req.setMaSan(1);
        req.setNgayChoi(ngayChoi);
        req.setGioBatDau(batDau);
        req.setGioKetThuc(ketThuc);
        req.setPhuongThucThanhToan("QR");

        DatSanResponse res = bookingService.datSan(req, 1);
        bookingService.thanhToanQR(res.getMaDatSan(), 1);

        // 2. Nhân viên hủy No-Show
        DatSanResponse noShowRes = adminService.huyNoShow(res.getMaDatSan());
        assertEquals("DaHuy", noShowRes.getTrangThaiDat(), "Đơn No-Show chuyển trạng thái DaHuy");
        assertEquals("KhongDenNhan", noShowRes.getLyDoHuy());
        assertNotNull(noShowRes.getThongTinHoanTien(), "Bản ghi HoanTien được lưu vết");
        assertEquals(0, noShowRes.getThongTinHoanTien().getTyLeHoan(), "Khách No-Show không được hoàn tiền (0%) theo điều khoản báo cáo");
        assertEquals(0, noShowRes.getThongTinHoanTien().getSoTienHoan().compareTo(BigDecimal.ZERO));
    }
}
