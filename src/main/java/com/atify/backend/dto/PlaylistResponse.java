package com.atify.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PlaylistResponse {
    private Long id;
    private String name;
    private Integer songCount;
    private String coverUrl;
}
