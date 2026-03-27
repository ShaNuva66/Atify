package com.atify.backend.service;

import com.atify.backend.config.JamendoProperties;
import com.atify.backend.dto.JamendoBulkImportResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Service;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class JamendoPreloadService {

    private final JamendoProperties jamendoProperties;
    private final SongService songService;

    @Order(50)
    @EventListener(ApplicationReadyEvent.class)
    public void preloadConfiguredTracks() {
        JamendoProperties.Preload preload = jamendoProperties.getPreload();
        if (!preload.isEnabled()) {
            log.info("Jamendo startup preload pasif.");
            return;
        }

        List<String> queries = preload.getQueries()
                .stream()
                .map(query -> query == null ? "" : query.trim())
                .filter(query -> !query.isBlank())
                .distinct()
                .toList();

        if (queries.isEmpty()) {
            log.info("Jamendo startup preload aktif ama sorgu tanimli degil.");
            return;
        }

        int totalImported = 0;
        int totalSkipped = 0;
        int safeLimit = Math.max(1, Math.min(preload.getLimit(), 20));

        for (String query : queries) {
            try {
                JamendoBulkImportResponse response = songService.importJamendoSearchResults(
                        query,
                        safeLimit,
                        "startup:" + query
                );
                totalImported += response.imported();
                totalSkipped += response.skipped();
                log.info(
                        "Jamendo preload tamamlandi. query='{}', imported={}, skipped={}",
                        query,
                        response.imported(),
                        response.skipped()
                );
            } catch (Exception exception) {
                log.warn("Jamendo preload basarisiz. query='{}', message={}", query, exception.getMessage());
            }
        }

        log.info(
                "Jamendo startup preload bitti. queryCount={}, imported={}, skipped={}",
                queries.size(),
                totalImported,
                totalSkipped
        );
    }
}
