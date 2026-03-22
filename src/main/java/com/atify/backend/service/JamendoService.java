package com.atify.backend.service;

import com.atify.backend.config.JamendoProperties;
import com.atify.backend.dto.JamendoSearchResponse;
import com.atify.backend.dto.JamendoTrackResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.util.Collections;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class JamendoService {

    private static final String API_URL = "https://api.jamendo.com/v3.0/tracks/";

    private final RestTemplate restTemplate;
    private final JamendoProperties jamendoProperties;

    @SuppressWarnings("unchecked")
    public JamendoSearchResponse searchTracks(String query, int limit) {
        requireConfigured();

        int safeLimit = Math.max(1, Math.min(limit, 20));

        URI uri = UriComponentsBuilder.fromUriString(API_URL)
                .queryParam("client_id", jamendoProperties.getClientId())
                .queryParam("format", "json")
                .queryParam("limit", safeLimit)
                .queryParam("search", query)
                .queryParam("audioformat", "mp31")
                .queryParam("imagesize", 300)
                .build()
                .encode()
                .toUri();

        try {
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                    uri,
                    HttpMethod.GET,
                    null,
                    new ParameterizedTypeReference<>() {
                    }
            );

            Map<String, Object> body = response.getBody();
            if (body == null) {
                throw new RuntimeException("Jamendo API bo? cevap d?nd?.");
            }

            Map<String, Object> headers = (Map<String, Object>) body.getOrDefault("headers", Collections.emptyMap());
            String status = asString(headers.get("status"));
            if ("failed".equalsIgnoreCase(status)) {
                throw new RuntimeException(
                        "Jamendo API hatas?: " + asString(headers.get("error_message"))
                );
            }
            List<Map<String, Object>> results = (List<Map<String, Object>>) body.getOrDefault("results", Collections.emptyList());

            List<JamendoTrackResponse> tracks = results.stream()
                    .map(this::toTrack)
                    .toList();

            return new JamendoSearchResponse(
                    query,
                    safeLimit,
                    toInt(headers.get("results_count")),
                    tracks
            );
        } catch (RestClientException ex) {
            throw new RuntimeException("Jamendo aramas? ba?ar?s?z oldu: " + ex.getMessage(), ex);
        }
    }

    private JamendoTrackResponse toTrack(Map<String, Object> item) {
        return new JamendoTrackResponse(
                asString(item.get("id")),
                asString(item.get("name")),
                asString(item.get("artist_name")),
                asString(item.get("album_name")),
                asString(item.get("album_image")),
                asString(item.get("audio")),
                asString(item.get("shareurl")),
                asString(item.get("license_ccurl")),
                toInteger(item.get("duration"))
        );
    }

    private void requireConfigured() {
        if (jamendoProperties.getClientId() == null || jamendoProperties.getClientId().isBlank()) {
            throw new RuntimeException("Jamendo client id tan?ml? de?il.");
        }
    }

    private String asString(Object value) {
        return value == null ? null : String.valueOf(value);
    }

    private int toInt(Object value) {
        return value instanceof Number number ? number.intValue() : 0;
    }

    private Integer toInteger(Object value) {
        return value instanceof Number number ? number.intValue() : null;
    }
}
