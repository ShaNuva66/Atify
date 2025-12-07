package com.atify.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.List;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Artist {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;             // Artist name
    private String country;          // Artist country
    private String biography;        // Short biography
    private String profileImageUrl;  // Profile image URL
    private LocalDate birthDate;     // Birth date

    @OneToMany(mappedBy = "artist", cascade = CascadeType.ALL)
    private List<Album> albums;      // Albums of the artist
}
