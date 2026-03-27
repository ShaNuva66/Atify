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

    @Lob
    @Column(name = "fingerprint_data", columnDefinition = "LONGTEXT")
    private String fingerprintData;

    private String coverUrl;

    @Column(name = "external_source")
    private String externalSource;

    @Column(name = "external_ref")
    private String externalRef;

    @Column(name = "audio_url", length = 1024)
    private String audioUrl;
}
