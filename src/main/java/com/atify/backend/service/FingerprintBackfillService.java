package com.atify.backend.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class FingerprintBackfillService {

    private final FingerprintCatalogService fingerprintCatalogService;

    @EventListener(ApplicationReadyEvent.class)
    public void backfillMissingFingerprints() {
        log.info("Fingerprint startup sync started.");
        fingerprintCatalogService.reindexCatalog("startup");
    }
}
