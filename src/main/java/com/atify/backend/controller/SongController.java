package com.atify.backend.controller;

import com.atify.backend.dto.SongRequest;
import com.atify.backend.dto.SongResponse;
import com.atify.backend.service.SongService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/songs")
@RequiredArgsConstructor
public class SongController {

    private final SongService songService;

    @PostMapping
    public SongResponse addSong(@RequestBody SongRequest request) {
        return songService.addSong(request);
    }

    @GetMapping
    public List<SongResponse> getAllSongs() {
        return songService.getAllSongs();
    }
}
