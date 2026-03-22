package com.atify.backend.dto;

import java.time.LocalDateTime;

public record ListeningHistoryResponse(
        Long songId,
        String name,
        String artistName,
        int duration,
        String coverUrl,
        String audioUrl,
        String source,
        long playCount,
        LocalDateTime lastListenedAt
) {
}
