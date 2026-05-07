package com.atify.backend.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class RecognizeSimpleResponse {
    private boolean match;
    private String songCode;
    private Integer hashCount;
    private Integer catalogSize;
    private Integer sharedHashes;
    private Integer offsetMatches;
    private Double offsetRatio;
}
