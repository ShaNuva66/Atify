package com.atify.backend.dto;

import lombok.Data;

@Data
public class KullaniciRequest {
    private String kullaniciAdi;
    private String email;
    private String sifre;
}
