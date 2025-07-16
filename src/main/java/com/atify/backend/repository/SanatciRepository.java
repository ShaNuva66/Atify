package com.atify.backend.repository;

import com.atify.backend.entity.Sanatci;
import org.springframework.data.jpa.repository.JpaRepository;

@Repository
public interface SanatciRepository extends JpaRepository<Sanatci, Long> {
    boolean existsByAd(String ad);  // aynı sanatçıyı iki kere yazınca patlamasın diye yaptım hata çıkarsa bak buraya
                                    // exitsBy __ kodu ile ana temel diğer noktalarda var mı diye kontrol edebilirsin unutma !
}

