package com.atify.backend.dto;

public record ArtistInsightResponse(
        String artistName,
        long playCount
) {
}
