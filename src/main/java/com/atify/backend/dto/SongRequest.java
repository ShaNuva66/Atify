package com.atify.backend.dto;

import lombok.Data;
import java.util.List;

@Data
public class SongRequest {
    private String name;                // Song name
    private int duration;               // Duration in seconds
    private Long albumId;               // Which album it belongs to
    private Long artistId;              // Artist of the song
    private List<Long> playlistIdList;  // Optional: playlists to add the song
}
