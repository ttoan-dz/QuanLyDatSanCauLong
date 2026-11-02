package com.quanlydatsan.scheduler;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.quanlydatsan.entity.ChiTietDatSan;
import com.quanlydatsan.entity.DatSan;
import com.quanlydatsan.repository.ChiTietDatSanRepository;
import com.quanlydatsan.repository.DatSanRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Component
@RequiredArgsConstructor
@Slf4j
public class HetHanDonQRScheduler {

    private final DatSanRepository datSanRepository;
    private final ChiTietDatSanRepository chiTietDatSanRepository;

    /**
     * Tự động hủy/hết hạn các đơn giữ chỗ quá 10 phút chưa thanh toán theo đặc tả.
     * Chạy định kỳ mỗi 1 phút.
     */
    @Scheduled(fixedRate = 60000)
    @Transactional
    public void hetHanDonQR() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime thoiDiemHetHan = now.minusMinutes(10);
        List<DatSan> danhSachHetHan = datSanRepository.findDonHetHanGiuCho(now, thoiDiemHetHan);

        for (DatSan ds : danhSachHetHan) {
            ds.setTrangThaiDat("HetHan");
            datSanRepository.save(ds);

            // Đồng bộ trạng thái chi tiết đặt sân
            List<ChiTietDatSan> chiTiets = chiTietDatSanRepository.findByDatSan_MaDatSan(ds.getMaDatSan());
            for (ChiTietDatSan ct : chiTiets) {
                ct.setTrangThai("DaHuy");
                chiTietDatSanRepository.save(ct);
            }

            log.info("Đơn đặt sân #{} đã hết hạn giữ chỗ (quá 10 phút chưa thanh toán)",
                    ds.getMaDatSan());
        }

        if (!danhSachHetHan.isEmpty()) {
            log.info("Scheduler: đã giải phóng {} đơn hết hạn giữ chỗ", danhSachHetHan.size());
        }
    }
}
