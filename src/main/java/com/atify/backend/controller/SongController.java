package com.atify.backend.controller;

import com.atify.backend.dto.RecommendationResponse;
import com.atify.backend.dto.JamendoImportRequest;
import com.atify.backend.dto.SongRequest;
import com.atify.backend.dto.SongResponse;
import com.atify.backend.dto.SongUploadResponse;
import com.atify.backend.entity.Song;
import com.atify.backend.repository.SongRepository;
import com.atify.backend.service.RecommendationService;
import com.atify.backend.service.SongService;
import com.atify.backend.service.SongUploadService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

@RestController
@RequestMapping("/songs")
@RequiredArgsConstructor
public class SongController {

    private final SongService songService;
    private final SongUploadService songUploadService;
    private final RecommendationService recommendationService;
    private final SongRepository songRepository;

    @Value("${music.upload-dir}")
    private String uploadDir;

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public SongResponse addSong(@RequestBody SongRequest request) {
        return songService.addSong(request);
    }

    @PostMapping(value = "/import/jamendo", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public SongResponse importJamendoSong(@RequestBody JamendoImportRequest request) {
        return songService.importJamendoTrackForCatalog(request);
    }

    @PutMapping(value = "/{id}", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public SongResponse updateSong(@PathVariable Long id, @RequestBody SongRequest request) {
        return songService.updateSong(id, request);
    }

    @GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    public List<SongResponse> getAllSongs() {
        return songService.getAllSongs();
    }

    @GetMapping(value = "/{id}/recommendations", produces = MediaType.APPLICATION_JSON_VALUE)
    public List<RecommendationResponse> getRecommendations(
            @PathVariable Long id,
            @RequestParam(defaultValue = "5") int limit
    ) {
        return recommendationService.getRecommendations(id, limit);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSong(@PathVariable Long id) {
        songService.deleteSong(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping(
            value = "/upload",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE
    )
    public SongUploadResponse uploadSongMp3(
            @RequestParam("file") MultipartFile file,
            @RequestParam("name") String name,
            @RequestParam("artistId") Long artistId,
            @RequestParam(value = "albumId", required = false) Long albumId
    ) {
        Song saved = songUploadService.uploadMp3(file, name, artistId, albumId);

        return new SongUploadResponse(
                saved.getId(),
                saved.getName(),
                saved.getDuration(),
                saved.getArtist() != null ? saved.getArtist().getId() : null,
                saved.getAlbum() != null ? saved.getAlbum().getId() : null,
                saved.getFileName()
        );
    }

    @GetMapping("/{id}/stream")
    public ResponseEntity<Resource> stream(@PathVariable Long id) {
        Song song = songRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Song not found"));

        if (song.getFileName() == null || song.getFileName().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Song does not have a fileName");
        }

        Path path = Path.of(uploadDir).resolve(song.getFileName());
        if (!Files.exists(path)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "File not found on disk: " + path);
        }

        Resource resource = new FileSystemResource(path.toFile());
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("audio/mpeg"))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + path.getFileName() + "\"")
                .body(resource);
    }
}
