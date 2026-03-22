package com.atify.backend.dto;

import java.time.LocalDateTime;

public record FavoriteResponse(
        Long songId,
        String name,
        String artistName,
        int duration,
        String coverUrl,
        String audioUrl,
        String source,
        String externalRef,
        LocalDateTime createdAt
) {
}
