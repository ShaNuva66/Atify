package com.atify.backend.controller;

import com.atify.backend.dto.ArtistInsightResponse;
import com.atify.backend.dto.JamendoImportRequest;
import com.atify.backend.dto.ListeningHistoryResponse;
import com.atify.backend.dto.ListeningStatsResponse;
import com.atify.backend.dto.RecommendationResponse;
import com.atify.backend.service.ListeningHistoryService;
import com.atify.backend.service.RecommendationService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/history")
@RequiredArgsConstructor
public class ListeningHistoryController {

    private final ListeningHistoryService listeningHistoryService;
    private final RecommendationService recommendationService;

    @PostMapping("/{songId}")
    public void recordPlay(@PathVariable Long songId) {
        listeningHistoryService.recordPlay(songId);
    }

    @PostMapping("/jamendo")
    public void recordJamendoPlay(@RequestBody JamendoImportRequest request) {
        listeningHistoryService.recordJamendoPlay(request);
    }

    @GetMapping("/recent")
    public List<ListeningHistoryResponse> getRecent(@RequestParam(defaultValue = "10") int limit) {
        return listeningHistoryService.getRecentHistory(limit);
    }

    @GetMapping("/top")
    public List<ListeningHistoryResponse> getTop(@RequestParam(defaultValue = "10") int limit) {
        return listeningHistoryService.getTopHistory(limit);
    }

    @GetMapping("/stats")
    public ListeningStatsResponse getStats() {
        return listeningHistoryService.getStats();
    }

    @GetMapping("/artists/top")
    public List<ArtistInsightResponse> getTopArtists(@RequestParam(defaultValue = "5") int limit) {
        return listeningHistoryService.getTopArtists(limit);
    }

    @GetMapping("/recommendations")
    public List<RecommendationResponse> getPersonalizedRecommendations(
            @RequestParam(defaultValue = "6") int limit
    ) {
        return recommendationService.getPersonalizedRecommendations(limit);
    }
}
