package com.atify.backend.service;

import com.atify.backend.dto.PlaylistResponse;
import com.atify.backend.dto.PlaylistRequest;
import com.atify.backend.dto.SongResponse;
import com.atify.backend.entity.Playlist;
import com.atify.backend.entity.Song;
import com.atify.backend.entity.User;
import com.atify.backend.repository.PlaylistRepository;
import com.atify.backend.repository.SongRepository;
import com.atify.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PlaylistService {

    private final SongRepository songRepo;
    private final PlaylistRepository playlistRepo;
    private final UserRepository userRepo;

    // ✅ Get active username from JWT
    private String getActiveUsername() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }

    // ✅ Create a playlist
    public PlaylistResponse addPlaylist(PlaylistRequest playlistRequest) {
        User user = userRepo.findByUsername(getActiveUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));

        Playlist playlist = Playlist.builder()
                .name(playlistRequest.getName())
                .user(user)
                .build();

        Playlist savedPlaylist = playlistRepo.save(playlist);
        return new PlaylistResponse(savedPlaylist.getId(), savedPlaylist.getName());
    }

    // ✅ Add a song to playlist (with ownership check)
    public void addSongToPlaylist(Long playlistId, Long songId) {
        Playlist playlist = playlistRepo.findById(playlistId)
                .orElseThrow(() -> new RuntimeException("Playlist not found"));

        if (!playlist.getUser().getUsername().equals(getActiveUsername())) {
            throw new RuntimeException("This is not your playlist!");
        }

        Song song = songRepo.findById(songId)
                .orElseThrow(() -> new RuntimeException("Song not found"));

        playlist.getSongs().add(song);
        playlistRepo.save(playlist);
    }

    // ✅ Remove a song from playlist (with ownership check)
    public void removeSongFromPlaylist(Long playlistId, Long songId) {
        Playlist playlist = playlistRepo.findById(playlistId)
                .orElseThrow(() -> new RuntimeException("Playlist not found"));

        if (!playlist.getUser().getUsername().equals(getActiveUsername())) {
            throw new RuntimeException("This is not your playlist!");
        }

        Song song = songRepo.findById(songId)
                .orElseThrow(() -> new RuntimeException("Song not found"));

        playlist.getSongs().remove(song);
        playlistRepo.save(playlist);
    }

    // ✅ Delete playlist (with ownership check)
    public void deletePlaylist(Long playlistId) {
        Playlist playlist = playlistRepo.findById(playlistId)
                .orElseThrow(() -> new RuntimeException("Playlist not found"));

        if (!playlist.getUser().getUsername().equals(getActiveUsername())) {
            throw new RuntimeException("This is not your playlist!");
        }

        playlistRepo.deleteById(playlistId);
    }

    // ✅ Get all playlists
    public List<PlaylistResponse> getAllPlaylists() {
        return playlistRepo.findAll()
                .stream()
                .map(p -> new PlaylistResponse(p.getId(), p.getName()))
                .collect(Collectors.toList());
    }

    // ✅ Get all playlists of a specific user
    public List<PlaylistResponse> getPlaylistsByUser(Long userId) {
        return playlistRepo.findAll().stream()
                .filter(p -> p.getUser().getId().equals(userId))
                .map(p -> new PlaylistResponse(p.getId(), p.getName()))
                .collect(Collectors.toList());
    }

    // ✅ Get songs in a playlist
    public List<SongResponse> getSongsByPlaylist(Long playlistId) {
        Playlist playlist = playlistRepo.findById(playlistId)
                .orElseThrow(() -> new RuntimeException("Playlist not found"));

        List<Song> songs = songRepo.findByPlaylists(playlist);

        return songs.stream()
                .map(s -> new SongResponse(s.getId(), s.getName(), s.getDuration()))
                .collect(Collectors.toList());
    }
}
