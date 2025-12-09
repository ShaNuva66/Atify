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

    private String name;        // Şarkı adı
    private int duration;

    @ManyToOne
    @JoinColumn(name = "artist_id")
    private Artist artist;

    // Albüm artık opsiyonel
    @ManyToOne
    @JoinColumn(name = "album_id", nullable = true)
    private Album album;

    // Playlist opsiyonel
    @ManyToMany(mappedBy = "songs")
    private List<Playlist> playlists;

    @Column(name = "file_name")
    private String fileName;

    @Column(name = "fingerprint_code", unique = true)
    private String fingerprintCode;

    private String coverUrl;
}
