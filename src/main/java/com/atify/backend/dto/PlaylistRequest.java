package com.atify.backend.dto;

import lombok.Data;

@Data
public class PlaylistRequest {
    private String name;        // Playlist name
    private String username;    // Which user owns this playlist
}
