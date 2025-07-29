package com.atify.backend.controller;

import com.atify.backend.dto.AlbumRequest;
import com.atify.backend.dto.AlbumResponse;
import com.atify.backend.service.AlbumService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/albumler")
@RequiredArgsConstructor
public class AlbumController {

    private final AlbumService albumService;

    @PostMapping
    public ResponseEntity<AlbumResponse> albumEkle(@RequestBody AlbumRequest request) {
        return ResponseEntity.ok(albumService.albumEkle(request));
    }

    @GetMapping
    public List<AlbumResponse> albumleriGetir() {
        return albumService.tumAlbumleriGetir();
    }
}
