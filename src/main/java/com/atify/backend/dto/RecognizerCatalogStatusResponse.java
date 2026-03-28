package com.atify.backend.dto;

public record RecognizerCatalogStatusResponse(
        String status,
        int catalogSize
) {
}
