package com.atify.backend.controller;

import com.atify.backend.dto.AuditLogResponse;
import com.atify.backend.service.AuditLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/audit-logs")
@RequiredArgsConstructor
public class AuditLogController {

    private final AuditLogService auditLogService;

    @GetMapping
    public List<AuditLogResponse> getAuditLogs(
            @RequestParam(defaultValue = "100") int limit,
            @RequestParam(required = false) String actor,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String target,
            @RequestParam(required = false, name = "q") String query
    ) {
        return auditLogService.searchLogs(limit, actor, action, target, query);
    }

    @GetMapping(value = "/export", produces = "text/csv;charset=UTF-8")
    public ResponseEntity<byte[]> exportAuditLogs(
            @RequestParam(defaultValue = "1000") int limit,
            @RequestParam(required = false) String actor,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String target,
            @RequestParam(required = false, name = "q") String query
    ) {
        byte[] csv = auditLogService.exportLogsAsCsv(limit, actor, action, target, query);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"atify-audit-log.csv\"")
                .contentType(MediaType.parseMediaType("text/csv;charset=UTF-8"))
                .body(csv);
    }
}
