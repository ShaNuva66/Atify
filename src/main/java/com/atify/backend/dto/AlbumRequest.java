package com.atify.backend.dto;

import lombok.Data;
import java.time.LocalDate;

@Data
public class AlbumRequest {

    private String name;            // Album name
    private LocalDate releaseDate;  // Release date in yyyy-MM-dd format
    private String coverUrl;        // Cover image URL
    private String genre;           // Album genre (Pop, Rock, etc.)
    private Integer releaseYear;    // Release year (NOT NULL)
    private Long artistId;          // ID of the artist this album belongs to
}
