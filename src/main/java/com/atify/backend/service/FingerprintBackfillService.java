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
        List<Song> songsToFingerprint = songRepository.findAll()
                .stream()
                .filter(song -> song.getFingerprintData() == null || song.getFingerprintData().isBlank())
                .filter(song -> hasAudioSource(song))
                .toList();

        if (songsToFingerprint.isEmpty()) {
            log.info("Fingerprint backfill icin eksik sarki bulunamadi.");
            return;
        }

        log.info("Fingerprint backfill basladi. {} sarki islenecek.", songsToFingerprint.size());
        for (Song song : songsToFingerprint) {
            fingerprintService.fingerprintSong(song);
        }
        log.info("Fingerprint backfill tamamlandi.");
    }

    private boolean hasAudioSource(Song song) {
        return (song.getFileName() != null && !song.getFileName().isBlank())
                || (song.getAudioUrl() != null && !song.getAudioUrl().isBlank());
    }
}
