package com.atify.backend.service;

import com.atify.backend.dto.JamendoImportRequest;
import com.atify.backend.dto.JamendoBulkImportResponse;
import com.atify.backend.dto.JamendoTrackResponse;
import com.atify.backend.dto.PageResponse;
import com.atify.backend.dto.SongRequest;
import com.atify.backend.dto.SongResponse;
import com.atify.backend.entity.Album;
import com.atify.backend.entity.Artist;
import com.atify.backend.entity.Playlist;
import com.atify.backend.entity.Song;
import com.atify.backend.repository.AlbumRepository;
import com.atify.backend.repository.ArtistRepository;
import com.atify.backend.repository.PlaylistRepository;
import com.atify.backend.repository.SongRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class SongService {

    private final SongRepository songRepo;
    private final AlbumRepository albumRepo;
    private final ArtistRepository artistRepo;
    private final PlaylistRepository playlistRepo;
    private final AuditLogService auditLogService;
    private final FingerprintService fingerprintService;
    private final JamendoService jamendoService;

    public SongResponse toSongResponse(Song song) {
        return new SongResponse(
                song.getId(),
                song.getName(),
                song.getDuration(),
                song.getArtist() != null ? song.getArtist().getName() : null,
                song.getCoverUrl(),
                song.getAudioUrl(),
                song.getExternalSource() == null ? "LOCAL" : song.getExternalSource(),
                song.getExternalUrl(),
                song.getLicenseUrl(),
                isRightsVerified(song),
                song.getRightsOwner(),
                song.getRightsNotes(),
                copyrightNotice(song),
                song.getAlbum() != null ? song.getAlbum().getId() : null,
                song.getAlbum() != null ? song.getAlbum().getName() : null
        );
    }

    @CacheEvict(value = {"songs", "search"}, allEntries = true)
    public SongResponse addSong(SongRequest request) {
        Artist artist = artistRepo.findById(request.getArtistId())
                .orElseThrow(() -> new IllegalArgumentException("Sanatçı bulunamadı: " + request.getArtistId()));

        Album album = null;
        if (request.getAlbumId() != null) {
            album = albumRepo.findById(request.getAlbumId())
                    .orElseThrow(() -> new IllegalArgumentException("Albüm bulunamadı: " + request.getAlbumId()));
        }

        List<Playlist> playlists = new ArrayList<>();
        if (request.getPlaylistIdList() != null && !request.getPlaylistIdList().isEmpty()) {
            playlists = playlistRepo.findAllById(request.getPlaylistIdList());
        }

        validateLocalRights(request.getRightsVerified(), request.getRightsOwner(), request.getRightsNotes());

        Song song = Song.builder()
                .name(request.getName())
                .duration(request.getDuration())
                .artist(artist)
                .album(album)
                .playlists(playlists)
                .rightsVerified(true)
                .rightsOwner(request.getRightsOwner().trim())
                .rightsNotes(request.getRightsNotes().trim())
                .build();

        Song saved = songRepo.save(song);
        auditLogService.record(
                "SONG_CREATED",
                "SONG",
                saved.getId(),
                saved.getName() + " şarkısı eklendi."
        );
        return toSongResponse(saved);
    }

    @CacheEvict(value = {"songs", "search"}, allEntries = true)
    public SongResponse updateSong(Long id, SongRequest request) {
        Song song = songRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Şarkı bulunamadı: " + id));

        if (request.getName() != null && !request.getName().isBlank()) {
            song.setName(request.getName());
        }

        song.setDuration(request.getDuration());

        if (request.getArtistId() != null) {
            Artist artist = artistRepo.findById(request.getArtistId())
                    .orElseThrow(() -> new IllegalArgumentException("Sanatçı bulunamadı: " + request.getArtistId()));
            song.setArtist(artist);
        }

        if (Boolean.TRUE.equals(request.getClearAlbum())) {
            song.setAlbum(null);
        } else if (request.getAlbumId() != null) {
            Album album = albumRepo.findById(request.getAlbumId())
                    .orElseThrow(() -> new IllegalArgumentException("Albüm bulunamadı: " + request.getAlbumId()));
            song.setAlbum(album);
        }

        if (request.getPlaylistIdList() != null) {
            List<Playlist> playlists;
            if (request.getPlaylistIdList().isEmpty()) {
                playlists = new ArrayList<>();
            } else {
                playlists = playlistRepo.findAllById(request.getPlaylistIdList());
            }
            song.setPlaylists(playlists);
        }

        if (request.getRightsVerified() != null || request.getRightsOwner() != null || request.getRightsNotes() != null) {
            validateLocalRights(request.getRightsVerified(), request.getRightsOwner(), request.getRightsNotes());
            song.setRightsVerified(true);
            song.setRightsOwner(request.getRightsOwner().trim());
            song.setRightsNotes(request.getRightsNotes().trim());
        }

        Song updated = songRepo.save(song);
        auditLogService.record(
                "SONG_UPDATED",
                "SONG",
                updated.getId(),
                updated.getName() + " şarkısı güncellendi."
        );
        return toSongResponse(updated);
    }

    public Song importJamendoTrack(JamendoImportRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Jamendo isteği boş olamaz.");
        }
        if (request.jamendoId() == null || request.jamendoId().isBlank()) {
            throw new IllegalArgumentException("Jamendo id zorunlu.");
        }
        if (request.name() == null || request.name().isBlank()) {
            throw new IllegalArgumentException("Şarkı adı zorunlu.");
        }
        if (request.artistName() == null || request.artistName().isBlank()) {
            throw new IllegalArgumentException("Sanatçı adı zorunlu.");
        }
        if (request.audioUrl() == null || request.audioUrl().isBlank()) {
            throw new IllegalArgumentException("Jamendo audio URL zorunlu.");
        }
        if (request.licenseUrl() == null || request.licenseUrl().isBlank()) {
            throw new IllegalArgumentException("Jamendo lisans URL zorunlu.");
        }

        return songRepo.findByExternalSourceAndExternalRef("JAMENDO", request.jamendoId())
                .orElseGet(() -> {
                    Artist artist = artistRepo.findByNameIgnoreCase(request.artistName())
                            .orElseGet(() -> artistRepo.save(Artist.builder()
                                    .name(request.artistName())
                                    .build()));

                    Song song = Song.builder()
                            .name(request.name())
                            .duration(request.duration() == null ? 0 : request.duration())
                            .artist(artist)
                            .coverUrl(request.coverUrl())
                            .externalSource("JAMENDO")
                            .externalRef(request.jamendoId())
                            .externalUrl(request.shareUrl())
                            .licenseUrl(request.licenseUrl())
                            .rightsVerified(true)
                            .rightsOwner(request.artistName())
                            .rightsNotes("Jamendo Creative Commons license: " + request.licenseUrl())
                            .audioUrl(request.audioUrl())
                            .build();

                    Song saved = songRepo.save(song);
                    fingerprintService.fingerprintSong(saved);
                    return saved;
                });
    }

    @CacheEvict(value = {"songs", "search"}, allEntries = true)
    public SongResponse importJamendoTrackForCatalog(JamendoImportRequest request) {
        if (request == null || request.jamendoId() == null || request.jamendoId().isBlank()) {
            throw new IllegalArgumentException("Jamendo id zorunlu.");
        }

        Song existing = songRepo.findByExternalSourceAndExternalRef("JAMENDO", request.jamendoId())
                .orElse(null);

        if (existing != null) {
            auditLogService.record(
                    "SONG_IMPORT_SKIPPED",
                    "SONG",
                    existing.getId(),
                    existing.getName() + " zaten Atify kütüphanesindeydi."
            );
            return toSongResponse(existing);
        }

        Song saved = importJamendoTrack(request);
        auditLogService.record(
                "SONG_IMPORTED_JAMENDO",
                "SONG",
                saved.getId(),
                saved.getName() + " Jamendo'dan Atify kütüphanesine eklendi."
        );
        return toSongResponse(saved);
    }

    @CacheEvict(value = {"songs", "search"}, allEntries = true)
    public JamendoBulkImportResponse importJamendoTracksForCatalog(List<JamendoImportRequest> requests, String source) {
        if (requests == null || requests.isEmpty()) {
            return new JamendoBulkImportResponse(source, 0, 0, 0, 0, List.of());
        }

        Map<String, JamendoImportRequest> uniqueRequests = new LinkedHashMap<>();
        for (JamendoImportRequest request : requests) {
            if (request == null || request.jamendoId() == null || request.jamendoId().isBlank()) {
                continue;
            }
            uniqueRequests.putIfAbsent(request.jamendoId(), request);
        }

        List<SongResponse> importedSongs = new ArrayList<>();
        int skipped = 0;

        for (JamendoImportRequest request : uniqueRequests.values()) {
            Song existing = songRepo.findByExternalSourceAndExternalRef("JAMENDO", request.jamendoId())
                    .orElse(null);

            if (existing != null) {
                skipped++;
                continue;
            }

            Song saved = importJamendoTrack(request);
            importedSongs.add(toSongResponse(saved));
        }

        if (!importedSongs.isEmpty()) {
            auditLogService.record(
                    "SONG_IMPORTED_JAMENDO_BULK",
                    "SONG",
                    null,
                    importedSongs.size() + " Jamendo parçası toplu olarak kütüphaneye eklendi."
            );
        }

        return new JamendoBulkImportResponse(
                source,
                requests.size(),
                uniqueRequests.size(),
                importedSongs.size(),
                skipped,
                importedSongs
        );
    }

    public JamendoBulkImportResponse importJamendoSearchResults(String query, int limit, String source) {
        List<JamendoImportRequest> requests = jamendoService.searchTracks(query, limit)
                .tracks()
                .stream()
                .map(this::toJamendoImportRequest)
                .toList();

        return importJamendoTracksForCatalog(requests, source);
    }

    @Cacheable(value = "songs", key = "'page-' + #page + '-' + #size")
    public PageResponse<SongResponse> getAllSongs(int page, int size) {
        return PageResponse.of(
                songRepo.findAll(PageRequest.of(page, size, Sort.by("name")))
                        .map(this::toSongResponse)
        );
    }

    // Geriye dönük uyumluluk — tüm şarkıları tek seferde döndürür
    @Cacheable(value = "songs", key = "'all'")
    public List<SongResponse> getAllSongs() {
        return songRepo.findAll(Sort.by("name"))
                .stream()
                .map(this::toSongResponse)
                .toList();
    }

    private JamendoImportRequest toJamendoImportRequest(JamendoTrackResponse track) {
        return new JamendoImportRequest(
                track.jamendoId(),
                track.name(),
                track.artistName(),
                track.albumName(),
                track.coverUrl(),
                track.audioUrl(),
                track.shareUrl(),
                track.licenseUrl(),
                track.duration()
        );
    }

    private String copyrightNotice(Song song) {
        String source = song.getExternalSource() == null ? "LOCAL" : song.getExternalSource();
        if ("JAMENDO".equalsIgnoreCase(source)) {
            return "Jamendo uzerinden saglanan parca. Creative Commons lisans linki ve kaynak sayfasi saklanir.";
        }
        if (isRightsVerified(song)) {
            return "Yerel parca icin yayin/stream hakki admin tarafindan dogrulandi.";
        }
        return "Yerel kutuphaneye eklenen parca. Yayin/stream haklari dogrulanmadan yayinlanmamalidir.";
    }

    public boolean isRightsVerified(Song song) {
        String source = song.getExternalSource() == null ? "LOCAL" : song.getExternalSource();
        return "JAMENDO".equalsIgnoreCase(source) ? song.getLicenseUrl() != null && !song.getLicenseUrl().isBlank() : song.isRightsVerified();
    }

    public void validateLocalRights(Boolean rightsVerified, String rightsOwner, String rightsNotes) {
        if (!Boolean.TRUE.equals(rightsVerified)) {
            throw new IllegalArgumentException("Yerel parca eklemek icin yayin/stream hakki dogrulamasi zorunlu.");
        }
        if (rightsOwner == null || rightsOwner.isBlank()) {
            throw new IllegalArgumentException("Hak sahibi veya izin veren kurum/kisi zorunlu.");
        }
        if (rightsNotes == null || rightsNotes.isBlank()) {
            throw new IllegalArgumentException("Hak/lisans belge notu zorunlu.");
        }
    }

    @Transactional
    @CacheEvict(value = {"songs", "search"}, allEntries = true)
    public void deleteSong(Long id) {
        Song song = songRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Şarkı bulunamadı: " + id));

        fingerprintService.unregisterFingerprint(song);

        if (song.getPlaylists() != null) {
            for (Playlist playlist : song.getPlaylists()) {
                if (playlist.getSongs() != null) {
                    playlist.getSongs().removeIf(s -> s.getId().equals(id));
                }
            }
            playlistRepo.saveAll(song.getPlaylists());
        }

        String deletedName = song.getName();
        songRepo.delete(song);
        auditLogService.record(
                "SONG_DELETED",
                "SONG",
                id,
                deletedName + " şarkısı silindi."
        );
    }
}
