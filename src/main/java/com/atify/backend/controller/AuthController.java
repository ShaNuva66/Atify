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
    public ResponseEntity<String> kayit(@RequestBody KullaniciRequest request) {
        String sonuc = kullaniciService.kaydet(request);
        return ResponseEntity.ok(sonuc);  // "Kayıt başarılı" gibi cevap döner
    }

    // POST → giriş endpoint'i
    @PostMapping("/login")
    public ResponseEntity<LoginResponse> giris(@RequestBody LoginRequest request) {
        LoginResponse cevap = kullaniciService.girisYap(request);
        return ResponseEntity.ok(cevap);
    }
}
