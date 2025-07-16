package com.atify.backend.dto;

import lombok.Data;

@Data
public class LoginRequest {
    private String kullaniciAdi;
    private String sifre;
}
