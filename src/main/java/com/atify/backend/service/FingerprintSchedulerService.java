package com.atify.backend.service;

import com.atify.backend.entity.Song;
import com.atify.backend.repository.SongRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Ses kaynağı olan ama henüz fingerprint'i olmayan tüm şarkıları
 * otomatik olarak fingerprint'ler. Her 5 dakikada bir çalışır.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class FingerprintSchedulerService {

    private final SongRepository songRepository;
    private final FingerprintService fingerprintService;
    private final FingerprintCatalogService fingerprintCatalogService;

    @Scheduled(fixedDelay = 300_000, initialDelay = 60_000)
    public void fingerprintMissingSongs() {
        List<Song> missing = songRepository.findAllWithAudioSource()
                .stream()
                .filter(s -> s.getFingerprintCode() == null || s.getFingerprintCode().isBlank())
                .toList();

        if (missing.isEmpty()) {
            return;
        }

        log.info("Auto-fingerprint: {} şarkının parmak izi eksik, işleniyor...", missing.size());

        int success = 0;
        for (Song song : missing) {
            try {
                fingerprintService.fingerprintSong(song);
                success++;
            } catch (Exception e) {
                log.warn("Auto-fingerprint başarısız. songId={}, hata={}", song.getId(), e.getMessage());
            }
        }

        if (success > 0) {
            log.info("Auto-fingerprint tamamlandı: {} şarkı işlendi, catalog sync tetikleniyor...", success);
            fingerprintCatalogService.ensureCatalogReady();
        }
    }
}
