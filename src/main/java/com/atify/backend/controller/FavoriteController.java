package com.atify.backend.controller;

import com.atify.backend.dto.FavoriteResponse;
import com.atify.backend.dto.JamendoImportRequest;
import com.atify.backend.service.FavoriteService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/favorites")
@RequiredArgsConstructor
public class FavoriteController {

    private final FavoriteService favoriteService;

    @GetMapping
    public List<FavoriteResponse> getFavorites() {
        return favoriteService.getFavorites();
    }

    @GetMapping("/{songId}/exists")
    public Map<String, Boolean> isFavorite(@PathVariable Long songId) {
        return Map.of("favorite", favoriteService.isFavorite(songId));
    }

    @PostMapping("/{songId}")
    public FavoriteResponse addFavorite(@PathVariable Long songId) {
        return favoriteService.addFavorite(songId);
    }

    @PostMapping("/jamendo")
    public FavoriteResponse addJamendoFavorite(@RequestBody JamendoImportRequest request) {
        return favoriteService.addJamendoFavorite(request);
    }

    @DeleteMapping("/{songId}")
    public void removeFavorite(@PathVariable Long songId) {
        favoriteService.removeFavorite(songId);
    }
}
