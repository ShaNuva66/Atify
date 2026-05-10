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
    private String externalUrl;
    private String licenseUrl;
    private boolean rightsVerified;
    private String rightsOwner;
    private String rightsNotes;
    private String copyrightNotice;
    private double score;
    private List<String> reasons;

    public RecommendationResponse(Long songId, String songName, String artistName, String coverUrl, Integer duration, String audioUrl, String source, double score, List<String> reasons) {
        this.songId = songId;
        this.songName = songName;
        this.artistName = artistName;
        this.coverUrl = coverUrl;
        this.duration = duration;
        this.audioUrl = audioUrl;
        this.source = source;
        this.score = score;
        this.reasons = reasons;
    }
}
