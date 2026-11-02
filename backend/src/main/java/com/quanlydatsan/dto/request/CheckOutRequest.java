package com.quanlydatsan.dto.request;

import lombok.Data;

@Data
public class CheckOutRequest {
    /**
     * Số block 15 phút chơi quá giờ (nếu có)
     */
    private Integer soBlockQuaGio = 0;

    /**
     * Phương thức thanh toán khoản phát sinh: 'TienMat' | 'ChuyenKhoan'
     */
    private String phuongThucThanhToan = "TienMat";
}
