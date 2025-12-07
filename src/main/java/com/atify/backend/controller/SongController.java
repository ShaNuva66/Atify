package com.atify.backend.controller;

import com.atify.backend.dto.SongRequest;
import com.atify.backend.dto.SongResponse;
import com.atify.backend.service.SongService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/songs")
@RequiredArgsConstructor
public class SongController {

    private final SongService songService;

    // ✅ Add song
    @PostMapping
    public ResponseEntity<SongResponse> addSong(@RequestBody SongRequest request) {
        return ResponseEntity.ok(songService.addSong(request));
    }

    // ✅ Get all songs
    @GetMapping
    public ResponseEntity<List<SongResponse>> getAllSongs() {
        return ResponseEntity.ok(songService.getAllSongs());
    }
}
