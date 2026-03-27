package com.atify.backend.dto;

import java.util.List;

public record JamendoPreloadSettingsRequest(
        boolean enabled,
        int limit,
        List<String> queries
) {
}
