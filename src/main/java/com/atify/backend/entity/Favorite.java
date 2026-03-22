package com.atify.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "favorite",
        uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "song_id"})
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Favorite {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne(optional = false)
    @JoinColumn(name = "song_id")
    private Song song;

    @Column(nullable = false)
    private LocalDateTime createdAt;
}
