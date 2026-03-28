package com.atify.backend.controller;

import com.atify.backend.dto.FingerprintCatalogStatusResponse;
import com.atify.backend.service.AuditLogService;
import com.atify.backend.service.FingerprintCatalogService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/admin/fingerprints")
@RequiredArgsConstructor
public class AdminFingerprintController {

    private final FingerprintCatalogService fingerprintCatalogService;
    private final AuditLogService auditLogService;

    @GetMapping("/status")
    public FingerprintCatalogStatusResponse getStatus() {
        return fingerprintCatalogService.getStatus();
    }

    @PostMapping("/reindex")
    public FingerprintCatalogStatusResponse reindex() {
        FingerprintCatalogStatusResponse response = fingerprintCatalogService.reindexCatalog("manual-admin");
        auditLogService.record(
                "FINGERPRINT_REINDEX_TRIGGERED",
                "SYSTEM",
                null,
                "Fingerprint reindex triggered from admin panel. registered=" + response.registeredCount()
        );
        return response;
    }
}
