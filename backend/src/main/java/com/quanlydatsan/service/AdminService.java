package com.quanlydatsan.service;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
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
import com.quanlydatsan.dto.request.CapNhatKhachHangRequest;
import com.quanlydatsan.dto.request.CapNhatTrangThaiSanRequest;
import com.quanlydatsan.dto.request.DuyetYeuCauHuyRequest;
import com.quanlydatsan.dto.request.HuyDatSanRequest;
import com.quanlydatsan.dto.request.SuaSanRequest;
import com.quanlydatsan.dto.request.TaoSanRequest;
import com.quanlydatsan.dto.response.DatSanResponse;
import com.quanlydatsan.dto.response.DiaDiemResponse;
import com.quanlydatsan.dto.response.KhachHangResponse;
import com.quanlydatsan.dto.response.SanResponse;
import com.quanlydatsan.dto.response.ThongKeDoanhThuResponse;
import com.quanlydatsan.entity.DatSan;
import com.quanlydatsan.entity.DiaDiem;
import com.quanlydatsan.entity.KhachHang;
import com.quanlydatsan.entity.San;
import com.quanlydatsan.entity.TaiKhoan;
import com.quanlydatsan.entity.ThanhToan;
import com.quanlydatsan.entity.ThongBao;
import com.quanlydatsan.repository.DatSanRepository;
import com.quanlydatsan.repository.DiaDiemRepository;
import com.quanlydatsan.repository.KhachHangRepository;
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

    // ======================== ĐƠN ĐẶT SÂN ========================

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
        datSanRepository.save(ds);

        ThanhToan tt = new ThanhToan();
        tt.setDatSan(ds);
        tt.setSoTien(ds.getSoTien());
        tt.setPhuongThuc("TienMat");
        tt.setTrangThai("ThanhCongDemo");
        tt.setThoiGianThanhToan(LocalDateTime.now());
        thanhToanRepository.save(tt);

        taoThongBao(ds.getKhachHang(),
                "Admin đã xác nhận",
                "Admin đã xác nhận thanh toán tiền mặt. Sân của bạn đã được đặt thành công.",
                "XacNhan");

        return toDatSanResponse(ds);
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

        ds.setTrangThaiDat("DaHuy");
        String lyDoHuy = req != null && req.getLyDoHuy() != null
                ? req.getLyDoHuy() : "AdminHuy";
        ds.setLyDoHuy(lyDoHuy);
        if (req != null && req.getGhiChu() != null && !req.getGhiChu().trim().isEmpty()) {
            ds.setGhiChu(req.getGhiChu().trim());
        }
        datSanRepository.save(ds);

        // Nếu no-show: tăng soLanNoShow
        if ("KhongDenNhan".equals(lyDoHuy)) {
            KhachHang kh = ds.getKhachHang();
            kh.setSoLanNoShow(kh.getSoLanNoShow() + 1);
            khachHangRepository.save(kh);
        }

        // ThongBao tuỳ lyDoHuy
        String noiDung;
        if ("KhongDenNhan".equals(lyDoHuy)) {
            noiDung = "Đơn đặt sân đã bị hủy do quá thời gian chờ nhận sân.";
        } else {
            noiDung = (req != null && req.getGhiChu() != null && !req.getGhiChu().trim().isEmpty())
                    ? "Đơn đặt sân đã bị admin hủy. Lý do: " + req.getGhiChu().trim()
                    : "Đơn đặt sân đã bị admin hủy.";
        }
        taoThongBao(ds.getKhachHang(), "Đơn đã bị hủy", noiDung, "Huy");

        return toDatSanResponse(ds);
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

        if (Boolean.TRUE.equals(req.getDongY())) {
            ds.setTrangThaiDat("DaHuy");
            ds.setLyDoHuy("NguoiDungHuy");
            datSanRepository.save(ds);
            taoThongBao(ds.getKhachHang(),
                    "Yêu cầu hủy được chấp nhận",
                    "Yêu cầu hủy sân của bạn đã được admin chấp nhận. Vui lòng chờ hoàn tiền.",
                    "DuyetHuy");
        } else {
            ds.setTrangThaiDat("DaXacNhan");
            datSanRepository.save(ds);
            taoThongBao(ds.getKhachHang(),
                    "Yêu cầu hủy bị từ chối",
                    "Yêu cầu hủy sân của bạn đã bị admin từ chối. Đơn vẫn giữ nguyên.",
                    "DuyetHuy");
        }

        return toDatSanResponse(ds);
    }

    // ======================== QUẢN LÝ SÂN ========================

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
                san.setTinhTrang("HoatDong");
                san.setHinhAnh(hinhAnh);
                sanRepository.save(san);
            }
        } else if (soMoi < soHienTai) {
            // Xoá từ cuối (MaSan lớn nhất) trước
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
                List.of("ChoXacNhan", "DaXacNhan", "ChoHuy"));

        Set<Integer> bookedCourtIds = activeBookings.stream()
                .filter(ds -> ds.getSan() != null)
                .map(ds -> ds.getSan().getMaSan())
                .collect(Collectors.toSet());

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

    // ======================== KHÁCH HÀNG ========================

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

    // ======================== THỐNG KÊ ========================

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

    @Transactional(readOnly = true)
    public List<DatSanResponse> danhSachDatSan(String status) {
        List<DatSan> list;
        if (status != null && !status.trim().isEmpty()) {
            list = datSanRepository.findByTrangThaiDatWithDetails(status.trim());
        } else {
            list = datSanRepository.findAllWithDetails();
        }
        return list.stream()
                .map(this::toDatSanResponse)
                .collect(Collectors.toList());
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
}
