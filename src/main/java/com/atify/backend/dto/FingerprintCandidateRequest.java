package com.atify.backend.dto;

public record FingerprintCandidateRequest(
        String songCode,
        String fingerprintData
) {
}
