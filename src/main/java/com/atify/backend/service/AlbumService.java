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

    private SongResponse toSongResponse(Song song) {
        return new SongResponse(
                song.getId(),
                song.getName(),
                song.getDuration(),
                song.getArtist() != null ? song.getArtist().getName() : null,
                song.getCoverUrl(),
                song.getAudioUrl(),
                song.getExternalSource() == null ? "LOCAL" : song.getExternalSource()
        );
    }

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

    public List<AlbumResponse> getAllAlbums() {
        return albumRepo.findAll()
                .stream()
                .map(a -> new AlbumResponse(a.getId(), a.getName(), a.getCoverUrl()))
                .collect(Collectors.toList());
    }

    public List<AlbumResponse> getAlbumsByArtist(Long artistId) {
        return albumRepo.findByArtistId(artistId).stream()
                .map(a -> new AlbumResponse(a.getId(), a.getName(), a.getCoverUrl()))
                .collect(Collectors.toList());
    }

    public List<SongResponse> getSongsByAlbum(Long albumId) {
        Album album = albumRepo.findById(albumId)
                .orElseThrow(() -> new RuntimeException("Album not found"));

        List<Song> songs = songRepo.findByAlbum(album);

        return songs.stream()
                .map(this::toSongResponse)
                .collect(Collectors.toList());
    }
}
