package com.atify.backend.dto;

import java.util.List;

public record JamendoPreloadRunResponse(
        String source,
        boolean enabled,
        int limit,
        int queryCount,
        int imported,
        int skipped,
        List<String> queries
) {
}
