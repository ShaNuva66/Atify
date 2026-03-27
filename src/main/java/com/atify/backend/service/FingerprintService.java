package com.atify.backend.service;

import com.atify.backend.dto.FingerprintResponse;
import com.atify.backend.entity.Song;
import com.atify.backend.repository.SongRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class FingerprintService {

    @Value("${music.upload-dir}")
    private String uploadDir;

    @Value("${music.temp-dir}")
    private String tempDir;

    @Value("${shazam.python-base-url:http://127.0.0.1:5001}")
    private String pythonBaseUrl;

    private final RestTemplate restTemplate;
    private final SongRepository songRepository;

    public void fingerprintSong(Song song) {
        if (song == null || song.getId() == null) {
            return;
        }

        try {
            Files.createDirectories(Paths.get(tempDir));
            Path tempWav = buildFingerprintWav(song);

            try {
                FileSystemResource resource = new FileSystemResource(tempWav.toFile());
                MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
                String songCode = "song:" + song.getId();
                body.add("file", resource);
                body.add("songCode", songCode);

                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.MULTIPART_FORM_DATA);

                HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

                FingerprintResponse response = restTemplate.postForObject(
                        pythonBaseUrl + "/fingerprint-file",
                        requestEntity,
                        FingerprintResponse.class
                );

                if (response == null || response.getFingerprintData() == null || response.getFingerprintData().isBlank()) {
                    log.warn("Fingerprint response boş döndü. songId={}", song.getId());
                    return;
                }

                song.setFingerprintCode(songCode);
                song.setFingerprintData(response.getFingerprintData());
                songRepository.save(song);

                log.info("Fingerprint oluşturuldu. songId={}, hashCount={}", song.getId(), response.getHashCount());
            } finally {
                Files.deleteIfExists(tempWav);
            }
        } catch (Exception e) {
            log.warn("Fingerprint oluşturulamadı. songId={}, message={}", song.getId(), e.getMessage());
        }
    }

    public void registerFingerprint(Song song) {
        if (song == null
                || song.getFingerprintCode() == null || song.getFingerprintCode().isBlank()
                || song.getFingerprintData() == null || song.getFingerprintData().isBlank()) {
            return;
        }

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<Map<String, String>> requestEntity = new HttpEntity<>(
                    Map.of(
                            "songCode", song.getFingerprintCode(),
                            "fingerprintData", song.getFingerprintData()
                    ),
                    headers
            );

            restTemplate.postForEntity(
                    pythonBaseUrl + "/register-fingerprint",
                    requestEntity,
                    String.class
            );
        } catch (Exception e) {
            log.warn("Fingerprint index'e yüklenemedi. songId={}, message={}", song.getId(), e.getMessage());
        }
    }

    private Path buildFingerprintWav(Song song) throws Exception {
        Path tempWav = Files.createTempFile(Paths.get(tempDir), "fingerprint-", ".wav");

        ProcessBuilder pb;
        if (song.getFileName() != null && !song.getFileName().isBlank()) {
            Path inputPath = Paths.get(uploadDir, song.getFileName()).toAbsolutePath();
            pb = new ProcessBuilder(
                    "ffmpeg", "-y",
                    "-i", inputPath.toString(),
                    "-vn",
                    "-ac", "1",
                    "-ar", "11025",
                    "-c:a", "pcm_s16le",
                    tempWav.toString()
            );
        } else if (song.getAudioUrl() != null && !song.getAudioUrl().isBlank()) {
            pb = new ProcessBuilder(
                    "ffmpeg", "-y",
                    "-i", song.getAudioUrl(),
                    "-vn",
                    "-ac", "1",
                    "-ar", "11025",
                    "-c:a", "pcm_s16le",
                    tempWav.toString()
            );
        } else {
            Files.deleteIfExists(tempWav);
            throw new IllegalStateException("Song için fingerprint kaynak dosyası yok");
        }

        pb.redirectErrorStream(true);
        Process process = pb.start();
        int exitCode = process.waitFor();

        if (exitCode != 0) {
            Files.deleteIfExists(tempWav);
            throw new IllegalStateException("ffmpeg fingerprint wav oluşturma hatası: " + exitCode);
        }

        return tempWav;
    }
}
