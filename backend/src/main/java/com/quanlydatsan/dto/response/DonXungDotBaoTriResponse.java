package com.quanlydatsan.dto.response;

import lombok.Data;
import java.util.ArrayList;
import java.util.List;

@Data
public class DonXungDotBaoTriResponse {

    private DatSanResponse donDatSan;
    private List<SanResponse> dsSanKhaDung = new ArrayList<>();
}

