package com.atify.backend.service;

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
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
@RequiredArgsConstructor
public class SongService {

    private final SongRepository songRepo;
    private final AlbumRepository albumRepo;
    private final ArtistRepository artistRepo;
    private final PlaylistRepository playlistRepo;

    // SONG EKLEME
    public SongResponse addSong(SongRequest request) {

        // Artist yine zorunlu
        Artist artist = artistRepo.findById(request.getArtistId())
                .orElseThrow(() -> new IllegalArgumentException("Artist not found: " + request.getArtistId()));

        // Album artık zorunlu değil
        Album album = null;
        if (request.getAlbumId() != null) {
            album = albumRepo.findById(request.getAlbumId())
                    .orElseThrow(() -> new IllegalArgumentException("Album not found: " + request.getAlbumId()));
        }

        // Playlist yine opsiyonel
        List<Playlist> playlists = new ArrayList<>();
        if (request.getPlaylistIdList() != null && !request.getPlaylistIdList().isEmpty()) {
            playlists = playlistRepo.findAllById(request.getPlaylistIdList());
        }

        Song song = Song.builder()
                .name(request.getName())
                .duration(request.getDuration())
                .artist(artist)
                .album(album)        // artık null olabilir
                .playlists(playlists)
                .build();

        Song saved = songRepo.save(song);
        return new SongResponse(saved.getId(), saved.getName(), saved.getDuration());
    }

    // TÜM ŞARKILAR
    public List<SongResponse> getAllSongs() {
        return songRepo.findAll()
                .stream()
                .map(s -> new SongResponse(s.getId(), s.getName(), s.getDuration()))
                .toList();
    }
}
