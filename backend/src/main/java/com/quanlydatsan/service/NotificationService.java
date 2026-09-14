package com.quanlydatsan.service;

import com.quanlydatsan.dto.response.ThongBaoResponse;
import com.quanlydatsan.entity.ThongBao;
import com.quanlydatsan.repository.ThongBaoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final ThongBaoRepository thongBaoRepository;

    public List<ThongBaoResponse> layThongBao(Integer maKH) {
        return thongBaoRepository.findByKhachHang_MaKHOrderByThoiGianTaoDesc(maKH)
                .stream()
                .map(this::toThongBaoResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public void danhDauDaDoc(Integer maThongBao) {
        ThongBao tb = thongBaoRepository.findById(maThongBao)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Không tìm thấy thông báo"));
        tb.setDaDoc(true);
        thongBaoRepository.save(tb);
    }

    private ThongBaoResponse toThongBaoResponse(ThongBao tb) {
        ThongBaoResponse res = new ThongBaoResponse();
        res.setMaThongBao(tb.getMaThongBao());
        res.setTieuDe(tb.getTieuDe());
        res.setNoiDung(tb.getNoiDung());
        res.setLoaiThongBao(tb.getLoaiThongBao());
        res.setDaDoc(tb.getDaDoc());
        res.setThoiGianTao(tb.getThoiGianTao());
        return res;
    }
}
