package com.atify.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Album {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;  // Album name

    private LocalDate releaseDate;  // Release date

    private String coverUrl;        // Cover image URL

    @Column(nullable = false)
    private String genre;           // Album genre

    @Column(name = "release_year", nullable = false)
    private Integer releaseYear;    // Release year

    @ManyToOne
    @JoinColumn(name = "artist_id", nullable = false)
    private Artist artist;          // Related artist
}
