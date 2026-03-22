package com.atify.backend.dto;

import java.time.LocalDateTime;

public record AuditLogResponse(
        Long id,
        String actorUsername,
        String actionType,
        String targetType,
        Long targetId,
        String detail,
        LocalDateTime createdAt
) {
}
