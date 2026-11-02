package com.quanlydatsan.service;

import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Comparator;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.quanlydatsan.dto.request.CapNhatAnhSanRequest;
import com.quanlydatsan.dto.request.CapNhatDichVuRequest;
import com.quanlydatsan.dto.request.CapNhatKhachHangRequest;
import com.quanlydatsan.dto.request.CapNhatTrangThaiSanRequest;
import com.quanlydatsan.dto.request.CheckOutRequest;
import com.quanlydatsan.dto.request.DuyetYeuCauHuyRequest;
import com.quanlydatsan.dto.request.HuyDatSanRequest;
import com.quanlydatsan.dto.request.SuaSanRequest;
import com.quanlydatsan.dto.request.TaoDichVuRequest;
import com.quanlydatsan.dto.request.TaoSanRequest;
import com.quanlydatsan.dto.request.ThemDichVuRequest;
import com.quanlydatsan.dto.response.DatSanResponse;
import com.quanlydatsan.dto.response.DiaDiemResponse;
import com.quanlydatsan.dto.response.DichVuResponse;
import com.quanlydatsan.dto.response.KhachHangResponse;
import com.quanlydatsan.dto.response.SanResponse;
import com.quanlydatsan.dto.response.ThongKeDoanhThuResponse;
import com.quanlydatsan.entity.BangGia;
import com.quanlydatsan.entity.ChiTietDatSan;
import com.quanlydatsan.entity.ChiTietDichVu;
import com.quanlydatsan.entity.DatSan;
import com.quanlydatsan.entity.DiaDiem;
import com.quanlydatsan.entity.DichVu;
import com.quanlydatsan.entity.HoaDon;
import com.quanlydatsan.entity.HoanTien;
import com.quanlydatsan.entity.KhachHang;
import com.quanlydatsan.entity.NhanVien;
import com.quanlydatsan.entity.San;
import com.quanlydatsan.entity.TaiKhoan;
import com.quanlydatsan.entity.ThanhToan;
import com.quanlydatsan.entity.ThongBao;
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
import com.quanlydatsan.repository.SanRepository;
import com.quanlydatsan.repository.TaiKhoanRepository;
import com.quanlydatsan.repository.ThanhToanRepository;
import com.quanlydatsan.repository.ThongBaoRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final DatSanRepository datSanRepository;
    private final SanRepository sanRepository;
    private final DiaDiemRepository diaDiemRepository;
    private final KhachHangRepository khachHangRepository;
    private final TaiKhoanRepository taiKhoanRepository;
    private final ThanhToanRepository thanhToanRepository;
    private final ThongBaoRepository thongBaoRepository;
    private final ChiTietDatSanRepository chiTietDatSanRepository;
    private final DichVuRepository dichVuRepository;
    private final ChiTietDichVuRepository chiTietDichVuRepository;
    private final HoaDonRepository hoaDonRepository;
    private final HoanTienRepository hoanTienRepository;
    private final NhanVienRepository nhanVienRepository;
    private final BangGiaRepository bangGiaRepository;
    private final BookingService bookingService;

    // ======================== 1. ĐƠN ĐẶT SÂN & NGHIỆP VỤ TẠI QUẦY (KỊCH BẢN 2) ========================

    @Transactional(readOnly = true)
    public List<DatSanResponse> danhSachDatSan(String status, String keyword) {
        List<DatSan> list;
        if ((keyword != null && !keyword.trim().isEmpty()) || (status != null && !status.trim().isEmpty())) {
            list = datSanRepository.searchBookings(keyword != null ? keyword.trim() : null,
                    status != null && !status.trim().isEmpty() ? status.trim() : null);
        } else {
            list = datSanRepository.findAllWithDetails();
        }
        return list.stream()
                .map(bookingService::toDatSanResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public DatSanResponse chiTietDatSan(Integer maDatSan) {
        DatSan ds = datSanRepository.findById(maDatSan)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy đơn đặt sân #" + maDatSan));
        return bookingService.toDatSanResponse(ds);
    }

    @Transactional
    public DatSanResponse xacNhanThanhToanTienMat(Integer maDatSan) {
        DatSan ds = datSanRepository.findById(maDatSan)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Không tìm thấy đơn đặt sân"));

        if (!"TienMat".equals(ds.getPhuongThucThanhToan())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Đơn này không phải thanh toán tiền mặt");
        }
        if (!"ChoXacNhan".equals(ds.getTrangThaiDat())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Đơn không ở trạng thái chờ xác nhận");
        }

        ds.setTrangThaiDat("DaXacNhan");
        ds.setTrangThaiThanhToan("DaThanhToan");
        ds.setTienTraTruoc(ds.getTienSan().compareTo(BigDecimal.ZERO) > 0 ? ds.getTienSan() : BigDecimal.valueOf(ds.getSoTien()));
        datSanRepository.save(ds);

        chiTietDatSanRepository.findFirstByDatSan_MaDatSan(maDatSan).ifPresent(ct -> {
            ct.setTrangThai("DaXacNhan");
            chiTietDatSanRepository.save(ct);
        });

        ThanhToan tt = new ThanhToan();
        tt.setDatSan(ds);
        tt.setSoTien(ds.getSoTien());
        tt.setPhuongThuc("TienMat");
        tt.setLoaiThanhToan("TraTruoc");
        tt.setMaGiaoDich("CASH_" + System.currentTimeMillis() + "_" + maDatSan);
        tt.setTrangThai("ThanhCongDemo");
        tt.setThoiGianThanhToan(LocalDateTime.now());
        thanhToanRepository.save(tt);

        taoThongBao(ds.getKhachHang(),
                "Xác nhận thanh toán tiền mặt",
                "Nhân viên đã xác nhận thu tiền mặt cho đơn #" + maDatSan + ". Sân của bạn đã sẵn sàng.",
                "XacNhan");

        return bookingService.toDatSanResponse(ds);
    }

    /**
     * Kịch bản 2 - Bước 3: Nhân viên check-in cho khách
     */
    @Transactional
    public DatSanResponse checkIn(Integer maDatSan, String username) {
        DatSan ds = datSanRepository.findById(maDatSan)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy đơn đặt sân"));

        if (!"DaXacNhan".equals(ds.getTrangThaiDat()) && !"ChoXacNhan".equals(ds.getTrangThaiDat())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Chỉ có thể check-in cho đơn ở trạng thái Đã xác nhận (hoặc Chờ xác nhận)");
        }

        // Nếu đơn tiền mặt chưa thanh toán thì tự động ghi nhận thanh toán trả trước
        if ("ChoXacNhan".equals(ds.getTrangThaiDat())) {
            ds.setTrangThaiThanhToan("DaThanhToan");
            ds.setTienTraTruoc(ds.getTienSan().compareTo(BigDecimal.ZERO) > 0 ? ds.getTienSan() : BigDecimal.valueOf(ds.getSoTien()));
        }

        LocalDateTime now = LocalDateTime.now();
        ds.setTrangThaiDat("DangChoi");
        ds.setGioCheckIn(now);

        // Gắn nhân viên check-in nếu có
        if (username != null) {
            taiKhoanRepository.findByTenDangNhap(username).ifPresent(tk -> {
                nhanVienRepository.findByTaiKhoan_MaTK(tk.getMaTK()).ifPresent(ds::setNhanVien);
            });
        }
        datSanRepository.save(ds);

        // Cập nhật ChiTietDatSan
        chiTietDatSanRepository.findFirstByDatSan_MaDatSan(maDatSan).ifPresent(ct -> {
            ct.setTrangThai("DangChoi");
            ct.setGioCheckIn(now);
            if (ds.getNhanVien() != null) {
                ct.setNhanVien(ds.getNhanVien());
            }
            chiTietDatSanRepository.save(ct);
        });

        taoThongBao(ds.getKhachHang(),
                "Check-in thành công",
                "Bạn đã check-in vào " + (ds.getSan() != null ? ds.getSan().getTenSan() : "sân") + ". Chúc bạn có buổi chơi vui vẻ!",
                "XacNhan");

        return bookingService.toDatSanResponse(ds);
    }

    /**
     * Kịch bản 2 - Bước 4: Thêm dịch vụ (nước uống, thuê vợt) vào đơn của khách
     */
    @Transactional
    public DatSanResponse themDichVu(Integer maDatSan, ThemDichVuRequest req) {
        DatSan ds = datSanRepository.findById(maDatSan)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy đơn đặt sân"));

        if (!"DangChoi".equals(ds.getTrangThaiDat()) && !"DaXacNhan".equals(ds.getTrangThaiDat())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Chỉ có thể thêm dịch vụ cho đơn đang chơi hoặc đã xác nhận");
        }

        DichVu dv = dichVuRepository.findById(req.getMaDV())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy dịch vụ"));

        if (!"HoatDong".equals(dv.getTrangThai())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Dịch vụ hiện đang tạm ngưng phục vụ");
        }

        if (dv.getSoLuongTon() < req.getSoLuong()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Số lượng tồn kho không đủ (chỉ còn " + dv.getSoLuongTon() + " " + dv.getTenDV() + ")");
        }

        // Trừ tồn kho
        dv.setSoLuongTon(dv.getSoLuongTon() - req.getSoLuong());
        dichVuRepository.save(dv);

        // Thêm chi tiết dịch vụ
        ChiTietDichVu ctdv = new ChiTietDichVu();
        ctdv.setDatSan(ds);
        ctdv.setDichVu(dv);
        ctdv.setSoLuong(req.getSoLuong());
        ctdv.setDonGia(dv.getDonGia());
        ctdv.setGhiChu(req.getGhiChu());
        ctdv.setThoiGian(LocalDateTime.now());
        chiTietDichVuRepository.save(ctdv);

        return bookingService.toDatSanResponse(ds);
    }

    /**
     * Xóa dòng dịch vụ đã gọi (hoàn lại tồn kho)
     */
    @Transactional
    public DatSanResponse xoaDichVuKhoiDon(Integer maDatSan, Integer maCTDV) {
        DatSan ds = datSanRepository.findById(maDatSan)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy đơn đặt sân"));

        ChiTietDichVu ctdv = chiTietDichVuRepository.findById(maCTDV)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy chi tiết dịch vụ"));

        if (!ctdv.getDatSan().getMaDatSan().equals(maDatSan)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Dịch vụ không thuộc đơn này");
        }

        // Hoàn tồn kho
        DichVu dv = ctdv.getDichVu();
        dv.setSoLuongTon(dv.getSoLuongTon() + ctdv.getSoLuong());
        dichVuRepository.save(dv);

        chiTietDichVuRepository.delete(ctdv);

        return bookingService.toDatSanResponse(ds);
    }

    /**
     * Kịch bản 2 - Bước 5: Check-out và Lập Hóa Đơn
     */
    @Transactional
    public DatSanResponse checkOut(Integer maDatSan, CheckOutRequest req) {
        DatSan ds = datSanRepository.findById(maDatSan)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy đơn đặt sân"));

        LocalDateTime now = LocalDateTime.now();
        ds.setGioCheckOut(now);

        // Xử lý chơi quá giờ (Overtime theo block 15 phút)
        int blocks = (req != null && req.getSoBlockQuaGio() != null) ? Math.max(0, req.getSoBlockQuaGio()) : 0;
        BigDecimal tienQuaGio = BigDecimal.ZERO;
        if (blocks > 0) {
            BangGia bg = bangGiaRepository.findFirstByDangApDungTrueOrderByMaBangGiaDesc()
                    .orElse(null);
            int giaMoi30p = bg != null ? bg.getGiaMoi30Phut() : 50000;
            int giaMoiGio = giaMoi30p * 2;
            int giaMoiBlock15p = giaMoiGio / 4;
            tienQuaGio = BigDecimal.valueOf((long) blocks * giaMoiBlock15p);
        }
        ds.setSoBlockQuaGio(blocks);
        ds.setTienQuaGio(tienQuaGio);

        // Tính tổng tiền dịch vụ
        List<ChiTietDichVu> dsDV = chiTietDichVuRepository.findByDatSan_MaDatSan(maDatSan);
        BigDecimal tongTienDV = dsDV.stream()
                .map(dv -> dv.getDonGia().multiply(BigDecimal.valueOf(dv.getSoLuong())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal tongTienSan = ds.getTienSan().compareTo(BigDecimal.ZERO) > 0 ? ds.getTienSan() : BigDecimal.valueOf(ds.getSoTien());
        BigDecimal tienTraTruoc = ds.getTienTraTruoc();
        BigDecimal tienHoanDuyet = BigDecimal.ZERO;

        // Công thức Báo cáo (Lớp HoaDon): ThanhTien = TongTienSan + TongTienDV + TienQuaGio - TienTraTruoc + TienHoanDuyet
        BigDecimal thanhTien = tongTienSan.add(tongTienDV).add(tienQuaGio).subtract(tienTraTruoc).add(tienHoanDuyet);
        if (thanhTien.compareTo(BigDecimal.ZERO) < 0) {
            thanhTien = BigDecimal.ZERO;
        }

        // Tạo hoặc cập nhật HoaDon
        HoaDon hd = hoaDonRepository.findByDatSan_MaDatSan(maDatSan).orElse(new HoaDon());
        hd.setDatSan(ds);
        hd.setNgayLap(now);
        hd.setTongTienSan(tongTienSan);
        hd.setTongTienDV(tongTienDV);
        hd.setTienQuaGio(tienQuaGio);
        hd.setTienTraTruoc(tienTraTruoc);
        hd.setTienHoanDuyet(tienHoanDuyet);
        hd.setThanhTien(thanhTien);
        hd.setTrangThai(thanhTien.compareTo(BigDecimal.ZERO) == 0 ? "DaThanhToan" : "ChuaThanhToan");
        hoaDonRepository.save(hd);

        datSanRepository.save(ds);

        // Cập nhật ChiTietDatSan
        final BigDecimal finalTienQuaGio = tienQuaGio;
        chiTietDatSanRepository.findFirstByDatSan_MaDatSan(maDatSan).ifPresent(ct -> {
            ct.setGioCheckOut(now);
            ct.setSoBlockQuaGio(blocks);
            ct.setTienQuaGio(finalTienQuaGio);
            chiTietDatSanRepository.save(ct);
        });

        return bookingService.toDatSanResponse(ds);
    }

    /**
     * Kịch bản 2 - Bước 6: Hoàn thành đơn (Khách thanh toán khoản phát sinh và nhân viên bấm Hoàn thành)
     */
    @Transactional
    public DatSanResponse hoanThanhDon(Integer maDatSan, String phuongThucThanhToan) {
        DatSan ds = datSanRepository.findById(maDatSan)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy đơn đặt sân"));

        HoaDon hd = hoaDonRepository.findByDatSan_MaDatSan(maDatSan)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Chưa lập hóa đơn check-out cho đơn này"));

        String pttt = (phuongThucThanhToan != null && !phuongThucThanhToan.trim().isEmpty())
                ? phuongThucThanhToan.trim() : "TienMat";

        // Ghi nhận thanh toán phát sinh nếu có số tiền cần thanh toán
        if (hd.getThanhTien().compareTo(BigDecimal.ZERO) > 0) {
            ThanhToan tt = new ThanhToan();
            tt.setDatSan(ds);
            tt.setHoaDon(hd);
            tt.setSoTien(hd.getThanhTien().intValue());
            tt.setPhuongThuc(pttt);
            tt.setLoaiThanhToan("PhatSinh");
            tt.setMaGiaoDich("EXT_" + System.currentTimeMillis() + "_" + maDatSan);
            tt.setTrangThai("ThanhCongDemo");
            tt.setThoiGianThanhToan(LocalDateTime.now());
            thanhToanRepository.save(tt);
        }

        hd.setTrangThai("DaThanhToan");
        hoaDonRepository.save(hd);

        ds.setTrangThaiDat("HoanThanh");
        ds.setTrangThaiThanhToan("DaThanhToan");
        datSanRepository.save(ds);

        chiTietDatSanRepository.findFirstByDatSan_MaDatSan(maDatSan).ifPresent(ct -> {
            ct.setTrangThai("HoanThanh");
            chiTietDatSanRepository.save(ct);
        });

        taoThongBao(ds.getKhachHang(),
                "Hóa đơn hoàn tất",
                "Đơn đặt sân #" + maDatSan + " đã hoàn thành. Cảm ơn quý khách và hẹn gặp lại!",
                "XacNhan");

        return bookingService.toDatSanResponse(ds);
    }

    /**
     * Kịch bản 2 - Ngoại lệ 1: Khách không đến nhận sân (No-Show quá 30 phút)
     */
    @Transactional
    public DatSanResponse huyNoShow(Integer maDatSan) {
        DatSan ds = datSanRepository.findById(maDatSan)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Không tìm thấy đơn đặt sân"));

        LocalDateTime now = LocalDateTime.now();
        ds.setTrangThaiDat("DaHuy");
        ds.setLyDoHuy("KhongDenNhan");
        datSanRepository.save(ds);

        // Chi tiết trạng thái: KhongDen
        chiTietDatSanRepository.findFirstByDatSan_MaDatSan(maDatSan).ifPresent(ct -> {
            ct.setTrangThai("KhongDen");
            chiTietDatSanRepository.save(ct);
        });

        // Ghi nhận HoanTien với tỷ lệ 0% (không hoàn lại tiền sân theo báo cáo)
        HoanTien ht = new HoanTien();
        ht.setDatSan(ds);
        ht.setNgayYeuCau(now);
        ht.setLyDo("Quá giờ đặt 30 phút mà khách không xuất hiện (No-Show)");
        ht.setLoaiHuy("KhongDen");
        ht.setTyLeHoan(0);
        ht.setSoTienHoan(BigDecimal.ZERO);
        ht.setTrangThai("KhongHoan");
        hoanTienRepository.save(ht);

        // Tăng số lần No-Show của khách
        KhachHang kh = ds.getKhachHang();
        kh.setSoLanNoShow(kh.getSoLanNoShow() + 1);
        khachHangRepository.save(kh);

        taoThongBao(kh, "Hủy đơn - Khách không đến",
                "Đơn đặt sân #" + maDatSan + " đã bị hủy do bạn không đến nhận sân theo quy định. Tiền sân không được hoàn lại.",
                "Huy");

        return bookingService.toDatSanResponse(ds);
    }

    @Transactional
    public DatSanResponse huyDatSan(Integer maDatSan, HuyDatSanRequest req) {
        DatSan ds = datSanRepository.findById(maDatSan)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Không tìm thấy đơn đặt sân"));

        String trangThai = ds.getTrangThaiDat();
        if ("DaHuy".equals(trangThai) || "HetHan".equals(trangThai)
                || "HoanThanh".equals(trangThai)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Không thể hủy đơn ở trạng thái " + trangThai);
        }

        String lyDoHuy = req != null && req.getLyDoHuy() != null
                ? req.getLyDoHuy() : "AdminHuy";

        if ("KhongDenNhan".equals(lyDoHuy)) {
            return huyNoShow(maDatSan);
        }

        LocalDateTime now = LocalDateTime.now();
        ds.setTrangThaiDat("DaHuy");
        ds.setLyDoHuy(lyDoHuy);
        if (req != null && req.getGhiChu() != null && !req.getGhiChu().trim().isEmpty()) {
            ds.setGhiChu(req.getGhiChu().trim());
        }
        datSanRepository.save(ds);

        chiTietDatSanRepository.findFirstByDatSan_MaDatSan(maDatSan).ifPresent(ct -> {
            ct.setTrangThai("DaHuy");
            chiTietDatSanRepository.save(ct);
        });

        // Nếu cơ sở / admin chủ động hủy: Hoàn 100% theo báo cáo (Ràng buộc 7: "Cơ sở hủy trước sử dụng hoàn 100%")
        BigDecimal tienGoc = ds.getTienSan().compareTo(BigDecimal.ZERO) > 0 ? ds.getTienSan() : BigDecimal.valueOf(ds.getSoTien());
        HoanTien ht = new HoanTien();
        ht.setDatSan(ds);
        ht.setNgayYeuCau(now);
        ht.setLyDo(req != null && req.getGhiChu() != null && !req.getGhiChu().trim().isEmpty() 
                ? req.getGhiChu().trim() : "Cơ sở hủy đơn");
        ht.setLoaiHuy("CoSoHuy");
        ht.setTyLeHoan(100);
        ht.setSoTienHoan(tienGoc);
        ht.setTrangThai("DaHoan");
        hoanTienRepository.save(ht);

        String noiDung = (req != null && req.getGhiChu() != null && !req.getGhiChu().trim().isEmpty())
                ? "Đơn đặt sân đã bị cơ sở hủy. Lý do: " + req.getGhiChu().trim() + ". Số tiền hoàn lại 100%."
                : "Đơn đặt sân đã bị cơ sở hủy. Bạn được hoàn lại 100% tiền sân.";
        taoThongBao(ds.getKhachHang(), "Đơn đã bị hủy", noiDung, "Huy");

        return bookingService.toDatSanResponse(ds);
    }

    @Transactional
    public DatSanResponse duyetYeuCauHuy(Integer maDatSan, DuyetYeuCauHuyRequest req) {
        DatSan ds = datSanRepository.findById(maDatSan)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Không tìm thấy đơn đặt sân"));

        if (!"ChoHuy".equals(ds.getTrangThaiDat())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Đơn không ở trạng thái chờ hủy");
        }

        LocalDateTime now = LocalDateTime.now();
        if (Boolean.TRUE.equals(req.getDongY())) {
            ds.setTrangThaiDat("DaHuy");
            ds.setLyDoHuy("NguoiDungHuy");
            datSanRepository.save(ds);

            chiTietDatSanRepository.findFirstByDatSan_MaDatSan(maDatSan).ifPresent(ct -> {
                ct.setTrangThai("DaHuy");
                chiTietDatSanRepository.save(ct);
            });

            // Tính tỷ lệ hoàn tiền theo thời điểm
            LocalDateTime gioBatDau = LocalDateTime.of(ds.getNgayChoi(), ds.getGioBatDau());
            long hoursBefore = Duration.between(now, gioBatDau).toHours();
            int tyLeHoan = hoursBefore >= 24 ? 100 : (hoursBefore >= 12 ? 50 : 0);
            BigDecimal tienGoc = ds.getTienSan().compareTo(BigDecimal.ZERO) > 0 ? ds.getTienSan() : BigDecimal.valueOf(ds.getSoTien());
            BigDecimal soTienHoan = tienGoc.multiply(BigDecimal.valueOf(tyLeHoan)).divide(BigDecimal.valueOf(100));

            HoanTien ht = new HoanTien();
            ht.setDatSan(ds);
            ht.setNgayYeuCau(now);
            ht.setLyDo("Khách yêu cầu hủy và được duyệt");
            ht.setLoaiHuy("KhachHuy");
            ht.setTyLeHoan(tyLeHoan);
            ht.setSoTienHoan(soTienHoan);
            ht.setTrangThai(tyLeHoan > 0 ? "DaHoan" : "KhongHoan");
            hoanTienRepository.save(ht);

            taoThongBao(ds.getKhachHang(),
                    "Yêu cầu hủy được chấp nhận",
                    String.format("Yêu cầu hủy đơn #%d đã được duyệt. Tỷ lệ hoàn: %d%%. Số tiền hoàn: %,.0f VNĐ.",
                            maDatSan, tyLeHoan, soTienHoan),
                    "DuyetHuy");
        } else {
            ds.setTrangThaiDat("DaXacNhan");
            datSanRepository.save(ds);

            chiTietDatSanRepository.findFirstByDatSan_MaDatSan(maDatSan).ifPresent(ct -> {
                ct.setTrangThai("DaXacNhan");
                chiTietDatSanRepository.save(ct);
            });

            taoThongBao(ds.getKhachHang(),
                    "Yêu cầu hủy bị từ chối",
                    "Yêu cầu hủy sân của bạn đã bị từ chối. Lịch đặt vẫn giữ nguyên.",
                    "DuyetHuy");
        }

        return bookingService.toDatSanResponse(ds);
    }

    // ======================== 2. QUẢN LÝ DỊCH VỤ ========================

    @Transactional(readOnly = true)
    public List<DichVuResponse> danhSachDichVu(Integer maDiaDiem) {
        List<DichVu> list = maDiaDiem != null
                ? dichVuRepository.findByDiaDiem_MaDiaDiem(maDiaDiem)
                : dichVuRepository.findAll();

        return list.stream().map(this::toDichVuResponse).collect(Collectors.toList());
    }

    @Transactional
    public DichVuResponse taoDichVu(TaoDichVuRequest req) {
        DiaDiem dd = diaDiemRepository.findById(req.getMaDiaDiem())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy địa điểm"));

        DichVu dv = new DichVu();
        dv.setDiaDiem(dd);
        dv.setTenDV(req.getTenDV());
        dv.setLoaiDV(req.getLoaiDV());
        dv.setDonGia(req.getDonGia());
        dv.setSoLuongTon(req.getSoLuongTon());
        dv.setHinhAnh(req.getHinhAnh());
        dv.setTrangThai("HoatDong");
        dichVuRepository.save(dv);

        return toDichVuResponse(dv);
    }

    @Transactional
    public DichVuResponse suaDichVu(Integer maDV, CapNhatDichVuRequest req) {
        DichVu dv = dichVuRepository.findById(maDV)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy dịch vụ"));

        dv.setTenDV(req.getTenDV());
        dv.setLoaiDV(req.getLoaiDV());
        dv.setDonGia(req.getDonGia());
        dv.setSoLuongTon(req.getSoLuongTon());
        if (req.getTrangThai() != null) {
            dv.setTrangThai(req.getTrangThai());
        }
        if (req.getHinhAnh() != null) {
            dv.setHinhAnh(req.getHinhAnh());
        }
        dichVuRepository.save(dv);

        return toDichVuResponse(dv);
    }

    @Transactional
    public void doiTrangThaiDichVu(Integer maDV) {
        DichVu dv = dichVuRepository.findById(maDV)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy dịch vụ"));
        dv.setTrangThai("HoatDong".equals(dv.getTrangThai()) ? "TamNgung" : "HoatDong");
        dichVuRepository.save(dv);
    }

    // ======================== 3. QUẢN LÝ SÂN & ĐỊA ĐIỂM ========================

    @Transactional
    public void taoSan(TaoSanRequest req) {
        if (diaDiemRepository.existsByTenDiaDiem(req.getTenDiaDiem())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Tên địa điểm đã tồn tại");
        }
        if (!req.getGioDong().isAfter(req.getGioMo())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Giờ đóng phải sau giờ mở");
        }

        DiaDiem dd = new DiaDiem();
        dd.setTenDiaDiem(req.getTenDiaDiem());
        dd.setGioMo(req.getGioMo());
        dd.setGioDong(req.getGioDong());
        dd.setTrangThai("HoatDong");

        String mapLink = (req.getMapLink() != null && !req.getMapLink().trim().isEmpty())
                ? req.getMapLink().trim()
                : "https://www.google.com/maps/search/?api=1&query=" + URLEncoder.encode(req.getTenDiaDiem(), StandardCharsets.UTF_8);
        dd.setMapLink(mapLink);

        diaDiemRepository.save(dd);

        String hinhAnh = (req.getHinhAnh() != null && !req.getHinhAnh().trim().isEmpty())
                ? req.getHinhAnh().trim()
                : "/images/courts.jpg";

        for (int i = 1; i <= req.getSoSanNho(); i++) {
            San san = new San();
            san.setDiaDiem(dd);
            san.setTenSan("Sân " + i);
            san.setLoaiSan("Sân tiêu chuẩn thảm PVC");
            san.setTinhTrang("HoatDong");
            san.setHinhAnh(hinhAnh);
            sanRepository.save(san);
        }
    }

    @Transactional
    public void suaSan(Integer maDiaDiem, SuaSanRequest req) {
        DiaDiem dd = diaDiemRepository.findById(maDiaDiem)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Không tìm thấy địa điểm"));

        if (!req.getGioDong().isAfter(req.getGioMo())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Giờ đóng phải sau giờ mở");
        }

        dd.setTenDiaDiem(req.getTenMoi());
        dd.setGioMo(req.getGioMo());
        dd.setGioDong(req.getGioDong());

        String mapLink = (req.getMapLink() != null && !req.getMapLink().trim().isEmpty())
                ? req.getMapLink().trim()
                : "https://www.google.com/maps/search/?api=1&query=" + URLEncoder.encode(req.getTenMoi(), StandardCharsets.UTF_8);
        dd.setMapLink(mapLink);

        diaDiemRepository.save(dd);

        String hinhAnh = (req.getHinhAnh() != null && !req.getHinhAnh().trim().isEmpty())
                ? req.getHinhAnh().trim()
                : "/images/courts.jpg";

        List<San> sanHienTai = sanRepository.findByDiaDiem_MaDiaDiem(maDiaDiem);
        sanHienTai.sort(Comparator.comparing(San::getMaSan));
        int soHienTai = sanHienTai.size();
        int soMoi = req.getSoSanNhoMoi();

        if (soMoi > soHienTai) {
            for (int i = soHienTai + 1; i <= soMoi; i++) {
                San san = new San();
                san.setDiaDiem(dd);
                san.setTenSan("Sân " + i);
                san.setLoaiSan("Sân tiêu chuẩn thảm PVC");
                san.setTinhTrang("HoatDong");
                san.setHinhAnh(hinhAnh);
                sanRepository.save(san);
            }
        } else if (soMoi < soHienTai) {
            List<San> sanCanXoa = sanHienTai.subList(soMoi, soHienTai);
            for (San san : sanCanXoa) {
                if (datSanRepository.existsDatSanActiveBySan(san.getMaSan())) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                            "Không thể giảm sân vì sân " + san.getTenSan()
                                    + " đã có người đặt");
                }
            }
            sanRepository.deleteAll(sanCanXoa);
        }
    }

    @Transactional
    public void capNhatAnhSan(Integer maSan, CapNhatAnhSanRequest req) {
        San san = sanRepository.findById(maSan)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Không tìm thấy sân"));
        String hinhAnh = (req.getHinhAnh() != null && !req.getHinhAnh().trim().isEmpty())
                ? req.getHinhAnh().trim()
                : "/images/courts.jpg";
        san.setHinhAnh(hinhAnh);
        sanRepository.save(san);
    }

    @Transactional
    public SanResponse capNhatTrangThaiSan(Integer maSan, CapNhatTrangThaiSanRequest req) {
        San san = sanRepository.findById(maSan)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Không tìm thấy sân"));
        san.setTinhTrang(req.getTinhTrang());
        sanRepository.save(san);

        SanResponse sr = new SanResponse();
        sr.setMaSan(san.getMaSan());
        sr.setTenSan(san.getTenSan());
        if (san.getDiaDiem() != null) {
            sr.setTenDiaDiem(san.getDiaDiem().getTenDiaDiem());
            sr.setMapLink(san.getDiaDiem().getMapLink());
        }
        sr.setTinhTrang(san.getTinhTrang());
        sr.setHinhAnh(san.getHinhAnh());
        return sr;
    }

    @Transactional(readOnly = true)
    public List<DiaDiemResponse> danhSachDiaDiem() {
        LocalDate today = LocalDate.now();
        LocalTime now = LocalTime.now();

        List<DatSan> activeBookings = datSanRepository.findByTrangThaiDatIn(
                List.of("ChoXacNhan", "DaXacNhan", "DangChoi", "ChoHuy"));

        Set<Integer> bookedCourtIds = activeBookings.stream()
                .filter(ds -> ds.getSan() != null)
                .map(ds -> ds.getSan().getMaSan())
                .collect(Collectors.toSet());

        Set<Integer> playingCourtIds = activeBookings.stream()
                .filter(ds -> "DangChoi".equals(ds.getTrangThaiDat()) ||
                             (today.equals(ds.getNgayChoi()) && !now.isBefore(ds.getGioBatDau()) && now.isBefore(ds.getGioKetThuc())))
                .filter(ds -> ds.getSan() != null)
                .map(ds -> ds.getSan().getMaSan())
                .collect(Collectors.toSet());

        return diaDiemRepository.findAll().stream()
                .map(dd -> {
                    DiaDiemResponse res = new DiaDiemResponse();
                    res.setMaDiaDiem(dd.getMaDiaDiem());
                    res.setTenDiaDiem(dd.getTenDiaDiem());
                    res.setGioMo(dd.getGioMo());
                    res.setGioDong(dd.getGioDong());
                    res.setTrangThai(dd.getTrangThai());
                    res.setMapLink(dd.getMapLink());

                    List<San> dsSan = sanRepository.findByDiaDiem_MaDiaDiem(dd.getMaDiaDiem());
                    List<SanResponse> sanResponses = dsSan.stream()
                            .map(s -> {
                                SanResponse sr = new SanResponse();
                                sr.setMaSan(s.getMaSan());
                                sr.setTenSan(s.getTenSan());
                                sr.setTenDiaDiem(dd.getTenDiaDiem());
                                sr.setTinhTrang(s.getTinhTrang());
                                sr.setHinhAnh(s.getHinhAnh());
                                sr.setMapLink(dd.getMapLink());
                                sr.setDangCoNguoiChoi(playingCourtIds.contains(s.getMaSan()));
                                sr.setDangDuocDat(bookedCourtIds.contains(s.getMaSan()));
                                return sr;
                            })
                            .collect(Collectors.toList());

                    res.setDanhSachSan(sanResponses);
                    return res;
                })
                .collect(Collectors.toList());
    }

    // ======================== 4. KHÁCH HÀNG & NHÂN VIÊN ========================

    public List<KhachHangResponse> danhSachKhachHang() {
        return khachHangRepository.findAll().stream()
                .map(kh -> {
                    KhachHangResponse res = new KhachHangResponse();
                    res.setMaKH(kh.getMaKH());
                    res.setHoTen(kh.getHoTen());
                    res.setSdt(kh.getSdt());
                    res.setEmail(kh.getEmail());
                    res.setSoLanNoShow(kh.getSoLanNoShow());
                    taiKhoanRepository.findByKhachHang_MaKH(kh.getMaKH())
                            .ifPresent(tk -> res.setTrangThaiTaiKhoan(tk.getTrangThai()));
                    return res;
                })
                .collect(Collectors.toList());
    }

    @Transactional
    public void doiTrangThaiTaiKhoan(Integer maTK) {
        TaiKhoan tk = taiKhoanRepository.findById(maTK)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Không tìm thấy tài khoản"));
        tk.setTrangThai("HoatDong".equals(tk.getTrangThai()) ? "Khoa" : "HoatDong");
        taiKhoanRepository.save(tk);
    }

    @Transactional
    public KhachHangResponse suaKhachHang(Integer maKH, CapNhatKhachHangRequest req) {
        KhachHang kh = khachHangRepository.findById(maKH)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy khách hàng"));
        if (khachHangRepository.existsBySdtAndMaKHNot(req.getSdt(), maKH)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Số điện thoại đã được đăng ký bởi khách hàng khác");
        }
        kh.setHoTen(req.getHoTen());
        kh.setSdt(req.getSdt());
        kh.setEmail(req.getEmail());
        khachHangRepository.save(kh);

        KhachHangResponse res = new KhachHangResponse();
        res.setMaKH(kh.getMaKH());
        res.setHoTen(kh.getHoTen());
        res.setSdt(kh.getSdt());
        res.setEmail(kh.getEmail());
        res.setSoLanNoShow(kh.getSoLanNoShow());
        taiKhoanRepository.findByKhachHang_MaKH(kh.getMaKH())
                .ifPresent(tk -> res.setTrangThaiTaiKhoan(tk.getTrangThai()));
        return res;
    }

    // ======================== 5. THỐNG KÊ DOANH THU ========================

    public ThongKeDoanhThuResponse thongKeDoanhThuTheoThang(int nam, int thang) {
        ThongKeDoanhThuResponse res = new ThongKeDoanhThuResponse();
        res.setNam(nam);
        res.setThang(thang);
        res.setTongDoanhThu(datSanRepository.tinhDoanhThuTheoThang(nam, thang));
        res.setSoDon(datSanRepository.demSoDonTheoThang(nam, thang));
        return res;
    }

    public ThongKeDoanhThuResponse thongKeDoanhThuTheoNam(int nam) {
        ThongKeDoanhThuResponse res = new ThongKeDoanhThuResponse();
        res.setNam(nam);
        res.setThang(null);
        res.setTongDoanhThu(datSanRepository.tinhDoanhThuTheoNam(nam));
        res.setSoDon(datSanRepository.demSoDonTheoNam(nam));
        return res;
    }

    // ======================== HELPER ========================

    private void taoThongBao(KhachHang kh, String tieuDe, String noiDung, String loai) {
        ThongBao tb = new ThongBao();
        tb.setKhachHang(kh);
        tb.setTieuDe(tieuDe);
        tb.setNoiDung(noiDung);
        tb.setLoaiThongBao(loai);
        tb.setDaDoc(false);
        tb.setThoiGianTao(LocalDateTime.now());
        thongBaoRepository.save(tb);
    }

    private DichVuResponse toDichVuResponse(DichVu dv) {
        DichVuResponse res = new DichVuResponse();
        res.setMaDV(dv.getMaDV());
        if (dv.getDiaDiem() != null) {
            res.setMaDiaDiem(dv.getDiaDiem().getMaDiaDiem());
            res.setTenDiaDiem(dv.getDiaDiem().getTenDiaDiem());
        }
        res.setTenDV(dv.getTenDV());
        res.setLoaiDV(dv.getLoaiDV());
        res.setDonGia(dv.getDonGia());
        res.setSoLuongTon(dv.getSoLuongTon());
        res.setHinhAnh(dv.getHinhAnh());
        res.setTrangThai(dv.getTrangThai());
        return res;
    }
}
