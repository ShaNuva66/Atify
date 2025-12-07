package com.atify.backend.controller;

import com.atify.backend.dto.PlaylistRequest;
import com.atify.backend.dto.PlaylistResponse;
import com.atify.backend.dto.SongResponse;
import com.atify.backend.service.PlaylistService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/playlists")
@RequiredArgsConstructor
public class PlaylistController {

    private final PlaylistService playlistService;

    // ✅ Add playlist
    @PostMapping
    public ResponseEntity<PlaylistResponse> addPlaylist(@RequestBody PlaylistRequest playlistRequest) {
        return ResponseEntity.ok(playlistService.addPlaylist(playlistRequest));
    }

    // ✅ Get all playlists
    @GetMapping
    public ResponseEntity<List<PlaylistResponse>> getAllPlaylists() {
        return ResponseEntity.ok(playlistService.getAllPlaylists());
    }

    // ✅ Get playlists of a user
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<PlaylistResponse>> getPlaylistsByUser(@PathVariable Long userId) {
        return ResponseEntity.ok(playlistService.getPlaylistsByUser(userId));
    }

    // ✅ Get songs of a playlist
    @GetMapping("/{playlistId}/songs")
    public ResponseEntity<List<SongResponse>> getSongsByPlaylist(@PathVariable Long playlistId) {
        return ResponseEntity.ok(playlistService.getSongsByPlaylist(playlistId));
    }

    // ✅ Add song to playlist
    @PostMapping("/{playlistId}/songs/{songId}")
    public ResponseEntity<String> addSongToPlaylist(
            @PathVariable Long playlistId,
            @PathVariable Long songId) {
        playlistService.addSongToPlaylist(playlistId, songId);
        return ResponseEntity.ok("Song added to playlist");
    }

    // ✅ Remove song from playlist
    @DeleteMapping("/{playlistId}/songs/{songId}")
    public ResponseEntity<String> removeSongFromPlaylist(
            @PathVariable Long playlistId,
            @PathVariable Long songId) {
        playlistService.removeSongFromPlaylist(playlistId, songId);
        return ResponseEntity.ok("Song removed from playlist");
    }

    // ✅ Delete playlist
    @DeleteMapping("/{playlistId}")
    public ResponseEntity<String> deletePlaylist(@PathVariable Long playlistId) {
        playlistService.deletePlaylist(playlistId);
        return ResponseEntity.ok("Playlist deleted");
    }
}
