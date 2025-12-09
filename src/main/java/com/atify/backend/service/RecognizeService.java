package com.atify.backend.service;

import com.atify.backend.dto.IdentifyResponse;
import com.atify.backend.dto.RecognizeSimpleResponse;
import com.atify.backend.entity.Song;
import com.atify.backend.repository.SongRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class RecognizeService {

    @Value("${music.temp-dir}")
    private String tempDir;

    private final SongRepository songRepository;
    private final RestTemplate restTemplate;

    public IdentifyResponse identifySong(MultipartFile sample) throws Exception {
        Files.createDirectories(Paths.get(tempDir));

        // 1) Gelen sample'ı geçici dosyaya kaydet
        Path tempInput = Files.createTempFile(Paths.get(tempDir), "sample-", ".webm");
        sample.transferTo(tempInput.toFile());

        // 2) ffmpeg ile wav'e dönüştür
        Path tempWav = Files.createTempFile(Paths.get(tempDir), "sample-", ".wav");

        ProcessBuilder pb = new ProcessBuilder(
                "ffmpeg", "-y",
                "-i", tempInput.toString(),
                "-ac", "1", "-ar", "44100",
                tempWav.toString()
        );
        pb.redirectErrorStream(true);
        Process process = pb.start();
        int exitCode = process.waitFor();

        Files.deleteIfExists(tempInput);

        if (exitCode != 0) {
            Files.deleteIfExists(tempWav);
            throw new IllegalStateException("ffmpeg failed with exit code " + exitCode);
        }

        // 3) Python /recognize-simple'a multipart gönder
        FileSystemResource resource = new FileSystemResource(tempWav.toFile());
        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("file", resource);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);

        HttpEntity<MultiValueMap<String, Object>> requestEntity =
                new HttpEntity<>(body, headers);

        ResponseEntity<RecognizeSimpleResponse> resp = restTemplate.postForEntity(
                "http://127.0.0.1:5001/recognize-simple",
                requestEntity,
                RecognizeSimpleResponse.class
        );

        Files.deleteIfExists(tempWav);

        RecognizeSimpleResponse recog = resp.getBody();
        if (recog == null || !recog.isMatch()) {
            return new IdentifyResponse(false, null, null, null);
        }

        // 4) SongRepository ile fingerprintCode üzerinden eşle
        Optional<Song> optSong = songRepository.findByFingerprintCode(recog.getSongCode());

        if (optSong.isEmpty()) {
            return new IdentifyResponse(false, null, null, null);
        }

        Song song = optSong.get();

        String artistName = song.getArtist() != null ? song.getArtist().getName() : null;

        return new IdentifyResponse(
                true,
                song.getName(),
                artistName,
                song.getCoverUrl()
        );
    }
}
