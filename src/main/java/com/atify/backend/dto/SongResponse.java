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
    private String externalUrl;
    private String licenseUrl;
    private boolean rightsVerified;
    private String rightsOwner;
    private String rightsNotes;
    private String copyrightNotice;
    private Long albumId;
    private String albumName;

    public SongResponse(Long id, String name, int duration, String artistName, String coverUrl, String audioUrl,
                        String source, String externalUrl, String licenseUrl, boolean rightsVerified,
                        String rightsOwner, String rightsNotes, String copyrightNotice) {
        this.id = id;
        this.name = name;
        this.duration = duration;
        this.artistName = artistName;
        this.coverUrl = coverUrl;
        this.audioUrl = audioUrl;
        this.source = source;
        this.externalUrl = externalUrl;
        this.licenseUrl = licenseUrl;
        this.rightsVerified = rightsVerified;
        this.rightsOwner = rightsOwner;
        this.rightsNotes = rightsNotes;
        this.copyrightNotice = copyrightNotice;
    }

    public SongResponse(Long id, String name, int duration, String artistName, String coverUrl, String audioUrl, String source) {
        this.id = id;
        this.name = name;
        this.duration = duration;
        this.artistName = artistName;
        this.coverUrl = coverUrl;
        this.audioUrl = audioUrl;
        this.source = source;
    }
}
