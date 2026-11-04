package com.quanlydatsan;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import com.quanlydatsan.dto.request.CapNhatTrangThaiSanRequest;
import com.quanlydatsan.dto.response.DatSanResponse;
import com.quanlydatsan.dto.response.DonXungDotBaoTriResponse;
import com.quanlydatsan.dto.response.SanResponse;
import com.quanlydatsan.dto.response.ThongKeDoanhThuResponse;
import com.quanlydatsan.entity.ChiTietDatSan;
import com.quanlydatsan.entity.DatSan;
import com.quanlydatsan.entity.DiaDiem;
import com.quanlydatsan.entity.HoaDon;
import com.quanlydatsan.entity.HoanTien;
import com.quanlydatsan.entity.KhachHang;
import com.quanlydatsan.entity.San;
import com.quanlydatsan.entity.ThongBao;
import com.quanlydatsan.repository.ChiTietDatSanRepository;
import com.quanlydatsan.repository.ChiTietDichVuRepository;
import com.quanlydatsan.repository.DatSanRepository;
import com.quanlydatsan.repository.DiaDiemRepository;
import com.quanlydatsan.repository.HoaDonRepository;
import com.quanlydatsan.repository.HoanTienRepository;
import com.quanlydatsan.repository.SanRepository;
import com.quanlydatsan.repository.ThongBaoRepository;
import com.quanlydatsan.service.AdminService;
import com.quanlydatsan.service.BookingService;

@ExtendWith(MockitoExtension.class)
public class AdminServiceMaintenanceTest {

    @Mock
    private DatSanRepository datSanRepository;

    @Mock
    private SanRepository sanRepository;

    @Mock
    private DiaDiemRepository diaDiemRepository;

    @Mock
    private ThongBaoRepository thongBaoRepository;

    @Mock
    private ChiTietDatSanRepository chiTietDatSanRepository;

    @Mock
    private ChiTietDichVuRepository chiTietDichVuRepository;

    @Mock
    private HoaDonRepository hoaDonRepository;

    @Mock
    private HoanTienRepository hoanTienRepository;

    @Mock
    private BookingService bookingService;

    @InjectMocks
    private AdminService adminService;

    private San mockSan;
    private DiaDiem mockDiaDiem;
    private DatSan mockDatSan;
    private KhachHang mockKhachHang;

    @BeforeEach
    void setUp() {
        mockDiaDiem = new DiaDiem();
        mockDiaDiem.setMaDiaDiem(1);
        mockDiaDiem.setTenDiaDiem("Nhà thi đấu Cầu Giấy");

        mockSan = new San();
        mockSan.setMaSan(1);
        mockSan.setTenSan("Sân 1");
        mockSan.setDiaDiem(mockDiaDiem);
        mockSan.setTinhTrang("HoatDong");

        mockKhachHang = new KhachHang();
        mockKhachHang.setMaKH(10);
        mockKhachHang.setHoTen("Nguyen Van An");
        mockKhachHang.setEmail("an.nguyen@gmail.com");

        mockDatSan = new DatSan();
        mockDatSan.setMaDatSan(100);
        mockDatSan.setSan(mockSan);
        mockDatSan.setKhachHang(mockKhachHang);
        mockDatSan.setNgayChoi(LocalDate.now().plusDays(1));
        mockDatSan.setGioBatDau(LocalTime.of(8, 0));
        mockDatSan.setGioKetThuc(LocalTime.of(9, 0));
        mockDatSan.setSoTien(100000);
        mockDatSan.setTienSan(BigDecimal.valueOf(100000));
        mockDatSan.setTrangThaiDat("DaXacNhan");
        mockDatSan.setTrangThaiThanhToan("DaThanhToan");
    }

