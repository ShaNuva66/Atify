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

import java.nio.file.*;
import java.util.UUID;

@Service
public class SongUploadService {

    private final SongRepository songRepository;
    private final ArtistRepository artistRepository;
    private final AlbumRepository albumRepository;
    private final MediaProbeService mediaProbeService;

    @Value("${music.upload-dir}")
    private String uploadDir;

    public SongUploadService(
            SongRepository songRepository,
            ArtistRepository artistRepository,
            AlbumRepository albumRepository,
            MediaProbeService mediaProbeService
    ) {
        this.songRepository = songRepository;
        this.artistRepository = artistRepository;
        this.albumRepository = albumRepository;
        this.mediaProbeService = mediaProbeService;
    }

    public Song uploadMp3(MultipartFile file, String name, Long artistId, Long albumId) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("file boş olamaz");
        }
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("name boş olamaz");
        }
        if (artistId == null) {
            throw new IllegalArgumentException("Sanat?? se?imi zorunlu.");
        }

        String original = (file.getOriginalFilename() == null) ? "audio.mp3" : file.getOriginalFilename();
        if (!original.toLowerCase().endsWith(".mp3")) {
            throw new IllegalArgumentException("Sadece .mp3 dosyalar? y?klenebilir.");
        }

        // artist zorunlu
        Artist artist = artistRepository.findById(artistId)
                .orElseThrow(() -> new IllegalArgumentException("Sanat?? bulunamad?: " + artistId));

        // album opsiyonel
        Album album = null;
        if (albumId != null) {
            album = albumRepository.findById(albumId)
                    .orElseThrow(() -> new IllegalArgumentException("Alb?m bulunamad?: " + albumId));
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

            return songRepository.save(song);

        } catch (Exception e) {
            throw new RuntimeException("Upload başarısız: " + e.getMessage(), e);
        }
    }
}
