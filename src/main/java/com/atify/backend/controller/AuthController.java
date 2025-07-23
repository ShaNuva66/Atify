package com.atify.backend.controller;

import com.atify.backend.dto.KullaniciRequest;
import com.atify.backend.dto.LoginRequest;
import com.atify.backend.dto.LoginResponse;
import com.atify.backend.service.KullaniciService;

import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;

@RestController
@RequestMapping("/auth") // tüm endpointler /auth ile başlar
public class AuthController {

    private final KullaniciService kullaniciService;

    // Constructor (yapıcı) → Servis sınıfını enjekte ediyoruz
    public AuthController(KullaniciService kullaniciService) {
        this.kullaniciService = kullaniciService;
    }

    // POST → kayıt endpoint'i
    @PostMapping("/register")
    public ResponseEntity<String> kayit(@RequestBody KullaniciRequest request) {                //@RequestBody i json verisini al KullanıcıRequeste dönüştür
        String sonuc = kullaniciService.kaydet(request);     //ResponseEntity<string> ---> metin döndürcem haberin olsun
        return ResponseEntity.ok(sonuc);
    }


    // POST → giriş endpoint'i
    @PostMapping("/login")
    public ResponseEntity<LoginResponse> giris(@RequestBody LoginRequest request) {
        LoginResponse cevap = kullaniciService.girisYap(request);
        return ResponseEntity.ok(cevap);
    }
}
