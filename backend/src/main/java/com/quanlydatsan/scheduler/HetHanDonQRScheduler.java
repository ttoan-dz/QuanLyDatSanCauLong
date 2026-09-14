package com.quanlydatsan.scheduler;

import com.quanlydatsan.entity.DatSan;
import com.quanlydatsan.repository.DatSanRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class HetHanDonQRScheduler {

    private final DatSanRepository datSanRepository;

    /**
     * Tự động hết hạn các đơn thanh toán QR quá 15 phút chưa thanh toán.
     * Chạy định kỳ mỗi 1 phút.
     */
    @Scheduled(fixedRate = 60000)
    @Transactional
    public void hetHanDonQR() {
        LocalDateTime thoiDiemHetHan = LocalDateTime.now().minusMinutes(15);
        List<DatSan> danhSachHetHan = datSanRepository.findDonQRHetHan(thoiDiemHetHan);

        for (DatSan ds : danhSachHetHan) {
            ds.setTrangThaiDat("HetHan");
            datSanRepository.save(ds);
            log.info("Đơn đặt sân #{} đã hết hạn (QR không thanh toán trong 15 phút)",
                    ds.getMaDatSan());
        }

        if (!danhSachHetHan.isEmpty()) {
            log.info("Scheduler: đã cập nhật {} đơn QR hết hạn", danhSachHetHan.size());
        }
    }

    /**
     * Tự động chuyển đơn 'DaXacNhan' sang 'HoanThanh' khi đã qua giờ chơi.
     * Chạy định kỳ mỗi 1 phút.
     */
    @Scheduled(fixedRate = 60000)
    @Transactional
    public void tuDongHoanThanhDonDaQuaGio() {
        LocalDate today = LocalDate.now();
        LocalTime now = LocalTime.now();

        List<DatSan> danhSachQuaGio = datSanRepository.findDonDaXacNhanQuaGio(today, now);

        for (DatSan ds : danhSachQuaGio) {
            ds.setTrangThaiDat("HoanThanh");
            datSanRepository.save(ds);
            log.info("Đơn đặt sân #{} (Sân: {}, Ngày: {}, Giờ: {}-{}) đã hoàn thành",
                    ds.getMaDatSan(),
                    ds.getSan() != null ? ds.getSan().getTenSan() : "N/A",
                    ds.getNgayChoi(),
                    ds.getGioBatDau(),
                    ds.getGioKetThuc());
        }

        if (!danhSachQuaGio.isEmpty()) {
            log.info("Scheduler: đã tự động hoàn thành {} đơn đặt sân đã qua giờ chơi",
                    danhSachQuaGio.size());
        }
    }
}
