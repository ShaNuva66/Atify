package com.atify.backend.controller;

import com.atify.backend.dto.JamendoPreloadRunResponse;
import com.atify.backend.dto.JamendoPreloadSettingsRequest;
import com.atify.backend.dto.JamendoPreloadSettingsResponse;
import com.atify.backend.service.AuditLogService;
import com.atify.backend.service.JamendoPreloadService;
import com.atify.backend.service.JamendoPreloadSettingsService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/admin/jamendo/preload")
@RequiredArgsConstructor
public class AdminJamendoController {

    private final JamendoPreloadSettingsService jamendoPreloadSettingsService;
    private final JamendoPreloadService jamendoPreloadService;
    private final AuditLogService auditLogService;

    @GetMapping
    public JamendoPreloadSettingsResponse getSettings() {
        return jamendoPreloadSettingsService.getSettings();
    }

    @PutMapping
    public JamendoPreloadSettingsResponse saveSettings(@RequestBody JamendoPreloadSettingsRequest request) {
        JamendoPreloadSettingsResponse response = jamendoPreloadSettingsService.saveSettings(request);
        auditLogService.record(
                "JAMENDO_PRELOAD_UPDATED",
                "SYSTEM",
                null,
                "Jamendo preload ayarlari guncellendi. enabled=" + response.enabled()
                        + ", limit=" + response.limit()
                        + ", queries=" + String.join("|", response.queries())
        );
        return response;
    }

    @PostMapping("/run")
    public JamendoPreloadRunResponse runNow() {
        return jamendoPreloadService.runPreloadNow();
    }
}
