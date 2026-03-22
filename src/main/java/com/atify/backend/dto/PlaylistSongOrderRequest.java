package com.atify.backend.dto;

import lombok.Data;

@Data
public class PlaylistSongOrderRequest {
    private Long songId;
    private Integer targetIndex;
}
