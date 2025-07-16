package com.atify.backend.service;

import com.atify.backend.dto.KullaniciRequest;
import com.atify.backend.dto.LoginRequest;
import com.atify.backend.dto.LoginResponse;
import com.atify.backend.entity.Kullanici;
import com.atify.backend.entity.Rol;
import com.atify.backend.repository.KullaniciRepository;

import org.springframework.stereotype.Service;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.util.Collections;

@Service  // bu sınıfı spring'e "bu bir servis sınıfı" diye tanıtıyoruz
public class KullaniciService {

    private final KullaniciRepository kullaniciRepo;

    // Kurucu metod: KullaniciRepository'yi dışardan alıyoruz
    public KullaniciService(KullaniciRepository kullaniciRepo) {
        this.kullaniciRepo = kullaniciRepo;
    }

    // Kayıt işlemini yapar
    public String kaydet(KullaniciRequest request) {

        // Eğer kullanıcı adı daha önce alınmışsa hata ver
        if (kullaniciRepo.existsByKullaniciAdi(request.getKullaniciAdi())) {
            throw new RuntimeException("Bu kullanıcı adı zaten var.");
        }

        // Eğer email zaten varsa hata ver
        if (kullaniciRepo.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Bu e-posta zaten kullanılıyor.");
        }

        // Şifreyi güvenli hale getiriyoruz (hashliyoruz)
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        String hashliSifre = encoder.encode(request.getSifre());

        // Yeni kullanıcı nesnesi oluştur
        Kullanici yeni = new Kullanici();
        yeni.setKullaniciAdi(request.getKullaniciAdi());
        yeni.setEmail(request.getEmail());
        yeni.setSifre(hashliSifre);
        yeni.setRoller(Collections.singleton(Rol.USER));  // default olarak USER rolü veriyoruz

        // Veritabanına kaydet
        kullaniciRepo.save(yeni);

        return "Kayıt başarılı.";
    }

    // Giriş yapma işlemi
    public LoginResponse girisYap(LoginRequest request) {

        // Kullanıcı adı veritabanında var mı diye bak
        Kullanici bulunan = kullaniciRepo
                .findByKullaniciAdi(request.getKullaniciAdi())
                .orElseThrow(() -> new RuntimeException("Kullanıcı bulunamadı."));

        // Şifre doğru mu diye kontrol et
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        boolean sifreDogruMu = encoder.matches(request.getSifre(), bulunan.getSifre());

        if (!sifreDogruMu) {
            throw new RuntimeException("Şifre yanlış.");
        }

        // Token sahte → gerçek token bir sonraki adımda yapılacak
        String token = "dummy-jwt-token";

        return new LoginResponse(token, "Bearer");
    }
}
