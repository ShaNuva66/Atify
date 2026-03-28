package com.atify.backend.service;

import com.atify.backend.dto.FingerprintCatalogStatusResponse;
import com.atify.backend.dto.RecognizerCatalogStatusResponse;
import com.atify.backend.entity.Song;
import com.atify.backend.repository.SongRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.concurrent.atomic.AtomicBoolean;

@Slf4j
@Service
@RequiredArgsConstructor
public class FingerprintCatalogService {

    @Value("${shazam.python-base-url:http://127.0.0.1:5001}")
    private String pythonBaseUrl;

    private final SongRepository songRepository;
    private final FingerprintService fingerprintService;
    private final RestTemplate restTemplate;
    private final AtomicBoolean syncInProgress = new AtomicBoolean(false);

    public FingerprintCatalogStatusResponse getStatus() {
        return buildStatus("Fingerprint catalog status ready.", 0, syncInProgress.get());
    }

    public FingerprintCatalogStatusResponse ensureCatalogReady() {
        FingerprintCatalogStatusResponse status = getStatus();
        if (status.fingerprintedSongCount() == 0) {
            return status;
        }

        if (!status.recognizerReachable() || status.recognizerCatalogSize() != status.fingerprintedSongCount()) {
            log.info(
                    "Fingerprint catalog sync required. reachable={}, remoteSize={}, localSize={}",
                    status.recognizerReachable(),
                    status.recognizerCatalogSize(),
                    status.fingerprintedSongCount()
            );
            return reindexCatalog("auto-ensure");
        }

        return status;
    }

    public FingerprintCatalogStatusResponse reindexCatalog(String source) {
        if (!syncInProgress.compareAndSet(false, true)) {
            return buildStatus("Fingerprint sync is already running.", 0, true);
        }

        int registeredCount = 0;
        try {
            List<Song> fingerprintableSongs = loadFingerprintableSongs();
            for (Song song : fingerprintableSongs) {
                if (!hasFingerprintPayload(song)) {
                    fingerprintService.fingerprintSong(song);
                }
            }

            resetRemoteCatalog();

            List<Song> fingerprintedSongs = loadFingerprintableSongs()
                    .stream()
                    .filter(this::hasFingerprintPayload)
                    .toList();

            for (Song song : fingerprintedSongs) {
                fingerprintService.registerFingerprint(song);
                registeredCount++;
            }

            log.info(
                    "Fingerprint catalog sync completed. source={}, fingerprintable={}, registered={}",
                    source,
                    fingerprintableSongs.size(),
                    registeredCount
            );
            return buildStatus("Fingerprint catalog synced. source=" + source, registeredCount, false);
        } catch (Exception exception) {
            log.warn("Fingerprint catalog sync failed. source={}, message={}", source, exception.getMessage());
            return buildStatus(
                    "Fingerprint catalog sync failed: " + exception.getMessage(),
                    registeredCount,
                    false
            );
        } finally {
            syncInProgress.set(false);
        }
    }

    private void resetRemoteCatalog() {
        restTemplate.postForEntity(
                pythonBaseUrl + "/reset-catalog",
                HttpEntity.EMPTY,
                RecognizerCatalogStatusResponse.class
        );
    }

    private FingerprintCatalogStatusResponse buildStatus(String message, int registeredCount, boolean syncFlag) {
        List<Song> fingerprintableSongs = loadFingerprintableSongs();
        long fingerprintedSongCount = fingerprintableSongs.stream().filter(this::hasFingerprintPayload).count();
        long missingFingerprintCount = Math.max(0, fingerprintableSongs.size() - fingerprintedSongCount);

        boolean recognizerReachable = false;
        int recognizerCatalogSize = 0;

        try {
            RecognizerCatalogStatusResponse recognizerStatus = restTemplate.getForObject(
                    pythonBaseUrl + "/catalog-status",
                    RecognizerCatalogStatusResponse.class
            );
            if (recognizerStatus != null) {
                recognizerReachable = true;
                recognizerCatalogSize = recognizerStatus.catalogSize();
            }
        } catch (Exception exception) {
            log.warn("Recognizer catalog status could not be read: {}", exception.getMessage());
        }

        return new FingerprintCatalogStatusResponse(
                recognizerReachable,
                syncFlag,
                recognizerCatalogSize,
                fingerprintableSongs.size(),
                fingerprintedSongCount,
                missingFingerprintCount,
                registeredCount,
                message
        );
    }

    private List<Song> loadFingerprintableSongs() {
        return songRepository.findAll()
                .stream()
                .filter(this::hasAudioSource)
                .toList();
    }

    private boolean hasAudioSource(Song song) {
        return (song.getFileName() != null && !song.getFileName().isBlank())
                || (song.getAudioUrl() != null && !song.getAudioUrl().isBlank());
    }

    private boolean hasFingerprintPayload(Song song) {
        return song.getFingerprintCode() != null
                && !song.getFingerprintCode().isBlank()
                && song.getFingerprintData() != null
                && !song.getFingerprintData().isBlank();
    }
}