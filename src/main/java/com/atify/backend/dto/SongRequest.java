package com.atify.backend.dto;

import lombok.Data;

import java.util.List;

@Data
public class SongRequest {
    private String name;
    private int duration;
    private Long artistId;
    private Long albumId;
    private Boolean clearAlbum;
    private List<Long> playlistIdList;
    private Boolean rightsVerified;
    private String rightsOwner;
    private String rightsNotes;
}
