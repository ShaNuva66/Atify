package com.atify.backend.service;

import com.atify.backend.entity.Album;
import com.atify.backend.entity.Artist;
import com.atify.backend.entity.Song;
import com.atify.backend.repository.AlbumRepository;
import com.atify.backend.repository.ArtistRepository;
import com.atify.backend.repository.SongRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
public class SongUploadService {

    private final SongRepository songRepository;
    private final ArtistRepository artistRepository;
    private final AlbumRepository albumRepository;
    private final MediaProbeService mediaProbeService;
    private final FingerprintService fingerprintService;

    @Value("${music.upload-dir}")
    private String uploadDir;

    public SongUploadService(
            SongRepository songRepository,
            ArtistRepository artistRepository,
            AlbumRepository albumRepository,
            MediaProbeService mediaProbeService,
            FingerprintService fingerprintService
    ) {
        this.songRepository = songRepository;
        this.artistRepository = artistRepository;
        this.albumRepository = albumRepository;
        this.mediaProbeService = mediaProbeService;
        this.fingerprintService = fingerprintService;
    }

    public Song uploadMp3(MultipartFile file, String name, Long artistId, Long albumId) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("file boş olamaz");
        }
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("name boş olamaz");
        }
        if (artistId == null) {
            throw new IllegalArgumentException("Sanatçı seçimi zorunlu.");
        }

        String original = (file.getOriginalFilename() == null) ? "audio.mp3" : file.getOriginalFilename();
        if (!original.toLowerCase().endsWith(".mp3")) {
            throw new IllegalArgumentException("Sadece .mp3 dosyaları yüklenebilir.");
        }

        Artist artist = artistRepository.findById(artistId)
                .orElseThrow(() -> new IllegalArgumentException("Sanatçı bulunamadı: " + artistId));

        Album album = null;
        if (albumId != null) {
            album = albumRepository.findById(albumId)
                    .orElseThrow(() -> new IllegalArgumentException("Albüm bulunamadı: " + albumId));
        }

        try {
            Path base = Paths.get(uploadDir);
            Files.createDirectories(base);

            String safeName = UUID.randomUUID() + "-" + original.replaceAll("[^a-zA-Z0-9._-]", "_");
            Path target = base.resolve(safeName);

            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);

            int durationSec = mediaProbeService.getDurationSeconds(target);

            Song song = new Song();
            song.setName(name);
            song.setDuration(durationSec);
            song.setFileName(safeName);
            song.setArtist(artist);
            song.setAlbum(album);

            Song saved = songRepository.save(song);
            fingerprintService.fingerprintSong(saved);
            return saved;
        } catch (Exception e) {
            throw new RuntimeException("Upload başarısız: " + e.getMessage(), e);
        }
    }
}
