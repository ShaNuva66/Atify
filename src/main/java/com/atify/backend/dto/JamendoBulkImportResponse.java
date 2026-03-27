package com.atify.backend.dto;

import java.util.List;

public record JamendoBulkImportResponse(
        String source,
        int requested,
        int uniqueRequested,
        int imported,
        int skipped,
        List<SongResponse> songs
) {
}
