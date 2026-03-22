package com.atify.backend.dto;

public record JamendoTrackResponse(
        String jamendoId,
        String name,
        String artistName,
        String albumName,
        String coverUrl,
        String audioUrl,
        String shareUrl,
        String licenseUrl,
        Integer duration
) {
}
