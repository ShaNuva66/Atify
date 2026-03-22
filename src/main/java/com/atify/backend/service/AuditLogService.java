package com.atify.backend.service;

import com.atify.backend.dto.AuditLogResponse;
import com.atify.backend.entity.AuditLog;
import com.atify.backend.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    public void record(String actionType, String targetType, Long targetId, String detail) {
        AuditLog log = AuditLog.builder()
                .actorUsername(resolveActorUsername())
                .actionType(normalize(actionType, "UNKNOWN_ACTION"))
                .targetType(normalize(targetType, "UNKNOWN_TARGET"))
                .targetId(targetId)
                .detail(detail == null || detail.isBlank() ? "-" : detail.trim())
                .createdAt(LocalDateTime.now())
                .build();

        auditLogRepository.save(log);
    }

    public List<AuditLogResponse> getRecentLogs(int requestedLimit) {
        int limit = Math.max(1, Math.min(requestedLimit, 200));
        return auditLogRepository.findAll().stream()
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .limit(limit)
                .map(this::toResponse)
                .toList();
    }

    public List<AuditLogResponse> searchLogs(
            int requestedLimit,
            String actor,
            String actionType,
            String targetType,
            String query
    ) {
        int limit = Math.max(1, Math.min(requestedLimit, 200));
        String normalizedActor = normalizeSearch(actor);
        String normalizedAction = normalizeSearch(actionType);
        String normalizedTarget = normalizeSearch(targetType);
        String normalizedQuery = normalizeSearch(query);

        return auditLogRepository.findAll().stream()
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .filter(log -> matches(log.getActorUsername(), normalizedActor))
                .filter(log -> matches(log.getActionType(), normalizedAction))
                .filter(log -> matches(log.getTargetType(), normalizedTarget))
                .filter(log -> matchesAny(log, normalizedQuery))
                .limit(limit)
                .map(this::toResponse)
                .toList();
    }

    public List<AuditLogResponse> getRecentLogs() {
        return auditLogRepository.findTop100ByOrderByCreatedAtDesc().stream()
                .map(this::toResponse)
                .toList();
    }

    public byte[] exportLogsAsCsv(
            int requestedLimit,
            String actor,
            String actionType,
            String targetType,
            String query
    ) {
        List<AuditLogResponse> logs = searchLogs(requestedLimit, actor, actionType, targetType, query);
        StringBuilder csv = new StringBuilder();
        csv.append('\uFEFF');
        csv.append("id,actorUsername,actionType,targetType,targetId,detail,createdAt\n");

        logs.forEach(log -> csv
                .append(csvValue(log.id()))
                .append(',')
                .append(csvValue(log.actorUsername()))
                .append(',')
                .append(csvValue(log.actionType()))
                .append(',')
                .append(csvValue(log.targetType()))
                .append(',')
                .append(csvValue(log.targetId()))
                .append(',')
                .append(csvValue(log.detail()))
                .append(',')
                .append(csvValue(log.createdAt()))
                .append('\n'));

        return csv.toString().getBytes(StandardCharsets.UTF_8);
    }

    private AuditLogResponse toResponse(AuditLog log) {
        return new AuditLogResponse(
                log.getId(),
                log.getActorUsername(),
                log.getActionType(),
                log.getTargetType(),
                log.getTargetId(),
                log.getDetail(),
                log.getCreatedAt()
        );
    }

    private String resolveActorUsername() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null
                || !authentication.isAuthenticated()
                || authentication instanceof AnonymousAuthenticationToken) {
            return "system";
        }
        return authentication.getName() == null || authentication.getName().isBlank()
                ? "system"
                : authentication.getName();
    }

    private String normalize(String value, String fallback) {
        if (value == null || value.isBlank()) {
            return fallback;
        }
        return value.trim();
    }

    private String normalizeSearch(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim().toLowerCase(Locale.ROOT);
    }

    private boolean matches(String value, String expected) {
        if (expected == null) {
            return true;
        }
        return value != null && value.toLowerCase(Locale.ROOT).contains(expected);
    }

    private boolean matchesAny(AuditLog log, String query) {
        if (query == null) {
            return true;
        }

        return Arrays.asList(
                        log.getActorUsername(),
                        log.getActionType(),
                        log.getTargetType(),
                        log.getDetail(),
                        log.getTargetId() == null ? null : String.valueOf(log.getTargetId())
                ).stream()
                .filter(Objects::nonNull)
                .map(value -> value.toLowerCase(Locale.ROOT))
                .anyMatch(value -> value.contains(query));
    }

    private String csvValue(Object value) {
        if (value == null) {
            return "\"\"";
        }
        String text = String.valueOf(value).replace("\"", "\"\"");
        return "\"" + text + "\"";
    }
}
