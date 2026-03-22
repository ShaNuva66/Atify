package com.atify.backend.dto;

import java.util.List;

public record JamendoSearchResponse(
        String query,
        int limit,
        int total,
        List<JamendoTrackResponse> tracks
) {
}
