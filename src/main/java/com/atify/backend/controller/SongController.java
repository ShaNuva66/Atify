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

    // Yeni şarkı ekleme
    @PostMapping
    public SongResponse addSong(@RequestBody SongRequest request) {
        return songService.addSong(request);
    }

    // Şarkı güncelleme (ADMIN edit ekranı burayı çağırıyor)
    @PutMapping("/{id}")
    public SongResponse updateSong(
            @PathVariable Long id,
            @RequestBody SongRequest request
    ) {
        return songService.updateSong(id, request);
    }

    // Tüm şarkılar
    @GetMapping
    public List<SongResponse> getAllSongs() {
        return songService.getAllSongs();
    }
}
