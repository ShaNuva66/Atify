package com.atify.backend.service;

import com.atify.backend.dto.IdentifyResponse;
import com.atify.backend.dto.RecognizeSimpleResponse;
import com.atify.backend.entity.Song;
import com.atify.backend.repository.SongRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class RecognizeService {

    public static final String AUDIO_FILTER = "highpass=f=80,lowpass=f=5200,dynaudnorm=f=250:g=15";

    @Value("${music.temp-dir}")
    private String tempDir;

    @Value("${shazam.python-base-url:http://127.0.0.1:5001}")
    private String pythonBaseUrl;

    private final SongRepository songRepository;
    private final RestTemplate restTemplate;
    private final FingerprintCatalogService fingerprintCatalogService;

    public IdentifyResponse identifySong(MultipartFile sample) throws Exception {
        if (songRepository.findByFingerprintDataIsNotNull().isEmpty()) {
            return new IdentifyResponse(false, null, null, null, null, null, null);
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
                    "-af", AUDIO_FILTER,
                    "-c:a", "pcm_s16le",
                    tempWav.toString()
            );
            pb.redirectOutput(ProcessBuilder.Redirect.DISCARD);
            Path ffmpegLog = Files.createTempFile(Paths.get(tempDir), "ffmpeg-identify-", ".log");
            pb.redirectError(ffmpegLog.toFile());
            Process process = pb.start();
            boolean finished = process.waitFor(30, java.util.concurrent.TimeUnit.SECONDS);
            if (!finished) {
                process.destroyForcibly();
                Files.deleteIfExists(ffmpegLog);
                throw new IllegalStateException("ffmpeg timed out after 30 seconds");
            }
            int exitCode = process.exitValue();

            if (exitCode != 0) {
                String tail = readTail(ffmpegLog);
                Files.deleteIfExists(ffmpegLog);
                throw new IllegalStateException("ffmpeg failed with exit code " + exitCode + ": " + tail);
            }
            Files.deleteIfExists(ffmpegLog);

            FileSystemResource resource = new FileSystemResource(tempWav.toFile());
            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("file", resource);

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
                log.info("Identify: no match (response={})", recog);
                return new IdentifyResponse(false, null, null, null, null, null, null);
            }
            log.info("Identify: match songCode={}", recog.getSongCode());

            Optional<Song> optSong = songRepository.findByFingerprintCode(recog.getSongCode());
            if (optSong.isEmpty()) {
                return new IdentifyResponse(false, null, null, null, null, null, null);
            }

            Song song = optSong.get();
            String artistName = song.getArtist() != null ? song.getArtist().getName() : null;
            String source = song.getExternalSource() != null ? song.getExternalSource() : "LOCAL";

            return new IdentifyResponse(
                    true,
                    song.getId(),
                    song.getName(),
                    artistName,
                    song.getCoverUrl(),
                    song.getAudioUrl(),
                    source
            );
        } finally {
            Files.deleteIfExists(tempInput);
            Files.deleteIfExists(tempWav);
        }
    }

    private String readTail(Path logFile) {
        try {
            byte[] bytes = Files.readAllBytes(logFile);
            String text = new String(bytes);
            int max = 500;
            return text.length() > max ? text.substring(text.length() - max) : text;
        } catch (Exception ignored) {
            return "<no log>";
        }
    }
}