    @Test
    @DisplayName("Kiểm tra danh sách đơn xung đột khi bảo trì")
    void testLayDanhSachDonXungDotKhiBaoTri() {
        when(sanRepository.findById(1)).thenReturn(Optional.of(mockSan));
        when(datSanRepository.findDonXungDotKhiBaoTri(eq(1), any(LocalDate.class)))
                .thenReturn(List.of(mockDatSan));

        DatSanResponse mockDsResp = new DatSanResponse();
        mockDsResp.setMaDatSan(100);
        when(bookingService.toDatSanResponse(mockDatSan)).thenReturn(mockDsResp);

        SanResponse sanTrong = new SanResponse();
        sanTrong.setMaSan(2);
        sanTrong.setTenSan("Sân 2");
        when(bookingService.timSanTrong(eq(1), any(LocalDate.class), any(LocalTime.class), any(LocalTime.class)))
                .thenReturn(List.of(sanTrong));

        List<DonXungDotBaoTriResponse> result = adminService.layDanhSachDonXungDotKhiBaoTri(1);

        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals(100, result.get(0).getDonDatSan().getMaDatSan());
        assertEquals(1, result.get(0).getDsSanKhaDung().size());
        assertEquals(2, result.get(0).getDsSanKhaDung().get(0).getMaSan());
    }

    @Test
    @DisplayName("Chặn chuyển trạng thái sân sang Bảo trì khi có đơn đặt trong tương lai")
    void testCapNhatTrangThaiSan_BlockWhenConflict() {
        when(sanRepository.findById(1)).thenReturn(Optional.of(mockSan));
        when(datSanRepository.findDonXungDotKhiBaoTri(eq(1), any(LocalDate.class)))
                .thenReturn(List.of(mockDatSan));

        CapNhatTrangThaiSanRequest req = new CapNhatTrangThaiSanRequest();
        req.setTinhTrang("BaoTri");

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> {
            adminService.capNhatTrangThaiSan(1, req);
        });

