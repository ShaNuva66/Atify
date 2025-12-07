package com.atify.backend.controller;

import com.atify.backend.dto.AlbumRequest;
import com.atify.backend.dto.AlbumResponse;
import com.atify.backend.service.AlbumService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/albums")
@RequiredArgsConstructor
public class AlbumController {

    private final AlbumService albumService;

    // ✅ Add album
    @PostMapping
    public ResponseEntity<AlbumResponse> addAlbum(@RequestBody AlbumRequest albumRequest) {
        return ResponseEntity.ok(albumService.addAlbum(albumRequest));
    }

    // ✅ Get all albums
    @GetMapping
    public ResponseEntity<List<AlbumResponse>> getAllAlbums() {
        return ResponseEntity.ok(albumService.getAllAlbums());
    }

    // ✅ Get albums of an artist
    @GetMapping("/artist/{artistId}")
    public ResponseEntity<List<AlbumResponse>> getAlbumsByArtist(@PathVariable Long artistId) {
        return ResponseEntity.ok(albumService.getAlbumsByArtist(artistId));
    }
}
