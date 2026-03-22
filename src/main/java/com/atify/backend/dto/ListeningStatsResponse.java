package com.atify.backend.dto;

import java.time.LocalDateTime;

public record ListeningStatsResponse(
        long totalPlays,
        long uniqueSongs,
        long favoriteCount,
        String topArtistName,
        long topArtistPlayCount,
        long localPlayCount,
        long jamendoPlayCount,
        LocalDateTime lastListenedAt
) {
}
