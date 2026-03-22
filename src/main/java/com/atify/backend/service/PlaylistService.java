package com.atify.backend.service;

import com.atify.backend.dto.JamendoImportRequest;
import com.atify.backend.dto.PlaylistRequest;
import com.atify.backend.dto.PlaylistResponse;
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

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PlaylistService {

    private final SongRepository songRepo;
    private final PlaylistRepository playlistRepo;
    private final UserRepository userRepo;
    private final SongService songService;

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

    private PlaylistResponse toPlaylistResponse(Playlist playlist) {
        List<Song> songs = songRepo.findByPlaylists(playlist);
        String coverUrl = playlist.getCoverUrl();
        if (coverUrl == null || coverUrl.isBlank()) {
            coverUrl = songs.stream()
                    .map(Song::getCoverUrl)
                    .filter(url -> url != null && !url.isBlank())
                    .findFirst()
                    .orElse(null);
        }

        return new PlaylistResponse(
                playlist.getId(),
                playlist.getName(),
                songs.size(),
                coverUrl
        );
    }

    private String getActiveUsername() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }

    public PlaylistResponse addPlaylist(PlaylistRequest playlistRequest) {
        User user = userRepo.findByUsername(getActiveUsername())
                .orElseThrow(() -> new RuntimeException("Kullan?c? bulunamad?"));

        Playlist playlist = Playlist.builder()
                .name(playlistRequest.getName())
                .coverUrl(normalizeCoverUrl(playlistRequest.getCoverUrl()))
                .user(user)
                .build();

        Playlist savedPlaylist = playlistRepo.save(playlist);
        return toPlaylistResponse(savedPlaylist);
    }

    public PlaylistResponse updatePlaylist(Long playlistId, PlaylistRequest playlistRequest) {
        Playlist playlist = playlistRepo.findById(playlistId)
                .orElseThrow(() -> new RuntimeException("Playlist bulunamad?"));

        if (!playlist.getUser().getUsername().equals(getActiveUsername())) {
            throw new RuntimeException("Bu playlist sana ait de?il.");
        }

        String newName = playlistRequest.getName();
        if (newName == null || newName.isBlank()) {
            throw new RuntimeException("Playlist ad? zorunlu.");
        }

        playlist.setName(newName.trim());
        if (playlistRequest.getCoverUrl() != null) {
            playlist.setCoverUrl(normalizeCoverUrl(playlistRequest.getCoverUrl()));
        }
        Playlist updatedPlaylist = playlistRepo.save(playlist);
        return toPlaylistResponse(updatedPlaylist);
    }

    public void addSongToPlaylist(Long playlistId, Long songId) {
        Playlist playlist = playlistRepo.findById(playlistId)
                .orElseThrow(() -> new RuntimeException("Playlist bulunamad?"));

        if (!playlist.getUser().getUsername().equals(getActiveUsername())) {
            throw new RuntimeException("Bu playlist sana ait de?il.");
        }

        Song song = songRepo.findById(songId)
                .orElseThrow(() -> new RuntimeException("?ark? bulunamad?"));

        if (playlist.getSongs() == null) {
            playlist.setSongs(new ArrayList<>());
        }

        boolean alreadyInPlaylist = playlist.getSongs().stream()
                .anyMatch(existing -> existing.getId().equals(songId));

        if (!alreadyInPlaylist) {
            playlist.getSongs().add(song);
        }
        playlistRepo.save(playlist);
    }

    public SongResponse addJamendoTrackToPlaylist(Long playlistId, JamendoImportRequest request) {
        Playlist playlist = playlistRepo.findById(playlistId)
                .orElseThrow(() -> new RuntimeException("Playlist bulunamad?"));

        if (!playlist.getUser().getUsername().equals(getActiveUsername())) {
            throw new RuntimeException("Bu playlist sana ait de?il.");
        }

        Song song = songService.importJamendoTrack(request);

        if (playlist.getSongs() == null) {
            playlist.setSongs(new ArrayList<>());
        }

        boolean alreadyInPlaylist = playlist.getSongs().stream()
                .anyMatch(existing -> existing.getId().equals(song.getId()));

        if (!alreadyInPlaylist) {
            playlist.getSongs().add(song);
            playlistRepo.save(playlist);
        }

        return toSongResponse(song);
    }

    public void removeSongFromPlaylist(Long playlistId, Long songId) {
        Playlist playlist = playlistRepo.findById(playlistId)
                .orElseThrow(() -> new RuntimeException("Playlist bulunamad?"));

        if (!playlist.getUser().getUsername().equals(getActiveUsername())) {
            throw new RuntimeException("Bu playlist sana ait de?il.");
        }

        Song song = songRepo.findById(songId)
                .orElseThrow(() -> new RuntimeException("?ark? bulunamad?"));

        playlist.getSongs().remove(song);
        playlistRepo.save(playlist);
    }

    public void reorderSongInPlaylist(Long playlistId, Long songId, Integer targetIndex) {
        Playlist playlist = playlistRepo.findById(playlistId)
                .orElseThrow(() -> new RuntimeException("Playlist bulunamad?"));

        if (!playlist.getUser().getUsername().equals(getActiveUsername())) {
            throw new RuntimeException("Bu playlist sana ait de?il.");
        }

        if (songId == null || targetIndex == null) {
            throw new RuntimeException("Song id ve hedef sıra zorunlu");
        }

        if (playlist.getSongs() == null || playlist.getSongs().isEmpty()) {
            throw new RuntimeException("Playlistte s?ralanacak ?ark? yok.");
        }

        List<Song> songs = new ArrayList<>(playlist.getSongs());
        int currentIndex = -1;
        for (int i = 0; i < songs.size(); i++) {
            if (songs.get(i).getId().equals(songId)) {
                currentIndex = i;
                break;
            }
        }

        if (currentIndex < 0) {
            throw new RuntimeException("?ark? playlistte bulunamad?.");
        }

        if (targetIndex < 0 || targetIndex >= songs.size()) {
            throw new RuntimeException("Hedef s?ra ge?ersiz.");
        }

        Song song = songs.remove(currentIndex);
        songs.add(targetIndex, song);
        playlist.setSongs(songs);
        playlistRepo.save(playlist);
    }

    public void deletePlaylist(Long playlistId) {
        Playlist playlist = playlistRepo.findById(playlistId)
                .orElseThrow(() -> new RuntimeException("Playlist bulunamad?"));

        if (!playlist.getUser().getUsername().equals(getActiveUsername())) {
            throw new RuntimeException("Bu playlist sana ait de?il.");
        }

        playlistRepo.deleteById(playlistId);
    }

    private String normalizeCoverUrl(String coverUrl) {
        if (coverUrl == null) {
            return null;
        }
        String trimmed = coverUrl.trim();
        return trimmed.isBlank() ? null : trimmed;
    }

    public List<PlaylistResponse> getAllPlaylists() {
        String activeUsername = getActiveUsername();

        return playlistRepo.findAll()
                .stream()
                .filter(p -> p.getUser() != null && activeUsername.equals(p.getUser().getUsername()))
                .map(this::toPlaylistResponse)
                .collect(Collectors.toList());
    }

    public List<PlaylistResponse> getPlaylistsByUser(Long userId) {
        return playlistRepo.findAll().stream()
                .filter(p -> p.getUser().getId().equals(userId))
                .map(this::toPlaylistResponse)
                .collect(Collectors.toList());
    }

    public List<SongResponse> getSongsByPlaylist(Long playlistId) {
        Playlist playlist = playlistRepo.findById(playlistId)
                .orElseThrow(() -> new RuntimeException("Playlist bulunamad?"));

        if (!playlist.getUser().getUsername().equals(getActiveUsername())) {
            throw new RuntimeException("Bu playlist sana ait de?il.");
        }

        List<Song> songs = playlist.getSongs() == null
                ? List.of()
                : playlist.getSongs();

        return songs.stream()
                .map(this::toSongResponse)
                .collect(Collectors.toList());
    }
}
