package com.atify.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FingerprintResponse {
    private String status;
    private String fingerprintData;
    private int hashCount;
}