        assertEquals(HttpStatus.CONFLICT, ex.getStatusCode());
        verify(sanRepository, never()).save(any(San.class));
    }

    @Test
    @DisplayName("Cho phép chuyển trạng thái sân sang Bảo trì khi KHÔNG có đơn xung đột")
    void testCapNhatTrangThaiSan_SuccessWhenNoConflict() {
        when(sanRepository.findById(1)).thenReturn(Optional.of(mockSan));
        when(datSanRepository.findDonXungDotKhiBaoTri(eq(1), any(LocalDate.class)))
                .thenReturn(Collections.emptyList());

        CapNhatTrangThaiSanRequest req = new CapNhatTrangThaiSanRequest();
        req.setTinhTrang("BaoTri");

        SanResponse res = adminService.capNhatTrangThaiSan(1, req);

        assertNotNull(res);
        assertEquals("BaoTri", res.getTinhTrang());
        verify(sanRepository).save(mockSan);
    }

    @Test
    @DisplayName("Hủy đơn do sân bảo trì: Hoàn tiền 100%, trạng thái ChuaThanhToan và thông báo chuyên biệt")
    void testHuyDonDoBaoTriHoacTamNgung_CustomerBooking_FullRefund() {
        when(datSanRepository.findById(100)).thenReturn(Optional.of(mockDatSan));
        when(chiTietDatSanRepository.findFirstByDatSan_MaDatSan(100))
                .thenReturn(Optional.of(new ChiTietDatSan()));

        HoaDon hd = new HoaDon();
        hd.setDatSan(mockDatSan);
        hd.setTrangThai("DaThanhToan");
        when(hoaDonRepository.findByDatSan_MaDatSan(100)).thenReturn(Optional.of(hd));

        DatSanResponse mockResp = new DatSanResponse();
        mockResp.setMaDatSan(100);
        when(bookingService.toDatSanResponse(mockDatSan)).thenReturn(mockResp);

        DatSanResponse resp = adminService.huyDonDoBaoTriHoacTamNgung(100, "bảo trì kỹ thuật");

        assertNotNull(resp);
        assertEquals("DaHuy", mockDatSan.getTrangThaiDat());
        assertEquals("BaoTriHoacTamNgung", mockDatSan.getLyDoHuy());
        assertEquals("ChuaThanhToan", mockDatSan.getTrangThaiThanhToan());

        // Kiểm tra bản ghi hoàn tiền 100%
        ArgumentCaptor<HoanTien> htCaptor = ArgumentCaptor.forClass(HoanTien.class);
        verify(hoanTienRepository).save(htCaptor.capture());
        HoanTien savedHt = htCaptor.getValue();
        assertEquals(100, savedHt.getTyLeHoan());
        assertEquals(BigDecimal.valueOf(100000), savedHt.getSoTienHoan());
        assertEquals("DaHoan", savedHt.getTrangThai());

        // Kiểm tra thông báo: Chỉ gửi 1 thông báo chuyên biệt duy nhất (không trùng lặp)
        ArgumentCaptor<ThongBao> tbCaptor = ArgumentCaptor.forClass(ThongBao.class);
        verify(thongBaoRepository, times(1)).save(tbCaptor.capture());
        ThongBao tb = tbCaptor.getValue();
        assertEquals("Thông báo hủy đơn #100 do sân bảo trì kỹ thuật đột xuất - Hoàn tiền 100%", tb.getTieuDe());
    }

    @Test
    @DisplayName("Hủy đơn do sân bảo trì cho Khách vãng lai (khachHang == null): Không phát sinh lỗi NullPointer")
    void testHuyDonDoBaoTriHoacTamNgung_GuestBooking_NoException() {
        mockDatSan.setKhachHang(null); // Khách vãng lai đặt tại quầy

        when(datSanRepository.findById(100)).thenReturn(Optional.of(mockDatSan));
        when(chiTietDatSanRepository.findFirstByDatSan_MaDatSan(100))
                .thenReturn(Optional.empty());
        when(hoaDonRepository.findByDatSan_MaDatSan(100)).thenReturn(Optional.empty());

        DatSanResponse mockResp = new DatSanResponse();
        mockResp.setMaDatSan(100);
        when(bookingService.toDatSanResponse(mockDatSan)).thenReturn(mockResp);

        DatSanResponse resp = adminService.huyDonDoBaoTriHoacTamNgung(100, "tạm ngưng phục vụ");

        assertNotNull(resp);
        assertEquals("DaHuy", mockDatSan.getTrangThaiDat());
        assertEquals("ChuaThanhToan", mockDatSan.getTrangThaiThanhToan());

        // Không gửi thông báo khi không có tài khoản khách hàng
        verify(thongBaoRepository, never()).save(any(ThongBao.class));
    }

    @Test
    @DisplayName("Chuyển sân sang Bảo trì kèm hủy tất cả đơn: Hủy toàn bộ đơn xung đột và cập nhật trạng thái sân")
    void testChuyenTrangThaiKemHuyTatCa_Success() {
        when(sanRepository.findById(1)).thenReturn(Optional.of(mockSan));
        when(datSanRepository.findDonXungDotKhiBaoTri(eq(1), any(LocalDate.class)))
                .thenReturn(List.of(mockDatSan));

        when(datSanRepository.findById(100)).thenReturn(Optional.of(mockDatSan));
        when(chiTietDatSanRepository.findFirstByDatSan_MaDatSan(100))
                .thenReturn(Optional.empty());
        when(hoaDonRepository.findByDatSan_MaDatSan(100)).thenReturn(Optional.empty());

        SanResponse sanResp = new SanResponse();
        sanResp.setMaSan(1);
        sanResp.setTinhTrang("BaoTri");
        when(bookingService.toSanResponse(mockSan)).thenReturn(sanResp);

        SanResponse result = adminService.chuyenTrangThaiKemHuyTatCa(1, "BaoTri");

        assertNotNull(result);
        assertEquals("BaoTri", mockSan.getTinhTrang());
        assertEquals("DaHuy", mockDatSan.getTrangThaiDat());
        verify(sanRepository).save(mockSan);
    }

    @Test
    @DisplayName("Thống kê doanh thu theo tháng: Bao gồm đầy đủ doanh thu quá giờ và phí hủy giữ lại vào doanh thu sân và tổng doanh thu")
    void testThongKeDoanhThuTheoThang_IncludesOvertimeFee() {
        int nam = 2026;
        int thang = 11;

        when(datSanRepository.tinhDoanhThuTheoThang(nam, thang)).thenReturn(100000L);
        when(hoanTienRepository.tinhDoanhThuGiuLaiTuDonHuyTheoThang(nam, thang)).thenReturn(BigDecimal.valueOf(100000)); // Đơn hủy giữ lại 100k (hoàn 0%)
        when(datSanRepository.tinhTienQuaGioTheoThang(nam, thang)).thenReturn(BigDecimal.valueOf(25000));
        when(chiTietDichVuRepository.tinhDoanhThuDichVuTheoThang(nam, thang)).thenReturn(BigDecimal.valueOf(30000));
        when(datSanRepository.demSoDonTheoThang(nam, thang)).thenReturn(5L);

        ThongKeDoanhThuResponse res = adminService.thongKeDoanhThuTheoThang(nam, thang);

        assertNotNull(res);
        assertEquals(nam, res.getNam());
        assertEquals(thang, res.getThang());
        assertEquals(225000L, res.getDoanhThuSan()); // 100.000 (gốc) + 100.000 (phạt hủy giữ lại) + 25.000 (quá giờ)
        assertEquals(100000L, res.getDoanhThuPhatHuy()); // 100.000
        assertEquals(25000L, res.getDoanhThuQuaGio()); // 25.000
        assertEquals(30000L, res.getDoanhThuDichVu()); // 30.000
        assertEquals(255000L, res.getTongDoanhThu()); // 225.000 + 30.000
        assertEquals(5L, res.getSoDon());
    }

    @Test
    @DisplayName("Thống kê doanh thu theo năm: Bao gồm đầy đủ doanh thu quá giờ và phí hủy giữ lại")
    void testThongKeDoanhThuTheoNam_IncludesOvertimeFee() {
        int nam = 2026;

        when(datSanRepository.tinhDoanhThuTheoNam(nam)).thenReturn(1000000L);
        when(hoanTienRepository.tinhDoanhThuGiuLaiTuDonHuyTheoNam(nam)).thenReturn(BigDecimal.valueOf(50000));
        when(datSanRepository.tinhTienQuaGioTheoNam(nam)).thenReturn(BigDecimal.valueOf(150000));
        when(chiTietDichVuRepository.tinhDoanhThuDichVuTheoNam(nam)).thenReturn(BigDecimal.valueOf(200000));
        when(datSanRepository.demSoDonTheoNam(nam)).thenReturn(20L);

        ThongKeDoanhThuResponse res = adminService.thongKeDoanhThuTheoNam(nam);

        assertNotNull(res);
        assertEquals(nam, res.getNam());
        assertEquals(1200000L, res.getDoanhThuSan()); // 1.000.000 + 50.000 + 150.000
        assertEquals(50000L, res.getDoanhThuPhatHuy()); // 50.000
        assertEquals(150000L, res.getDoanhThuQuaGio()); // 150.000
        assertEquals(200000L, res.getDoanhThuDichVu()); // 200.000
        assertEquals(1400000L, res.getTongDoanhThu()); // 1.200.000 + 200.000
        assertEquals(20L, res.getSoDon());
    }

    @Test
    @DisplayName("Lọc danh sách đặt sân theo trạng thái ChoHuy khi không có keyword")
    void testDanhSachDatSan_FilterByStatusOnly() {
        DatSan ds = new DatSan();
        ds.setMaDatSan(2);
        ds.setTrangThaiDat("ChoHuy");

        when(datSanRepository.findByTrangThaiDatWithDetails("ChoHuy")).thenReturn(List.of(ds));
        when(bookingService.toDatSanResponse(ds)).thenReturn(new DatSanResponse());

        List<DatSanResponse> list = adminService.danhSachDatSan("ChoHuy", null);

        assertNotNull(list);
        assertEquals(1, list.size());
        verify(datSanRepository, times(1)).findByTrangThaiDatWithDetails("ChoHuy");
        verify(datSanRepository, never()).searchBookings(any(), any());
    }

    @Test
    @DisplayName("Lọc danh sách đặt sân khi có cả keyword và status")
    void testDanhSachDatSan_WithKeywordAndStatus() {
        DatSan ds = new DatSan();
        ds.setMaDatSan(2);

        when(datSanRepository.searchBookings("Nguyen Van An", "ChoHuy")).thenReturn(List.of(ds));
        when(bookingService.toDatSanResponse(ds)).thenReturn(new DatSanResponse());

        List<DatSanResponse> list = adminService.danhSachDatSan("ChoHuy", "Nguyen Van An");

        assertNotNull(list);
        assertEquals(1, list.size());
        verify(datSanRepository, times(1)).searchBookings("Nguyen Van An", "ChoHuy");
        verify(datSanRepository, never()).findByTrangThaiDatWithDetails(any());
    }
}

