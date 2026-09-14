package com.quanlydatsan.service;

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
import com.quanlydatsan.dto.response.DatSanResponse;
import com.quanlydatsan.dto.response.DiaDiemResponse;
import com.quanlydatsan.dto.response.SanResponse;
import com.quanlydatsan.entity.BangGia;
import com.quanlydatsan.entity.DatSan;
import com.quanlydatsan.entity.DiaDiem;
import com.quanlydatsan.entity.KhachHang;
import com.quanlydatsan.entity.San;
import com.quanlydatsan.entity.ThanhToan;
import com.quanlydatsan.entity.ThongBao;
import com.quanlydatsan.repository.BangGiaRepository;
import com.quanlydatsan.repository.DatSanRepository;
import com.quanlydatsan.repository.DiaDiemRepository;
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

    @Transactional(readOnly = true)
    public List<DiaDiemResponse> layTatCaDiaDiemVaSan() {
        LocalDate today = LocalDate.now();
        LocalTime now = LocalTime.now();

        // Lấy tất cả đơn có trạng thái active (ChoXacNhan, DaXacNhan, ChoHuy)
        List<DatSan> activeBookings = datSanRepository.findByTrangThaiDatIn(
                List.of("ChoXacNhan", "DaXacNhan", "ChoHuy"));

        // Tập hợp các sân đang có đơn đặt active
        Set<Integer> bookedCourtIds = activeBookings.stream()
                .filter(ds -> ds.getSan() != null)
                .map(ds -> ds.getSan().getMaSan())
                .collect(Collectors.toSet());

        // Tập hợp các sân đang có người chơi ngay thời điểm hiện tại
        Set<Integer> playingCourtIds = activeBookings.stream()
                .filter(ds -> today.equals(ds.getNgayChoi()))
                .filter(ds -> !now.isBefore(ds.getGioBatDau()) && now.isBefore(ds.getGioKetThuc()))
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

    @Transactional
    public DatSanResponse datSan(DatSanRequest req, Integer maKH) {
        // 1. San tồn tại, active, DiaDiem active
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

        // 2. gioKetThuc > gioBatDau
        if (!req.getGioKetThuc().isAfter(req.getGioBatDau())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Giờ kết thúc phải sau giờ bắt đầu");
        }

        // 3. Không đặt quá khứ
        LocalDateTime thoiDiemBatDau = LocalDateTime.of(req.getNgayChoi(), req.getGioBatDau());
        if (thoiDiemBatDau.isBefore(LocalDateTime.now())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Không thể đặt sân trong quá khứ");
        }

        // 4. Giờ theo mốc 30 phút
        if (!isMoc30Phut(req.getGioBatDau()) || !isMoc30Phut(req.getGioKetThuc())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Giờ phải theo mốc 30 phút (phút = 00 hoặc 30)");
        }

        // 5. Nằm trong khoảng GioMo–GioDong
        if (req.getGioBatDau().isBefore(diaDiem.getGioMo())
                || req.getGioKetThuc().isAfter(diaDiem.getGioDong())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Khung giờ phải nằm trong giờ hoạt động của địa điểm ("
                            + diaDiem.getGioMo() + " – " + diaDiem.getGioDong() + ")");
        }

        // 6. Không trùng lịch
        if (datSanRepository.existsTrungLich(san.getMaSan(), req.getNgayChoi(),
                req.getGioBatDau(), req.getGioKetThuc())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Sân đã có người đặt trong khung giờ này");
        }

        // 7. Không hết sân toàn địa điểm
        long tongSanActive = sanRepository
                .findByDiaDiem_MaDiaDiemAndTinhTrang(diaDiem.getMaDiaDiem(), "HoatDong").size();
        long soSanDaDat = datSanRepository.demSoSanDaDat(diaDiem.getMaDiaDiem(),
                req.getNgayChoi(), req.getGioBatDau(), req.getGioKetThuc());
        if (soSanDaDat >= tongSanActive) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Đã hết sân tại địa điểm này trong khung giờ đã chọn");
        }

        // 8. Tính giá
        BangGia bangGia = bangGiaRepository.findFirstByDangApDungTrueOrderByMaBangGiaDesc()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Chưa có bảng giá áp dụng"));
        long soPhut = Duration.between(req.getGioBatDau(), req.getGioKetThuc()).toMinutes();
        int soTien = (int) (soPhut / 30) * bangGia.getGiaMoi30Phut();

        // 9. Validate phuongThucThanhToan
        String pttt = req.getPhuongThucThanhToan();
        if (!"QR".equals(pttt) && !"TienMat".equals(pttt)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Phương thức thanh toán chỉ được là 'QR' hoặc 'TienMat'");
        }

        // Tạo DatSan
        KhachHang kh = khachHangRepository.findById(maKH)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Không tìm thấy khách hàng"));

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
        ds.setGhiChu(req.getGhiChu());
        ds.setNgayTao(LocalDateTime.now());
        datSanRepository.save(ds);

        // 10. Tạo ThongBao
        String noiDung = "TienMat".equals(pttt)
                ? "Sân đã được giữ chỗ. Vui lòng thanh toán tại sân và chờ admin xác nhận."
                : "Vui lòng hoàn tất thanh toán QR trong 15 phút để xác nhận đặt sân.";
        taoThongBao(kh, "Đặt sân thành công", noiDung, "DatSan");

        return toDatSanResponse(ds);
    }

    @Transactional
    public DatSanResponse thanhToanQR(Integer maDatSan, Integer maKH) {
        DatSan ds = getDatSanBelongingTo(maDatSan, maKH);

        if (!"QR".equals(ds.getPhuongThucThanhToan())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Đơn thanh toán tiền mặt không thể tự xác nhận");
        }
        if (!"ChoXacNhan".equals(ds.getTrangThaiDat())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Đơn không ở trạng thái chờ xác nhận");
        }

        ds.setTrangThaiThanhToan("DaThanhToan");
        ds.setTrangThaiDat("DaXacNhan");
        datSanRepository.save(ds);

        ThanhToan tt = new ThanhToan();
        tt.setDatSan(ds);
        tt.setSoTien(ds.getSoTien());
        tt.setPhuongThuc("QR");
        tt.setTrangThai("ThanhCongDemo");
        tt.setThoiGianThanhToan(LocalDateTime.now());
        thanhToanRepository.save(tt);

        taoThongBao(ds.getKhachHang(),
                "Thanh toán QR thành công",
                "Thanh toán QR thành công. Sân của bạn đã được xác nhận.",
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
            taoThongBao(ds.getKhachHang(),
                    "Đơn đã được hủy",
                    "Bạn đã hủy đơn đặt sân thành công.",
                    "Huy");
        } else if ("DaXacNhan".equals(ds.getTrangThaiDat())) {
            ds.setTrangThaiDat("ChoHuy");
            datSanRepository.save(ds);
            taoThongBao(ds.getKhachHang(),
                    "Đã gửi yêu cầu hủy",
                    "Yêu cầu hủy sân của bạn đang chờ admin duyệt.",
                    "YeuCauHuy");
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

    // ======================== HELPER ========================

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

    private DatSanResponse toDatSanResponse(DatSan ds) {
        DatSanResponse res = new DatSanResponse();
        res.setMaDatSan(ds.getMaDatSan());
        if (ds.getSan() != null) {
            res.setTenSan(ds.getSan().getTenSan());
            if (ds.getSan().getDiaDiem() != null) {
                res.setTenDiaDiem(ds.getSan().getDiaDiem().getTenDiaDiem());
                res.setMapLink(ds.getSan().getDiaDiem().getMapLink());
            }
        }
        res.setNgayChoi(ds.getNgayChoi());
        res.setGioBatDau(ds.getGioBatDau());
        res.setGioKetThuc(ds.getGioKetThuc());
        res.setTrangThaiDat(ds.getTrangThaiDat());
        res.setTrangThaiThanhToan(ds.getTrangThaiThanhToan());
        res.setPhuongThucThanhToan(ds.getPhuongThucThanhToan());
        res.setSoTien(ds.getSoTien());
        res.setGhiChu(ds.getGhiChu());
        res.setLyDoHuy(ds.getLyDoHuy());
        res.setNgayTao(ds.getNgayTao());
        return res;
    }

    private SanResponse toSanResponse(San san) {
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
