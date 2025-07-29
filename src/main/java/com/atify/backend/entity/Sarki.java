package com.atify.backend.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Sarki {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String ad;
    private int sure; // saniye cinsinden

    @ManyToOne
    @JoinColumn(name = "album_id")
    private Album album;
}
