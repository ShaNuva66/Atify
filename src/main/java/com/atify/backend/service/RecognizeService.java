package com.atify.backend.service;

import com.atify.backend.dto.FingerprintCandidateRequest;
import com.atify.backend.dto.IdentifyResponse;
import com.atify.backend.dto.RecognizeSimpleResponse;
import com.atify.backend.entity.Song;
import com.atify.backend.repository.SongRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class RecognizeService {

    @Value("${music.temp-dir}")
    private String tempDir;

    @Value("${shazam.python-base-url:http://127.0.0.1:5001}")
    private String pythonBaseUrl;

    private final SongRepository songRepository;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public IdentifyResponse identifySong(MultipartFile sample) throws Exception {
        List<Song> fingerprintedSongs = songRepository.findByFingerprintDataIsNotNull()
                .stream()
                .filter(song -> song.getFingerprintCode() != null && !song.getFingerprintCode().isBlank())
                .filter(song -> song.getFingerprintData() != null && !song.getFingerprintData().isBlank())
                .toList();

        if (fingerprintedSongs.isEmpty()) {
            return new IdentifyResponse(false, null, null, null);
        }

        Files.createDirectories(Paths.get(tempDir));

        Path tempInput = Files.createTempFile(Paths.get(tempDir), "sample-", ".webm");
        Path tempWav = Files.createTempFile(Paths.get(tempDir), "sample-", ".wav");

        try {
            sample.transferTo(tempInput.toFile());

            ProcessBuilder pb = new ProcessBuilder(
                    "ffmpeg", "-y",
                    "-i", tempInput.toString(),
                    "-vn",
                    "-ac", "1",
                    "-ar", "11025",
                    "-c:a", "pcm_s16le",
                    tempWav.toString()
            );
            pb.redirectErrorStream(true);
            Process process = pb.start();
            int exitCode = process.waitFor();

            if (exitCode != 0) {
                throw new IllegalStateException("ffmpeg failed with exit code " + exitCode);
            }

            FileSystemResource resource = new FileSystemResource(tempWav.toFile());
            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("file", resource);
            body.add("candidates", objectMapper.writeValueAsString(
                    fingerprintedSongs.stream()
                            .map(song -> new FingerprintCandidateRequest(song.getFingerprintCode(), song.getFingerprintData()))
                            .toList()
            ));

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);

            HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

            ResponseEntity<RecognizeSimpleResponse> resp = restTemplate.postForEntity(
                    pythonBaseUrl + "/recognize-simple",
                    requestEntity,
                    RecognizeSimpleResponse.class
            );

            RecognizeSimpleResponse recog = resp.getBody();
            if (recog == null || !recog.isMatch() || recog.getSongCode() == null || recog.getSongCode().isBlank()) {
                return new IdentifyResponse(false, null, null, null);
            }

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
        } finally {
            Files.deleteIfExists(tempInput);
            Files.deleteIfExists(tempWav);
        }
    }
}
