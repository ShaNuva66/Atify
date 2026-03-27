package com.atify.backend.service;

import com.atify.backend.config.JamendoProperties;
import com.atify.backend.dto.JamendoPreloadSettingsRequest;
import com.atify.backend.dto.JamendoPreloadSettingsResponse;
import com.atify.backend.entity.AppSetting;
import com.atify.backend.repository.AppSettingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class JamendoPreloadSettingsService {

    private static final String ENABLED_KEY = "jamendo.preload.enabled";
    private static final String LIMIT_KEY = "jamendo.preload.limit";
    private static final String QUERIES_KEY = "jamendo.preload.queries";

    private final AppSettingRepository appSettingRepository;
    private final JamendoProperties jamendoProperties;

    public JamendoPreloadSettingsResponse getSettings() {
        JamendoProperties.Preload defaults = jamendoProperties.getPreload();

        boolean enabled = readBoolean(ENABLED_KEY).orElse(defaults.isEnabled());
        int limit = readInteger(LIMIT_KEY).orElse(defaults.getLimit());
        List<String> queries = readCsvList(QUERIES_KEY).orElse(sanitizeQueries(defaults.getQueries()));

        return new JamendoPreloadSettingsResponse(enabled, sanitizeLimit(limit), queries);
    }

    public JamendoPreloadSettingsResponse saveSettings(JamendoPreloadSettingsRequest request) {
        int limit = sanitizeLimit(request.limit());
        List<String> queries = sanitizeQueries(request.queries());

        saveValue(ENABLED_KEY, String.valueOf(request.enabled()));
        saveValue(LIMIT_KEY, String.valueOf(limit));
        saveValue(QUERIES_KEY, String.join(",", queries));

        return new JamendoPreloadSettingsResponse(request.enabled(), limit, queries);
    }

    private Optional<Boolean> readBoolean(String key) {
        return appSettingRepository.findById(key)
                .map(AppSetting::getSettingValue)
                .map(String::trim)
                .filter(value -> !value.isBlank())
                .map(Boolean::parseBoolean);
    }

    private Optional<Integer> readInteger(String key) {
        return appSettingRepository.findById(key)
                .map(AppSetting::getSettingValue)
                .map(String::trim)
                .filter(value -> !value.isBlank())
                .flatMap(value -> {
                    try {
                        return Optional.of(Integer.parseInt(value));
                    } catch (NumberFormatException ex) {
                        return Optional.empty();
                    }
                });
    }

    private Optional<List<String>> readCsvList(String key) {
        return appSettingRepository.findById(key)
                .map(AppSetting::getSettingValue)
                .map(value -> sanitizeQueries(List.of(value.split(","))));
    }

    private void saveValue(String key, String value) {
        appSettingRepository.save(AppSetting.builder()
                .settingKey(key)
                .settingValue(value)
                .updatedAt(LocalDateTime.now())
                .build());
    }

    private int sanitizeLimit(int limit) {
        return Math.max(1, Math.min(limit, 20));
    }

    private List<String> sanitizeQueries(List<String> queries) {
        if (queries == null) {
            return List.of();
        }
        return queries.stream()
                .map(query -> query == null ? "" : query.trim())
                .filter(query -> !query.isBlank())
                .distinct()
                .limit(20)
                .toList();
    }
}
