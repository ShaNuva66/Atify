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

    // ✅ Add album
    public AlbumResponse addAlbum(AlbumRequest albumRequest) {
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

        return new AlbumResponse(savedAlbum.getId(), savedAlbum.getName(), savedAlbum.getCoverUrl());
    }

    // ✅ Get all albums
    public List<AlbumResponse> getAllAlbums() {
        return albumRepo.findAll()
                .stream()
                .map(a -> new AlbumResponse(a.getId(), a.getName(), a.getCoverUrl()))
                .collect(Collectors.toList());
    }

    // ✅ Get albums of an artist
    public List<AlbumResponse> getAlbumsByArtist(Long artistId) {
        return albumRepo.findAll().stream()
                .filter(a -> a.getArtist().getId().equals(artistId))
                .map(a -> new AlbumResponse(a.getId(), a.getName(), a.getCoverUrl()))
                .collect(Collectors.toList());
    }

    // ✅ Get songs of an album
    public List<SongResponse> getSongsByAlbum(Long albumId) {
        Album album = albumRepo.findById(albumId)
                .orElseThrow(() -> new RuntimeException("Album not found"));

        List<Song> songs = songRepo.findByAlbum(album);

        return songs.stream()
                .map(s -> new SongResponse(s.getId(), s.getName(), s.getDuration()))
                .collect(Collectors.toList());
    }
}
