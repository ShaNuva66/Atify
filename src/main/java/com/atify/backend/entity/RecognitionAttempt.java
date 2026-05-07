package com.atify.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "recognition_attempt")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RecognitionAttempt {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "actor_username", length = 120)
    private String actorUsername;

    @Column(name = "hash_count")
    private Integer hashCount;

    @Column(name = "catalog_size")
    private Integer catalogSize;

    @Column(name = "matched", nullable = false)
    private boolean matched;

    @Column(name = "matched_song_id")
    private Long matchedSongId;

    @Column(name = "shared_hashes")
    private Integer sharedHashes;

    @Column(name = "offset_matches")
    private Integer offsetMatches;

    @Column(name = "offset_ratio")
    private Double offsetRatio;

    @Column(name = "processing_ms")
    private Long processingMs;

    @Column(name = "fp_version", length = 16)
    private String fpVersion;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
}
