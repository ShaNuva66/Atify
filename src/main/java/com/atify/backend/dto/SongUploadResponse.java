package com.atify.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class SongUploadResponse {
    private Long id;
    private String name;
    private int duration;
    private Long artistId;
    private Long albumId; // null olabilir
    private String fileName;
}
