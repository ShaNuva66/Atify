package com.atify.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDate;

@Data
@AllArgsConstructor
public class AlbumResponse {
    private Long id;
    private String name;
    private String coverUrl;
    private String genre;
    private Integer releaseYear;
    private LocalDate releaseDate;
    private Long artistId;
    private String artistName;
}
