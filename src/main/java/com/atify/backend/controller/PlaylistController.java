package com.atify.backend.controller;

import com.atify.backend.dto.JamendoImportRequest;
import com.atify.backend.dto.PlaylistRequest;
import com.atify.backend.dto.PlaylistResponse;
import com.atify.backend.dto.PlaylistSongOrderRequest;
import com.atify.backend.dto.SongResponse;
import com.atify.backend.service.PlaylistService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/playlists")
@RequiredArgsConstructor
public class PlaylistController {

    private final PlaylistService playlistService;

    @PostMapping
    public ResponseEntity<PlaylistResponse> addPlaylist(@RequestBody PlaylistRequest playlistRequest) {
        return ResponseEntity.ok(playlistService.addPlaylist(playlistRequest));
    }

    @PutMapping("/{playlistId}")
    public ResponseEntity<PlaylistResponse> updatePlaylist(
            @PathVariable Long playlistId,
            @RequestBody PlaylistRequest playlistRequest
    ) {
        return ResponseEntity.ok(playlistService.updatePlaylist(playlistId, playlistRequest));
    }

    @GetMapping
    public ResponseEntity<List<PlaylistResponse>> getAllPlaylists() {
        return ResponseEntity.ok(playlistService.getAllPlaylists());
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<PlaylistResponse>> getPlaylistsByUser(@PathVariable Long userId) {
        return ResponseEntity.ok(playlistService.getPlaylistsByUser(userId));
    }

    @GetMapping("/{playlistId}/songs")
    public ResponseEntity<List<SongResponse>> getSongsByPlaylist(@PathVariable Long playlistId) {
        return ResponseEntity.ok(playlistService.getSongsByPlaylist(playlistId));
    }

    @PostMapping("/{playlistId}/songs/{songId}")
    public ResponseEntity<String> addSongToPlaylist(
            @PathVariable Long playlistId,
            @PathVariable Long songId
    ) {
        playlistService.addSongToPlaylist(playlistId, songId);
        return ResponseEntity.ok("Song added to playlist");
    }

    @PostMapping("/{playlistId}/jamendo")
    public ResponseEntity<SongResponse> addJamendoTrackToPlaylist(
            @PathVariable Long playlistId,
            @RequestBody JamendoImportRequest request
    ) {
        return ResponseEntity.ok(playlistService.addJamendoTrackToPlaylist(playlistId, request));
    }

    @DeleteMapping("/{playlistId}/songs/{songId}")
    public ResponseEntity<String> removeSongFromPlaylist(
            @PathVariable Long playlistId,
            @PathVariable Long songId
    ) {
        playlistService.removeSongFromPlaylist(playlistId, songId);
        return ResponseEntity.ok("Song removed from playlist");
    }

    @PutMapping("/{playlistId}/songs/reorder")
    public ResponseEntity<String> reorderSongInPlaylist(
            @PathVariable Long playlistId,
            @RequestBody PlaylistSongOrderRequest request
    ) {
        playlistService.reorderSongInPlaylist(playlistId, request.getSongId(), request.getTargetIndex());
        return ResponseEntity.ok("Playlist order updated");
    }

    @DeleteMapping("/{playlistId}")
    public ResponseEntity<String> deletePlaylist(@PathVariable Long playlistId) {
        playlistService.deletePlaylist(playlistId);
        return ResponseEntity.ok("Playlist deleted");
    }
}
