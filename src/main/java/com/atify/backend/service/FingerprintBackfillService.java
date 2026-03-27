package com.atify.backend.service;

import com.atify.backend.entity.Song;
import com.atify.backend.repository.SongRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class FingerprintBackfillService {

    private final SongRepository songRepository;
    private final FingerprintService fingerprintService;

    @EventListener(ApplicationReadyEvent.class)
    public void backfillMissingFingerprints() {
        List<Song> songs = songRepository.findAll()
                .stream()
                .filter(song -> hasAudioSource(song))
                .toList();

        if (songs.isEmpty()) {
            log.info("Fingerprint backfill için ses kaynağı olan şarkı bulunamadı.");
            return;
        }

        int indexedCount = 0;
        int generatedCount = 0;

        log.info("Fingerprint startup senkronizasyonu başladı. {} şarkı kontrol edilecek.", songs.size());
        for (Song song : songs) {
            if (song.getFingerprintData() != null && !song.getFingerprintData().isBlank()
                    && song.getFingerprintCode() != null && !song.getFingerprintCode().isBlank()) {
                fingerprintService.registerFingerprint(song);
                indexedCount++;
                continue;
            }

            fingerprintService.fingerprintSong(song);
            generatedCount++;
        }
        log.info("Fingerprint startup senkronizasyonu tamamlandı. indexed={}, generated={}", indexedCount, generatedCount);
    }

    private boolean hasAudioSource(Song song) {
        return (song.getFileName() != null && !song.getFileName().isBlank())
                || (song.getAudioUrl() != null && !song.getAudioUrl().isBlank());
    }
}
