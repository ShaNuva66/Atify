package com.atify.backend.service;

import com.atify.backend.dto.AlbumRequest;
import com.atify.backend.dto.AlbumResponse;
import com.atify.backend.dto.SongResponse;
import com.atify.backend.entity.Album;
import com.atify.backend.entity.Artist;
import com.atify.backend.entity.Song;
import com.atify.backend.repository.AlbumRepository;
import com.atify.backend.repository.ArtistRepository;
import com.atify.backend.repository.SongRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AlbumService {

    private final AlbumRepository albumRepo;
    private final SongRepository songRepo;
    private final ArtistRepository artistRepo;
    private final SongService songService;

    public AlbumResponse addAlbum(AlbumRequest albumRequest) {
        validateAlbumRequest(albumRequest);
        Artist artist = artistRepo.findById(albumRequest.getArtistId())
                .orElseThrow(() -> new RuntimeException("Artist not found"));

        Album album = Album.builder()
                .name(albumRequest.getName())
                .releaseDate(albumRequest.getReleaseDate())
                .coverUrl(albumRequest.getCoverUrl())
                .genre(albumRequest.getGenre())
                .releaseYear(albumRequest.getReleaseYear())
                .artist(artist)
                .build();

        Album savedAlbum = albumRepo.save(album);

        return toAlbumResponse(savedAlbum);
    }

    public List<AlbumResponse> getAllAlbums() {
        return albumRepo.findAll()
                .stream()
                .map(this::toAlbumResponse)
                .collect(Collectors.toList());
    }

    public List<AlbumResponse> getAlbumsByArtist(Long artistId) {
        return albumRepo.findByArtistId(artistId).stream()
                .map(this::toAlbumResponse)
                .collect(Collectors.toList());
    }

    public AlbumResponse updateAlbum(Long id, AlbumRequest albumRequest) {
        validateAlbumRequest(albumRequest);
        Album album = albumRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Album not found"));
        Artist artist = artistRepo.findById(albumRequest.getArtistId())
                .orElseThrow(() -> new RuntimeException("Artist not found"));

        album.setName(albumRequest.getName().trim());
        album.setReleaseDate(albumRequest.getReleaseDate());
        album.setCoverUrl(trimToNull(albumRequest.getCoverUrl()));
        album.setGenre(albumRequest.getGenre().trim());
        album.setReleaseYear(albumRequest.getReleaseYear());
        album.setArtist(artist);

        return toAlbumResponse(albumRepo.save(album));
    }

    public void deleteAlbum(Long id) {
        Album album = albumRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Album not found"));

        List<Song> songs = songRepo.findByAlbum(album);
        songs.forEach(song -> song.setAlbum(null));
        songRepo.saveAll(songs);
        albumRepo.delete(album);
    }

    public List<SongResponse> getSongsByAlbum(Long albumId) {
        Album album = albumRepo.findById(albumId)
                .orElseThrow(() -> new RuntimeException("Album not found"));

        List<Song> songs = songRepo.findByAlbum(album);

        return songs.stream()
                .map(songService::toSongResponse)
                .collect(Collectors.toList());
    }

    private AlbumResponse toAlbumResponse(Album album) {
        Artist artist = album.getArtist();
        return new AlbumResponse(
                album.getId(),
                album.getName(),
                album.getCoverUrl(),
                album.getGenre(),
                album.getReleaseYear(),
                album.getReleaseDate(),
                artist != null ? artist.getId() : null,
                artist != null ? artist.getName() : null
        );
    }

    private void validateAlbumRequest(AlbumRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Album istegi bos olamaz.");
        }
        if (request.getName() == null || request.getName().isBlank()) {
            throw new IllegalArgumentException("Album adi zorunlu.");
        }
        if (request.getGenre() == null || request.getGenre().isBlank()) {
            throw new IllegalArgumentException("Album turu zorunlu.");
        }
        if (request.getReleaseYear() == null || request.getReleaseYear() < 1800) {
            throw new IllegalArgumentException("Gecerli bir yayin yili zorunlu.");
        }
        if (request.getArtistId() == null) {
            throw new IllegalArgumentException("Album sanatcisi zorunlu.");
        }
    }

    private String trimToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
