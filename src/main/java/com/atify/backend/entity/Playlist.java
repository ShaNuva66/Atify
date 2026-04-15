package com.atify.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.List;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@ToString(exclude = {"songs", "user"})
public class Playlist {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    private Long id;

    private String name;  // Playlist name

    @Column(name = "cover_url", length = 1024)
    private String coverUrl;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;  // Owner of the playlist

    // 🔹 ManyToMany: A playlist can contain multiple songs
    @ManyToMany
    @JoinTable(
            name = "playlist_song",  // join table
            joinColumns = @JoinColumn(name = "playlist_id"),
            inverseJoinColumns = @JoinColumn(name = "song_id")
    )
    @OrderColumn(name = "song_order")
    private List<Song> songs;
}
