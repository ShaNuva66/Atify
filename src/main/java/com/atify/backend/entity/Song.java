package com.atify.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.List;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Song {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;        // Song name

    private int duration;       // Duration in seconds

    @ManyToOne
    @JoinColumn(name = "album_id")
    private Album album;        // Album of the song

    @ManyToOne
    @JoinColumn(name = "artist_id")
    private Artist artist;      // Artist of the song

    // 🔹 ManyToMany: A song can be in multiple playlists
    @ManyToMany(mappedBy = "songs")
    private List<Playlist> playlists;
}
