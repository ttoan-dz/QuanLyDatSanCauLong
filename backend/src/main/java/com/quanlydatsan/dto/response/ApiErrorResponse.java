package com.quanlydatsan.dto.response;

import java.time.LocalDateTime;

import lombok.Data;

@Data
public class ApiErrorResponse {

    private String message;
    private Integer status;
    private LocalDateTime timestamp;
}

