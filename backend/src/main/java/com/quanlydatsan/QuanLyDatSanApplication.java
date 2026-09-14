package com.quanlydatsan;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class QuanLyDatSanApplication {

    public static void main(String[] args) {
        SpringApplication.run(QuanLyDatSanApplication.class, args);
    }
}

