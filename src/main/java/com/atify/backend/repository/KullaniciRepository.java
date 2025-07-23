package com.atify.backend.repository;

import com.atify.backend.entity.Kullanici;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;


// kullanıcı giriş doğrulama ikiside 1 dönerse çaat gir hesaba

public interface KullaniciRepository extends JpaRepository<Kullanici, Long> {
    Optional<Kullanici>
    findByKullaniciAdi(String kullaniciAdi);
    boolean existsByKullaniciAdi(String kullaniciAdi);
    boolean existsByEmail(String email);
}
