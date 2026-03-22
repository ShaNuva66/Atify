package com.atify.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RecommendationResponse {
    private Long songId;
    private String songName;
    private String artistName;
    private String coverUrl;
    private Integer duration;
    private String audioUrl;
    private String source;
    private double score;
    private List<String> reasons;
}
