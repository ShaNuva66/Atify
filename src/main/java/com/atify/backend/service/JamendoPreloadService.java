package com.atify.backend.service;

import com.atify.backend.dto.JamendoBulkImportResponse;
import com.atify.backend.dto.JamendoPreloadRunResponse;
import com.atify.backend.dto.JamendoPreloadSettingsResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.concurrent.atomic.AtomicBoolean;

@Slf4j
@Service
@RequiredArgsConstructor
public class JamendoPreloadService {

    private final SongService songService;
    private final JamendoPreloadSettingsService jamendoPreloadSettingsService;
    private final AuditLogService auditLogService;
    private final AtomicBoolean running = new AtomicBoolean(false);

    @Order(50)
    @EventListener(ApplicationReadyEvent.class)
    public void preloadConfiguredTracks() {
        runPreload("startup", false);
    }

    public JamendoPreloadRunResponse runPreloadNow() {
        return runPreload("manual-run", true);
    }

    private JamendoPreloadRunResponse runPreload(String source, boolean audit) {
        if (!running.compareAndSet(false, true)) {
            log.info("Jamendo preload zaten calisiyor. source={}", source);
            JamendoPreloadSettingsResponse settings = jamendoPreloadSettingsService.getSettings();
            return new JamendoPreloadRunResponse(
                    source,
                    settings.enabled(),
                    settings.limit(),
                    settings.queries().size(),
                    0,
                    0,
                    settings.queries()
            );
        }

        try {
            JamendoPreloadSettingsResponse settings = jamendoPreloadSettingsService.getSettings();
            if (!settings.enabled()) {
                log.info("Jamendo preload pasif. source={}", source);
                return new JamendoPreloadRunResponse(source, false, settings.limit(), settings.queries().size(), 0, 0, settings.queries());
            }

            List<String> queries = settings.queries();
            if (queries.isEmpty()) {
                log.info("Jamendo preload aktif ama sorgu tanimli degil. source={}", source);
                return new JamendoPreloadRunResponse(source, true, settings.limit(), 0, 0, 0, queries);
            }

            int totalImported = 0;
            int totalSkipped = 0;

            for (String query : queries) {
                try {
                    JamendoBulkImportResponse response = songService.importJamendoSearchResults(
                            query,
                            settings.limit(),
                            source + ":" + query
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
                    "Jamendo preload bitti. source={}, queryCount={}, imported={}, skipped={}",
                    source,
                    queries.size(),
                    totalImported,
                    totalSkipped
            );

            if (audit) {
                auditLogService.record(
                        "JAMENDO_PRELOAD_RUN",
                        "SYSTEM",
                        null,
                        "Jamendo preload manuel calistirildi. imported=" + totalImported + ", skipped=" + totalSkipped
                );
            }

            return new JamendoPreloadRunResponse(
                    source,
                    true,
                    settings.limit(),
                    queries.size(),
                    totalImported,
                    totalSkipped,
                    queries
            );
        } finally {
            running.set(false);
        }
    }
}
