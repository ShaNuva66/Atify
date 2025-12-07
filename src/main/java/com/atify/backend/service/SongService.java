package com.atify.backend.service;

import com.atify.backend.dto.SongRequest;
import com.atify.backend.dto.SongResponse;
import com.atify.backend.entity.Album;
import com.atify.backend.entity.Playlist;
import com.atify.backend.entity.Artist;
import com.atify.backend.entity.Song;
import com.atify.backend.repository.AlbumRepository;
import com.atify.backend.repository.PlaylistRepository;
import com.atify.backend.repository.ArtistRepository;
import com.atify.backend.repository.SongRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SongService {

    private final SongRepository songRepo;
    private final AlbumRepository albumRepo;
    private final ArtistRepository artistRepo;
    private final PlaylistRepository playlistRepo;

    // ✅ Add a song
    public SongResponse addSong(SongRequest request) {
        Album album = albumRepo.findById(request.getAlbumId())
                .orElseThrow(() -> new IllegalArgumentException("Album not found: " + request.getAlbumId()));

        Artist artist = artistRepo.findById(request.getArtistId())
                .orElseThrow(() -> new IllegalArgumentException("Artist not found: " + request.getArtistId()));

        Set<Playlist> playlists = new HashSet<>();
        if (request.getPlaylistIdList() != null && !request.getPlaylistIdList().isEmpty()) {
            playlists.addAll(playlistRepo.findAllById(request.getPlaylistIdList()));
        }

        Song song = Song.builder()
                .name(request.getName())
                .duration(request.getDuration())
                .album(album)
                .artist(artist)
                .playlists(playlists.stream().toList())
                .build();

        Song savedSong = songRepo.save(song);

        return new SongResponse(savedSong.getId(), savedSong.getName(), savedSong.getDuration());
    }

    // ✅ Get all songs
    public List<SongResponse> getAllSongs() {
        return songRepo.findAll()
                .stream()
                .map(s -> new SongResponse(s.getId(), s.getName(), s.getDuration()))
                .collect(Collectors.toList());
    }
}
