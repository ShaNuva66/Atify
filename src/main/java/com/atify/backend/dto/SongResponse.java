package com.atify.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SongResponse {
    private Long id;
    private String name;
    private int duration;
    private String artistName;
    private String coverUrl;
    private String audioUrl;
    private String source;
}
