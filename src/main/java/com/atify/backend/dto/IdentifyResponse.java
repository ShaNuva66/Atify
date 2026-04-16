package com.atify.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class IdentifyResponse {

    private boolean found;
    private Long songId;
    private String title;
    private String artist;
    private String coverUrl;
    private String audioUrl;
    private String source;
}
