package com.atify.backend.service;

import com.atify.backend.entity.Song;
import lombok.RequiredArgsConstructor;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class FingerprintService {

    @Value("${music.upload-dir}")
    private String uploadDir;

    private final RestTemplate restTemplate;

    public void fingerprintSong(Song song) {
        String fileName = song.getFileName();
        if (fileName == null || fileName.isBlank()) {
            return; // dosya yoksa sessizce çık
        }

        Path path = Paths.get(uploadDir, fileName);
        String filePath = path.toAbsolutePath().toString();

        Map<String, String> body = new HashMap<>();
        body.put("filePath", filePath);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<Map<String, String>> entity = new HttpEntity<>(body, headers);

        try {
            restTemplate.postForEntity(
                    "http://127.0.0.1:5001/fingerprint-file",
                    entity,
                    String.class
            );
        } catch (Exception e) {
            // Burada log atabilirsin, şarkının kaydını iptal etmiyoruz
            e.printStackTrace();
        }
    }

}
