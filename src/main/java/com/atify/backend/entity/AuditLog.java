package com.atify.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "audit_log")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 120)
    private String actorUsername;

    @Column(nullable = false, length = 80)
    private String actionType;

    @Column(nullable = false, length = 80)
    private String targetType;

    private Long targetId;

    @Column(nullable = false, length = 1024)
    private String detail;

    @Column(nullable = false)
    private LocalDateTime createdAt;
}
