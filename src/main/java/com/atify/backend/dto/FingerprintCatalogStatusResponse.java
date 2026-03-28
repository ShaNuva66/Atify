package com.atify.backend.dto;

public record FingerprintCatalogStatusResponse(
        boolean recognizerReachable,
        boolean syncInProgress,
        int recognizerCatalogSize,
        long fingerprintableSongCount,
        long fingerprintedSongCount,
        long missingFingerprintCount,
        int registeredCount,
        String message
) {
}
