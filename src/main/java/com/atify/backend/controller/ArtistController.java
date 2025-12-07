package com.atify.backend.controller;

import com.atify.backend.dto.ArtistRequest;
import com.atify.backend.dto.ArtistResponse;
import com.atify.backend.service.ArtistService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/artists")
@RequiredArgsConstructor
public class ArtistController {

    private final ArtistService artistService;

    @PostMapping
    public ArtistResponse addArtist(@RequestBody ArtistRequest artistRequest) {
        return artistService.addArtist(artistRequest);
    }

    @GetMapping
    public List<ArtistResponse> getAllArtists() {
        return artistService.getAllArtists();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteArtist(@PathVariable Long id) {
        artistService.deleteArtist(id);
        return ResponseEntity.ok("Artist deleted successfully");
    }

    @PutMapping("/{id}")
    public ResponseEntity<String> updateArtist(@PathVariable Long id, @RequestBody ArtistRequest request) {
        artistService.updateArtist(id, request);
        return ResponseEntity.ok("Artist updated successfully");
    }
}
