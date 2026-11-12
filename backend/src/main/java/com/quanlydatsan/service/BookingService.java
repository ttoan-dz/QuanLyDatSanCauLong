package com.quanlydatsan.service;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.quanlydatsan.dto.request.DatSanRequest;
import com.quanlydatsan.dto.request.HuyDatSanRequest;
import com.quanlydatsan.dto.response.ChiTietDichVuResponse;
import com.quanlydatsan.dto.response.DatSanResponse;
import com.quanlydatsan.dto.response.DiaDiemResponse;
import com.quanlydatsan.dto.response.HoaDonResponse;
import com.quanlydatsan.dto.response.HoanTienResponse;
import com.quanlydatsan.dto.response.KhungGioDaDatResponse;
import com.quanlydatsan.dto.response.SanResponse;
import com.quanlydatsan.entity.BangGia;
import com.quanlydatsan.entity.ChiTietDatSan;
import com.quanlydatsan.entity.ChiTietDichVu;
import com.quanlydatsan.entity.DatSan;
import com.quanlydatsan.entity.DiaDiem;
import com.quanlydatsan.entity.HoaDon;
import com.quanlydatsan.entity.HoanTien;
import com.quanlydatsan.entity.KhachHang;
import com.quanlydatsan.entity.San;
import com.quanlydatsan.entity.ThanhToan;
import com.quanlydatsan.entity.ThongBao;
import com.quanlydatsan.repository.BangGiaRepository;
import com.quanlydatsan.repository.ChiTietDatSanRepository;
import com.quanlydatsan.repository.ChiTietDichVuRepository;
import com.quanlydatsan.repository.DatSanRepository;
import com.quanlydatsan.repository.DiaDiemRepository;
import com.quanlydatsan.repository.HoaDonRepository;
import com.quanlydatsan.repository.HoanTienRepository;
import com.quanlydatsan.repository.KhachHangRepository;
import com.quanlydatsan.repository.SanRepository;
import com.quanlydatsan.repository.ThanhToanRepository;
import com.quanlydatsan.repository.ThongBaoRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class BookingService {

    private final DatSanRepository datSanRepository;
    private final SanRepository sanRepository;
    private final DiaDiemRepository diaDiemRepository;
    private final KhachHangRepository khachHangRepository;
    private final BangGiaRepository bangGiaRepository;
    private final ThanhToanRepository thanhToanRepository;
    private final ThongBaoRepository thongBaoRepository;
    private final ChiTietDatSanRepository chiTietDatSanRepository;
    private final ChiTietDichVuRepository chiTietDichVuRepository;
    private final HoaDonRepository hoaDonRepository;
    private final HoanTienRepository hoanTienRepository;

    @Transactional(readOnly = true)
    public List<DiaDiemResponse> layTatCaDiaDiemVaSan() {
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
                                SanResponse sr = toSanResponse(s);
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

    @Transactional(readOnly = true)
    public BangGia layGiaHienHanh() {
        return bangGiaRepository.findFirstByDangApDungTrueOrderByMaBangGiaDesc()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Chưa cấu hình bảng giá"));
    }

    public List<SanResponse> timSanTrong(Integer maDiaDiem, LocalDate ngay,
                                         LocalTime batDau, LocalTime ketThuc) {
        List<San> sanActiveList = sanRepository
                .findByDiaDiem_MaDiaDiemAndTinhTrang(maDiaDiem, "HoatDong");

        return sanActiveList.stream()
                .filter(san -> !datSanRepository.existsTrungLich(
                        san.getMaSan(), ngay, batDau, ketThuc))
                .map(this::toSanResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<KhungGioDaDatResponse> layDanhSachKhungGioDaDat(Integer maSan, LocalDate ngay) {
        List<DatSan> activeBookings = datSanRepository.findBySan_MaSanAndNgayChoiAndTrangThaiDatIn(
                maSan, ngay, List.of("ChoXacNhan", "DaXacNhan", "DangChoi", "ChoHuy"));

        return activeBookings.stream()
                .map(ds -> new KhungGioDaDatResponse(ds.getGioBatDau(), ds.getGioKetThuc(), ds.getTrangThaiDat()))
                .sorted((a, b) -> a.getGioBatDau().compareTo(b.getGioBatDau()))
                .collect(Collectors.toList());
    }

    @Transactional
    public DatSanResponse datSan(DatSanRequest req, Integer maKH) {

        San san = sanRepository.findById(req.getMaSan())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Không tìm thấy sân"));
        if (!"HoatDong".equals(san.getTinhTrang())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Sân đang tạm ngưng hoặc bảo trì");
        }
        DiaDiem diaDiem = san.getDiaDiem();
        if (!"HoatDong".equals(diaDiem.getTrangThai())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Địa điểm đang tạm ngưng hoạt động");
        }

        if (!req.getGioKetThuc().isAfter(req.getGioBatDau())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Giờ kết thúc phải sau giờ bắt đầu");
        }

        LocalDateTime thoiDiemBatDau = LocalDateTime.of(req.getNgayChoi(), req.getGioBatDau());
        if (thoiDiemBatDau.isBefore(LocalDateTime.now())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Không thể đặt sân trong quá khứ");
        }

        if (!isMoc30Phut(req.getGioBatDau()) || !isMoc30Phut(req.getGioKetThuc())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Giờ phải theo mốc 30 phút (phút = 00 hoặc 30)");
        }

        if (req.getGioBatDau().isBefore(diaDiem.getGioMo())
                || req.getGioKetThuc().isAfter(diaDiem.getGioDong())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Khung giờ phải nằm trong giờ hoạt động của địa điểm ("
                            + diaDiem.getGioMo() + " – " + diaDiem.getGioDong() + ")");
        }

        if (datSanRepository.existsTrungLich(san.getMaSan(), req.getNgayChoi(),
                req.getGioBatDau(), req.getGioKetThuc())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Khung giờ đã được đặt, vui lòng chọn giờ khác");
        }

        long tongSanActive = sanRepository
                .findByDiaDiem_MaDiaDiemAndTinhTrang(diaDiem.getMaDiaDiem(), "HoatDong").size();
        long soSanDaDat = datSanRepository.demSoSanDaDat(diaDiem.getMaDiaDiem(),
                req.getNgayChoi(), req.getGioBatDau(), req.getGioKetThuc());
        if (soSanDaDat >= tongSanActive) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Đã hết sân tại địa điểm này trong khung giờ đã chọn");
        }

        BangGia bangGia = bangGiaRepository.findFirstByDangApDungTrueOrderByMaBangGiaDesc()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Chưa có bảng giá áp dụng"));
        long soPhut = Duration.between(req.getGioBatDau(), req.getGioKetThuc()).toMinutes();
        int soTien = (int) (soPhut / 30) * bangGia.getGiaMoi30Phut();

        String pttt = req.getPhuongThucThanhToan();
        if (pttt == null || pttt.trim().isEmpty()) {
            pttt = "QR";
        }
        if (!"QR".equals(pttt) && !"TienMat".equals(pttt) && !"VNPay".equals(pttt) && !"MoMo".equals(pttt)) {
            pttt = "QR";
        }

        KhachHang kh = khachHangRepository.findById(maKH)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Không tìm thấy khách hàng"));

        LocalDateTime now = LocalDateTime.now();
        DatSan ds = new DatSan();
        ds.setKhachHang(kh);
        ds.setSan(san);
        ds.setNgayChoi(req.getNgayChoi());
        ds.setGioBatDau(req.getGioBatDau());
        ds.setGioKetThuc(req.getGioKetThuc());
        ds.setTrangThaiDat("ChoXacNhan");
        ds.setTrangThaiThanhToan("ChuaThanhToan");
        ds.setPhuongThucThanhToan(pttt);
        ds.setSoTien(soTien);
        ds.setTienSan(BigDecimal.valueOf(soTien));
        ds.setTienTraTruoc(BigDecimal.ZERO);
        ds.setGhiChu(req.getGhiChu());
        ds.setNgayTao(now);
        ds.setHanThanhToan(now.plusMinutes(10));
        datSanRepository.save(ds);

        ChiTietDatSan ct = new ChiTietDatSan();
        ct.setDatSan(ds);
        ct.setSan(san);
        ct.setBatDau(thoiDiemBatDau);
        ct.setKetThuc(LocalDateTime.of(req.getNgayChoi(), req.getGioKetThuc()));
        ct.setTienSan(BigDecimal.valueOf(soTien));
        ct.setTrangThai("GiuCho");
        chiTietDatSanRepository.save(ct);

        String noiDung = "TienMat".equals(pttt)
                ? "Sân đã được giữ chỗ trong 10 phút. Vui lòng thanh toán tại sân và chờ nhân viên xác nhận."
                : "Vui lòng hoàn tất thanh toán trước 100% trong vòng 10 phút để xác nhận đơn đặt sân.";
        taoThongBao(kh, "Đặt sân thành công", noiDung, "DatSan");

        return toDatSanResponse(ds);
    }

    @Transactional
    public DatSanResponse thanhToanQR(Integer maDatSan, Integer maKH) {
        DatSan ds = getDatSanBelongingTo(maDatSan, maKH);

        if (!"ChoXacNhan".equals(ds.getTrangThaiDat())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Đơn không ở trạng thái chờ xác nhận");
        }

        if (ds.getHanThanhToan() != null && LocalDateTime.now().isAfter(ds.getHanThanhToan())) {
            ds.setTrangThaiDat("HetHan");
            datSanRepository.save(ds);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Đơn đặt sân đã hết hạn giữ chỗ (10 phút), vui lòng đặt lại");
        }

        ds.setTrangThaiThanhToan("DaThanhToan");
        ds.setTrangThaiDat("DaXacNhan");
        ds.setTienTraTruoc(ds.getTienSan());
        datSanRepository.save(ds);

        chiTietDatSanRepository.findFirstByDatSan_MaDatSan(maDatSan).ifPresent(ct -> {
            ct.setTrangThai("DaXacNhan");
            chiTietDatSanRepository.save(ct);
        });

        ThanhToan tt = new ThanhToan();
        tt.setDatSan(ds);
        tt.setSoTien(ds.getSoTien());
        tt.setPhuongThuc(ds.getPhuongThucThanhToan());
        tt.setLoaiThanhToan("TraTruoc");
        tt.setMaGiaoDich("TXN_" + System.currentTimeMillis() + "_" + maDatSan);
        tt.setTrangThai("ThanhCongDemo");
        tt.setThoiGianThanhToan(LocalDateTime.now());
        thanhToanRepository.save(tt);

        taoThongBao(ds.getKhachHang(),
                "Thanh toán trực tuyến thành công",
                "Thanh toán 100% tiền sân thành công. Sân của bạn đã được xác nhận.",
                "ThanhToan");

        return toDatSanResponse(ds);
    }

    @Transactional
    public DatSanResponse huyDatSan(Integer maDatSan, Integer maKH, HuyDatSanRequest req) {
        DatSan ds = getDatSanBelongingTo(maDatSan, maKH);

        if ("ChoXacNhan".equals(ds.getTrangThaiDat())) {

            ds.setTrangThaiDat("DaHuy");
            ds.setLyDoHuy("NguoiDungHuy");
            datSanRepository.save(ds);

            chiTietDatSanRepository.findFirstByDatSan_MaDatSan(maDatSan).ifPresent(ct -> {
                ct.setTrangThai("DaHuy");
                chiTietDatSanRepository.save(ct);
            });

            taoThongBao(ds.getKhachHang(),
                    "Đơn đã được hủy",
                    "Bạn đã hủy đơn đặt sân thành công.",
                    "Huy");
        } else if ("DaXacNhan".equals(ds.getTrangThaiDat())) {

            LocalDateTime gioBatDau = LocalDateTime.of(ds.getNgayChoi(), ds.getGioBatDau());
            LocalDateTime now = LocalDateTime.now();

            if (now.isAfter(gioBatDau)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Không thể hủy đơn sau giờ bắt đầu chơi");
            }

            long hoursBefore = Duration.between(now, gioBatDau).toHours();
            int tyLeHoan;
            if (hoursBefore >= 24) {
                tyLeHoan = 100;
            } else if (hoursBefore >= 12) {
                tyLeHoan = 50;
            } else {
                tyLeHoan = 0;
            }

            BigDecimal tienGoc = ds.getTienSan().compareTo(BigDecimal.ZERO) > 0 ? ds.getTienSan() : BigDecimal.valueOf(ds.getSoTien());
            BigDecimal soTienHoan = tienGoc.multiply(BigDecimal.valueOf(tyLeHoan)).divide(BigDecimal.valueOf(100));

            ds.setTrangThaiDat("ChoHuy");
            String lyDo = req != null && req.getLyDoHuy() != null && !req.getLyDoHuy().trim().isEmpty()
                    ? req.getLyDoHuy().trim() : "Khách yêu cầu hủy đơn";
            ds.setLyDoHuy(lyDo);
            datSanRepository.save(ds);

            chiTietDatSanRepository.findFirstByDatSan_MaDatSan(maDatSan).ifPresent(ct -> {
                ct.setTrangThai("ChoHuy");
                chiTietDatSanRepository.save(ct);
            });

            HoanTien ht = hoanTienRepository.findFirstByDatSan_MaDatSanOrderByNgayYeuCauDesc(maDatSan)
                    .orElse(new HoanTien());
            ht.setDatSan(ds);
            ht.setNgayYeuCau(now);
            ht.setLyDo(lyDo);
            ht.setLoaiHuy("KhachHuy");
            ht.setTyLeHoan(tyLeHoan);
            ht.setSoTienHoan(soTienHoan);
            ht.setTrangThai("ChoDuyet");
            hoanTienRepository.save(ht);

            String msg = String.format("Yêu cầu hủy đơn #%d đã được gửi tới quản trị viên (trước giờ chơi %d giờ). Dự kiến hoàn tiền: %d%% (%,.0f VNĐ). Vui lòng chờ duyệt.",
                    maDatSan, hoursBefore, tyLeHoan, soTienHoan);
            taoThongBao(ds.getKhachHang(), "Yêu cầu hủy đơn đang chờ duyệt", msg, "YeuCauHuy");
        } else {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Không thể hủy đơn ở trạng thái hiện tại (" + ds.getTrangThaiDat() + ")");
        }

        return toDatSanResponse(ds);
    }

    public List<DatSanResponse> xemLichSu(Integer maKH) {
        return datSanRepository.findByKhachHang_MaKHOrderByNgayTaoDesc(maKH)
                .stream()
                .map(this::toDatSanResponse)
                .collect(Collectors.toList());
    }

    private DatSan getDatSanBelongingTo(Integer maDatSan, Integer maKH) {
        DatSan ds = datSanRepository.findById(maDatSan)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Không tìm thấy đơn đặt sân"));
        if (!ds.getKhachHang().getMaKH().equals(maKH)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Bạn không có quyền thao tác đơn này");
        }
        return ds;
    }

    private boolean isMoc30Phut(LocalTime time) {
        return (time.getMinute() == 0 || time.getMinute() == 30) && time.getSecond() == 0;
    }

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

    public DatSanResponse toDatSanResponse(DatSan ds) {
        DatSanResponse res = new DatSanResponse();
        res.setMaDatSan(ds.getMaDatSan());
        if (ds.getSan() != null) {
            res.setMaSan(ds.getSan().getMaSan());
            res.setTenSan(ds.getSan().getTenSan());
            if (ds.getSan().getDiaDiem() != null) {
                res.setMaDiaDiem(ds.getSan().getDiaDiem().getMaDiaDiem());
                res.setTenDiaDiem(ds.getSan().getDiaDiem().getTenDiaDiem());
                res.setMapLink(ds.getSan().getDiaDiem().getMapLink());
            }
        }
        if (ds.getKhachHang() != null) {
            res.setHoTenKhachHang(ds.getKhachHang().getHoTen());
            res.setSdtKhachHang(ds.getKhachHang().getSdt());
        }
        res.setNgayChoi(ds.getNgayChoi());
        res.setGioBatDau(ds.getGioBatDau());
        res.setGioKetThuc(ds.getGioKetThuc());
        res.setGioCheckIn(ds.getGioCheckIn());
        res.setGioCheckOut(ds.getGioCheckOut());
        res.setSoBlockQuaGio(ds.getSoBlockQuaGio() != null ? ds.getSoBlockQuaGio() : 0);
        res.setTienQuaGio(ds.getTienQuaGio() != null ? ds.getTienQuaGio() : BigDecimal.ZERO);
        res.setTrangThaiDat(ds.getTrangThaiDat());
        res.setTrangThaiThanhToan(ds.getTrangThaiThanhToan());
        res.setPhuongThucThanhToan(ds.getPhuongThucThanhToan());
        res.setSoTien(ds.getSoTien());
        res.setTienSan(ds.getTienSan() != null ? ds.getTienSan() : BigDecimal.valueOf(ds.getSoTien()));
        res.setTienTraTruoc(ds.getTienTraTruoc() != null ? ds.getTienTraTruoc() : BigDecimal.ZERO);
        res.setGhiChu(ds.getGhiChu());
        res.setLyDoHuy(ds.getLyDoHuy());
        res.setHanThanhToan(ds.getHanThanhToan());
        res.setNgayTao(ds.getNgayTao());

        hoaDonRepository.findByDatSan_MaDatSan(ds.getMaDatSan()).ifPresent(hd -> {
            HoaDonResponse hdr = new HoaDonResponse();
            hdr.setMaHoaDon(hd.getMaHoaDon());
            hdr.setMaDatSan(ds.getMaDatSan());
            hdr.setNgayLap(hd.getNgayLap());
            hdr.setTongTienSan(hd.getTongTienSan());
            hdr.setTongTienDV(hd.getTongTienDV());
            hdr.setTienQuaGio(hd.getTienQuaGio());
            hdr.setTienTraTruoc(hd.getTienTraTruoc());
            hdr.setTienHoanDuyet(hd.getTienHoanDuyet());
            hdr.setThanhTien(hd.getThanhTien());
            hdr.setTrangThai(hd.getTrangThai());
            res.setHoaDon(hdr);
        });

        List<ChiTietDichVu> dsDichVu = chiTietDichVuRepository.findByDatSan_MaDatSan(ds.getMaDatSan());
        if (!dsDichVu.isEmpty()) {
            res.setDanhSachDichVu(dsDichVu.stream().map(dv -> {
                ChiTietDichVuResponse dvr = new ChiTietDichVuResponse();
                dvr.setMaCTDV(dv.getMaCTDV());
                dvr.setMaDV(dv.getDichVu().getMaDV());
                dvr.setTenDV(dv.getDichVu().getTenDV());
                dvr.setLoaiDV(dv.getDichVu().getLoaiDV());
                dvr.setSoLuong(dv.getSoLuong());
                dvr.setDonGia(dv.getDonGia());
                dvr.setThanhTien(dv.getDonGia().multiply(BigDecimal.valueOf(dv.getSoLuong())));
                dvr.setGhiChu(dv.getGhiChu());
                dvr.setThoiGian(dv.getThoiGian());
                return dvr;
            }).collect(Collectors.toList()));
        }

        hoanTienRepository.findFirstByDatSan_MaDatSanOrderByNgayYeuCauDesc(ds.getMaDatSan()).ifPresent(ht -> {
            HoanTienResponse htr = new HoanTienResponse();
            htr.setMaHoanTien(ht.getMaHoanTien());
            htr.setMaDatSan(ds.getMaDatSan());
            htr.setNgayYeuCau(ht.getNgayYeuCau());
            htr.setLyDo(ht.getLyDo());
            htr.setLoaiHuy(ht.getLoaiHuy());
            htr.setTyLeHoan(ht.getTyLeHoan());
            htr.setSoTienHoan(ht.getSoTienHoan());
            htr.setTrangThai(ht.getTrangThai());
            res.setThongTinHoanTien(htr);
        });

        return res;
    }

    public SanResponse toSanResponse(San san) {
        SanResponse res = new SanResponse();
        res.setMaSan(san.getMaSan());
        if (san.getDiaDiem() != null) {
            res.setTenDiaDiem(san.getDiaDiem().getTenDiaDiem());
            res.setMapLink(san.getDiaDiem().getMapLink());
        }
        res.setTenSan(san.getTenSan());
        res.setTinhTrang(san.getTinhTrang());
        res.setHinhAnh(san.getHinhAnh());
        return res;
    }
}
