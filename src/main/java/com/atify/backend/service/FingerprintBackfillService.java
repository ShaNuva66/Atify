package com.atify.backend.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class FingerprintBackfillService {

    private final FingerprintCatalogService fingerprintCatalogService;

    @Value("${app.fingerprint.startup-sync.enabled:true}")
    private boolean startupSyncEnabled;

    @EventListener(ApplicationReadyEvent.class)
    public void backfillMissingFingerprints() {
        if (!startupSyncEnabled) {
            log.info("Fingerprint startup sync disabled.");
            return;
        }

        log.info("Fingerprint startup sync started.");
        fingerprintCatalogService.reindexCatalog("startup");
    }
}
