package com.atify.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.file.Path;

@Service
public class MediaProbeService {

    @Value("${ffprobe.path:ffprobe}")
    private String ffprobePath;

    public int getDurationSeconds(Path mp3Path) {
        try {
            ProcessBuilder pb = new ProcessBuilder(
                    ffprobePath,
                    "-v", "error",
                    "-show_entries", "format=duration",
                    "-of", "default=noprint_wrappers=1:nokey=1",
                    mp3Path.toAbsolutePath().toString()
            );
            pb.redirectErrorStream(true);

            Process p = pb.start();

            String out;
            try (BufferedReader br = new BufferedReader(new InputStreamReader(p.getInputStream()))) {
                out = br.readLine();
            }

            int exit = p.waitFor();
            if (exit != 0 || out == null || out.isBlank()) {
                throw new RuntimeException("ffprobe duration alınamadı. exit=" + exit + " out=" + out);
            }

            double seconds = Double.parseDouble(out.trim());
            return (int) Math.round(seconds);

        } catch (Exception e) {
            throw new RuntimeException("ffprobe ile duration okunamadı: " + e.getMessage(), e);
        }
    }
}
