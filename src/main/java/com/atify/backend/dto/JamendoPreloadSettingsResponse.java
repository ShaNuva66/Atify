package com.atify.backend.dto;

import java.util.List;

public record JamendoPreloadSettingsResponse(
        boolean enabled,
        int limit,
        List<String> queries
) {
}
